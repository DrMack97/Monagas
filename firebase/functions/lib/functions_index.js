"use strict";
// firebase/functions/src/index.ts
//
// Punto de entrada de Cloud Functions. Cada función exportada aquí
// queda desplegada como un endpoint/trigger independiente.
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyOperator = exports.notifyMgr = exports.onReject = exports.onApprove = exports.onEvalSubmit = exports.reassignPozo = exports.assignRole = void 0;
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
// Auth
var assignRole_1 = require("./auth/assignRole");
Object.defineProperty(exports, "assignRole", { enumerable: true, get: function () { return assignRole_1.assignRole; } });
var reassignPozo_1 = require("./auth/reassignPozo");
Object.defineProperty(exports, "reassignPozo", { enumerable: true, get: function () { return reassignPozo_1.reassignPozo; } });
// Approvals (Fase 2 — decoy, pendiente de implementación real)
var onEvalSubmit_1 = require("./approvals/onEvalSubmit");
Object.defineProperty(exports, "onEvalSubmit", { enumerable: true, get: function () { return onEvalSubmit_1.onEvalSubmit; } });
var onApprove_1 = require("./approvals/onApprove");
Object.defineProperty(exports, "onApprove", { enumerable: true, get: function () { return onApprove_1.onApprove; } });
var onReject_1 = require("./approvals/onReject");
Object.defineProperty(exports, "onReject", { enumerable: true, get: function () { return onReject_1.onReject; } });
// Notifications (Fase 3 — decoy, pendiente de implementación real)
var notifyMgr_1 = require("./notifications/notifyMgr");
Object.defineProperty(exports, "notifyMgr", { enumerable: true, get: function () { return notifyMgr_1.notifyMgr; } });
var notifyOperator_1 = require("./notifications/notifyOperator");
Object.defineProperty(exports, "notifyOperator", { enumerable: true, get: function () { return notifyOperator_1.notifyOperator; } });
//# sourceMappingURL=functions_index.js.map