// TODO: Trigger cuando operador cierra evaluación - Player 1 (Backend)
// Paso 1: firestore.onWrite cuando evaluation.estado cambia a 'CERRADA'
// Paso 2: Update estado a 'PENDIENTE_SUPERVISOR'
// Paso 3: Set supervisorId desde pozo
// Prompt de implementación rápida:
// "Crear onEvalSubmit onWrite trigger, cambiar CERRADA → PENDIENTE_SUPERVISOR"
// Entregable:
// - Detectar cambio a CERRADA
// - Update estado = PENDIENTE_SUPERVISOR
// - Set supervisorId, fechaPendiente
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onEvalSubmit = functions.firestore
  .document('evaluations/{evaluationId}')
  .onWrite(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Detectar cambio a CERRADA
    if (before?.estado !== 'CERRADA' && after?.estado === 'CERRADA') {
      try {
        const evaluationId = context.params.evaluationId

        // Obtener pozo para obtener supervisorId
        const pozoRef = admin.firestore().collection('wells').doc(after.pozoId)
        const pozoDoc = await pozoRef.get()

        if (!pozoDoc.exists) {
          console.error(`Pozo ${after.pozoId} not found`)
          return
        }

        const pozo = pozoDoc.data()

        // Update evaluación
        await admin.firestore().collection('evaluations').doc(evaluationId).update({
          estado: 'PENDIENTE_SUPERVISOR',
          supervisorId: pozo?.supervisorId,
          fechaPendiente: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        })

        console.log(`Evaluation ${evaluationId} moved to PENDIENTE_SUPERVISOR`)

        // TODO: Trigger notifyMgr para notificar gerente
        // notifyMgr.trigger({ evaluationId, supervisorId })

      } catch (error) {
        console.error('Error in onEvalSubmit:', error)
        throw error
      }
    }
  })
