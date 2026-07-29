// firebase/functions/src/index.ts
//
// Punto de entrada de Cloud Functions. Cada función exportada aquí
// queda desplegada como un endpoint/trigger independiente.

import { initializeApp } from 'firebase-admin/app'

initializeApp()

// Auth
export { assignRole } from './auth/assignRole'
export { reassignPozo } from './auth/reassignPozo'

// Approvals (Fase 2 — decoy, pendiente de implementación real)
export { onEvalSubmit } from './approvals/onEvalSubmit'
export { onApprove } from './approvals/onApprove'
export { onReject } from './approvals/onReject'

// Notifications (Fase 3 — decoy, pendiente de implementación real)
export { notifyMgr } from './notifications/notifyMgr'
export { notifyOperator } from './notifications/notifyOperator'
