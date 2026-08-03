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

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

const ROLES_REASIGNABLES = ['OPERADOR', 'SUP_CAMPO'] as const
const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'] as const

interface ReassignPozoRequest {
  targetUid: string
  nuevoPozoId: string | null
}

export const reassignPozo = onCall<ReassignPozoRequest>(async (request) => {
  const callerRol = request.auth?.token?.rol as string | undefined

  if (!request.auth || !(ROLES_AUTORIZADOS as readonly string[]).includes(callerRol ?? '')) {
    throw new HttpsError(
      'permission-denied',
      'Solo Supervisor de Área o Gerente pueden reasignar personal.'
    )
  }

  const { targetUid, nuevoPozoId } = request.data
  if (!targetUid) {
    throw new HttpsError('invalid-argument', 'Falta targetUid.')
  }

  const db = getFirestore()
  const auth = getAuth()

  const targetSnap = await db.collection('usuarios').doc(targetUid).get()
  if (!targetSnap.exists) {
    throw new HttpsError('not-found', 'El usuario a reasignar no existe.')
  }
  const targetData = targetSnap.data()!
  const targetRol = targetData.rol as string
  const pozoAnteriorId = (targetData.pozoAsignado as string | null) ?? null

  if (!(ROLES_REASIGNABLES as readonly string[]).includes(targetRol)) {
    throw new HttpsError(
      'failed-precondition',
      `Solo se puede reasignar a OPERADOR o SUP_CAMPO. Este usuario tiene rol ${targetRol}.`
    )
  }

  let nuevoPozoSnap: FirebaseFirestore.DocumentSnapshot | null = null
  if (nuevoPozoId !== null) {
    nuevoPozoSnap = await db.collection('pozos').doc(nuevoPozoId).get()
    if (!nuevoPozoSnap.exists) {
      throw new HttpsError('not-found', 'El pozo destino no existe.')
    }
  }

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

  // Agregar al usuario al nuevo pozo (si hay uno — nuevoPozoId puede ser null)
  if (nuevoPozoSnap) {
    const asignadosNuevo = (nuevoPozoSnap.data()!.asignados ?? []) as string[]
    if (!asignadosNuevo.includes(targetUid)) {
      batch.update(nuevoPozoSnap.ref, {
        asignados: [...asignadosNuevo, targetUid],
      })
    }
  }

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
    `reassignPozo: ${targetUid} (${targetRol}) movido de ${pozoAnteriorId ?? 'ninguno'} a ${nuevoPozoId ?? 'ninguno (liberado)'} por ${request.auth.uid} (${callerRol})`
  )

  return { success: true, pozoAnterior: pozoAnteriorId, pozoNuevo: nuevoPozoId }
})
