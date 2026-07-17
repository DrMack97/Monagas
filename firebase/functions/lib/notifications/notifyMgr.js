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
exports.notifyMgr = void 0;
// TODO: Trigger notificar gerente cuando evaluación se envía - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluación cambia a PENDIENTE_SUPERVISOR
// Paso 2: Obtener FCM token del gerente
// Paso 3: Enviar notificación push con FCM
// Prompt de implementación rápida:
// "Crear notifyMgr trigger con FCM sendToDevice, notificar gerente"
// Entregable:
// - Detectar cambio a PENDIENTE_SUPERVISOR
// - Obtener gerente FCM token
// - Enviar notificación: "Nueva evaluación pendiente de MFB-950"
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.notifyMgr = functions.firestore
    .document('evaluations/{evaluationId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    // Detectar cambio a PENDIENTE_SUPERVISOR
    if (before?.estado !== 'PENDIENTE_SUPERVISOR' &&
        after?.estado === 'PENDIENTE_SUPERVISOR') {
        try {
            const evaluationId = context.params.evaluationId;
            // Obtener evaluación completa
            const evaluation = after;
            // Obtener pozo para Nombre
            const pozoDoc = await admin.firestore()
                .collection('wells')
                .doc(evaluation.pozoId)
                .get();
            const pozo = pozoDoc.data();
            const pozoNombre = pozo?.nombre || 'Pozo desconocido';
            // Obtener gerente (usuario con rol GERENTE)
            const gerentes = await admin.firestore()
                .collection('users')
                .where('rol', '==', 'GERENTE')
                .where('activo', '==', true)
                .get();
            if (gerentes.empty) {
                console.log('No hay gerentes activos');
                return;
            }
            // Enviar notificación a cada gerente
            for (const gerenteDoc of gerentes.docs) {
                const gerente = gerenteDoc.data();
                const fcmToken = gerente.fcmToken;
                if (!fcmToken) {
                    console.log(`Gerente ${gerenteDoc.id} no tiene FCM token`);
                    continue;
                }
                const message = {
                    token: fcmToken,
                    notification: {
                        title: '🔔 Nueva evaluación pendiente',
                        body: `${pozoNombre} requiere aprobación de ${evaluation.operador}`,
                        imageUrl: '/logo.png',
                    },
                    data: {
                        evaluationId,
                        pozoId: evaluation.pozoId,
                        pozoNombre,
                        operador: evaluation.operador,
                        type: 'PENDING_APPROVAL',
                        clickAction: 'OPEN_EVALUATION'
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            channelId: 'approvals',
                            sound: 'default'
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1
                            }
                        }
                    }
                };
                try {
                    await admin.messaging().send(message);
                    console.log(`Notificación enviada a gerente ${gerenteDoc.id}`);
                }
                catch (error) {
                    console.error(`Error enviando notificación a gerente ${gerenteDoc.id}:`, error);
                }
            }
        }
        catch (error) {
            console.error('Error en notifyMgr:', error);
            throw error;
        }
    }
});
//# sourceMappingURL=notifyMgr.js.map