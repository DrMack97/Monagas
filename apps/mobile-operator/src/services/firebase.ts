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

import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

// Firestore con persistencia offline
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('⚠️ Múltiples pestañas abiertas, persistencia limitada');
  } else if (err.code === 'unimplemented') {
    console.warn('⚠️ Navegador no soporta persistencia offline');
  }
});

const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth, app };