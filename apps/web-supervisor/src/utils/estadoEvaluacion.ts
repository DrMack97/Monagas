// src/utils/estadoEvaluacion.ts
//
// Etiqueta y color de cada estado de evaluación — UNA sola fuente para todo el panel. Antes el
// Dashboard tenía su propio mapa de colores y "Actividad Reciente" de Analytics usaba clases grises
// fijas, así que ahí todos los estados (también "En Curso") salían sin color.
// Record<EstadoEvaluacion, …> obliga a que un estado nuevo traiga etiqueta y color (si no, no compila).

import type { EstadoEvaluacion } from '@core/types'

export const ESTADO_LABEL: Record<EstadoEvaluacion, string> = {
  EN_CURSO: 'En Curso',
  CERRADA: 'Cerrada',
  PENDIENTE_SUPERVISOR: 'Pendiente Supervisor',
  APROBADA_SUPERVISOR: 'Aprobada',
  OFICIAL: 'Oficial',
}

export const ESTADO_COLOR: Record<EstadoEvaluacion, string> = {
  EN_CURSO: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CERRADA: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  PENDIENTE_SUPERVISOR: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  APROBADA_SUPERVISOR: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  OFICIAL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

/** Un estado desconocido (dato viejo o futuro) se muestra gris con su texto crudo, no se rompe. */
export function estadoLabel(estado: string): string {
  return (ESTADO_LABEL as Record<string, string>)[estado] ?? estado
}
export function estadoColor(estado: string): string {
  return (ESTADO_COLOR as Record<string, string>)[estado] ?? ESTADO_COLOR.CERRADA
}
