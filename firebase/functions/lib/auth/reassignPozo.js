"use strict";
// firebase/functions/src/auth/reassignPozo.ts
//
// Reasigna (o libera) a un OPERADOR o SUP_CAMPO. Es la ÚNICA vía
// autorizada para cambiar `pozoAsignado` — un write directo del
// cliente a /usuarios está bloqueado por Firestore Rules a propósito.
//
// Exclusiva de SUP_AREA y GERENTE (verificado aquí en código, no
// solo en Firestore Rules, porque el Admin SDK las ignora por
// completo). SUP_CAMPO NO tiene autoridad para reasignar — no elige
// el equipo con el que trabaja, solo opera con el personal que se le
// asigna.
//
// `nuevoPozoId` acepta `null` para liberar a alguien sin moverlo
// de inmediato a otro pozo.
Object.defineProperty(exports, "__esModule", { value: true });
exports.reassignPozo = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("firebase-admin/auth");
const firestore_1 = require("firebase-admin/firestore");
const v2_1 = require("firebase-functions/v2");
const ROLES_REASIGNABLES = ['OPERADOR', 'SUP_CAMPO'];
const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'];
exports.reassignPozo = (0, https_1.onCall)(async (request) => {
    const callerRol = request.auth?.token?.rol;
    const callerZona = request.auth?.token?.zona;
    if (!request.auth || !ROLES_AUTORIZADOS.includes(callerRol ?? '')) {
        throw new https_1.HttpsError('permission-denied', 'Solo Supervisor de Área o Gerente pueden reasignar personal.');
    }
    const { targetUid, nuevoPozoId } = request.data;
    if (!targetUid) {
        throw new https_1.HttpsError('invalid-argument', 'Falta targetUid.');
    }
    const db = (0, firestore_1.getFirestore)();
    const auth = (0, auth_1.getAuth)();
    const targetSnap = await db.collection('usuarios').doc(targetUid).get();
    if (!targetSnap.exists) {
        throw new https_1.HttpsError('not-found', 'El usuario a reasignar no existe.');
    }
    const targetData = targetSnap.data();
    const targetRol = targetData.rol;
    const pozoAnteriorId = targetData.pozoAsignado ?? null;
    if (!ROLES_REASIGNABLES.includes(targetRol)) {
        throw new https_1.HttpsError('failed-precondition', `Solo se puede reasignar a OPERADOR o SUP_CAMPO. Este usuario tiene rol ${targetRol}.`);
    }
    // SUP_AREA solo gestiona personal dentro de SU zona — ni el origen
    // ni el destino pueden salirse de ahí. GERENTE no tiene esta
    // restricción.
    if (callerRol === 'SUP_AREA') {
        const targetZona = targetData.zona;
        if (targetZona !== callerZona) {
            throw new https_1.HttpsError('permission-denied', 'Ese usuario no pertenece a tu zona.');
        }
    }
    let nuevoPozoSnap = null;
    if (nuevoPozoId !== null) {
        nuevoPozoSnap = await db.collection('pozos').doc(nuevoPozoId).get();
        if (!nuevoPozoSnap.exists) {
            throw new https_1.HttpsError('not-found', 'El pozo destino no existe.');
        }
        if (callerRol === 'SUP_AREA' && nuevoPozoSnap.data().zona !== callerZona) {
            throw new https_1.HttpsError('permission-denied', 'Ese pozo no pertenece a tu zona.');
        }
    }
    const batch = db.batch();
    // Quitar al usuario del pozo anterior (si tenía uno)
    if (pozoAnteriorId) {
        const pozoAnteriorRef = db.collection('pozos').doc(pozoAnteriorId);
        const pozoAnteriorSnap = await pozoAnteriorRef.get();
        if (pozoAnteriorSnap.exists) {
            const asignadosActuales = (pozoAnteriorSnap.data().asignados ?? []);
            batch.update(pozoAnteriorRef, {
                asignados: asignadosActuales.filter((uid) => uid !== targetUid),
            });
        }
    }
    // Agregar al usuario al nuevo pozo (si hay uno — nuevoPozoId puede ser null)
    if (nuevoPozoSnap) {
        const asignadosNuevo = (nuevoPozoSnap.data().asignados ?? []);
        if (!asignadosNuevo.includes(targetUid)) {
            batch.update(nuevoPozoSnap.ref, {
                asignados: [...asignadosNuevo, targetUid],
            });
        }
    }
    batch.update(targetSnap.ref, { pozoAsignado: nuevoPozoId });
    await batch.commit();
    // Refrescar el Custom Claim — Firestore no dispara el trigger
    // onDocumentCreated en un update, así que hay que hacerlo explícito aquí.
    await auth.setCustomUserClaims(targetUid, {
        rol: targetRol,
        pozoAsignado: nuevoPozoId,
        zona: targetData.zona ?? null,
    });
    v2_1.logger.info(`reassignPozo: ${targetUid} (${targetRol}) movido de ${pozoAnteriorId ?? 'ninguno'} a ${nuevoPozoId ?? 'ninguno (liberado)'} por ${request.auth.uid} (${callerRol})`);
    return { success: true, pozoAnterior: pozoAnteriorId, pozoNuevo: nuevoPozoId };
});
//# sourceMappingURL=reassignPozo.js.map