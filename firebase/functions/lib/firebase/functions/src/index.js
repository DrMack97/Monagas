"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = exports.notifyOperator = exports.notifyMgr = exports.onReject = exports.onApprove = exports.onEvalSubmit = exports.setupUser = exports.assignRole = void 0;
// TODO: Actualizar index.ts con funciones Fase 2 - Player 1 (Backend)
// Paso 1: Importar funciones notifications Fase 2
// Paso 2: Exportar notifyMgr, notifyOperator
// Entregable: Functions exportadas correctamente
// Auth functions
var assignRole_1 = require("./auth/assignRole");
Object.defineProperty(exports, "assignRole", { enumerable: true, get: function () { return assignRole_1.assignRole; } });
var setupUser_1 = require("./auth/setupUser");
Object.defineProperty(exports, "setupUser", { enumerable: true, get: function () { return setupUser_1.setupUser; } });
// Approvals functions
var onEvalSubmit_1 = require("./approvals/onEvalSubmit");
Object.defineProperty(exports, "onEvalSubmit", { enumerable: true, get: function () { return onEvalSubmit_1.onEvalSubmit; } });
var onApprove_1 = require("./approvals/onApprove");
Object.defineProperty(exports, "onApprove", { enumerable: true, get: function () { return onApprove_1.onApprove; } });
var onReject_1 = require("./approvals/onReject");
Object.defineProperty(exports, "onReject", { enumerable: true, get: function () { return onReject_1.onReject; } });
// Notifications functions (Fase 2)
var notifyMgr_1 = require("./notifications/notifyMgr");
Object.defineProperty(exports, "notifyMgr", { enumerable: true, get: function () { return notifyMgr_1.notifyMgr; } });
var notifyOperator_1 = require("./notifications/notifyOperator");
Object.defineProperty(exports, "notifyOperator", { enumerable: true, get: function () { return notifyOperator_1.notifyOperator; } });
// Runtime options
exports.config = {
    runtime: 'nodejs20'
};
//# sourceMappingURL=index.js.map