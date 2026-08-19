// firebase/functions/src/index.ts
//
// Punto de entrada de Cloud Functions. Cada función exportada aquí
// queda desplegada como un endpoint/trigger independiente.

import { initializeApp } from 'firebase-admin/app'

initializeApp()

// Auth
export { assignRole } from './auth/assignRole'
export { reassignPozo } from './auth/reassignPozo'
export { crearPersonal } from './auth/crearPersonal'

// Approvals — reescritas contra el esquema real (evaluaciones/pozos),
// ver checklist Fase 2.
export { onEvalSubmit } from './approvals/onEvalSubmit'
export { onApprove } from './approvals/onApprove'
export { onReject } from './approvals/onReject'
export { onLecturaEdit } from './approvals/onLecturaEdit'

// Notifications
export { notifyOperator } from './notifications/notifyOperator'
// notifyMgr.ts sigue siendo el decoy original — apunta a las
// colecciones falsas 'evaluations'/'wells'/'users' (inglés) y nunca
// pudo haber disparado contra la app real. Pendiente de reescribir
// igual que notifyOperator.ts (ver checklist).
export { notifyMgr } from './notifications/notifyMgr'
