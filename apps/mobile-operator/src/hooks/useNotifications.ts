// src/hooks/useNotifications.ts
//
// Solicita permiso de notificaciones push, obtiene el token de FCM y
// lo guarda en usuarios/{uid} — notifyOperator.ts (Cloud Function) lo
// usa para avisar cuando un supervisor aprueba/rechaza una evaluación.
//
// getMessagingInstance() es async y puede devolver null (navegador
// sin soporte) — getMessaging() sin guardia revienta el módulo entero
// en esos casos, ver services/firebase-messaging.ts.
import { useState, useEffect } from 'react';
import { auth, db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getToken, onMessage } from 'firebase/messaging';
import { getMessagingInstance, VAPID_KEY } from '../services/firebase-messaging';

export function useNotifications() {
  const [permission, setPermission] = useState<boolean | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<any>(null);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const permissionResult = await Notification.requestPermission();
      const granted = permissionResult === 'granted';
      setPermission(granted);

      if (!granted) return false;

      const messaging = await getMessagingInstance();
      if (!messaging) {
        console.warn('FCM no soportado en este navegador — permiso otorgado pero sin token.');
        return false;
      }

      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      setFcmToken(token);

      const user = auth.currentUser;
      if (user) {
        // Payload EXACTO — firestore.rules solo permite a un usuario
        // tocar su propio campo fcmToken, nada más (ver /usuarios/{uid}).
        await updateDoc(doc(db, 'usuarios', user.uid), { fcmToken: token });
      }

      return true;
    } catch (error) {
      console.error('Error solicitando permiso de notificaciones:', error);
      return false;
    }
  };

  useEffect(() => {
    let unsubscribeForeground: (() => void) | undefined;

    getMessagingInstance().then((messaging) => {
      if (!messaging) return;
      unsubscribeForeground = onMessage(messaging, (payload) => {
        setNotification(payload);

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.notification?.title || 'Notificación', {
            body: payload.notification?.body || '',
            icon: '/logo.png',
          });
        }
      });
    });

    return () => {
      unsubscribeForeground?.();
    };
  }, []);

  return {
    permission,
    fcmToken,
    notification,
    requestPermission,
  };
}
