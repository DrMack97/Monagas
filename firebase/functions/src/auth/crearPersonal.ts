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

import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { logger } from 'firebase-functions/v2'

const ROLES_AUTORIZADOS = ['SUP_AREA', 'GERENTE'] as const
const ROLES_CREABLES = ['OPERADOR', 'SUP_CAMPO'] as const

interface CrearPersonalRequest {
  nombre: string
  email: string
  password: string
  rol: 'OPERADOR' | 'SUP_CAMPO'
  pozoId: string
}

export const crearPersonal = onCall<CrearPersonalRequest>(async (request) => {
  const callerRol = request.auth?.token?.rol as string | undefined
  const callerZona = request.auth?.token?.zona as string | null | undefined

  if (!request.auth || !(ROLES_AUTORIZADOS as readonly string[]).includes(callerRol ?? '')) {
    throw new HttpsError(
      'permission-denied',
      'Solo Supervisor de Área o Gerente pueden dar de alta personal.'
    )
  }

  const { nombre, email, password, rol, pozoId } = request.data
  if (!nombre || !email || !password || !rol || !pozoId) {
    throw new HttpsError('invalid-argument', 'Faltan campos obligatorios.')
  }

  if (!(ROLES_CREABLES as readonly string[]).includes(rol)) {
    throw new HttpsError('invalid-argument', 'Rol no válido para crear.')
  }

  const db = getFirestore()

  const pozoSnap = await db.collection('pozos').doc(pozoId).get()
  if (!pozoSnap.exists) {
    throw new HttpsError('not-found', 'El pozo destino no existe.')
  }
  const pozoZona = pozoSnap.data()!.zona as string

  if (callerRol === 'SUP_AREA' && pozoZona !== callerZona) {
    throw new HttpsError('permission-denied', 'Ese pozo no pertenece a tu zona.')
  }

  const userRecord = await getAuth().createUser({ email, password, displayName: nombre })

  // Crear el documento en /usuarios — dispara assignRole automáticamente
  await db.collection('usuarios').doc(userRecord.uid).set({
    uid: userRecord.uid,
    nombre,
    email,
    rol,
    zona: pozoZona,
    pozoAsignado: pozoId,
    activo: true,
    creadoEn: FieldValue.serverTimestamp(),
  })

  await db.collection('pozos').doc(pozoId).update({
    asignados: FieldValue.arrayUnion(userRecord.uid),
  })

  logger.info(
    `crearPersonal: ${userRecord.uid} (${rol}) creado por ${request.auth.uid} (${callerRol}), asignado a ${pozoId}`
  )

  return { success: true, uid: userRecord.uid }
})
