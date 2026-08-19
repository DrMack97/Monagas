// src/hooks/useLecturasEvaluacion.ts
//
// Equivalente exacto al hook de mobile-operator (mismo nombre,
// mismo comportamiento) — lee en tiempo real la subcolección de
// lecturas de una evaluación. Usado por el drill-down de
// ApprovalQueuePage.tsx: el Supervisor necesita ver cada lectura
// individual, no solo el resumen agregado en `resultados`.
//
// La regla de lectura de /evaluaciones/{evalId}/lecturas/{lecturaId}
// ya es abierta a cualquier usuario autenticado — no hace falta
// tocar firestore.rules para esto (a diferencia de editarlas).

import { useEffect, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { ILectura } from '@core/types'

export function useLecturasEvaluacion(evalId: string | undefined) {
  const [lecturas, setLecturas] = useState<ILectura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!evalId) {
      setLecturas([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'evaluaciones', evalId, 'lecturas'),
      orderBy('hora', 'asc')
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setLecturas(
          snap.docs.map((d) => {
            const data = d.data()
            const timestamp =
              data.timestamp && typeof data.timestamp.toDate === 'function'
                ? data.timestamp.toDate()
                : data.timestamp
            return { id: d.id, ...data, timestamp } as ILectura
          })
        )
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [evalId])

  return { lecturas, loading, error }
}
