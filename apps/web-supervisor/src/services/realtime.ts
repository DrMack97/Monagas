// TODO: Listeners en tiempo real (updates de pozos) - Player 3 (Fullstack)
// Paso 1: onSnapshot para colecciones wells, evaluations
// Paso 2: Actualizar estado cuando cambia
// Paso 3: Manejar error de conexión
// Prompt de implementación rápida:
// "Crear useWellsRealtime, usePendingApprovalsRealtime con onSnapshot"
// Entregable:
// - onWellsChange(callback) → unsubscribe
// - onPendingApprovalsChange(callback) → unsubscribe
// - Reconnect automático si falla
import { db } from './firebase'
import { collection, onSnapshot } from 'firebase/firestore'

export function onWellsChange(callback: (wells: any[]) => void) {
  return onSnapshot(
    collection(db, 'wells'),
    (snapshot) => {
      const wells = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      callback(wells)
    },
    (error) => {
      console.error('Error listening to wells:', error)
    }
  )
}

export function onPendingApprovalsChange(callback: (approvals: any[]) => void) {
  return onSnapshot(
    collection(db, 'evaluations'),
    (snapshot) => {
      const approvals = snapshot.docs
        .filter(doc => doc.data().estado === 'PENDIENTE_SUPERVISOR')
        .map(doc => ({ id: doc.id, ...doc.data() }))
      callback(approvals)
    },
    (error) => {
      console.error('Error listening to approvals:', error)
    }
  )
}

export function onEvaluationChange(evaluationId: string, callback: (evaluation: any) => void) {
  return onSnapshot(
    collection(db, 'evaluations'),
    (snapshot) => {
      const evalDoc = snapshot.docs.find(doc => doc.id === evaluationId)
      if (evalDoc) {
        callback({ id: evalDoc.id, ...evalDoc.data() })
      }
    }
  )
}
