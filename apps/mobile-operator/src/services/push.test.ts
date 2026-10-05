// src/services/push.test.ts
//
// Pruebas del servicio de push nativo. El plugin de Capacitor, Preferences y
// Firestore se simulan (no hay un teléfono en Jest); lo que se verifica aquí
// es la LÓGICA propia: cuándo se pide permiso, qué se escribe en Firestore,
// que no se dupliquen listeners y que el cierre de sesión nunca se cuelgue.
// La entrega real de una notificación a un dispositivo NO se puede probar
// con Jest — ver docs/technical/go-live-checklist.md (#47).

const mockPush: Record<string, jest.Mock> = {
  checkPermissions: jest.fn(),
  requestPermissions: jest.fn(),
  createChannel: jest.fn(),
  register: jest.fn(),
  unregister: jest.fn(),
  addListener: jest.fn(),
}
const mockCapacitor = { isNativePlatform: jest.fn() }
const mockPrefs = { get: jest.fn(), set: jest.fn() }
const mockFirestore = {
  doc: jest.fn((_db: unknown, col: string, id: string) => `${col}/${id}`),
  updateDoc: jest.fn(),
  deleteField: jest.fn(() => 'BORRAR_CAMPO'),
}

jest.mock('@capacitor/core', () => ({ Capacitor: mockCapacitor }))
jest.mock('@capacitor/push-notifications', () => ({ PushNotifications: mockPush }))
jest.mock('@capacitor/preferences', () => ({ Preferences: mockPrefs }))
jest.mock('firebase/firestore', () => mockFirestore)
// moduleNameMapper solo cubre imports que terminan en "/services/firebase"; push.ts
// importa './firebase' (relativo), así que se simula aquí. Cada resetModules()
// vuelve a ejecutar esta fábrica: un auth limpio por test.
jest.mock('./firebase', () => ({ auth: { currentUser: null }, db: {} }))

let handlers: Record<string, (p: any) => void>

async function cargar() {
  jest.resetModules() // listenersListos es estado de módulo: cada test parte limpio
  const push = await import('./push')
  const fb = (await import('./firebase')) as unknown as { auth: { currentUser: unknown } }
  return { push, auth: fb.auth }
}

beforeEach(() => {
  jest.clearAllMocks()
  handlers = {}
  mockCapacitor.isNativePlatform.mockReturnValue(true)
  mockPush.checkPermissions.mockResolvedValue({ receive: 'granted' })
  mockPush.requestPermissions.mockResolvedValue({ receive: 'granted' })
  mockPush.addListener.mockImplementation(async (ev: string, cb: (p: any) => void) => {
    handlers[ev] = cb
    return { remove: jest.fn() }
  })
  mockFirestore.updateDoc.mockResolvedValue(undefined)
})

describe('activarPush', () => {
  it('en navegador (no nativo) no hace nada y avisa que no está soportado', async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(false)
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('no-soportado')
    expect(mockPush.checkPermissions).not.toHaveBeenCalled()
    expect(mockPush.register).not.toHaveBeenCalled()
  })

  it('pide permiso cuando está en "prompt" y, si lo concede, crea el canal y registra', async () => {
    mockPush.checkPermissions.mockResolvedValue({ receive: 'prompt' })
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('activadas')
    expect(mockPush.requestPermissions).toHaveBeenCalledTimes(1)
    expect(mockPush.createChannel).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'evaluaciones', importance: 4 })
    )
    expect(mockPush.register).toHaveBeenCalledTimes(1)
  })

  it('si el permiso ya estaba concedido NO vuelve a preguntar', async () => {
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('activadas')
    expect(mockPush.requestPermissions).not.toHaveBeenCalled()
  })

  it('si el usuario deniega el permiso: "denegadas" y NO registra ni crea canal', async () => {
    mockPush.checkPermissions.mockResolvedValue({ receive: 'prompt' })
    mockPush.requestPermissions.mockResolvedValue({ receive: 'denied' })
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('denegadas')
    expect(mockPush.register).not.toHaveBeenCalled()
    expect(mockPush.createChannel).not.toHaveBeenCalled()
  })

  it('si Android ya lo bloqueó ("denied" sin poder preguntar) tampoco registra', async () => {
    mockPush.checkPermissions.mockResolvedValue({ receive: 'denied' })
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('denegadas')
    expect(mockPush.requestPermissions).not.toHaveBeenCalled()
  })

  it('llamarla varias veces NO duplica los listeners del plugin', async () => {
    const { push } = await cargar()
    await push.activarPush()
    await push.activarPush()
    await push.activarPush()
    // 3 eventos (registration, registrationError, pushNotificationReceived), una sola vez
    expect(mockPush.addListener).toHaveBeenCalledTimes(3)
  })
})

describe('token FCM', () => {
  it('al recibir el token lo guarda en usuarios/{uid} con SOLO la clave fcmToken', async () => {
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await push.activarPush()
    handlers.registration({ value: 'token-abc' })
    await Promise.resolve()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/op1', { fcmToken: 'token-abc' })
    // firestore.rules rechaza la escritura completa si se cuela cualquier otra clave
    expect(Object.keys(mockFirestore.updateDoc.mock.calls[0][1])).toEqual(['fcmToken'])
  })

  it('si FCM rota el token, el nuevo sobrescribe al anterior', async () => {
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await push.activarPush()
    handlers.registration({ value: 'viejo' })
    handlers.registration({ value: 'nuevo' })
    await Promise.resolve()
    expect(mockFirestore.updateDoc).toHaveBeenLastCalledWith('usuarios/op1', { fcmToken: 'nuevo' })
  })

  it('sin usuario autenticado no escribe nada', async () => {
    const { push, auth } = await cargar()
    auth.currentUser = null
    await push.activarPush()
    handlers.registration({ value: 'token-abc' })
    await Promise.resolve()
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
  })

  it('un fallo al guardar el token no revienta la app (se registra y listo)', async () => {
    const err = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockFirestore.updateDoc.mockRejectedValue(new Error('permission-denied'))
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await push.activarPush()
    expect(() => handlers.registration({ value: 't' })).not.toThrow()
    await new Promise((r) => setTimeout(r, 0))
    expect(err).toHaveBeenCalled()
    err.mockRestore()
  })
})

describe('avisos con la app abierta', () => {
  it('entrega la notificación a los suscriptores y deja de hacerlo al desuscribirse', async () => {
    const { push } = await cargar()
    await push.activarPush()
    const cb = jest.fn()
    const baja = push.suscribirRecibidas(cb)
    handlers.pushNotificationReceived({ title: 'Evaluación aprobada' })
    expect(cb).toHaveBeenCalledWith({ title: 'Evaluación aprobada' })
    baja()
    handlers.pushNotificationReceived({ title: 'otra' })
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('desactivarPush y cierre de sesión', () => {
  it('desactivar borra el campo fcmToken (deleteField) y da de baja el dispositivo', async () => {
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await push.desactivarPush()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/op1', { fcmToken: 'BORRAR_CAMPO' })
    expect(mockPush.unregister).toHaveBeenCalledTimes(1)
  })

  it('en navegador, desactivar y limpiar son no-ops', async () => {
    mockCapacitor.isNativePlatform.mockReturnValue(false)
    const { push } = await cargar()
    await push.desactivarPush()
    await push.limpiarTokenAlCerrarSesion()
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
    expect(mockPush.unregister).not.toHaveBeenCalled()
  })

  it('limpiarTokenAlCerrarSesion limpia el token cuando hay conexión', async () => {
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await push.limpiarTokenAlCerrarSesion()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/op1', { fcmToken: 'BORRAR_CAMPO' })
  })

  it('SIN SEÑAL (la escritura nunca resuelve) el cierre de sesión se libera a los 3 s, no se cuelga', async () => {
    jest.useFakeTimers()
    try {
      mockFirestore.updateDoc.mockReturnValue(new Promise(() => {})) // cola offline: jamás resuelve
      const { push, auth } = await cargar()
      auth.currentUser = { uid: 'op1' }
      let terminado = false
      const p = push.limpiarTokenAlCerrarSesion().then(() => { terminado = true })
      await jest.advanceTimersByTimeAsync(push.TOPE_LIMPIEZA_MS - 1)
      expect(terminado).toBe(false)
      await jest.advanceTimersByTimeAsync(2)
      await p
      expect(terminado).toBe(true)
    } finally {
      jest.useRealTimers()
    }
  })

  it('si limpiar falla, no propaga el error (nunca debe impedir cerrar sesión)', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockFirestore.updateDoc.mockRejectedValue(new Error('boom'))
    const { push, auth } = await cargar()
    auth.currentUser = { uid: 'op1' }
    await expect(push.limpiarTokenAlCerrarSesion()).resolves.toBeUndefined()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})

describe('preferencia del interruptor', () => {
  it('por defecto (sin valor guardado) está activada', async () => {
    mockPrefs.get.mockResolvedValue({ value: null })
    const { push } = await cargar()
    expect(await push.leerPreferencia()).toBe(true)
  })

  it('respeta un "false" guardado', async () => {
    mockPrefs.get.mockResolvedValue({ value: 'false' })
    const { push } = await cargar()
    expect(await push.leerPreferencia()).toBe(false)
  })

  it('guardarPreferencia persiste el valor como texto', async () => {
    const { push } = await cargar()
    await push.guardarPreferencia(false)
    expect(mockPrefs.set).toHaveBeenCalledWith({ key: 'notificaciones', value: 'false' })
  })
})
