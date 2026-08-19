"use strict";
// firebase/functions/src/index.ts
//
// Punto de entrada de Cloud Functions. Cada función exportada aquí
// queda desplegada como un endpoint/trigger independiente.
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyMgr = exports.notifyOperator = exports.onLecturaEdit = exports.onReject = exports.onApprove = exports.onEvalSubmit = exports.crearPersonal = exports.reassignPozo = exports.assignRole = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
// Auth
var assignRole_1 = require("./auth/assignRole");
Object.defineProperty(exports, "assignRole", { enumerable: true, get: function () { return assignRole_1.assignRole; } });
var reassignPozo_1 = require("./auth/reassignPozo");
Object.defineProperty(exports, "reassignPozo", { enumerable: true, get: function () { return reassignPozo_1.reassignPozo; } });
var crearPersonal_1 = require("./auth/crearPersonal");
Object.defineProperty(exports, "crearPersonal", { enumerable: true, get: function () { return crearPersonal_1.crearPersonal; } });
// Approvals — reescritas contra el esquema real (evaluaciones/pozos),
// ver checklist Fase 2.
var onEvalSubmit_1 = require("./approvals/onEvalSubmit");
Object.defineProperty(exports, "onEvalSubmit", { enumerable: true, get: function () { return onEvalSubmit_1.onEvalSubmit; } });
var onApprove_1 = require("./approvals/onApprove");
Object.defineProperty(exports, "onApprove", { enumerable: true, get: function () { return onApprove_1.onApprove; } });
var onReject_1 = require("./approvals/onReject");
Object.defineProperty(exports, "onReject", { enumerable: true, get: function () { return onReject_1.onReject; } });
var onLecturaEdit_1 = require("./approvals/onLecturaEdit");
Object.defineProperty(exports, "onLecturaEdit", { enumerable: true, get: function () { return onLecturaEdit_1.onLecturaEdit; } });
// Notifications
var notifyOperator_1 = require("./notifications/notifyOperator");
Object.defineProperty(exports, "notifyOperator", { enumerable: true, get: function () { return notifyOperator_1.notifyOperator; } });
// notifyMgr.ts sigue siendo el decoy original — apunta a las
// colecciones falsas 'evaluations'/'wells'/'users' (inglés) y nunca
// pudo haber disparado contra la app real. Pendiente de reescribir
// igual que notifyOperator.ts (ver checklist).
var notifyMgr_1 = require("./notifications/notifyMgr");
Object.defineProperty(exports, "notifyMgr", { enumerable: true, get: function () { return notifyMgr_1.notifyMgr; } });
//# sourceMappingURL=index.js.map