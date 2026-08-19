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
exports.onLecturaEdit = void 0;
// Recalcula automáticamente resultados (el promedio agregado de la
// evaluación) cuando el Supervisor corrige una lectura individual
// desde el drill-down de ApprovalQueuePage.tsx. El Supervisor nunca
// debería ver un promedio desactualizado por accidente después de
// una corrección.
//
// canEditLectura() en firestore.rules ya garantiza que esto solo
// puede pasar mientras la evaluación está PENDIENTE_SUPERVISOR — se
// vuelve a validar aquí explícitamente, no por desconfianza de la
// regla, sino porque este trigger corre con Admin SDK y por lo tanto
// no está sujeto a ella.
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const core_1 = require("@monagas/core");
exports.onLecturaEdit = functions.firestore
    .document('evaluaciones/{evalId}/lecturas/{lecturaId}')
    .onUpdate(async (change, context) => {
    const { evalId, lecturaId } = context.params;
    try {
        const db = admin.firestore();
        const evalRef = db.collection('evaluaciones').doc(evalId);
        const evalDoc = await evalRef.get();
        if (!evalDoc.exists) {
            console.error(`Evaluación ${evalId} no encontrada al recalcular tras editar lectura ${lecturaId}.`);
            return;
        }
        const evaluacion = evalDoc.data();
        if (evaluacion.estado !== 'PENDIENTE_SUPERVISOR') {
            // No debería pasar (la regla ya lo exige), pero evita
            // recalcular sobre una evaluación ya cerrada si de alguna
            // forma este trigger dispara fuera de ese estado.
            return;
        }
        const lecturasSnap = await evalRef.collection('lecturas').orderBy('hora', 'asc').get();
        const lecturas = lecturasSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const promedio = (0, core_1.calcularPromedioEvaluacion)(lecturas);
        const nuevosResultados = {
            ...promedio,
            tipoCalculo: evaluacion.resultados?.tipoCalculo ?? 'FINAL_24H',
            calculadoEn: new Date(),
        };
        await evalRef.update({ resultados: nuevosResultados });
        console.log(`Resultados recalculados para evaluación ${evalId} tras editar lectura ${lecturaId}.`);
    }
    catch (error) {
        console.error(`Error recalculando resultados de ${evalId} tras editar lectura ${lecturaId}:`, error);
        throw error;
    }
});
//# sourceMappingURL=onLecturaEdit.js.map