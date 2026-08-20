// src/hooks/useEvaluacionesOficiales.ts
//
// Historial de evaluaciones YA cerradas (OFICIAL, o APROBADA_SUPERVISOR
// en el instante brevísimo antes de que onApprove.ts la ascienda a
// OFICIAL) de UN pozo — usado por WellDetailPage.tsx para exportar
// informes pasados. Sin esto no había ninguna pantalla en
// web-supervisor donde volver a ver/exportar un informe ya aprobado:
// ApprovalQueuePage.tsx solo muestra PENDIENTE_SUPERVISOR, y en cuanto
// se aprueba, la evaluación desaparece de esa cola para siempre.
//
// Orden por fechaCierre se hace en cliente, no con orderBy() de
// Firestore, para no necesitar un índice compuesto — el volumen de
// evaluaciones por pozo es chico (una por ciclo de prueba).
//
// El where('zona', '==', zona) NO es opcional aunque pozoId ya
// identifique un único pozo (y por lo tanto una única zona) — la
// regla de lectura de /evaluaciones exige canViewPozosEnZona(zona)
// para SUP_AREA/GERENTE, y Firestore rechaza un query 'list' entero
// con permission-denied si el campo que la regla evalúa (zona) no
// está también acotado por un where() explícito, sin importar que en
// los datos reales ya esté implícitamente fijo. Mismo patrón que
// useApprovals.ts.
import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IEvaluacion, Zona } from '@core/types'

function toDate(value: any): Date | undefined {
  if (!value) return undefined
  return typeof value.toDate === 'function' ? value.toDate() : value
}

export function useEvaluacionesOficiales(pozoId: string | undefined, zona: Zona | undefined) {
  const [evaluaciones, setEvaluaciones] = useState<IEvaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pozoId || !zona) {
      setEvaluaciones([])
      setLoading(false)
      return
    }
    setLoading(true)
    const q = query(
      collection(db, 'evaluaciones'),
      where('pozoId', '==', pozoId),
      where('zona', '==', zona),
      where('estado', 'in', ['OFICIAL', 'APROBADA_SUPERVISOR'])
    )
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs
          .map((d) => {
            const data = d.data()
            return {
              id: d.id,
              ...data,
              fechaInicio: toDate(data.fechaInicio),
              fechaCierre: toDate(data.fechaCierre),
              creadoEn: toDate(data.creadoEn),
            } as IEvaluacion
          })
          .sort((a, b) => (b.fechaCierre?.getTime() ?? 0) - (a.fechaCierre?.getTime() ?? 0))
        setEvaluaciones(lista)
        setLoading(false)
        setError(null)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )
    return () => unsubscribe()
  }, [pozoId, zona])

  return { evaluaciones, loading, error }
}
