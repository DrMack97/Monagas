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
// Sincroniza pozo.estado cuando una evaluación entra a
// PENDIENTE_SUPERVISOR — el Operador no tiene permiso de escritura
// sobre /pozos/{pozoId} en firestore.rules (ver canEditOwnTanquesYLimites
// y canManagePozoEnZona()), así que esta sincronización solo puede hacerse
// aquí, con Admin SDK.
//
// El propósito original de este trigger (CERRADA → PENDIENTE_SUPERVISOR)
// quedó obsoleto: ReportePage.tsx en mobile-operator ya escribe
// PENDIENTE_SUPERVISOR directamente al cerrar el ciclo FINAL_24H (ver
// checklist Fase 2, item "máquina de estados"). Repropuesto para la
// sincronización de pozo.estado, que es lo único que realmente falta
// del lado del servidor en esta transición.
//
// Reescrito contra el esquema real — el original apuntaba a las
// colecciones inexistentes 'evaluations'/'wells' (inglés) y nunca
// pudo haber disparado en la app real.
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onEvalSubmit = functions.firestore
    .document('evaluaciones/{evalId}')
    .onWrite(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before?.estado === 'PENDIENTE_SUPERVISOR' || after?.estado !== 'PENDIENTE_SUPERVISOR') {
        return;
    }
    const evalId = context.params.evalId;
    const pozoId = after?.pozoId;
    if (!pozoId) {
        console.error(`Evaluación ${evalId} no tiene pozoId — no se puede sincronizar el pozo.`);
        return;
    }
    try {
        const pozoRef = admin.firestore().collection('pozos').doc(pozoId);
        const pozoDoc = await pozoRef.get();
        if (!pozoDoc.exists) {
            console.error(`Pozo ${pozoId} no encontrado (evaluación ${evalId}).`);
            return;
        }
        // evalEnCursoId -> null libera el candado de useEvaluacionActual.ts
        // (mobile-operator) para que el próximo ciclo cree una evaluación
        // nueva en vez de seguir apuntando a esta, ya cerrada.
        await pozoRef.update({ estado: 'PENDIENTE_SUPERVISOR', evalEnCursoId: null });
        console.log(`Pozo ${pozoId} sincronizado a PENDIENTE_SUPERVISOR (evaluación ${evalId}).`);
        // notifyMgr.ts (firebase/functions/src/notifications/) ya escucha
        // este mismo cambio de estado de forma independiente — no se
        // invoca desde aquí (los triggers de Firestore no se "llaman"
        // entre sí). Pero notifyMgr.ts tiene el mismo problema de
        // esquema falso ('evaluations'/'wells'/'users' en inglés) y
        // necesita su propia reescritura para disparar de verdad.
    }
    catch (error) {
        console.error(`Error sincronizando pozo ${pozoId} para evaluación ${evalId}:`, error);
        throw error;
    }
});
//# sourceMappingURL=onEvalSubmit.js.map