// TODO: Request/Response types para Cloud Functions - Player 1 (Backend)
// Paso 1: Definir AssignRoleRequest, AssignRoleResponse
// Paso 2: Definir CreateEvaluationRequest, CreateEvaluationResponse
// Paso 3: Definir ApproveEvaluationRequest, ApproveEvaluationResponse
// Prompt de implementación rápida:
// "Crear tipos Request/Response para asignarRol, crearEvaluacion, aprobarEvaluacion"
// Entregable:
// - AssignRoleRequest: { userId, rol }
// - CreateEvaluationRequest: { pozoId, lecturas, tanques }
// - ApproveEvaluationRequest: { evaluationId }
// - Respuestas con éxito/error
export interface AssignRoleRequest {
  userId: string
  rol: 'OPERADOR' | 'SUP_CAMPO' | 'SUP_AREA' | 'GERENTE'
}

export interface AssignRoleResponse {
  success: boolean
  message: string
  userId?: string
  rol?: string
}

export interface CreateEvaluationRequest {
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
}

export interface CreateEvaluationResponse {
  success: boolean
  message: string
  evaluationId?: string
  netos?: number
  qg?: number
}

export interface ApproveEvaluationRequest {
  evaluationId: string
  supervisorId: string
}

export interface ApproveEvaluationResponse {
  success: boolean
  message: string
  evaluationId?: string
  nuevoEstado?: string
}

export interface RejectEvaluationRequest {
  evaluationId: string
  motivo: string
  supervisorId: string
}

export interface RejectEvaluationResponse {
  success: boolean
  message: string
  evaluationId?: string
  nuevoEstado?: string
}

export interface APIError {
  success: false
  error: string
  code?: string
}
