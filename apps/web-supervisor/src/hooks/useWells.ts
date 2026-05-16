// TODO: Custom hook lectura pozos asignados - Player 3 (Fullstack)
// Paso 1: Usar useAuth para obtener current user
// Paso 2: Fetch pozos desde Firestore
// Paso 3: Manejar loading y error states
// Prompt de implementación rápida:
// "Crear useWells con auth, fetch, loading, error, realtime option"
// Entregable:
// - wells: array
// - loading: boolean
// - error: string | null
// - refresh: function
import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { getWellsForSupervisor } from '../services/firebase'

export function useWells(options: { realtime?: boolean } = {}) {
  const { user, loading: authLoading } = useAuth()
  const [wells, setWells] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchWells = async () => {
    if (!user) return
    try {
      setLoading(true)
      const data = await getWellsForSupervisor(user.uid)
      setWells(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && user) {
      fetchWells()
    }
  }, [user, authLoading])

  return {
    wells,
    loading: authLoading || loading,
    error,
    refresh: fetchWells
  }
}
