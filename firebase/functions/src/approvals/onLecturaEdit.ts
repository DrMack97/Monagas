// Recalcula automáticamente resultados (el promedio agregado de la
// evaluación) cuando el Supervisor corrige una lectura individual
// desde el drill-down de ApprovalQueuePage.tsx. El Supervisor nunca
// debería ver un promedio desactualizado por accidente después de
// una corrección.
//
// canEditLectura() en firestore.rules ya garantiza que esto solo
// puede pasar mientras la evaluación está PENDIENTE_SUPERVISOR — se
// vuelve a validar aquí explícitamente, no por desconfianza de la
// regla, sino porque este trigger corre con Admin SDK y por lo tanto
// no está sujeto a ella.
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import { calcularPromedioEvaluacion } from '@monagas/core'
import type { ILectura, IResultadosEval } from '@monagas/core'

export const onLecturaEdit = functions.firestore
  .document('evaluaciones/{evalId}/lecturas/{lecturaId}')
  .onUpdate(async (change, context) => {
    const { evalId, lecturaId } = context.params

    try {
      const db = admin.firestore()
      const evalRef = db.collection('evaluaciones').doc(evalId)
      const evalDoc = await evalRef.get()

      if (!evalDoc.exists) {
        console.error(`Evaluación ${evalId} no encontrada al recalcular tras editar lectura ${lecturaId}.`)
        return
      }

      const evaluacion = evalDoc.data()!
      if (evaluacion.estado !== 'PENDIENTE_SUPERVISOR') {
        // No debería pasar (la regla ya lo exige), pero evita
        // recalcular sobre una evaluación ya cerrada si de alguna
        // forma este trigger dispara fuera de ese estado.
        return
      }

      const lecturasSnap = await evalRef.collection('lecturas').orderBy('hora', 'asc').get()
      const lecturas = lecturasSnap.docs.map((d) => ({ id: d.id, ...d.data() }) as ILectura)

      const promedio = calcularPromedioEvaluacion(lecturas)
      const nuevosResultados: IResultadosEval = {
        ...promedio,
        tipoCalculo: evaluacion.resultados?.tipoCalculo ?? 'FINAL_24H',
        calculadoEn: new Date(),
      }

      await evalRef.update({ resultados: nuevosResultados })
      console.log(`Resultados recalculados para evaluación ${evalId} tras editar lectura ${lecturaId}.`)
    } catch (error) {
      console.error(`Error recalculando resultados de ${evalId} tras editar lectura ${lecturaId}:`, error)
      throw error
    }
  })
