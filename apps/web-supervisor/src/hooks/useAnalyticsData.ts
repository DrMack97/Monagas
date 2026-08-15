// src/hooks/useAnalyticsData.ts
//
// KPIs reales para AnalyticsPage.tsx, calculados sobre evaluaciones
// reales — no confundir con useAnalytics.ts (ese es telemetría de
// Firebase Analytics, un concern totalmente distinto que comparte
// nombre por accidente del scaffold original).
//
// Mismo scoping por zona que usePozosVisibles/useApprovals: SUP_AREA
// ve su zona, GERENTE ve todo. SUP_CAMPO/OPERADOR no consumen este
// hook (Analytics es exclusivo SUP_AREA/GERENTE, igual que Aprobaciones).
//
// "Producción Total" sí es un agregado en tiempo real sobre las
// evaluaciones OFICIALES visibles — no la cifra denormalizada en el
// pozo que DashboardPage.tsx ya dejó anotada como fuera de alcance.
// Aquí no hace falta denormalizar nada: se suma al vuelo.

import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../services/firebase'
import type { IEvaluacion, Rol, Zona } from '@core/types'

export interface AnalyticsKPIs {
  totalEvaluaciones: number
  produccionTotal: number
  aprobacionesHoy: number
  tiempoPromedioAprobacionHoras: number | null
}

function esHoy(fecha: Date): boolean {
  const hoy = new Date()
  return fecha.getFullYear() === hoy.getFullYear()
    && fecha.getMonth() === hoy.getMonth()
    && fecha.getDate() === hoy.getDate()
}

function aDate(valor: any): Date | null {
  if (!valor) return null
  return typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor)
}

function calcularKPIs(evaluaciones: IEvaluacion[]): AnalyticsKPIs {
  const oficiales = evaluaciones.filter((e) => e.estado === 'OFICIAL')
  const produccionTotal = oficiales.reduce((acc, e) => acc + (e.resultados?.netosPromedio ?? 0), 0)

  let aprobacionesHoy = 0
  const tiemposAprobacion: number[] = []

  for (const evalu of evaluaciones) {
    const ultimaAprobacion = evalu.aprobaciones?.[evalu.aprobaciones.length - 1]
    if (!ultimaAprobacion) continue

    const tsAprobacion = aDate(ultimaAprobacion.timestamp)
    if (tsAprobacion && esHoy(tsAprobacion)) aprobacionesHoy++

    const tsCierre = aDate(evalu.fechaCierre)
    if (tsAprobacion && tsCierre && ultimaAprobacion.accion === 'APROBAR') {
      const horas = (tsAprobacion.getTime() - tsCierre.getTime()) / (1000 * 60 * 60)
      if (horas >= 0) tiemposAprobacion.push(horas)
    }
  }

  const tiempoPromedioAprobacionHoras = tiemposAprobacion.length > 0
    ? tiemposAprobacion.reduce((a, b) => a + b, 0) / tiemposAprobacion.length
    : null

  return {
    totalEvaluaciones: evaluaciones.length,
    produccionTotal,
    aprobacionesHoy,
    tiempoPromedioAprobacionHoras,
  }
}

export function useAnalyticsData(rol: Rol | null, zona: Zona | null) {
  const [evaluaciones, setEvaluaciones] = useState<IEvaluacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (rol !== 'SUP_AREA' && rol !== 'GERENTE') {
      setEvaluaciones([])
      setLoading(false)
      return
    }
    if (rol === 'SUP_AREA' && !zona) {
      setEvaluaciones([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const base = collection(db, 'evaluaciones')
    const q = rol === 'GERENTE' ? query(base) : query(base, where('zona', '==', zona))

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setEvaluaciones(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as IEvaluacion))
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [rol, zona])

  return { evaluaciones, kpis: calcularKPIs(evaluaciones), loading, error }
}
