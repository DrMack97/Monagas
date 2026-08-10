// src/hooks/usePozosVisibles.ts
//
// Reemplaza a useWells.ts (decoy: colección 'wells' inexistente,
// campo 'supervisorId' inventado, sin lógica de rol).
//
// Implementa exactamente lo que permiten las Firestore Rules —
// si esta query pide más de lo que la regla autoriza, Firestore
// no filtra silenciosamente: rechaza toda la consulta.
//
//   SUP_CAMPO → un (1) pozo, el mismo que pozoAsignado
//   SUP_AREA  → todos los pozos de su zona
//   GERENTE   → todos los pozos del sistema, sin filtro

import { useEffect, useState } from 'react'
import {
  collection, doc, query, where, onSnapshot,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IPozo, Rol, Zona } from '@core/types'

export function usePozosVisibles(
  rol: Rol | null,
  zona: Zona | null,
  pozoAsignado: string | null
) {
  const [pozos, setPozos] = useState<IPozo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!rol) {
      setPozos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    let unsubscribe: () => void

    if (rol === 'SUP_CAMPO') {
      if (!pozoAsignado) {
        setPozos([])
        setLoading(false)
        return
      }
      unsubscribe = onSnapshot(
        doc(db, 'pozos', pozoAsignado),
        (snap) => {
          setPozos(snap.exists() ? [{ id: snap.id, ...snap.data() } as IPozo] : [])
          setLoading(false)
        },
        (err) => { setError(err.message); setLoading(false) }
      )
    } else if (rol === 'SUP_AREA') {
      if (!zona) {
        setPozos([])
        setLoading(false)
        return
      }
      const q = query(collection(db, 'pozos'), where('zona', '==', zona))
      unsubscribe = onSnapshot(
        q,
        (snap) => {
          setPozos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IPozo))
          setLoading(false)
        },
        (err) => { setError(err.message); setLoading(false) }
      )
    } else if (rol === 'GERENTE') {
      unsubscribe = onSnapshot(
        collection(db, 'pozos'),
        (snap) => {
          setPozos(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IPozo))
          setLoading(false)
        },
        (err) => { setError(err.message); setLoading(false) }
      )
    } else {
      // OPERADOR u otro rol no debería llegar a este hook —
      // el consumo de web-supervisor es exclusivo de supervisión.
      setPozos([])
      setLoading(false)
      return
    }

    return () => unsubscribe?.()
  }, [rol, zona, pozoAsignado])

  return { pozos, loading, error }
}
