// src/services/push.test.ts
//
// Pruebas del servicio de push web. firebase/messaging, Firestore y las APIs
// del navegador (Notification, serviceWorker, PushManager) se simulan: lo que se
// verifica es la LÓGICA propia — cuándo se pide permiso, qué se escribe en
// Firestore, que el cierre de sesión nunca se cuelgue y que un token no quede
// pegado a un usuario que ya salió. La entrega real de una notificación a un
// navegador NO se puede probar con Jest (ver docs/technical/go-live-checklist.md, #47).

const mockMessaging = {
  getMessaging: jest.fn(() => 'MESSAGING'),
  getToken: jest.fn(),
  deleteToken: jest.fn(),
  onMessage: jest.fn(),
  isSupported: jest.fn(),
}
const mockFirestore = {
  doc: jest.fn((_db: unknown, col: string, id: string) => `${col}/${id}`),
  updateDoc: jest.fn(),
  deleteField: jest.fn(() => 'BORRAR_CAMPO'),
}

jest.mock('firebase/messaging', () => mockMessaging)
jest.mock('firebase/firestore', () => mockFirestore)
// moduleNameMapper solo cubre imports que terminan en "/services/firebase"; push.ts
// importa './firebase' (relativo), así que se simula aquí. Cada resetModules()
// vuelve a ejecutar esta fábrica: un auth limpio por test.
jest.mock('./firebase', () => ({ app: {}, auth: { currentUser: null }, db: {} }))

const permiso = { actual: 'default' as NotificationPermission, alPedir: 'granted' as NotificationPermission }

function simularNavegador(soportado: boolean) {
  const w = window as any
  if (soportado) {
    w.Notification = Object.assign(function () {}, {
      requestPermission: jest.fn(async () => {
        permiso.actual = permiso.alPedir
        return permiso.alPedir
      }),
    })
    Object.defineProperty(w.Notification, 'permission', { get: () => permiso.actual, configurable: true })
    w.PushManager = function () {}
    Object.defineProperty(navigator, 'serviceWorker', { value: {}, configurable: true })
  } else {
    delete w.Notification
    delete w.PushManager
    delete (navigator as any).serviceWorker
  }
}

async function cargar(uid: string | null = 'uid-sup') {
  jest.resetModules() // `escuchando` es estado de módulo: cada test parte limpio
  const push = await import('./push')
  const fb = (await import('./firebase')) as unknown as { auth: { currentUser: unknown } }
  fb.auth.currentUser = uid ? { uid } : null
  return { push, auth: fb.auth }
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  permiso.actual = 'default'
  permiso.alPedir = 'granted'
  simularNavegador(true)
  mockMessaging.isSupported.mockResolvedValue(true)
  mockMessaging.getToken.mockResolvedValue('token-web-1')
  mockMessaging.deleteToken.mockResolvedValue(true)
  mockFirestore.updateDoc.mockResolvedValue(undefined)
})

afterEach(() => {
  jest.useRealTimers()
})

describe('pushSoportado / estadoAvisos', () => {
  it('sin APIs de push en el navegador: no soportado', async () => {
    simularNavegador(false)
    const { push } = await cargar()
    expect(push.pushSoportado()).toBe(false)
    expect(push.estadoAvisos()).toBe('no-soportado')
  })

  it('permiso sin decidir: "inactivo"', async () => {
    const { push } = await cargar()
    expect(push.estadoAvisos()).toBe('inactivo')
  })

  it('permiso bloqueado: "denegado"', async () => {
    permiso.actual = 'denied'
    const { push } = await cargar()
    expect(push.estadoAvisos()).toBe('denegado')
  })

  it('permiso concedido: "activo", salvo que ese usuario haya apagado los avisos', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar('uid-sup')
    expect(push.estadoAvisos()).toBe('activo')
    localStorage.setItem('avisos:uid-sup', 'false')
    expect(push.estadoAvisos()).toBe('inactivo')
  })

  it('la preferencia es POR USUARIO: otro usuario en el mismo navegador no hereda el apagado', async () => {
    permiso.actual = 'granted'
    localStorage.setItem('avisos:uid-A', 'false')
    const { push } = await cargar('uid-B')
    expect(push.estadoAvisos()).toBe('activo')
  })
})

describe('activarPush', () => {
  it('en un navegador sin soporte no hace nada', async () => {
    simularNavegador(false)
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('no-soportado')
    expect(mockMessaging.getToken).not.toHaveBeenCalled()
  })

  it('si isSupported() dice que no (p. ej. Firefox privado), tampoco', async () => {
    mockMessaging.isSupported.mockResolvedValue(false)
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('no-soportado')
    expect(mockMessaging.getToken).not.toHaveBeenCalled()
  })

  it('pide permiso si está sin decidir y, al concederse, guarda EXACTAMENTE { fcmToken }', async () => {
    const { push } = await cargar('uid-sup')
    expect(await push.activarPush()).toBe('activadas')
    expect(Notification.requestPermission).toHaveBeenCalledTimes(1)
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/uid-sup', { fcmToken: 'token-web-1' })
    expect(push.estadoAvisos()).toBe('activo')
  })

  it('si el permiso ya estaba concedido NO vuelve a preguntar', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('activadas')
    expect(Notification.requestPermission).not.toHaveBeenCalled()
  })

  it('si el usuario rechaza el permiso: "denegadas" y no pide token', async () => {
    permiso.alPedir = 'denied'
    const { push } = await cargar()
    expect(await push.activarPush()).toBe('denegadas')
    expect(mockMessaging.getToken).not.toHaveBeenCalled()
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
  })

  it('si FCM falla al dar el token: "error" y no guarda nada ni marca los avisos como activos', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    permiso.actual = 'granted'
    localStorage.setItem('avisos:uid-sup', 'false')
    mockMessaging.getToken.mockRejectedValue(new Error('messaging/token-subscribe-failed'))
    const { push } = await cargar('uid-sup')
    expect(await push.activarPush()).toBe('error')
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
    expect(localStorage.getItem('avisos:uid-sup')).toBe('false')
  })

  it('sin sesión: "error"', async () => {
    const { push } = await cargar(null)
    expect(await push.activarPush()).toBe('error')
  })

  it('onMessage se registra UNA sola vez aunque se active varias veces', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar()
    await push.activarPush()
    await push.activarPush()
    await push.sincronizarPush()
    expect(mockMessaging.onMessage).toHaveBeenCalledTimes(1)
  })

  it('los avisos con la pestaña visible llegan a los suscritos hasta que se dan de baja', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar()
    await push.activarPush()
    const recibido = jest.fn()
    const baja = push.suscribirRecibidas(recibido)
    const entregar = mockMessaging.onMessage.mock.calls[0][1]
    entregar({ notification: { title: 'Nueva evaluación pendiente' } })
    expect(recibido).toHaveBeenCalledTimes(1)
    baja()
    entregar({ notification: { title: 'otra' } })
    expect(recibido).toHaveBeenCalledTimes(1)
  })
})

describe('sincronizarPush', () => {
  it('NUNCA pide permiso: con permiso sin decidir no hace nada', async () => {
    const { push } = await cargar()
    await push.sincronizarPush()
    expect(Notification.requestPermission).not.toHaveBeenCalled()
    expect(mockMessaging.getToken).not.toHaveBeenCalled()
  })

  it('con permiso concedido renueva el token', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar('uid-sup')
    await push.sincronizarPush()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/uid-sup', { fcmToken: 'token-web-1' })
  })

  it('respeta que el usuario haya apagado los avisos', async () => {
    permiso.actual = 'granted'
    localStorage.setItem('avisos:uid-sup', 'false')
    const { push } = await cargar('uid-sup')
    await push.sincronizarPush()
    expect(mockMessaging.getToken).not.toHaveBeenCalled()
  })

  it('un fallo de FCM se registra pero no lanza (no debe romper el inicio de sesión)', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    permiso.actual = 'granted'
    mockMessaging.getToken.mockRejectedValue(new Error('boom'))
    const { push } = await cargar()
    await expect(push.sincronizarPush()).resolves.toBeUndefined()
  })
})

describe('desactivarPush', () => {
  it('recuerda la elección, borra el campo fcmToken y da de baja el token en FCM', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar('uid-sup')
    await push.desactivarPush()
    expect(localStorage.getItem('avisos:uid-sup')).toBe('false')
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/uid-sup', { fcmToken: 'BORRAR_CAMPO' })
    expect(mockMessaging.deleteToken).toHaveBeenCalledTimes(1)
    expect(push.estadoAvisos()).toBe('inactivo')
  })

  it('si deleteToken falla, el perfil igual quedó limpio y no lanza', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    mockMessaging.deleteToken.mockRejectedValue(new Error('offline'))
    const { push } = await cargar('uid-sup')
    await expect(push.desactivarPush()).resolves.toBeUndefined()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/uid-sup', { fcmToken: 'BORRAR_CAMPO' })
  })
})

describe('limpiarTokenAlCerrarSesion', () => {
  it('quita el token del perfil SIN tocar la preferencia del usuario', async () => {
    permiso.actual = 'granted'
    const { push } = await cargar('uid-sup')
    await push.limpiarTokenAlCerrarSesion()
    expect(mockFirestore.updateDoc).toHaveBeenCalledWith('usuarios/uid-sup', { fcmToken: 'BORRAR_CAMPO' })
    expect(localStorage.getItem('avisos:uid-sup')).toBeNull()
  })

  it('si nunca hubo permiso no toca Firestore', async () => {
    const { push } = await cargar()
    await push.limpiarTokenAlCerrarSesion()
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
  })

  it('sin conexión (updateDoc nunca resuelve) NO deja colgado el cierre de sesión: corta a los 3 s', async () => {
    jest.useFakeTimers()
    permiso.actual = 'granted'
    mockFirestore.updateDoc.mockReturnValue(new Promise(() => {})) // en cola hasta tener señal
    const { push } = await cargar('uid-sup')
    let terminado = false
    const p = push.limpiarTokenAlCerrarSesion().then(() => {
      terminado = true
    })
    await jest.advanceTimersByTimeAsync(push.TOPE_LIMPIEZA_MS - 1)
    expect(terminado).toBe(false)
    await jest.advanceTimersByTimeAsync(2)
    await p
    expect(terminado).toBe(true)
  })

  it('si la limpieza falla, no lanza', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {})
    permiso.actual = 'granted'
    mockFirestore.updateDoc.mockRejectedValue(new Error('permission-denied'))
    const { push } = await cargar('uid-sup')
    await expect(push.limpiarTokenAlCerrarSesion()).resolves.toBeUndefined()
  })

  it('sin sesión o sin soporte no hace nada', async () => {
    permiso.actual = 'granted'
    const sinSesion = await cargar(null)
    await sinSesion.push.limpiarTokenAlCerrarSesion()
    simularNavegador(false)
    const sinSoporte = await cargar('uid-sup')
    await sinSoporte.push.limpiarTokenAlCerrarSesion()
    expect(mockFirestore.updateDoc).not.toHaveBeenCalled()
  })
})
