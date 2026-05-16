// TODO: Trigger cuando supervisor aprueba - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluation.estado cambia a 'APROBADA_SUPERVISOR'
// Paso 2: Update estado a 'OFICIAL' si es nivel final
// Paso 3: Update pozo.produccion con nueva evaluación
// Prompt de implementación rápida:
// "Crear onApprove onUpdate trigger, APROBADA_SUPERVISOR → OFICIAL, update pozo.produccion"
// Entregable:
// - Detectar cambio a APROBADA_SUPERVISOR
// - Update pozo.produccion = evaluation.netos
// - Update pozo.ultimaLectura = now
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onApprove = functions.firestore
  .document('evaluations/{evaluationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Detectar cambio a APROBADA_SUPERVISOR
    if (before?.estado !== 'APROBADA_SUPERVISOR' && after?.estado === 'APROBADA_SUPERVISOR') {
      try {
        const evaluationId = context.params.evaluationId

        // Update a OFICIAL (flujo simple MVP)
        await admin.firestore().collection('evaluations').doc(evaluationId).update({
          estado: 'OFICIAL',
          fechaOfficial: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        // Update pozo con nueva producción
        await admin.firestore().collection('wells').doc(after.pozoId).update({
          produccion: after.lecturas.netos,
          ultimaLectura: admin.firestore.FieldValue.serverTimestamp(),
          estado: 'OFICIAL',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log(`Evaluation ${evaluationId} approved and set to OFICIAL`)

        // TODO: Trigger notifyOperator para notificar operador
        // notifyOperator.trigger({ evaluationId, operadorId: after.operadorId })

      } catch (error) {
        console.error('Error in onApprove:', error)
        throw error
      }
    }
  })
