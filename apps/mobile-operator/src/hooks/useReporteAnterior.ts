// src/hooks/useReporteAnterior.ts
//
// Datos del reporte (reporteOperativo) ya capturados para el pozo, para el PREFILL de la pantalla Reporte: nombres
// de supervisores, datos del testing, acumulados… ("tras el primer registro deben autocompletarse en los reportes
// posteriores", requisito del cliente).
//
// Devuelve tres vistas:
//   - anterior: cada campo del reporte MÁS RECIENTE del pozo que lo tenga — primero el ciclo actual (si ya se guardó un
//               avance) y luego los ciclos anteriores del más nuevo al más viejo. Se resuelve campo por campo y, dentro de
//               los objetos (resumenTanques, tipoFluido…), también subcampo por subcampo.
//   - actual:   solo el reporte del ciclo actual (lo que ya se guardó en este ciclo).
//   - previo:   igual que "anterior" pero SIN el ciclo actual (cómo cerraron los ciclos anteriores). Los acumulados
//               parten de aquí: el acumulado del ciclo anterior + lo de este ciclo.
//
// Es "mejor esfuerzo": sin ciclos, sin señal ni caché, o si la consulta falla, devuelve todo en null y la pantalla queda
// como siempre (campos vacíos). Nunca bloquea ni muestra error. El Operador ya puede leer las evaluaciones de su pozo
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

/** Objeto simple ({a: 1}), no una fecha, un Timestamp de Firestore ni una lista: se fusiona subcampo por subcampo. */
function esObjetoSimple(v: unknown): v is Record<string, unknown> {
  if (typeof v !== 'object' || v === null || Object.getPrototypeOf(v) !== Object.prototype) return false
  // Un Timestamp (o algo con toDate) es un valor atómico: partirlo mezclaría segundos de un ciclo con nanosegundos de otro.
  return typeof (v as { toDate?: unknown }).toDate !== 'function'
}

/**
 * Une los reportes de los ciclos del pozo, campo por campo: el valor lo pone el ciclo ACTUAL si lo tiene y, si no, el
 * ciclo anterior más reciente que lo tenga. Los valores vacíos (cadena en blanco, null) no cuentan. Los objetos simples
 * (resumenTanques, tipoFluido, acumuladosBase) se fusionan también subcampo por subcampo: un ciclo que solo trae la
 * existencia no tapa el total trasegado de un ciclo anterior.
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
      if (esObjetoSimple(valor)) {
        const destino = (resultado[campo] ??= {}) as Record<string, unknown>
        for (const [sub, subValor] of Object.entries(valor)) {
          if (!(sub in destino) && tieneValor(subValor)) destino[sub] = subValor
        }
        if (Object.keys(destino).length === 0) delete resultado[campo]
      } else if (!(campo in resultado) && tieneValor(valor)) {
        resultado[campo] = valor
      }
    }
  }
  return resultado as Partial<IReporteOperativo>
}

interface Vistas {
  anterior: Partial<IReporteOperativo> | null
  actual: Partial<IReporteOperativo> | null
  previo: Partial<IReporteOperativo> | null
}
const VACIO: Vistas = { anterior: null, actual: null, previo: null }
const comoNulo = (r: Partial<IReporteOperativo>) => (Object.keys(r).length > 0 ? r : null)

export function useReporteAnterior(pozoId: string | undefined, evalId: string | undefined): Vistas {
  const [vistas, setVistas] = useState<Vistas>(VACIO)

  useEffect(() => {
    if (!pozoId || !evalId) {
      setVistas(VACIO)
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
        const actualCiclo = ciclos.find((c) => c.id === evalId)
        if (!cancelado) {
          setVistas({
            anterior: comoNulo(fusionarReportes(ciclos, evalId)),
            actual: comoNulo(fusionarReportes(actualCiclo ? [actualCiclo] : [], evalId)),
            previo: comoNulo(fusionarReportes(ciclos.filter((c) => c.id !== evalId), evalId)),
          })
        }
      } catch (err) {
        console.debug('Sin reporte anterior para prefill:', err)
        if (!cancelado) setVistas(VACIO)
      }
    })()

    return () => {
      cancelado = true
    }
  }, [pozoId, evalId])

  return vistas
}
