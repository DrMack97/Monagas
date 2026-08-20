"use strict";
// firebase/functions/src/auth/setPersonalActivo.ts
//
// Desactiva o reactiva a un OPERADOR o SUP_CAMPO — la pieza que
// faltaba en la gestión de personal: crearPersonal.ts da de alta,
// reassignPozo.ts mueve de pozo, pero no existía ninguna forma de
// revocarle el acceso a alguien que deja la empresa o el proyecto.
//
// Mismo patrón de autorización que crearPersonal.ts/reassignPozo.ts:
// exclusiva de SUP_AREA (solo dentro de SU zona) y GERENTE (sin
// restricción), verificado aquí en código porque el Admin SDK ignora
// Firestore Rules por completo.
//
// Hace DOS cosas, no solo una — desactivar solo el documento de
// Firestore (activo: false) no basta, porque el usuario seguiría
// pudiendo iniciar sesión con su cuenta de Firebase Auth intacta:
//   1. usuarios/{uid}.activo — para que las pantallas que ya filtran
//      o muestran personal reflejen el estado.
//   2. admin.auth().updateUser(uid, { disabled }) — bloquea/desbloquea
//      el login real. Sin esto, "desactivar" sería solo cosmético.
//
// Deliberadamente NO toca pozoAsignado ni pozo.asignados — desactivar
// es distinto de reasignar/liberar (eso ya lo resuelve
// reassignPozo.ts por separado). Reactivar a alguien lo devuelve
// exactamente a como estaba, incluyendo su pozo.
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPersonalActivo = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'];
const ROLES_GESTIONABLES = ['OPERADOR', 'SUP_CAMPO'];
exports.setPersonalActivo = (0, https_1.onCall)(async (request) => {
    const callerRol = request.auth?.token?.rol;
    const callerZona = request.auth?.token?.zona;
    if (!request.auth || !ROLES_AUTORIZADOS.includes(callerRol ?? '')) {
        throw new https_1.HttpsError('permission-denied', 'Solo Supervisor de Área o Gerente pueden desactivar/reactivar personal.');
    }
    const { targetUid, activo } = request.data;
    if (!targetUid || typeof activo !== 'boolean') {
        throw new https_1.HttpsError('invalid-argument', 'Faltan campos obligatorios.');
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const targetSnap = await db.collection('usuarios').doc(targetUid).get();
    if (!targetSnap.exists) {
        throw new https_1.HttpsError('not-found', 'El usuario no existe.');
    }
    const targetData = targetSnap.data();
    const targetRol = targetData.rol;
    if (!ROLES_GESTIONABLES.includes(targetRol)) {
        throw new https_1.HttpsError('failed-precondition', `Solo se puede desactivar/reactivar a OPERADOR o SUP_CAMPO. Este usuario tiene rol ${targetRol}.`);
    }
    if (callerRol === 'SUP_AREA') {
        const targetZona = targetData.zona;
        if (targetZona !== callerZona) {
            throw new https_1.HttpsError('permission-denied', 'Ese usuario no pertenece a tu zona.');
        }
    }
    await db.collection('usuarios').doc(targetUid).update({ activo });
    await auth.updateUser(targetUid, { disabled: !activo });
    v2_1.logger.info(`setPersonalActivo: ${targetUid} (${targetRol}) ${activo ? 'reactivado' : 'desactivado'} por ${request.auth.uid} (${callerRol})`);
    return { success: true, uid: targetUid, activo };
});
//# sourceMappingURL=setPersonalActivo.js.map