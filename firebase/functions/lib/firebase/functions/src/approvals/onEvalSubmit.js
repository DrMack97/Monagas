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
exports.onEvalSubmit = void 0;
// TODO: Trigger cuando operador cierra evaluación - Player 1 (Backend)
// Paso 1: firestore.onWrite cuando evaluation.estado cambia a 'CERRADA'
// Paso 2: Update estado a 'PENDIENTE_SUPERVISOR'
// Paso 3: Set supervisorId desde pozo
// Prompt de implementación rápida:
// "Crear onEvalSubmit onWrite trigger, cambiar CERRADA → PENDIENTE_SUPERVISOR"
// Entregable:
// - Detectar cambio a CERRADA
// - Update estado = PENDIENTE_SUPERVISOR
// - Set supervisorId, fechaPendiente
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onEvalSubmit = functions.firestore
    .document('evaluations/{evaluationId}')
    .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Detectar cambio a CERRADA
    if (before?.estado !== 'CERRADA' && after?.estado === 'CERRADA') {
        try {
            const evaluationId = context.params.evaluationId;
            // Obtener pozo para obtener supervisorId
            const pozoRef = admin.firestore().collection('wells').doc(after.pozoId);
            const pozoDoc = await pozoRef.get();
            if (!pozoDoc.exists) {
                console.error(`Pozo ${after.pozoId} not found`);
                return;
            }
            const pozo = pozoDoc.data();
            // Update evaluación
            await admin.firestore().collection('evaluations').doc(evaluationId).update({
                estado: 'PENDIENTE_SUPERVISOR',
                supervisorId: pozo?.supervisorId,
                fechaPendiente: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Evaluation ${evaluationId} moved to PENDIENTE_SUPERVISOR`);
            // TODO: Trigger notifyMgr para notificar gerente
            // notifyMgr.trigger({ evaluationId, supervisorId })
        }
        catch (error) {
            console.error('Error in onEvalSubmit:', error);
            throw error;
        }
    }
});
//# sourceMappingURL=onEvalSubmit.js.map