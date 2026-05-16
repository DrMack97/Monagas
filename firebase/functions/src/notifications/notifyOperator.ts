// TODO: Trigger notificar operador cuando evaluación es aprobada/rechazada - Player 1 (Backend)
// Paso 1: firestore.onUpdate cuando evaluación cambia a OFICIAL o RECHAZADA
// Paso 2: Obtener FCM token del operador
// Paso 3: Enviar notificación push con resultado
// Prompt de implementación rápida:
// "Crear notifyOperator con FCM, notificar aprobación o rechazo"
// Entregable:
// - OFICIAL → "Tu evaluación de MFB-950 fue aprobada ✅"
// - RECHAZADA → "Tu evaluación de MFB-950 fue rechazada ❌"
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const notifyOperator = functions.firestore
  .document('evaluations/{evaluationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    const evaluationId = context.params.evaluationId

    // Detectar cambio a OFICIAL (aprobada)
    if (before?.estado !== 'OFICIAL' && after?.estado === 'OFICIAL') {
      await sendNotificationToOperator(after, 'APPROVED')
    }

    // Detectar cambio a RECHAZADA
    if (before?.estado !== 'RECHAZADA' && after?.estado === 'RECHAZADA') {
      await sendNotificationToOperator(after, 'REJECTED')
    }
  })

async function sendNotificationToOperator(evaluation: any, type: 'APPROVED' | 'REJECTED') {
  try {
    // Obtener operador
    const operadorDoc = await admin.firestore()
      .collection('users')
      .doc(evaluation.operadorId)
      .get()

    if (!operadorDoc.exists) {
      console.log('Operador no encontrado')
      return
    }

    const operador = operadorDoc.data()
    const fcmToken = operador.fcmToken

    if (!fcmToken) {
      console.log(`Operador ${evaluation.operadorId} no tiene FCM token`)
      return
    }

    // Obtener pozo nombre
    const pozoDoc = await admin.firestore()
      .collection('wells')
      .doc(evaluation.pozoId)
      .get()
    
    const pozoNombre = pozoDoc.data()?.nombre || 'Pozo desconocido'

    const title = type === 'APPROVED' 
      ? '✅ Evaluación aprobada'
      : '❌ Evaluación rechazada'
    
    const body = type === 'APPROVED'
      ? `Tu evaluación de ${pozoNombre} fue aprobada. Producción: ${evaluation.lecturas.netos} Bls/día`
      : `Tu evaluación de ${pozoNombre} fue rechazada. Motivo: ${evaluation.motivoRechazo}`

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title,
        body,
        icon: '/logo.png'
      },
      data: {
        evaluationId,
        pozoId: evaluation.pozoId,
        pozoNombre,
        type: type === 'APPROVED' ? 'EVALUATION_APPROVED' : 'EVALUATION_REJECTED',
        clickAction: 'OPEN_EVALUATION'
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'evaluations',
          sound: type === 'APPROVED' ? 'approved.wav' : 'rejected.wav'
        }
      }
    }

    await admin.messaging().send(message)
    console.log(`Notificación ${type} enviada a operador ${evaluation.operadorId}`)

  } catch (error) {
    console.error('Error sending notification to operator:', error)
    throw error
  }
}
