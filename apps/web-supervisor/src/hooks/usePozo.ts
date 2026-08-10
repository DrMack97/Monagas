// src/hooks/usePozo.ts
//
// Lee un pozo específico por ID, en tiempo real. Usado por
// WellDetailPage. A diferencia de usePozosVisibles (lista completa
// según rol), este hook no filtra nada — si el usuario no tiene
// permiso de lectura sobre ese pozo puntual, Firestore Rules
// rechaza la suscripción y el error queda reflejado en `error`.

import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IPozo } from '@core/types'

export function usePozo(pozoId: string | undefined) {
  const [pozo, setPozo] = useState<IPozo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pozoId) {
      setPozo(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const unsubscribe = onSnapshot(
      doc(db, 'pozos', pozoId),
      (snap) => {
        setPozo(snap.exists() ? ({ id: snap.id, ...snap.data() } as IPozo) : null)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(
          err.code === 'permission-denied'
            ? 'No tienes acceso a este pozo.'
            : err.message
        )
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [pozoId])

  return { pozo, loading, error }
}
