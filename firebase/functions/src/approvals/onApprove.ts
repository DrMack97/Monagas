// Ascenso automático APROBADA_SUPERVISOR → OFICIAL (flujo de un solo
// nivel de aprobación, decidido explícitamente en el checklist Fase
// 2 — no hay un segundo paso manual de GERENTE). Sincroniza
// pozo.estado en la misma transacción — el Operador no tiene permiso
// de escritura sobre /pozos/{pozoId} en firestore.rules, así que esto
// solo puede hacerse aquí, con Admin SDK (mismo razonamiento que
// onEvalSubmit.ts para la transición anterior).
//
// Deliberadamente NO se denormaliza producción en el pozo
// (pozo.produccion/ultimaLectura, como hacía el stub original) — IPozo
// no modela esos campos, y DashboardPage.tsx ya deja anotado que un
// "Total Netos Fiscalizado" agregado queda fuera de alcance hasta
// diseñarlo a propósito, para no inventar cifras.
//
// Reescrito contra el esquema real — el original apuntaba a las
// colecciones inexistentes 'evaluations'/'wells' (inglés) y al campo
// mal escrito 'fechaOfficial', ninguno de los cuales existe en la app
// real.
import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'

export const onApprove = functions.firestore
  .document('evaluaciones/{evalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data()
    const after = change.after.data()

    if (before?.estado === 'APROBADA_SUPERVISOR' || after?.estado !== 'APROBADA_SUPERVISOR') {
      return
    }

    const evalId = context.params.evalId
    const pozoId = after?.pozoId

    if (!pozoId) {
      console.error(`Evaluación ${evalId} no tiene pozoId — no se puede sincronizar el pozo.`)
      return
    }

    try {
      const db = admin.firestore()
      const pozoRef = db.collection('pozos').doc(pozoId)
      const pozoDoc = await pozoRef.get()

      if (!pozoDoc.exists) {
        console.error(`Pozo ${pozoId} no encontrado (evaluación ${evalId}).`)
        return
      }

      // Batch: la evaluación pasa a OFICIAL y el pozo se sincroniza en
      // la misma escritura atómica — evita que uno se actualice y el
      // otro falle, dejándolos inconsistentes.
      const batch = db.batch()
      batch.update(change.after.ref, { estado: 'OFICIAL' })
      batch.update(pozoRef, { estado: 'OFICIAL' })
      await batch.commit()

      console.log(`Evaluación ${evalId} aprobada → OFICIAL. Pozo ${pozoId} sincronizado.`)

      // notifyOperator.ts (firebase/functions/src/notifications/) ya
      // escucha este mismo cambio de forma independiente — no se
      // invoca desde aquí. Tiene el mismo problema de esquema falso y
      // necesita su propia reescritura para disparar de verdad.
    } catch (error) {
      console.error(`Error aprobando evaluación ${evalId} (pozo ${pozoId}):`, error)
      throw error
    }
  })
