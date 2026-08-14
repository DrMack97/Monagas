// src/hooks/useApprovals.ts
//
// Cola de aprobaciones para SUP_AREA/GERENTE. Reemplaza el stub
// original, que apuntaba a una colección 'evaluations' (inglés,
// plana) que no existe — el esquema real es la colección de nivel
// raíz 'evaluaciones' (ver useEvaluacionActual.ts /
// useLecturasEvaluacion.ts en mobile-operator), con scoping por zona
// idéntico al de usePozosVisibles.ts:
//   SUP_AREA → evaluaciones de su zona
//   GERENTE  → todas, sin filtro
//   SUP_CAMPO/OPERADOR → sin acceso (no les corresponde aprobar)
//
// NOTA (depende de la definición de la máquina de estados — checklist
// Fase 2, item 2): hoy nada en la app pone estado en
// PENDIENTE_SUPERVISOR todavía — ReportePage.tsx cierra directo a
// CERRADA. Este hook queda correcto pero devolverá una cola vacía
// hasta que ese cambio aterrice.
//
// Rechazar: IEvaluacion no define un estado 'RECHAZADA' — solo
// EN_CURSO | CERRADA | PENDIENTE_SUPERVISOR | APROBADA_SUPERVISOR |
// OFICIAL. Para no inventar un estado nuevo fuera de esta rama, un
// rechazo devuelve la evaluación a EN_CURSO con el motivo guardado en
// `aprobaciones` — el operador la ve y puede seguir registrando
// lecturas. Revisar si esto es lo deseado al definir la máquina de
// estados completa.

import { useEffect, useState, useCallback } from 'react'
import {
  collection, query, where, onSnapshot, doc, updateDoc, arrayUnion,
} from 'firebase/firestore'
import { db } from '../services/firebase'
import type { Rol, Zona, IEvaluacion, IAprobacion } from '@core/types'

export function useApprovals(rol: Rol | null, zona: Zona | null, uid: string | null) {
  const [pendientes, setPendientes] = useState<IEvaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    if (rol !== 'SUP_AREA' && rol !== 'GERENTE') {
      setPendientes([])
      setLoading(false)
      return
    }
    if (rol === 'SUP_AREA' && !zona) {
      setPendientes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const base = collection(db, 'evaluaciones')
    const q =
      rol === 'GERENTE'
        ? query(base, where('estado', '==', 'PENDIENTE_SUPERVISOR'))
        : query(base, where('estado', '==', 'PENDIENTE_SUPERVISOR'), where('zona', '==', zona))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setPendientes(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IEvaluacion))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [rol, zona])

  const aprobar = useCallback(
    async (evalId: string, comentario?: string) => {
      if (!rol || !uid) throw new Error('No hay sesión activa.')
      setProcesando(true)
      try {
        const aprobacion: IAprobacion = {
          rol,
          uid,
          accion: 'APROBAR',
          // arrayUnion no admite serverTimestamp() dentro de un array —
          // Date() de cliente es la única opción válida aquí.
          timestamp: new Date(),
          ...(comentario ? { comentario } : {}),
        }
        await updateDoc(doc(db, 'evaluaciones', evalId), {
          estado: 'APROBADA_SUPERVISOR',
          aprobaciones: arrayUnion(aprobacion),
        })
      } finally {
        setProcesando(false)
      }
    },
    [rol, uid]
  )

  const rechazar = useCallback(
    async (evalId: string, comentario: string) => {
      if (!rol || !uid) throw new Error('No hay sesión activa.')
      if (!comentario.trim()) throw new Error('El rechazo requiere un motivo.')
      setProcesando(true)
      try {
        const aprobacion: IAprobacion = {
          rol,
          uid,
          accion: 'RECHAZAR',
          timestamp: new Date(),
          comentario,
        }
        await updateDoc(doc(db, 'evaluaciones', evalId), {
          estado: 'EN_CURSO',
          aprobaciones: arrayUnion(aprobacion),
        })
      } finally {
        setProcesando(false)
      }
    },
    [rol, uid]
  )

  return { pendientes, loading, error, procesando, aprobar, rechazar }
}
