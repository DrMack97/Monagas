// TODO: Configuración Firebase Cloud Messaging - Player 3 (Fullstack)
// Paso 1: Importar messaging SDK
// Paso 2: Configurar Firebase Messaging con app existente
// Paso 3: Exportar messaging instance
// Prompt de implementación rápida:
// "Configurar Firebase Messaging con getMessaging, exportar messaging"
// Entregable:
// - messaging instance inicializada
// - Listenable para background messages
import { initializeApp, getApp, getApps } from 'firebase/app'
import { getMessaging, isSupported, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

// Inicializar Firebase si no está inicializado
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// getMessaging() revienta de inmediato en navegadores/contextos sin
// soporte (Safari sin config previa, tests, iframes sin service
// worker, etc.) — antes se llamaba sin guardia al cargar el módulo,
// lo que tumbaba toda la app (este archivo se importa desde
// useNotifications.ts → SettingsPage.tsx). isSupported() lo evita.
let messagingPromise: Promise<Messaging | null> | null = null
export function getMessagingInstance(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = isSupported()
      .then((soportado) => (soportado ? getMessaging(app) : null))
      .catch(() => null)
  }
  return messagingPromise
}

// Aislado aquí (no directo en useNotifications.ts) para que quede
// cubierto por el mismo mock de tests que el resto de este archivo —
// import.meta.env no es válido bajo el target CommonJS que usa Jest.
export const VAPID_KEY = import.meta.env.VITE_VAPID_KEY

// Configurar service worker para background messages
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(() => console.log('Service Worker registrado para FCM'))
    .catch(err => console.error('Error registrando SW:', err))
}
