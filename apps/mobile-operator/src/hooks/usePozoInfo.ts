// src/hooks/usePozoInfo.ts
//
// Lee la configuración de un pozo (nombre, empresa, horasEval, etc.)
// para el encabezado del reporte. Lectura directa por ID, no un
// listener realtime — la config de un pozo no cambia mientras el
// operador está viendo su reporte.
//
// OFFLINE: getDoc() sin caché previa (primera vez que este pozo se
// abre en este dispositivo) y sin conexión no tiene de dónde sacar el
// dato — rechaza. Antes esto no se manejaba (sin .catch()), así que
// `loading` se quedaba en true para siempre y la pantalla mostraba
// "Cargando pozo..." indefinidamente. Ver docs/technical/offline-strategy.md.
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IPozo } from '@core/types'

export function usePozoInfo(pozoId: string | undefined) {
  const [pozo, setPozo] = useState<IPozo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!pozoId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getDoc(doc(db, 'pozos', pozoId))
      .then((snap) => {
        setPozo(snap.exists() ? ({ id: snap.id, ...snap.data() } as IPozo) : null)
        setLoading(false)
      })
      .catch((err) => {
        setError(
          err.code === 'unavailable'
            ? 'Sin conexión y este pozo todavía no se cargó en este dispositivo — necesitas señal al menos una vez.'
            : 'No se pudo cargar el pozo. Intenta de nuevo.'
        )
        setLoading(false)
      })
  }, [pozoId])

  return { pozo, loading, error }
}
