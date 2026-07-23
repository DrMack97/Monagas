// firebase/functions/src/auth/assignRole.ts
//
// Trigger: se ejecuta automáticamente cuando se crea un documento
// en /usuarios/{uid}. Firestore Rules restringen esa escritura a ROOT,
// por lo que este trigger no tiene problema de arranque (no requiere
// un admin ya autenticado para asignar el primer rol).
//
// Asigna el Custom Claim de rol para que las Firestore Rules puedan
// leerlo directamente del JWT sin una consulta adicional.
//
// Regla de negocio: OPERADOR y SUP_CAMPO tienen acceso a UN (1) solo
// pozo a la vez (`pozoAsignado`, singular). SUP_AREA y GERENTE no
// usan este campo — su acceso se rige por `zona`, ya presente en el
// documento de usuario.

import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { getAuth } from 'firebase-admin/auth'
import { logger } from 'firebase-functions/v2'

const ROLES_VALIDOS = ['OPERADOR', 'SUP_CAMPO', 'SUP_AREA', 'GERENTE'] as const

export const assignRole = onDocumentCreated(
  'usuarios/{uid}',
  async (event) => {
    const snap = event.data
    if (!snap) {
      logger.warn('assignRole: evento sin datos, se omite')
      return
    }

    const uid = event.params.uid
    const data = snap.data()
    const rolSolicitado = data.rol

    // Nunca confiar en un rol que no venga del set permitido.
    // ROOT nunca se asigna por este flujo — solo vía script directo
    // con Admin SDK, fuera de la app.
    const rol = ROLES_VALIDOS.includes(rolSolicitado)
      ? rolSolicitado
      : 'OPERADOR'

    // pozoAsignado solo aplica a OPERADOR/SUP_CAMPO. Para SUP_AREA y
    // GERENTE queda null — su acceso lo gobierna `zona`, no un pozo
    // específico.
    const pozoAsignado =
      rol === 'OPERADOR' || rol === 'SUP_CAMPO'
        ? (data.pozoAsignado ?? null)
        : null

    // Claves en español — deben coincidir EXACTO con lo que leen
    // las Firestore Rules: request.auth.token.rol / .pozoAsignado / .zona
    await getAuth().setCustomUserClaims(uid, {
      rol,
      pozoAsignado,
      zona: data.zona ?? null,
    })

    logger.info(`assignRole: uid=${uid} rol=${rol} pozoAsignado=${pozoAsignado}`)
  }
)
