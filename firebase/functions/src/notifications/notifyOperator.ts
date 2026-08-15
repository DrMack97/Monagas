// Notifica al Operador cuando su evaluación es aprobada (→ OFICIAL,
// disparado por onApprove.ts) o rechazada (PENDIENTE_SUPERVISOR →
// EN_CURSO, disparado por onReject.ts — mismo criterio de detección
// que ese archivo, ver su comentario para el porqué). Trigger
// independiente sobre el mismo documento — no se invoca desde
// onApprove/onReject, dispara solo al detectar el cambio de estado.
//
// Reescrito contra el esquema real — el original apuntaba a
// 'evaluations'/'users'/'wells' (inglés) y a un estado 'RECHAZADA'
// que nunca existió en EstadoEvaluacion, así que nunca pudo haber
// disparado contra la app real. También usaba evaluation.lecturas.netos
// y evaluation.motivoRechazo, ninguno de los cuales existe — el dato
// real vive en resultados.netosPromedio y en el último elemento de
// aprobaciones[].comentario respectivamente.
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const notifyOperator = functions.firestore
  .document('evaluaciones/{evalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()
    const evalId = context.params.evalId

    const aprobada = before?.estado !== 'OFICIAL' && after?.estado === 'OFICIAL'
    const rechazada = before?.estado === 'PENDIENTE_SUPERVISOR' && after?.estado === 'EN_CURSO'

    if (!aprobada && !rechazada) return

    await enviarNotificacionAOperador(after, aprobada ? 'APROBADA' : 'RECHAZADA', evalId)
  })

async function enviarNotificacionAOperador(
  evaluacion: FirebaseFirestore.DocumentData | undefined,
  tipo: 'APROBADA' | 'RECHAZADA',
  evalId: string
) {
  if (!evaluacion?.operadorId) {
    console.error(`Evaluación ${evalId} no tiene operadorId — no se puede notificar.`)
    return
  }

  try {
    const operadorDoc = await admin.firestore().collection('usuarios').doc(evaluacion.operadorId).get()
    if (!operadorDoc.exists) {
      console.log(`Operador ${evaluacion.operadorId} no encontrado.`)
      return
    }

    const fcmToken = operadorDoc.data()?.fcmToken
    if (!fcmToken) {
      console.log(`[${tipo}] Operador ${evaluacion.operadorId} no tiene fcmToken guardado — no se envía notificación.`)
      return
    }

    const pozoDoc = await admin.firestore().collection('pozos').doc(evaluacion.pozoId).get()
    const pozoNombre = pozoDoc.data()?.nombre ?? 'tu pozo'

    const title = tipo === 'APROBADA' ? 'Evaluación aprobada' : 'Evaluación rechazada'
    const body = tipo === 'APROBADA'
      ? `Tu evaluación de ${pozoNombre} fue aprobada. Netos: ${evaluacion.resultados?.netosPromedio ?? '—'} Bls/día`
      : `Tu evaluación de ${pozoNombre} fue rechazada.${
          evaluacion.aprobaciones?.[evaluacion.aprobaciones.length - 1]?.comentario
            ? ` Motivo: ${evaluacion.aprobaciones[evaluacion.aprobaciones.length - 1].comentario}`
            : ''
        }`

    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: { title, body },
      data: {
        evalId,
        pozoId: evaluacion.pozoId,
        pozoNombre,
        tipo: tipo === 'APROBADA' ? 'EVALUACION_APROBADA' : 'EVALUACION_RECHAZADA',
      },
      android: {
        priority: 'high',
        notification: { channelId: 'evaluaciones' },
      },
    }

    await admin.messaging().send(message)
    console.log(`Notificación ${tipo} enviada a operador ${evaluacion.operadorId} (evaluación ${evalId}).`)
  } catch (error) {
    console.error(`Error notificando al operador de la evaluación ${evalId}:`, error)
    throw error
  }
}
