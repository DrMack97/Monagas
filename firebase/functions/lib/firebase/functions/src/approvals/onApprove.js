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
exports.onApprove = void 0;
// TODO: Trigger cuando supervisor aprueba - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluation.estado cambia a 'APROBADA_SUPERVISOR'
// Paso 2: Update estado a 'OFICIAL' si es nivel final
// Paso 3: Update pozo.produccion con nueva evaluación
// Prompt de implementación rápida:
// "Crear onApprove onUpdate trigger, APROBADA_SUPERVISOR → OFICIAL, update pozo.produccion"
// Entregable:
// - Detectar cambio a APROBADA_SUPERVISOR
// - Update pozo.produccion = evaluation.netos
// - Update pozo.ultimaLectura = now
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onApprove = functions.firestore
    .document('evaluations/{evaluationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Detectar cambio a APROBADA_SUPERVISOR
    if (before?.estado !== 'APROBADA_SUPERVISOR' && after?.estado === 'APROBADA_SUPERVISOR') {
        try {
            const evaluationId = context.params.evaluationId;
            // Update a OFICIAL (flujo simple MVP)
            await admin.firestore().collection('evaluations').doc(evaluationId).update({
                estado: 'OFICIAL',
                fechaOfficial: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            // Update pozo con nueva producción
            await admin.firestore().collection('wells').doc(after.pozoId).update({
                produccion: after.lecturas.netos,
                ultimaLectura: admin.firestore.FieldValue.serverTimestamp(),
                estado: 'OFICIAL',
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Evaluation ${evaluationId} approved and set to OFICIAL`);
            // TODO: Trigger notifyOperator para notificar operador
            // notifyOperator.trigger({ evaluationId, operadorId: after.operadorId })
        }
        catch (error) {
            console.error('Error in onApprove:', error);
            throw error;
        }
    }
});
//# sourceMappingURL=onApprove.js.map