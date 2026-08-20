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
// Notifica a quien puede aprobar una evaluación (SUP_AREA de la misma
// zona, y GERENTE — sin restricción de zona, mismo criterio que
// canManagePozoEnZona() en firestore.rules) cuando esa evaluación
// entra a PENDIENTE_SUPERVISOR. Mismo patrón que notifyOperator.ts:
// trigger independiente sobre evaluaciones/{evalId}, no invocado
// desde onEvalSubmit.ts.
//
// Reescrito contra el esquema real — el original apuntaba a
// 'evaluations'/'wells'/'users' (inglés), a un campo
// 'evaluation.operador' que no existe (es operadorId, un UID, no un
// nombre) y a un flujo de "notificar al gerente" que ni siquiera
// coincide con la máquina de estados real: la aprobación es de un
// solo nivel (SUP_AREA o GERENTE aprueban directamente en
// PENDIENTE_SUPERVISOR — ver onApprove.ts), no hay un paso separado
// donde el gerente "revisa después". Nunca pudo haber disparado
// contra la app real.
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.notifyMgr = functions.firestore
    .document('evaluaciones/{evalId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const evalId = context.params.evalId;
    if (before?.estado === 'PENDIENTE_SUPERVISOR' || after?.estado !== 'PENDIENTE_SUPERVISOR') {
        return;
    }
    await notificarAprobadores(after, evalId);
});
async function notificarAprobadores(evaluacion, evalId) {
    if (!evaluacion?.pozoId || !evaluacion?.zona) {
        console.error(`Evaluación ${evalId} no tiene pozoId/zona — no se puede notificar a los aprobadores.`);
        return;
    }
    try {
        const db = admin.firestore();
        // Mismo criterio de autoridad que canManagePozoEnZona() en
        // firestore.rules: GERENTE ve/aprueba todo sin restricción de
        // zona, SUP_AREA solo dentro de la SUYA.
        const [gerentesSnap, supAreaSnap] = await Promise.all([
            db.collection('usuarios').where('rol', '==', 'GERENTE').where('activo', '==', true).get(),
            db.collection('usuarios')
                .where('rol', '==', 'SUP_AREA')
                .where('zona', '==', evaluacion.zona)
                .where('activo', '==', true)
                .get(),
        ]);
        const aprobadores = [...gerentesSnap.docs, ...supAreaSnap.docs];
        if (aprobadores.length === 0) {
            console.log(`No hay GERENTE ni SUP_AREA activos para la zona ${evaluacion.zona} (evaluación ${evalId}).`);
            return;
        }
        const pozoDoc = await db.collection('pozos').doc(evaluacion.pozoId).get();
        const pozoNombre = pozoDoc.data()?.nombre ?? 'un pozo';
        const message = (fcmToken) => ({
            token: fcmToken,
            notification: {
                title: 'Nueva evaluación pendiente',
                body: `${pozoNombre} espera tu aprobación.`,
            },
            data: {
                evalId,
                pozoId: evaluacion.pozoId,
                pozoNombre,
                tipo: 'EVALUACION_PENDIENTE',
            },
            android: {
                priority: 'high',
                notification: { channelId: 'aprobaciones' },
            },
        });
        let enviadas = 0;
        for (const aprobadorDoc of aprobadores) {
            const fcmToken = aprobadorDoc.data().fcmToken;
            if (!fcmToken) {
                console.log(`Aprobador ${aprobadorDoc.id} no tiene fcmToken guardado — se omite.`);
                continue;
            }
            try {
                await admin.messaging().send(message(fcmToken));
                enviadas++;
            }
            catch (error) {
                console.error(`Error notificando al aprobador ${aprobadorDoc.id} (evaluación ${evalId}):`, error);
            }
        }
        console.log(`Evaluación ${evalId} (${pozoNombre}): ${enviadas}/${aprobadores.length} aprobadores notificados.`);
    }
    catch (error) {
        console.error(`Error notificando aprobadores de la evaluación ${evalId}:`, error);
        throw error;
    }
}
//# sourceMappingURL=notifyMgr.js.map