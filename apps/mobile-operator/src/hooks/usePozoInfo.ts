// src/hooks/usePozoInfo.ts
//
// Lee la configuración de un pozo (nombre, empresa, horasEval, etc.)
// para el encabezado del reporte. Lectura directa por ID, no un
// listener realtime — la config de un pozo no cambia mientras el
// operador está viendo su reporte.

import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IPozo } from '@core/types'

export function usePozoInfo(pozoId: string | undefined) {
  const [pozo, setPozo] = useState<IPozo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!pozoId) {
      setLoading(false)
      return
    }
    getDoc(doc(db, 'pozos', pozoId)).then((snap) => {
      setPozo(snap.exists() ? ({ id: snap.id, ...snap.data() } as IPozo) : null)
      setLoading(false)
    })
  }, [pozoId])

  return { pozo, loading }
}
