// TODO: Actualizar states.ts con Estados Fase 2 - Player 4 (Product Manager)
// Paso 1: Añadir nuevos estados si es necesario
// Entregable: Estados actualizados
export const ESTADOS = [
  'EN_CURSO',
  'CERRADA',
  'PENDIENTE_SUPERVISOR',
  'APROBADA_SUPERVISOR',
  'RECHAZADA',
  'OFICIAL'
] as const

export type EstadoEvaluation = typeof ESTADOS[number]

export const TRANSICIONES_PERMITIDAS: Record<EstadoEvaluation, EstadoEvaluation[]> = {
  'EN_CURSO': ['CERRADA'],
  'CERRADA': ['PENDIENTE_SUPERVISOR'],
  'PENDIENTE_SUPERVISOR': ['APROBADA_SUPERVISOR', 'RECHAZADA'],
  'APROBADA_SUPERVISOR': ['OFICIAL'],
  'RECHAZADA': ['EN_CURSO'],
  'OFICIAL': []
}

export const ESTADO_COLOR: Record<EstadoEvaluation, string> = {
  'EN_CURSO': 'bg-blue-500',
  'CERRADA': 'bg-gray-500',
  'PENDIENTE_SUPERVISOR': 'bg-yellow-500',
  'APROBADA_SUPERVISOR': 'bg-green-500',
  'RECHAZADA': 'bg-red-500',
  'OFICIAL': 'bg-purple-500'
}

export const ESTADO_LABEL: Record<EstadoEvaluation, string> = {
  'EN_CURSO': 'En curso',
  'CERRADA': 'Cerrada',
  'PENDIENTE_SUPERVISOR': 'Pendiente supervisor',
  'APROBADA_SUPERVISOR': 'Aprobada por supervisor',
  'RECHAZADA': 'Rechazada',
  'OFICIAL': 'Oficial'
}

// Fase 2: Tipos de notificación
export const NOTIFICACION_TIPOS = [
  'INFO',
  'WARNING',
  'SUCCESS',
  'ERROR',
  'PENDING_APPROVAL',
  'EVALUATION_APPROVED',
  'EVALUATION_REJECTED'
] as const

export type NotificacionTipo = typeof NOTIFICACION_TIPOS[number]
