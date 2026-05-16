// TODO: Custom hook flujo aprobaciones - Player 3 (Fullstack)
// Paso 1: getPendingApprovals()
// Paso 2: approve(evaluationId) → update estado
// Paso 3: reject(evaluationId, reason) → update estado + reason
// Prompt de implementación rápida:
// "Crear useApprovals con pending, approve, reject, loading states"
// Entregable:
// - pendingApprovals: array
// - approve(id) → Promise
// - reject(id, reason) → Promise
// - loading: boolean durante approve/reject
import { useState, useEffect } from 'react'
import { db } from '../services/firebase'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

export function useApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPending = async () => {
    try {
      setLoading(true)
      const q = query(
        collection(db, 'evaluations'),
        where('estado', '==', 'PENDIENTE_SUPERVISOR')
      )
      const snapshot = await getDocs(q)
      setPendingApprovals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const approve = async (evaluationId: string) => {
    try {
      const ref = doc(db, 'evaluations', evaluationId)
      await updateDoc(ref, { 
        estado: 'APROBADA_SUPERVISOR',
        aprobadaPor: 'current-user-id', // TODO: obtener de auth
        fechaAprobacion: new Date()
      })
      await fetchPending()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  const reject = async (evaluationId: string, reason: string) => {
    try {
      const ref = doc(db, 'evaluations', evaluationId)
      await updateDoc(ref, { 
        estado: 'RECHAZADA',
        motivoRechazo: reason,
        rechazadaPor: 'current-user-id',
        fechaRechazo: new Date()
      })
      await fetchPending()
    } catch (err) {
      setError(err.message)
      throw err
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  return {
    pendingApprovals,
    loading,
    error,
    approve,
    reject,
    refresh: fetchPending
  }
}
