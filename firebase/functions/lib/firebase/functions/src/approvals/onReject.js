"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onReject = void 0;
// TODO: Trigger cuando supervisor rechaza - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluation.estado cambia a 'RECHAZADA'
// Paso 2: Set motivoRechazo, rejectedBy, fechaRechazo
// Paso 3: Notificar operador para corregir
// Prompt de implementación rápida:
// "Crear onReject onUpdate trigger, RECHAZADA con motivo, notify operador"
// Entregable:
// - Detectar cambio a RECHAZADA
// - Set motivoRechazo, rejectedBy, fechaRechazo
// - Notify operador para corregir
const functions = __importStar(require("firebase-functions"));
exports.onReject = functions.firestore
    .document('evaluations/{evaluationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Detectar cambio a RECHAZADA
    if (before?.estado !== 'RECHAZADA' && after?.estado === 'RECHAZADA') {
        try {
            const evaluationId = context.params.evaluationId;
            // Validar que hay motivo
            if (!after.motivoRechazo) {
                throw new functions.https.HttpsError('invalid-argument', 'Motivo de rechazo es requerido');
            }
            console.log(`Evaluation ${evaluationId} rejected by ${after.rejectedBy}`);
            console.log(`Motivo: ${after.motivoRechazo}`);
            // TODO: Trigger notifyOperator para notificar operador
            // notifyOperator.trigger({ 
            //   evaluationId, 
            //   operadorId: after.operadorId,
            //   motivoRechazo: after.motivoRechazo 
            // })
        }
        catch (error) {
            console.error('Error in onReject:', error);
            throw error;
        }
    }
});
//# sourceMappingURL=onReject.js.map