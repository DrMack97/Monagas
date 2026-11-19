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

import { useEffect, useMemo, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { ILectura } from '@core/types'
import { lecturasActivas, lecturasAnuladas } from '@core/utils/lecturasActivas'

export function useLecturasEvaluacion(evalId: string | undefined) {
  // Todas las lecturas del documento, incluidas las anuladas por el Operador; se separan al devolverlas.
  const [todas, setTodas] = useState<ILectura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!evalId) {
      setTodas([])
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
        setTodas(
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

  // `lecturas` son solo las que CUENTAN (no anuladas); las anuladas se devuelven aparte, como constancia.
  const lecturas = useMemo(() => lecturasActivas(todas), [todas])
  const anuladas = useMemo(() => lecturasAnuladas(todas), [todas])
  return { lecturas, anuladas, loading, error }
}
