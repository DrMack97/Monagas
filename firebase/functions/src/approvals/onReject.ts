// TODO: Trigger cuando supervisor rechaza - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluation.estado cambia a 'RECHAZADA'
// Paso 2: Set motivoRechazo, rejectedBy, fechaRechazo
// Paso 3: Notificar operador para corregir
// Prompt de implementación rápida:
// "Crear onReject onUpdate trigger, RECHAZADA con motivo, notify operador"
// Entregable:
// - Detectar cambio a RECHAZADA
// - Set motivoRechazo, rejectedBy, fechaRechazo
// - Notify operador para corregir
import * as functions from 'firebase-functions'
export const onReject = functions.firestore
  .document('evaluations/{evaluationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    // Detectar cambio a RECHAZADA
    if (before?.estado !== 'RECHAZADA' && after?.estado === 'RECHAZADA') {
      try {
        const evaluationId = context.params.evaluationId

        // Validar que hay motivo
        if (!after.motivoRechazo) {
          throw new functions.https.HttpsError(
            'invalid-argument',
            'Motivo de rechazo es requerido'
          )
        }

        console.log(`Evaluation ${evaluationId} rejected by ${after.rejectedBy}`)
        console.log(`Motivo: ${after.motivoRechazo}`)

        // TODO: Trigger notifyOperator para notificar operador
        // notifyOperator.trigger({ 
        //   evaluationId, 
        //   operadorId: after.operadorId,
        //   motivoRechazo: after.motivoRechazo 
        // })

      } catch (error) {
        console.error('Error in onReject:', error)
        throw error
      }
    }
  })
