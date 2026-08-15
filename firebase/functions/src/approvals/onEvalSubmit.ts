// Sincroniza pozo.estado cuando una evaluación entra a
// PENDIENTE_SUPERVISOR — el Operador no tiene permiso de escritura
// sobre /pozos/{pozoId} en firestore.rules (ver canEditOwnTanquesYLimites
// y canManagePozoEnZona()), así que esta sincronización solo puede hacerse
// aquí, con Admin SDK.
//
// El propósito original de este trigger (CERRADA → PENDIENTE_SUPERVISOR)
// quedó obsoleto: ReportePage.tsx en mobile-operator ya escribe
// PENDIENTE_SUPERVISOR directamente al cerrar el ciclo FINAL_24H (ver
// checklist Fase 2, item "máquina de estados"). Repropuesto para la
// sincronización de pozo.estado, que es lo único que realmente falta
// del lado del servidor en esta transición.
//
// Reescrito contra el esquema real — el original apuntaba a las
// colecciones inexistentes 'evaluations'/'wells' (inglés) y nunca
// pudo haber disparado en la app real.
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onEvalSubmit = functions.firestore
  .document('evaluaciones/{evalId}')
  .onWrite(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    if (before?.estado === 'PENDIENTE_SUPERVISOR' || after?.estado !== 'PENDIENTE_SUPERVISOR') {
      return
    }

    const evalId = context.params.evalId
    const pozoId = after?.pozoId

    if (!pozoId) {
      console.error(`Evaluación ${evalId} no tiene pozoId — no se puede sincronizar el pozo.`)
      return
    }

    try {
      const pozoRef = admin.firestore().collection('pozos').doc(pozoId)
      const pozoDoc = await pozoRef.get()

      if (!pozoDoc.exists) {
        console.error(`Pozo ${pozoId} no encontrado (evaluación ${evalId}).`)
        return
      }

      await pozoRef.update({ estado: 'PENDIENTE_SUPERVISOR' })
      console.log(`Pozo ${pozoId} sincronizado a PENDIENTE_SUPERVISOR (evaluación ${evalId}).`)

      // notifyMgr.ts (firebase/functions/src/notifications/) ya escucha
      // este mismo cambio de estado de forma independiente — no se
      // invoca desde aquí (los triggers de Firestore no se "llaman"
      // entre sí). Pero notifyMgr.ts tiene el mismo problema de
      // esquema falso ('evaluations'/'wells'/'users' en inglés) y
      // necesita su propia reescritura para disparar de verdad.
    } catch (error) {
      console.error(`Error sincronizando pozo ${pozoId} para evaluación ${evalId}:`, error)
      throw error
    }
  })
