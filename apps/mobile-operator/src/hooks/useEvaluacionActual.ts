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
//
// OFFLINE: el onSnapshot de arriba resuelve al instante desde caché
// (enableIndexedDbPersistence, ver services/firebase.ts) si el pozo ya
// se cargó alguna vez con conexión — por eso seguir registrando
// lecturas de un ciclo YA iniciado funciona sin señal. Lo que NO
// funciona offline es runTransaction: a diferencia de un write normal,
// una transacción necesita ida y vuelta real al servidor (tiene que
// leer el estado más reciente para no pisar a otro cliente), así que
// Firestore la deja pendiente indefinidamente sin red. TRANSACTION_TIMEOUT_MS
// evita que esto trabe la pantalla para siempre cuando el Operador
// abre un pozo SIN ciclo iniciado todavía y sin conexión — ahí sí hace
// falta estar en línea al menos una vez para arrancar el ciclo.
import { useEffect, useRef, useState } from 'react'
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Zona } from '@core/types'

const TRANSACTION_TIMEOUT_MS = 8000

function conTimeout<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promesa,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject({ code: 'sin-conexion-timeout' }), ms)
    ),
  ])
}

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
          const nuevoEvalId = await conTimeout(runTransaction(db, async (tx) => {
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
          }), TRANSACTION_TIMEOUT_MS)
          setEvalId(nuevoEvalId)
        } catch (err: any) {
          setError(
            err.code === 'permission-denied'
              ? 'No tienes permiso para iniciar una evaluación en este pozo.'
              : err.code === 'sin-conexion-timeout'
              ? 'Sin conexión — necesitas señal al menos una vez para iniciar un ciclo nuevo en este pozo.'
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
