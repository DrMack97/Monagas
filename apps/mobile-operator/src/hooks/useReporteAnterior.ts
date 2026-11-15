// src/hooks/useReporteAnterior.ts
//
// Datos del reporte (reporteOperativo) ya capturados para el pozo, para el PREFILL de la pantalla Reporte: nombres
// de supervisores, datos del testing, acumulados… ("tras el primer registro deben autocompletarse en los reportes
// posteriores", requisito del cliente).
//
// Cada campo se toma del reporte MÁS RECIENTE del pozo que lo tenga: primero el del ciclo actual (si ya se guardó un
// avance) y luego los ciclos anteriores del más nuevo al más viejo. Se hace campo por campo: si el último reporte no
// traía el supervisor nocturno pero el anterior sí, se usa ese.
//
// Es "mejor esfuerzo": sin ciclos, sin señal ni caché, o si la consulta falla, devuelve null y la pantalla queda como
// siempre (campos vacíos). Nunca bloquea ni muestra error. El Operador ya puede leer las evaluaciones de su pozo
// (firestore.rules), así que no hay permisos nuevos; la consulta solo filtra por pozoId (sin índice compuesto) y el
// orden se hace en el cliente.

import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IReporteOperativo } from '@core/types'

export interface ReporteDeCiclo {
  id: string
  /** Fecha de creación del ciclo en milisegundos (para ordenar). */
  creadoMs: number
  reporte: Partial<IReporteOperativo> | undefined
}

function aMillis(valor: any): number {
  if (!valor) return 0
  if (typeof valor.toMillis === 'function') return valor.toMillis()
  if (typeof valor.toDate === 'function') return valor.toDate().getTime()
  const t = new Date(valor).getTime()
  return Number.isFinite(t) ? t : 0
}

function tieneValor(v: unknown): boolean {
  if (v === undefined || v === null) return false
  if (typeof v === 'string') return v.trim() !== ''
  if (typeof v === 'number') return Number.isFinite(v)
  if (Array.isArray(v)) return v.length > 0
  return true
}

/**
 * Une los reportes de los ciclos del pozo, campo por campo: el valor lo pone el ciclo ACTUAL si lo tiene y, si no, el
 * ciclo anterior más reciente que lo tenga. Los valores vacíos (cadena en blanco, null) no cuentan.
 */
export function fusionarReportes(ciclos: ReporteDeCiclo[], evalIdActual: string): Partial<IReporteOperativo> {
  const orden = [...ciclos].sort((a, b) => {
    if (a.id === evalIdActual) return -1
    if (b.id === evalIdActual) return 1
    return b.creadoMs - a.creadoMs
  })
  const resultado: Record<string, unknown> = {}
  for (const ciclo of orden) {
    for (const [campo, valor] of Object.entries(ciclo.reporte ?? {})) {
      if (!(campo in resultado) && tieneValor(valor)) resultado[campo] = valor
    }
  }
  return resultado as Partial<IReporteOperativo>
}

export function useReporteAnterior(pozoId: string | undefined, evalId: string | undefined) {
  const [anterior, setAnterior] = useState<Partial<IReporteOperativo> | null>(null)

  useEffect(() => {
    if (!pozoId || !evalId) {
      setAnterior(null)
      return
    }
    let cancelado = false

    ;(async () => {
      try {
        const evaluaciones = await getDocs(query(collection(db, 'evaluaciones'), where('pozoId', '==', pozoId)))
        const ciclos: ReporteDeCiclo[] = evaluaciones.docs.map((d) => {
          const data = d.data()
          return { id: d.id, creadoMs: aMillis(data.creadoEn), reporte: data.reporteOperativo }
        })
        const fusionado = fusionarReportes(ciclos, evalId)
        if (!cancelado) setAnterior(Object.keys(fusionado).length > 0 ? fusionado : null)
      } catch (err) {
        console.debug('Sin reporte anterior para prefill:', err)
        if (!cancelado) setAnterior(null)
      }
    })()

    return () => {
      cancelado = true
    }
  }, [pozoId, evalId])

  return { anterior }
}
