// TODO: Tests de notificaciones - Player 3 (Fullstack)
// Paso 1: Test requestPermission granted
// Paso 2: Test requestPermission denied
// Paso 3: Test FCM token guardado en Firestore
// Prompt de implementación rápida:
// "Crear tests para useNotifications con mocks"
// Entregable:
// - requestPermission granted → fcmToken set
// - requestPermission denied → permission false
// - FCM token guardado en Firestore
import { act, renderHook } from '@testing-library/react'
import { useNotifications } from './useNotifications'

// Mock Firebase Messaging — onMessage debe devolver una función de
// unsubscribe real: el cleanup del useEffect de useNotifications la
// invoca al desmontar, y un jest.fn() sin retorno explícito devuelve
// undefined (rompe con "unsubscribeForeground is not a function").
jest.mock('firebase/messaging', () => ({
  getMessaging: jest.fn(() => ({})),
  isSupported: jest.fn().mockResolvedValue(true),
  getToken: jest.fn().mockResolvedValue('test-fcm-token'),
  onMessage: jest.fn(() => jest.fn()),
  onBackgroundMessage: jest.fn(),
}))

// jsdom no implementa la Notification API — se stubea a nivel global
// para todo el archivo en vez de mutar/restaurar por test.
beforeAll(() => {
  ;(globalThis as any).Notification = { requestPermission: jest.fn(), permission: 'default' }
})

describe('useNotifications', () => {
  it('debe solicitar permiso y obtener FCM token', async () => {
    const { result } = renderHook(() => useNotifications())

    ;(Notification.requestPermission as jest.Mock).mockResolvedValueOnce('granted')

    let granted = false
    // requestPermission dispara setState internamente — sin act(),
    // result.current queda con el snapshot pre-update.
    await act(async () => {
      granted = await result.current.requestPermission()
    })

    expect(granted).toBe(true)
    expect(result.current.permission).toBe(true)
    expect(result.current.fcmToken).toBe('test-fcm-token')
  })

  it('debe negar permiso si usuario rechaza', async () => {
    const { result } = renderHook(() => useNotifications())

    ;(Notification.requestPermission as jest.Mock).mockResolvedValueOnce('denied')

    let granted = true
    await act(async () => {
      granted = await result.current.requestPermission()
    })

    expect(granted).toBe(false)
    expect(result.current.permission).toBe(false)
  })
})
