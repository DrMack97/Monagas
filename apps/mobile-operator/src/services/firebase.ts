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
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

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

const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Emuladores locales en dev — nunca en build de producción. Debe
// correr ANTES de cualquier otra operación sobre db/auth/storage
// (persistencia incluida), o Firestore tira "already started".
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR !== 'false') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  connectStorageEmulator(storage, 'localhost', 9199);
}

// Persistencia offline — no en el emulador de Firestore (rompe con
// invalid access en algunas versiones) y solo tiene sentido contra
// el backend real.
if (!import.meta.env.DEV) {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Múltiples pestañas abiertas, persistencia limitada');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Navegador no soporta persistencia offline');
    }
  });
}

export { db, storage, auth, app };