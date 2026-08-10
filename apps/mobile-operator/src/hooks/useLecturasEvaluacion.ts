// src/hooks/useLecturasEvaluacion.ts
//
// Lee en tiempo real la subcolección de lecturas de una evaluación.
// Es la fuente de datos tanto para TablaPage como para el cálculo
// de promedio (normal o forzado) en ReportePage.

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
            // Firestore devuelve Timestamp, no Date — convertir en el
            // borde de lectura para que el resto de la app (fmt,
            // dateFormat) pueda tratarlo como Date de forma segura.
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
