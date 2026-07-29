// firebase/functions/src/types.ts
import type { IUsuario } from '@monagas/core'

export interface FunctionContext {
  user: IUsuario | null
  role: string | null
  ip: string | null
  auth: {
    uid: string
    email: string | null
    role: string
  } | null
}

export interface FunctionResponse<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

export type CloudFunctionHandler<TRequest, TResponse> = (
  request: TRequest,
  context: FunctionContext
) => Promise<TResponse>

export interface EvaluationCreateData {
  pozoId: string
  operadorId: string
}

export interface ApprovalData {
  evaluationId: string
  supervisorId: string
  aprobada: boolean
  motivo?: string
}
