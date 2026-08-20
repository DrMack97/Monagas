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

// Notifications — ambas reescritas contra el esquema real
// (evaluaciones/pozos/usuarios), ver checklist Fase 2/3.
export { notifyOperator } from './notifications/notifyOperator'
export { notifyMgr } from './notifications/notifyMgr'
