// firebase/functions/src/auth/reassignPozo.ts
//
// Reasigna a un OPERADOR o SUP_CAMPO a un nuevo pozo. Es la ÚNICA
// vía autorizada para cambiar `pozoAsignado` — un write directo del
// cliente a /usuarios está bloqueado por Firestore Rules a propósito.
//
// Solo SUP_AREA y GERENTE pueden invocar esta función (verificado
// aquí explícitamente, porque el Admin SDK dentro de la función
// ignora las Firestore Rules por completo — la validación de permiso
// tiene que vivir en el código, no solo en las reglas).

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

const ROLES_REASIGNABLES = ['OPERADOR', 'SUP_CAMPO'] as const
const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'] as const

interface ReassignPozoRequest {
  targetUid: string
  nuevoPozoId: string
}

export const reassignPozo = onCall<ReassignPozoRequest>(async (request) => {
  const callerRol = request.auth?.token?.rol as string | undefined

  if (!request.auth || !ROLES_AUTORIZADOS.includes(callerRol as any)) {
    throw new HttpsError(
      'permission-denied',
      'Solo Supervisor de Área o Gerente pueden reasignar personal a un pozo.'
    )
  }

  const { targetUid, nuevoPozoId } = request.data
  if (!targetUid || !nuevoPozoId) {
    throw new HttpsError('invalid-argument', 'Falta targetUid o nuevoPozoId.')
  }

  const db = getFirestore()
  const auth = getAuth()

  const targetSnap = await db.collection('usuarios').doc(targetUid).get()
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'El usuario a reasignar no existe.')
  }
  const targetData = targetSnap.data()!
  const targetRol = targetData.rol as string

  if (!ROLES_REASIGNABLES.includes(targetRol as any)) {
    throw new HttpsError(
      'failed-precondition',
      `Solo se puede reasignar a OPERADOR o SUP_CAMPO. Este usuario tiene rol ${targetRol}.`
    )
  }

  const nuevoPozoSnap = await db.collection('pozos').doc(nuevoPozoId).get()
  if (!nuevoPozoSnap.exists) {
    throw new HttpsError('not-found', 'El pozo destino no existe.')
  }

  const pozoAnteriorId = targetData.pozoAsignado as string | null

  const batch = db.batch()

  // Quitar al usuario del pozo anterior (si tenía uno)
  if (pozoAnteriorId) {
    const pozoAnteriorRef = db.collection('pozos').doc(pozoAnteriorId)
    const pozoAnteriorSnap = await pozoAnteriorRef.get()
    if (pozoAnteriorSnap.exists) {
      const asignadosActuales = (pozoAnteriorSnap.data()!.asignados ?? []) as string[]
      batch.update(pozoAnteriorRef, {
        asignados: asignadosActuales.filter((uid) => uid !== targetUid),
      })
    }
  }

  // Agregar al usuario al nuevo pozo
  const asignadosNuevo = (nuevoPozoSnap.data()!.asignados ?? []) as string[]
  if (!asignadosNuevo.includes(targetUid)) {
    batch.update(nuevoPozoSnap.ref, {
      asignados: [...asignadosNuevo, targetUid],
    })
  }

  // Actualizar el documento del usuario
  batch.update(targetSnap.ref, { pozoAsignado: nuevoPozoId })

  await batch.commit()

  // Refrescar el Custom Claim — Firestore no dispara el trigger
  // onDocumentCreated en un update, así que hay que hacerlo explícito aquí.
  await auth.setCustomUserClaims(targetUid, {
    rol: targetRol,
    pozoAsignado: nuevoPozoId,
    zona: targetData.zona ?? null,
  })

  logger.info(
    `reassignPozo: ${targetUid} (${targetRol}) reasignado de ${pozoAnteriorId ?? 'ninguno'} a ${nuevoPozoId} por ${request.auth.uid}`
  )

  return { success: true, pozoAnterior: pozoAnteriorId, pozoNuevo: nuevoPozoId }
})
