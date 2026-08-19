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
//
// CONCURRENCIA: la versión anterior resolvía esto con una query
// (where pozoId+estado==EN_CURSO) + un onSnapshot que, si llegaba
// vacío, creaba una evaluación nueva — protegido solo por un ref
// local (creandoRef). Ese guard es por-instancia: no sirve de nada si
// el mismo Operador tiene dos pestañas/dispositivos abiertos a la vez
// (ni si el mismo componente remonta), porque cada instancia tiene su
// propio ref y ambas ven la query vacía al mismo tiempo — resultado:
// dos evaluaciones EN_CURSO duplicadas para el mismo pozo.
//
// La solución es un candado atómico del lado del servidor:
// pozo.evalEnCursoId (ver IPozo en @monagas/core). Se resuelve con
// runTransaction: lee el pozo, si ya tiene evalEnCursoId lo reutiliza,
// si no, crea la evaluación Y fija el candado en la misma transacción.
// Si dos transacciones compiten, Firestore reintenta automáticamente
// la que pierde — al releer, ya ve el candado puesto por la ganadora
// y simplemente lo reutiliza en vez de crear un duplicado.
import { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
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
  const resolviendoRef = useRef(false)

  useEffect(() => {
    if (!pozoId || !operadorId) {
      setEvalId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    const pozoRef = doc(db, 'pozos', pozoId)

    const unsubscribe = onSnapshot(
      pozoRef,
      async (snap) => {
        if (!snap.exists()) {
          setError('El pozo asignado ya no existe.')
          setLoading(false)
          return
        }

        const evalEnCursoId = (snap.data().evalEnCursoId as string | null | undefined) ?? null
        if (evalEnCursoId) {
          setEvalId(evalEnCursoId)
          setLoading(false)
          return
        }

        // Nadie tiene el candado todavía — intentar tomarlo.
        if (resolviendoRef.current) return
        resolviendoRef.current = true
        try {
          const nuevoEvalId = await runTransaction(db, async (tx) => {
            const pozoSnap = await tx.get(pozoRef)
            const pozoActual = pozoSnap.data()

            // Otra pestaña/dispositivo ganó la carrera entre que
            // llegó este snapshot y que arrancó esta transacción.
            const yaExiste = pozoActual?.evalEnCursoId as string | null | undefined
            if (yaExiste) return yaExiste

            const nuevaEvalRef = doc(collection(db, 'evaluaciones'))
            tx.set(nuevaEvalRef, {
              pozoId,
              operadorId,
              estado: 'EN_CURSO',
              fechaInicio: serverTimestamp(),
              horasEvaluadas: 0,
              zona: zona ?? 'MONAGAS',
              config: { apiXp: 0, aysPct: 0 },
              creadoEn: serverTimestamp(),
            })
            tx.update(pozoRef, { evalEnCursoId: nuevaEvalRef.id })
            return nuevaEvalRef.id
          })
          setEvalId(nuevoEvalId)
        } catch (err: any) {
          setError(
            err.code === 'permission-denied'
              ? 'No tienes permiso para iniciar una evaluación en este pozo.'
              : 'No se pudo iniciar la evaluación. Intenta de nuevo.'
          )
        } finally {
          resolviendoRef.current = false
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
