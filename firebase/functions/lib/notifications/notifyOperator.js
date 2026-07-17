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
exports.notifyOperator = void 0;
// TODO: Trigger notificar operador cuando evaluación es aprobada/rechazada - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluación cambia a OFICIAL o RECHAZADA
// Paso 2: Obtener FCM token del operador
// Paso 3: Enviar notificación push con resultado
// Prompt de implementación rápida:
// "Crear notifyOperator con FCM, notificar aprobación o rechazo"
// Entregable:
// - OFICIAL → "Tu evaluación de MFB-950 fue aprobada ✅"
// - RECHAZADA → "Tu evaluación de MFB-950 fue rechazada ❌"
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.notifyOperator = functions.firestore
    .document('evaluations/{evaluationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const evaluationId = context.params.evaluationId;
    // Detectar cambio a OFICIAL (aprobada)
    if (before?.estado !== 'OFICIAL' && after?.estado === 'OFICIAL') {
        await sendNotificationToOperator(after, 'APPROVED', evaluationId);
    }
    // Detectar cambio a RECHAZADA
    if (before?.estado !== 'RECHAZADA' && after?.estado === 'RECHAZADA') {
        await sendNotificationToOperator(after, 'REJECTED', evaluationId);
    }
});
async function sendNotificationToOperator(evaluation, type, evaluationId) {
    try {
        // Obtener operador
        const operadorDoc = await admin.firestore()
            .collection('users')
            .doc(evaluation.operadorId)
            .get();
        if (!operadorDoc.exists) {
            console.log('Operador no encontrado');
            return;
        }
        const operador = operadorDoc.data();
        const fcmToken = operador.fcmToken;
        if (!fcmToken) {
            console.log(`Operador ${evaluation.operadorId} no tiene FCM token`);
            return;
        }
        // Obtener pozo nombre
        const pozoDoc = await admin.firestore()
            .collection('wells')
            .doc(evaluation.pozoId)
            .get();
        const pozoNombre = pozoDoc.data()?.nombre || 'Pozo desconocido';
        const title = type === 'APPROVED'
            ? '✅ Evaluación aprobada'
            : '❌ Evaluación rechazada';
        const body = type === 'APPROVED'
            ? `Tu evaluación de ${pozoNombre} fue aprobada. Producción: ${evaluation.lecturas.netos} Bls/día`
            : `Tu evaluación de ${pozoNombre} fue rechazada. Motivo: ${evaluation.motivoRechazo}`;
        const message = {
            token: fcmToken,
            notification: {
                title,
                body,
                imageUrl: '/logo.png'
            },
            data: {
                evaluationId,
                pozoId: evaluation.pozoId,
                pozoNombre,
                type: type === 'APPROVED' ? 'EVALUATION_APPROVED' : 'EVALUATION_REJECTED',
                clickAction: 'OPEN_EVALUATION'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'evaluations',
                    sound: type === 'APPROVED' ? 'approved.wav' : 'rejected.wav'
                }
            }
        };
        await admin.messaging().send(message);
        console.log(`Notificación ${type} enviada a operador ${evaluation.operadorId}`);
    }
    catch (error) {
        console.error('Error sending notification to operator:', error);
        throw error;
    }
}
//# sourceMappingURL=notifyOperator.js.map