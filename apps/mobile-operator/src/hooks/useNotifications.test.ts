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
import { renderHook, waitFor } from '@testing-library/react'
import { useNotifications } from './useNotifications'

// Mock Firebase Messaging
jest.mock('firebase/messaging', () => ({
  getToken: jest.fn().mockResolvedValue('test-fcm-token'),
  onMessage: jest.fn(),
  onBackgroundMessage: jest.fn()
}))

describe('useNotifications', () => {
  it('debe solicitar permiso y obtener FCM token', async () => {
    const { result } = renderHook(() => useNotifications())

    // Mock Notification.requestPermission
    const originalRequestPermission = Notification.requestPermission
    Notification.requestPermission = jest.fn().mockResolvedValue('granted')

    const granted = await result.current.requestPermission()

    expect(granted).toBe(true)
    expect(result.current.permission).toBe(true)
    expect(result.current.fcmToken).toBe('test-fcm-token')

    Notification.requestPermission = originalRequestPermission
  })

  it('debe negar permiso si usuario rechaza', async () => {
    const { result } = renderHook(() => useNotifications())

    const originalRequestPermission = Notification.requestPermission
    Notification.requestPermission = jest.fn().mockResolvedValue('denied')

    const granted = await result.current.requestPermission()

    expect(granted).toBe(false)
    expect(result.current.permission).toBe(false)

    Notification.requestPermission = originalRequestPermission
  })
})
