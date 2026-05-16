// TODO: Consultas específicas para supervisor - Player 3 (Fullstack)
// Paso 1: Importar Firebase SDK web
// Paso 2: Configurar Firebase con variables de entorno
// Paso 3: Crear queries para pozos, evaluaciones, aprobaciones
// Prompt de implementación rápida:
// "Configurar Firebase web, crear queries pozos por supervisor, evaluaciones pendientes"
// Entregable:
// - getWellsForSupervisor(supervisorId) → Promise[]
// - getPendingApprovals() → Promise[]
// - getEvaluationById(id) → Promise
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc 
} from 'firebase/firestore'

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

export async function getWellsForSupervisor(supervisorId: string) {
  const q = query(
    collection(db, 'wells'),
    where('supervisorId', '==', supervisorId)
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getPendingApprovals() {
  const q = query(
    collection(db, 'evaluations'),
    where('estado', '==', 'PENDIENTE_SUPERVISOR')
  )
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getEvaluationById(id: string) {
  const docRef = doc(db, 'evaluations', id)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}
