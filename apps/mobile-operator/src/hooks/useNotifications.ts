// TODO: Hook notificaciones push Firebase Cloud Messaging - Player 3 (Fullstack)
// Paso 1: Importar Firebase Messaging SDK
// Paso 2: Solicitar permiso al usuario
// Paso 3: Obtener FCM token y guardarlo en Firestore
// Paso 4: Listeners para mensajes en foreground/background
// Prompt de implementación rápida:
// "Crear useNotifications con requestPermission, getToken, onMessage, onBackgroundMessage"
// Entregable:
// - requestPermission() → Promise<boolean>
// - getFCMToken() → string (guardado en Firestore users/{uid})
// - onMessage(callback) → listener foreground
// - onBackgroundMessage(callback) → listener background
import { useState, useEffect } from 'react'
import { messaging } from '../services/firebase-messaging'
import { 
  getToken, 
  onMessage, 
  onBackgroundMessage 
} from 'firebase/messaging'
import { auth, db } from '../services/firebase'
import { doc, updateDoc } from 'firebase/firestore'

export function useNotifications() {
  const [permission, setPermission] = useState<boolean | null>(null)
  const [fcmToken, setFcmToken] = useState<string | null>(null)
  const [notification, setNotification] = useState<any>(null)

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission === 'granted')

      if (permission === 'granted') {
        const token = await getToken(messaging, {
          vapidKey: import.meta.env.VITE_VAPID_KEY
        })
        
        setFcmToken(token)

        // Guardar token en Firestore
        const user = auth.currentUser
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            fcmToken: token,
            lastNotificationUpdate: new Date()
          })
        }

        return true
      }

      return false
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  useEffect(() => {
    // Listener para mensajes en foreground
    const unsubscribeForeground = onMessage(messaging, (payload) => {
      setNotification(payload)
      console.log('Mensaje en foreground:', payload)
      
      // Mostrar notificación local
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.notification?.title || 'Notificación', {
          body: payload.notification?.body || '',
          icon: '/logo.png'
        })
      }
    })

    return () => {
      unsubscribeForeground()
    }
  }, [])

  return {
    permission,
    fcmToken,
    notification,
    requestPermission
  }
}

// Listener para background (debe ser externo al hook)
export function onBackgroundNotification(callback: (payload: any) => void) {
  onBackgroundMessage(messaging, (payload) => {
    console.log('Mensaje en background:', payload)
    callback(payload)
  })
}
