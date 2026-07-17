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
exports.assignRole = void 0;
// TODO: Cloud Function asignarRol(userId, rol) - Player 1 (Backend)
// Paso 1: Validar que caller es admin
// Paso 2: Set custom claim con admin.assertCustomAuth
// Paso 3: Retornar éxito/error
// Prompt de implementación rápida:
// "Crear assignRole https.onCall con admin.assertCustomAuth, setCustomUserClaims"
// Entregable:
// - Solo admin puede llamar
// - Set custom claim { role: 'OPERADOR' }
// - Retornar { success: true, userId, rol }
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.assignRole = functions.https.onCall(async (data, context) => {
    // Verificar que el caller es admin
    if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'No autorizados');
    }
    const { userId, rol } = data;
    // Validar rol
    const validRoles = ['OPERADOR', 'SUP_CAMPO', 'SUP_MAYOR', 'COORDINADOR', 'GERENTE'];
    if (!validRoles.includes(rol)) {
        throw new functions.https.HttpsError('invalid-argument', 'Rol inválido');
    }
    try {
        // Set custom claim
        await admin.auth().setCustomUserClaims(userId, { role: rol });
        return {
            success: true,
            userId,
            rol,
            message: `Rol ${rol} asignado a ${userId}`
        };
    }
    catch (error) {
        console.error('Error assigning role:', error);
        throw new functions.https.HttpsError('internal', 'Error asignando rol');
    }
});
//# sourceMappingURL=assignRole.js.map