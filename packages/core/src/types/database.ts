// TODO: Actualizar database.ts con tipos Fase 2 - Player 1 (Backend)
// Paso 1: Añadir INotification
// Paso 2: Actualizar IUser con fcmToken
// Entregable: Tipos actualizados
export interface IWell {
  id: string
  nombre: string
  ubicacion: {
    lat: number
    lng: number
  }
  supervisorId: string
  estado: 'EN_CURSO' | 'PENDIENTE_SUPERVISOR' | 'APROBADA_SUPERVISOR' | 'RECHAZADA' | 'OFICIAL'
  produccion: number
  ultimaLectura: Date
  tanques: ITank[]
  createdAt: Date
  updatedAt: Date
}

export interface ILecture {
  bph: number
  bpd: number
  netos: number
  qg: number
  presion: number
  temperatura: number
}

export interface ITank {
  numero: number
  capacidad: number
  nivel: number
  volumen: number
}

export interface IEvaluation {
  id: string
  pozoId: string
  pozo: IWell
  fecha: Date
  lecturas: ILecture
  tanques: ITank[]
  estado: 'EN_CURSO' | 'PENDIENTE_SUPERVISOR' | 'APROBADA_SUPERVISOR' | 'RECHAZADA' | 'OFICIAL'
  operador: string
  operadorId: string
  aprobadaPor?: string
  fechaAprobacion?: Date
  motivoRechazo?: string
  rejectedBy?: string
  fechaRechazo?: Date
  createdAt: Date
  updatedAt: Date
}

export interface IUser {
  uid: string
  email: string
  nombre: string
  rol: 'OPERADOR' | 'SUP_CAMPO' | 'SUP_MAYOR' | 'COORDINADOR' | 'GERENTE'
  phone?: string
  fotoUrl?: string
  fcmToken?: string  // Fase 2: Push notifications
  lastNotificationUpdate?: Date  // Fase 2
  createdAt: Date
  lastLogin: Date
  activo: boolean
}

export interface IApproval {
  id: string
  evaluationId: string
  evaluacion: IEvaluation
  solicitadoPor: string
  solicitadoEl: Date
  aprobadaPor?: string
  fechaAprobacion?: Date
  motivoRechazo?: string
  rechazadaPor?: string
  fechaRechazo?: Date
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'
  createdAt: Date
  updatedAt: Date
}

// Fase 2: Notificaciones
export interface INotification {
  id: string
  userId: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'PENDING_APPROVAL' | 'EVALUATION_APPROVED' | 'EVALUATION_REJECTED'
  read: boolean
  data?: any  // Datos adicionales (evaluationId, pozoId, etc.)
  createdAt: Date
  readAt?: Date
}
