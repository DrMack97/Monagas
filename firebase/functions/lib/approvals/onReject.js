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
// Sincroniza pozo.estado cuando un supervisor rechaza una evaluación
// — mismo razonamiento de permisos que onEvalSubmit.ts/onApprove.ts:
// centralizar el sync de pozo.estado en Cloud Functions (Admin SDK)
// en vez de repartirlo entre cliente y servidor, aunque en este caso
// puntual SUP_AREA/GERENTE sí tienen permiso de escritura directa
// sobre /pozos (canManagePozos() en firestore.rules) — se mantiene
// aquí de todas formas por consistencia con las otras dos transiciones.
//
// IEvaluacion no tiene un estado 'RECHAZADA' (ver EstadoEvaluacion en
// @monagas/core) — useApprovals.ts en web-supervisor ya lo resolvió
// devolviendo la evaluación a EN_CURSO con el motivo guardado en
// `aprobaciones` (accion: 'RECHAZAR'), en vez de inventar un estado
// que no existe. La única transición existente PENDIENTE_SUPERVISOR
// → EN_CURSO de una evaluación ya creada es, precisamente, un
// rechazo — no hay otro camino que aterrice ahí, así que detectar esa
// transición es una señal inequívoca sin necesitar el estado falso.
//
// Reescrito contra el esquema real — el original apuntaba a la
// colección inexistente 'evaluations' (inglés) y nunca pudo haber
// disparado contra la app real.
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onReject = functions.firestore
    .document('evaluaciones/{evalId}')
    .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    if (before?.estado !== 'PENDIENTE_SUPERVISOR' || after?.estado !== 'EN_CURSO') {
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
        await pozoRef.update({ estado: 'EN_CURSO' });
        const ultimaAprobacion = after?.aprobaciones?.[after.aprobaciones.length - 1];
        console.log(`Evaluación ${evalId} rechazada. Pozo ${pozoId} sincronizado a EN_CURSO.` +
            (ultimaAprobacion?.comentario ? ` Motivo: ${ultimaAprobacion.comentario}` : ''));
        // notifyOperator.ts (firebase/functions/src/notifications/) ya
        // escucha este mismo cambio de forma independiente — no se
        // invoca desde aquí. Tiene el mismo problema de esquema falso y
        // necesita su propia reescritura para disparar de verdad.
    }
    catch (error) {
        console.error(`Error sincronizando pozo ${pozoId} tras rechazo de ${evalId}:`, error);
        throw error;
    }
});
//# sourceMappingURL=onReject.js.map