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
import { getMessaging } from 'firebase/messaging'

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

// Inicializar Messaging
export const messaging = getMessaging(app)

// Configurar service worker para background messages
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then(() => console.log('Service Worker registrado para FCM'))
    .catch(err => console.error('Error registrando SW:', err))
}
