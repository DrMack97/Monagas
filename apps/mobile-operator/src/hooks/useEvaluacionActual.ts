// src/hooks/useEvaluacionActual.ts
//
// Resuelve la evaluación EN_CURSO del pozo asignado al Operador: si
// ya existe una, la reutiliza; si no, crea una nueva. Es el puente
// que faltaba entre "tengo un pozo asignado" y "tengo un evalId para
// escribir lecturas" — sin esto, RegistroPage/TablaPage/ReportePage
// no tienen a dónde guardar nada.
//
// El create respeta exactamente la regla de firestore.rules:
// isOperador() && isAssignedToPozo(request.resource.data.pozoId).

import { useEffect, useRef, useState } from 'react'
import { collection, query, where, limit, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Zona } from '@core/types'

export function useEvaluacionActual(
  pozoId: string | undefined,
  operadorId: string | undefined,
  zona: Zona | undefined
) {
  const [evalId, setEvalId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const creandoRef = useRef(false)

  useEffect(() => {
    if (!pozoId || !operadorId) {
      setEvalId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const q = query(
      collection(db, 'evaluaciones'),
      where('pozoId', '==', pozoId),
      where('estado', '==', 'EN_CURSO'),
      limit(1)
    )

    const unsubscribe = onSnapshot(
      q,
      async (snap) => {
        if (!snap.empty) {
          setEvalId(snap.docs[0].id)
          setLoading(false)
          return
        }

        if (creandoRef.current) return
        creandoRef.current = true
        try {
          const ref = await addDoc(collection(db, 'evaluaciones'), {
            pozoId,
            operadorId,
            estado: 'EN_CURSO',
            fechaInicio: serverTimestamp(),
            horasEvaluadas: 0,
            zona: zona ?? 'MONAGAS',
            config: { apiXp: 0, aysPct: 0 },
            creadoEn: serverTimestamp(),
          })
          setEvalId(ref.id)
        } catch (err: any) {
          setError(
            err.code === 'permission-denied'
              ? 'No tienes permiso para iniciar una evaluación en este pozo.'
              : 'No se pudo iniciar la evaluación. Intenta de nuevo.'
          )
        } finally {
          creandoRef.current = false
          setLoading(false)
        }
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [pozoId, operadorId, zona])

  return { evalId, loading, error }
}
