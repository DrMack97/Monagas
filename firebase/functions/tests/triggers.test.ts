// tests/triggers.test.ts
//
// Integración real contra el emulador de Functions: la máquina de estados que
// mantienen los triggers de evaluaciones (onEvalSubmit, onLecturaEdit,
// onReject, onApprove). Se escribe con el Admin SDK (ignora las reglas — lo que
// se prueba aquí son los triggers, no las reglas, que cubre firestore-rules.test.ts)
// y se sondea el resultado, porque un trigger corre asíncrono.
//
// Existe porque estos triggers se migraron de 1.ª a 2.ª generación (la forma del
// evento cambia: `change, context` → `event`) y no tenían NINGUNA prueba local;
// onReject ni siquiera la tenía en la E2E de nube (scripts/e2e-cloud.cjs).
// notifyMgr/notifyOperator también disparan en estas transiciones: sin
// aprobadores ni tokens solo registran y salen — el envío FCM real no se prueba aquí.
//
// Requiere los emuladores corriendo — `pnpm test` (en firebase/functions) ya
// envuelve el comando con `firebase emulators:exec`.

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import { initializeApp, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'well-testing-dev' })
}
const db = getFirestore()

const SUFIJO = Date.now().toString(36)
const POZO = `pozo-trg-${SUFIJO}`
const EVAL = `eval-trg-${SUFIJO}`
const pozoRef = db.collection('pozos').doc(POZO)
const evalRef = db.collection('evaluaciones').doc(EVAL)

async function esperar<T>(leer: () => Promise<T>, cumple: (v: T) => boolean, tope = 40000): Promise<T> {
  // Sondeo con tope en vez de un sleep fijo: el trigger tarda lo que tarde el emulador.
  const limite = Date.now() + tope
  let ultimo = await leer()
  while (!cumple(ultimo) && Date.now() < limite) {
    await new Promise((r) => setTimeout(r, 500))
    ultimo = await leer()
  }
  return ultimo
}
const pozo = async () => (await pozoRef.get()).data() ?? {}
const evaluacion = async () => (await evalRef.get()).data() ?? {}

const lectura = (hora: number, netos: number) => ({
  hora,
  tanques: [{ tanqueId: 't1', mi: 0, mf: 0, dif: 0, th: 1, reductor: 0, bph: netos, bpd: netos * 24, aysBls: 0, netos }],
  operativos: { pCab: 100, pSep: 40, pCsg: 0 },
  alertas: [],
})

beforeAll(async () => {
  await pozoRef.set({ nombre: 'Pozo trigger', zona: 'MONAGAS', estado: 'EN_CURSO', evalEnCursoId: EVAL })
  await evalRef.set({ pozoId: POZO, operadorId: 'op-x', zona: 'MONAGAS', estado: 'EN_CURSO', horasEvaluadas: 3 })
})

afterAll(async () => {
  const lecturas = await evalRef.collection('lecturas').get()
  await Promise.all(lecturas.docs.map((d) => d.ref.delete()))
  await Promise.all([evalRef.delete(), pozoRef.delete()])
})

describe('máquina de estados de evaluaciones (triggers reales)', () => {
  it('onEvalSubmit: al pasar a PENDIENTE_SUPERVISOR el pozo se sincroniza y libera el candado', async () => {
    await evalRef.update({ estado: 'PENDIENTE_SUPERVISOR' })
    const p = await esperar(pozo, (v) => v.estado === 'PENDIENTE_SUPERVISOR')
    expect(p.estado).toBe('PENDIENTE_SUPERVISOR')
    expect(p.evalEnCursoId).toBeNull()
  }, 60000)

  it('onLecturaEdit: corregir una lectura recalcula el promedio de la evaluación', async () => {
    const refs = await Promise.all([100, 200, 300].map((n, i) => evalRef.collection('lecturas').add(lectura(i + 1, n))))
    // Corrección de 200 → 230: el promedio de netos pasa de 200 a 210.
    await refs[1].update(lectura(2, 230))
    const e = await esperar(evaluacion, (v) => v.resultados?.netosPromedio === 210)
    expect(e.resultados?.netosPromedio).toBe(210)
    expect(e.resultados?.horasTotales).toBe(3)
  }, 60000)

  it('onReject: al rechazar (→ EN_CURSO) el pozo vuelve a EN_CURSO y el candado apunta a ESTA evaluación', async () => {
    await evalRef.update({ estado: 'EN_CURSO' })
    const p = await esperar(pozo, (v) => v.estado === 'EN_CURSO')
    expect(p.estado).toBe('EN_CURSO')
    expect(p.evalEnCursoId).toBe(EVAL)
  }, 60000)

  it('reenviar tras el rechazo vuelve a sincronizar (onEvalSubmit se dispara otra vez)', async () => {
    await evalRef.update({ estado: 'PENDIENTE_SUPERVISOR' })
    const p = await esperar(pozo, (v) => v.estado === 'PENDIENTE_SUPERVISOR')
    expect(p.estado).toBe('PENDIENTE_SUPERVISOR')
    expect(p.evalEnCursoId).toBeNull()
  }, 60000)

  it('onApprove: APROBADA_SUPERVISOR asciende la evaluación y el pozo a OFICIAL', async () => {
    await evalRef.update({ estado: 'APROBADA_SUPERVISOR' })
    const e = await esperar(evaluacion, (v) => v.estado === 'OFICIAL')
    expect(e.estado).toBe('OFICIAL')
    const p = await esperar(pozo, (v) => v.estado === 'OFICIAL')
    expect(p.estado).toBe('OFICIAL')
  }, 60000)
})
