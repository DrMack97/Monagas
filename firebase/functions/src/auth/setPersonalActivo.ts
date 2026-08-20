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

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'] as const
const ROLES_GESTIONABLES = ['OPERADOR', 'SUP_CAMPO'] as const

interface SetPersonalActivoRequest {
  targetUid: string
  activo: boolean
}

export const setPersonalActivo = onCall<SetPersonalActivoRequest>(async (request) => {
  const callerRol = request.auth?.token?.rol as string | undefined
  const callerZona = request.auth?.token?.zona as string | null | undefined

  if (!request.auth || !(ROLES_AUTORIZADOS as readonly string[]).includes(callerRol ?? '')) {
    throw new HttpsError(
      'permission-denied',
      'Solo Supervisor de Área o Gerente pueden desactivar/reactivar personal.'
    )
  }

  const { targetUid, activo } = request.data
  if (!targetUid || typeof activo !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Faltan campos obligatorios.')
  }

  const db = getFirestore()
  const auth = getAuth()

  const targetSnap = await db.collection('usuarios').doc(targetUid).get()
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'El usuario no existe.')
  }
  const targetData = targetSnap.data()!
  const targetRol = targetData.rol as string

  if (!(ROLES_GESTIONABLES as readonly string[]).includes(targetRol)) {
    throw new HttpsError(
      'failed-precondition',
      `Solo se puede desactivar/reactivar a OPERADOR o SUP_CAMPO. Este usuario tiene rol ${targetRol}.`
    )
  }

  if (callerRol === 'SUP_AREA') {
    const targetZona = targetData.zona as string | null
    if (targetZona !== callerZona) {
      throw new HttpsError('permission-denied', 'Ese usuario no pertenece a tu zona.')
    }
  }

  await db.collection('usuarios').doc(targetUid).update({ activo })
  await auth.updateUser(targetUid, { disabled: !activo })

  logger.info(
    `setPersonalActivo: ${targetUid} (${targetRol}) ${activo ? 'reactivado' : 'desactivado'} por ${request.auth.uid} (${callerRol})`
  )

  return { success: true, uid: targetUid, activo }
})
