"use strict";
// firebase/functions/src/auth/crearPersonal.ts
//
// Da de alta un nuevo usuario (OPERADOR o SUP_CAMPO) en el sistema.
// Exclusiva de SUP_AREA y GERENTE — SUP_CAMPO no tiene ninguna
// autoridad para crear personal: no elige el equipo con el que
// trabaja, solo opera con el que se le asigna.
//
//   SUP_AREA — crea OPERADOR o SUP_CAMPO, para cualquier pozo
//     dentro de SU zona.
//
//   GERENTE — crea OPERADOR o SUP_CAMPO, para cualquier pozo sin
//     restricción de zona.
//
// Crea la cuenta de Firebase Auth y el documento en /usuarios vía
// Admin SDK. El trigger assignRole (onDocumentCreated) se dispara
// igual, sin importar que el write venga de Admin SDK — por eso no
// hay que duplicar la lógica de asignación de Custom Claims aquí.
Object.defineProperty(exports, "__esModule", { value: true });
exports.crearPersonal = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'];
const ROLES_CREABLES = ['OPERADOR', 'SUP_CAMPO'];
exports.crearPersonal = (0, https_1.onCall)(async (request) => {
    const callerRol = request.auth?.token?.rol;
    const callerZona = request.auth?.token?.zona;
    if (!request.auth || !ROLES_AUTORIZADOS.includes(callerRol ?? '')) {
        throw new https_1.HttpsError('permission-denied', 'Solo Supervisor de Área o Gerente pueden dar de alta personal.');
    }
    const { nombre, email, password, rol, pozoId } = request.data;
    if (!nombre || !email || !password || !rol || !pozoId) {
        throw new https_1.HttpsError('invalid-argument', 'Faltan campos obligatorios.');
    }
    if (!ROLES_CREABLES.includes(rol)) {
        throw new https_1.HttpsError('invalid-argument', 'Rol no válido para crear.');
    }
    const db = (0, firestore_1.getFirestore)();
    const pozoSnap = await db.collection('pozos').doc(pozoId).get();
    if (!pozoSnap.exists) {
        throw new https_1.HttpsError('not-found', 'El pozo destino no existe.');
    }
    const pozoZona = pozoSnap.data().zona;
    if (callerRol === 'SUP_AREA' && pozoZona !== callerZona) {
        throw new https_1.HttpsError('permission-denied', 'Ese pozo no pertenece a tu zona.');
    }
    const userRecord = await (0, auth_1.getAuth)().createUser({ email, password, displayName: nombre });
    // Crear el documento en /usuarios — dispara assignRole automáticamente
    await db.collection('usuarios').doc(userRecord.uid).set({
        uid: userRecord.uid,
        nombre,
        email,
        rol,
        zona: pozoZona,
        pozoAsignado: pozoId,
        activo: true,
        creadoEn: firestore_1.FieldValue.serverTimestamp(),
    });
    await db.collection('pozos').doc(pozoId).update({
        asignados: firestore_1.FieldValue.arrayUnion(userRecord.uid),
    });
    v2_1.logger.info(`crearPersonal: ${userRecord.uid} (${rol}) creado por ${request.auth.uid} (${callerRol}), asignado a ${pozoId}`);
    return { success: true, uid: userRecord.uid };
});
//# sourceMappingURL=crearPersonal.js.map