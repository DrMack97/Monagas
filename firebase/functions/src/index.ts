// TODO: Actualizar index.ts con funciones Fase 2 - Player 1 (Backend)
// Paso 1: Importar funciones notifications Fase 2
// Paso 2: Exportar notifyMgr, notifyOperator
// Entregable: Functions exportadas correctamente
// Auth functions
export { assignRole } from './auth/assignRole'
export { setupUser } from './auth/setupUser'

// Approvals functions
export { onEvalSubmit } from './approvals/onEvalSubmit'
export { onApprove } from './approvals/onApprove'
export { onReject } from './approvals/onReject'

// Notifications functions (Fase 2)
export { notifyMgr } from './notifications/notifyMgr'
export { notifyOperator } from './notifications/notifyOperator'

// Runtime options
export const config = {
  runtime: 'nodejs20'
}
