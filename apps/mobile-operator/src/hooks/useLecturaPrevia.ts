// src/hooks/useLecturaPrevia.ts
//
// Lecturas del ciclo ANTERIOR del pozo, para el prefill de Registro cuando el ciclo actual todavía no tiene
// ninguna: la primera lectura de un ciclo nuevo debe partir de lo capturado en la última carga (gas, presiones…)
// y no de valores por defecto. Cuando el ciclo actual ya tiene lecturas no se consulta nada (habilitado = false).
//
// Es "mejor esfuerzo": si no hay ciclos anteriores, no hay señal sin caché, o la consulta falla, devuelve []
// y la pantalla usa sus valores por defecto. Nunca bloquea ni muestra error.
//
// Lecturas: el Operador ya puede leer las evaluaciones de su pozo y sus lecturas (firestore.rules), así que no
// requiere permisos nuevos. La consulta por pozoId usa solo un filtro de igualdad (sin índice compuesto) y el orden
// por ciclo se hace en el cliente.

import { useEffect, useState } from 'react'
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { ILectura } from '@core/types'

/** Cuántos ciclos anteriores se revisan buscando uno que tenga lecturas. */
const MAX_CICLOS_ATRAS = 3
/** Cuántas lecturas se traen de ese ciclo (la más reciente primero): por si la última no trae algún dato. */
const LECTURAS_POR_CICLO = 5

function aMillis(valor: any): number {
  if (!valor) return 0
  if (typeof valor.toMillis === 'function') return valor.toMillis()
  if (typeof valor.toDate === 'function') return valor.toDate().getTime()
  const t = new Date(valor).getTime()
  return Number.isFinite(t) ? t : 0
}

export function useLecturaPrevia(pozoId: string | undefined, evalId: string | null | undefined, habilitado: boolean) {
  /** Lecturas del último ciclo anterior con datos, la más reciente primero. */
  const [previas, setPrevias] = useState<ILectura[]>([])

  useEffect(() => {
    if (!habilitado || !pozoId || !evalId) {
      setPrevias([])
      return
    }
    let cancelado = false

    ;(async () => {
      try {
        const evaluaciones = await getDocs(query(collection(db, 'evaluaciones'), where('pozoId', '==', pozoId)))
        const anteriores = evaluaciones.docs
          .filter((d) => d.id !== evalId)
          .map((d) => ({ id: d.id, creado: aMillis(d.data().creadoEn) }))
          .sort((a, b) => b.creado - a.creado)
          .slice(0, MAX_CICLOS_ATRAS)

        for (const ciclo of anteriores) {
          const lecturas = await getDocs(
            query(collection(db, 'evaluaciones', ciclo.id, 'lecturas'), orderBy('hora', 'desc'), limit(LECTURAS_POR_CICLO))
          )
          if (!lecturas.empty) {
            if (!cancelado) setPrevias(lecturas.docs.map((d) => ({ id: d.id, ...d.data() }) as ILectura))
            return
          }
        }
        if (!cancelado) setPrevias([])
      } catch (err) {
        // Sin ciclos previos accesibles (sin caché ni señal, permisos…): se usan los valores por defecto.
        console.debug('Sin lecturas previas para prefill:', err)
        if (!cancelado) setPrevias([])
      }
    })()

    return () => {
      cancelado = true
    }
  }, [pozoId, evalId, habilitado])

  return { previas }
}
