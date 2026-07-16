// TODO: Tipos TypeScript para functions - Player 1 (Backend)
// Paso 1: Importar tipos de @core/types
// Paso 2: Definir FunctionContext con user, role
// Paso 3: Definir FunctionResponse con success, message
// Prompt de implementación rápida:
// "Crear FunctionContext, FunctionResponse, CloudFunctionHandler"
// Entregable:
// - FunctionContext: { user, role, ip }
// - FunctionResponse: { success, message, data? }
// - CloudFunctionHandler: type para handlers
import { IUser } from '@monagas/core'
export interface FunctionContext {
  user: IUser | null
  role: string | null
  ip: string | null
  auth: {
    uid: string
    email: string | null
    role: string
  } | null
}

export interface FunctionResponse {
  success: boolean
  message: string
  data?: any
  error?: string
}

export type CloudFunctionHandler<TRequest, TResponse> = (
  request: TRequest,
  context: FunctionContext
) => Promise<TResponse>

export interface EvaluationCreateData {
  pozoId: string
  lecturas: {
    bph: number
    bpd: number
    presion: number
    temperatura: number
  }
  tanques: Array<{
    numero: number
    capacidad: number
    nivel: number
  }>
  operador: string
  operadorId: string
}

export interface ApprovalData {
  evaluationId: string
  supervisorId: string
  aprobada: boolean
  motivo?: string
}
