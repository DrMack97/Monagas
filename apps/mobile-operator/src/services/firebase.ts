// TODO: Inicialización Firebase Auth + Firestore - Player 3 (Fullstack)
// Paso 1: Importar Firebase SDK functions
// Paso 2: Configurar Firebase con variables de entorno
// Paso 3: Exportar auth, db, storage instancias
// Prompt de implementación rápida:
// "Configurar Firebase app con VITE_FIREBASE_*, exportar auth, db, storage"
// Entregable:
// - Firebase app inicializado
// - auth, db, storage exportadas
// - Persistence enabled para offline
import { initializeApp } from 'firebase/app'
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enablePersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Enable offline persistence
enablePersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.log('Persistence failed: Already enabled')
  } else if (err.code === 'unimplemented') {
    console.log('Persistence not supported by browser')
  }
})

// Set persistence to local
setPersistence(auth, browserLocalPersistence).catch(err => {
  console.error('Auth persistence failed:', err)
})
