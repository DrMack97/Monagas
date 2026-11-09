// tests/firestore-rules.test.ts
//
// Tests de las reglas de Firestore (firebase/firestore.rules) contra el
// emulador real, con @firebase/rules-unit-testing. Hasta el checklist
// Fase 6 #51b las reglas solo se habían probado con scripts ad hoc — de
// ahí que la revisión del #51 encontrara huecos que nadie había visto.
//
// Cada caso "denegado" existe porque fue un hueco real (o un riesgo de
// regresión de una regla ya cerrada); cada caso "permitido" protege un
// flujo legítimo de las apps de que la corrección no lo rompa.
//
// Se corre dentro de `pnpm test` de firebase/functions (ya levanta el
// emulador de Firestore vía `firebase emulators:exec`).

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, getDocs, setDoc, updateDoc, addDoc, collection, query, where } from 'firebase/firestore'
import { readFileSync } from 'fs'
import { resolve } from 'path'

let env: RulesTestEnvironment

// Actores. pozoAsignado/zona reproducen exactamente los Custom Claims que
// asignan assignRole.ts / reassignPozo.ts.
const OPERADOR = { rol: 'OPERADOR', pozoAsignado: 'pozo1', zona: 'MONAGAS' }
const OPERADOR_OTRO_POZO = { rol: 'OPERADOR', pozoAsignado: 'pozo2', zona: 'MONAGAS' }
const SUP_MONAGAS = { rol: 'SUP_AREA', pozoAsignado: null, zona: 'MONAGAS' }
const SUP_FAJA = { rol: 'SUP_AREA', pozoAsignado: null, zona: 'FAJA' }
const GERENTE = { rol: 'GERENTE', pozoAsignado: null, zona: null }
const SUP_CAMPO = { rol: 'SUP_CAMPO', pozoAsignado: 'pozo1', zona: 'MONAGAS' }

const as = (uid: string, claims: Record<string, unknown>) =>
  env.authenticatedContext(uid, claims).firestore()

// Evaluación que el cliente crea hoy (ver useEvaluacionActual.ts).
const evalNueva = (over: Record<string, unknown> = {}) => ({
  pozoId: 'pozo1',
  operadorId: 'op1',
  estado: 'EN_CURSO',
  fechaInicio: new Date(),
  horasEvaluadas: 0,
  zona: 'MONAGAS',
  config: { apiXp: 0, aysPct: 0 },
  creadoEn: new Date(),
  ...over,
})

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'well-testing-rules-test',
    firestore: {
      rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8'),
    },
  })
})

afterAll(async () => {
  await env.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  // Datos base, escritos sin reglas.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'pozos/pozo1'), { nombre: 'P1', zona: 'MONAGAS', asignados: ['op1'] })
    await setDoc(doc(db, 'pozos/pozo2'), { nombre: 'P2', zona: 'MONAGAS', asignados: ['op2'] })
    await setDoc(doc(db, 'usuarios/op1'), { nombre: 'Op1', rol: 'OPERADOR', zona: 'MONAGAS', fcmToken: 'tok-op1' })
    await setDoc(doc(db, 'usuarios/op2'), { nombre: 'Op2', rol: 'OPERADOR', zona: 'MONAGAS', fcmToken: 'tok-op2' })
    await setDoc(doc(db, 'usuarios/opFaja'), { nombre: 'OpF', rol: 'OPERADOR', zona: 'FAJA', fcmToken: 'tok-f' })
    await setDoc(doc(db, 'evaluaciones/evEnCurso'), evalNueva())
    await setDoc(doc(db, 'evaluaciones/evPendiente'), evalNueva({ estado: 'PENDIENTE_SUPERVISOR' }))
    await setDoc(doc(db, 'evaluaciones/evEnCurso/lecturas/l1'), { hora: 1, tanques: [], operativos: {} })
    await setDoc(doc(db, 'evaluaciones/evPendiente/lecturas/l1'), {
      hora: 1, timestamp: new Date(), alertas: [], tanques: [{ tanqueId: 't1', bph: 1, bpd: 24, netos: 24 }],
      operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' },
    })
  })
}, 20000) // 8 escrituras en frío contra el emulador — 5000ms (default de Jest) no siempre alcanza

describe('/evaluaciones — create', () => {
  it('permite al Operador asignado crear el ciclo EN_CURSO legítimo (lo que hace la app)', async () => {
    await assertSucceeds(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/nueva'), evalNueva()))
  })

  it('DENIEGA crear una evaluación ya OFICIAL (fabricar datos oficiales)', async () => {
    await assertFails(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ estado: 'OFICIAL' })))
  })

  it('DENIEGA crear una evaluación ya aprobada por el supervisor', async () => {
    await assertFails(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ estado: 'APROBADA_SUPERVISOR' })))
  })

  it('DENIEGA declarar una zona distinta a la del pozo (saltarse el scoping de supervisores)', async () => {
    await assertFails(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ zona: 'FAJA' })))
  })

  it('DENIEGA colar campos que el cliente no manda (resultados inventados)', async () => {
    await assertFails(
      setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ resultados: { netosPromedio: 99999 } }))
    )
  })

  it('DENIEGA crear a nombre de otro operador', async () => {
    await assertFails(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ operadorId: 'op2' })))
  })

  it('DENIEGA crear en un pozo que no es el asignado', async () => {
    await assertFails(setDoc(doc(as('op1', OPERADOR), 'evaluaciones/x'), evalNueva({ pozoId: 'pozo2' })))
  })
})

describe('/evaluaciones — update por el Operador', () => {
  it('permite registrar horas (RegistroPage)', async () => {
    await assertSucceeds(updateDoc(doc(as('op1', OPERADOR), 'evaluaciones/evEnCurso'), { horasEvaluadas: 3 }))
  })

  it('permite cerrar el ciclo hacia PENDIENTE_SUPERVISOR (ReportePage)', async () => {
    await assertSucceeds(
      updateDoc(doc(as('op1', OPERADOR), 'evaluaciones/evEnCurso'), {
        estado: 'PENDIENTE_SUPERVISOR',
        resultados: { netosPromedio: 10 },
        fechaCierre: new Date(),
      })
    )
  })

  it('DENIEGA auto-aprobarse: pasar estado directo a OFICIAL', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), 'evaluaciones/evEnCurso'), { estado: 'OFICIAL' }))
  })

  it('DENIEGA auto-aprobarse: pasar estado a APROBADA_SUPERVISOR', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), 'evaluaciones/evEnCurso'), { estado: 'APROBADA_SUPERVISOR' }))
  })
})

describe('/evaluaciones/{id}/lecturas — read', () => {
  const ruta = 'evaluaciones/evEnCurso/lecturas/l1'

  it('permite al Operador asignado a ese pozo', async () => {
    await assertSucceeds(getDoc(doc(as('op1', OPERADOR), ruta)))
  })
  it('permite al SUP_AREA de la misma zona', async () => {
    await assertSucceeds(getDoc(doc(as('sup', SUP_MONAGAS), ruta)))
  })
  it('permite al GERENTE', async () => {
    await assertSucceeds(getDoc(doc(as('ger', GERENTE), ruta)))
  })
  it('DENIEGA a un Operador de otro pozo', async () => {
    await assertFails(getDoc(doc(as('op2', OPERADOR_OTRO_POZO), ruta)))
  })
  it('DENIEGA al SUP_AREA de otra zona', async () => {
    await assertFails(getDoc(doc(as('supF', SUP_FAJA), ruta)))
  })
  it('permite listar con la query real de la app (Operador, su evaluación)', async () => {
    await assertSucceeds(getDocs(collection(as('op1', OPERADOR), 'evaluaciones/evEnCurso/lecturas')))
  })
  it('DENIEGA listar las lecturas de una evaluación ajena', async () => {
    await assertFails(getDocs(collection(as('op2', OPERADOR_OTRO_POZO), 'evaluaciones/evEnCurso/lecturas')))
  })
})

describe('/evaluaciones/{id}/lecturas — create', () => {
  it('permite al Operador dueño agregar lecturas a su ciclo EN_CURSO (RegistroPage)', async () => {
    await assertSucceeds(
      addDoc(collection(as('op1', OPERADOR), 'evaluaciones/evEnCurso/lecturas'), { hora: 2, tanques: [], operativos: {} })
    )
  })
  it('DENIEGA agregar lecturas a una evaluación ya cerrada (PENDIENTE_SUPERVISOR)', async () => {
    await assertFails(
      addDoc(collection(as('op1', OPERADOR), 'evaluaciones/evPendiente/lecturas'), { hora: 2, tanques: [], operativos: {} })
    )
  })
  it('DENIEGA a otro operador agregar lecturas a un ciclo ajeno', async () => {
    await assertFails(
      addDoc(collection(as('op2', OPERADOR_OTRO_POZO), 'evaluaciones/evEnCurso/lecturas'), { hora: 2, tanques: [], operativos: {} })
    )
  })
})

describe('/evaluaciones/{id}/lecturas — corrección por el Supervisor (drill-down de aprobaciones)', () => {
  const ruta = 'evaluaciones/evPendiente/lecturas/l1'

  it('permite corregir P. Cabezal con ruta anidada (operativos.pCab) sin tocar el resto de operativos', async () => {
    await assertSucceeds(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), { 'operativos.pCab': 600, 'operativos.pSep': 310 }))
    await env.withSecurityRulesDisabled(async (ctx) => {
      const { operativos } = (await getDoc(doc(ctx.firestore(), ruta))).data() as any
      expect(operativos).toEqual({ pCab: 600, pSep: 310, pCsg: 12, reductorPulgadas: '1"' })
    })
  })

  it('DENIEGA cambiar la hora (es un hecho, no un valor medido)', async () => {
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), { hora: 9 }))
  })

  it('DENIEGA corregir lecturas de una evaluación ya aprobada (congeladas)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'evaluaciones/evPendiente'), evalNueva({ estado: 'APROBADA_SUPERVISOR' }))
    })
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), { 'operativos.pCab': 1 }))
  })
})

describe('/evaluaciones — recalcular promedios tras corregir (supervisor)', () => {
  const ruta = 'evaluaciones/evPendiente'
  const promedios = (uid: string, over: Record<string, unknown> = {}) => ({
    'resultados.bpdPromedio': 200, 'resultados.netosPromedio': 180, 'resultados.qgPromedio': 1.5,
    'resultados.aysBls': 10, 'resultados.proyeccion24H': 4800,
    'resultados.recalculadoEn': new Date(), 'resultados.recalculadoPor': uid, ...over,
  })

  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), ruta), evalNueva({
        estado: 'PENDIENTE_SUPERVISOR',
        resultados: { bpdPromedio: 100, netosPromedio: 90, qgPromedio: 1, aysBls: 5, horasTotales: 5, proyeccion24H: 2400, tipoCalculo: 'FINAL_24H', calculadoEn: new Date() },
      }))
    })
  })

  it('permite al SUP_AREA de la zona actualizar los promedios con su uid como autor', async () => {
    await assertSucceeds(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup')))
  })
  it('permite al GERENTE', async () => {
    await assertSucceeds(updateDoc(doc(as('ger', GERENTE), ruta), promedios('ger')))
  })
  it('DENIEGA firmar el recálculo con el uid de otra persona', async () => {
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('otro')))
  })
  it('DENIEGA tocar horasTotales, tipoCalculo o calculadoEn (no son promedios)', async () => {
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup', { 'resultados.horasTotales': 99 })))
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup', { 'resultados.tipoCalculo': 'PRELIMINAR_FORZADO' })))
  })
  it('DENIEGA colar otros campos junto con los promedios (estado, pozoId…)', async () => {
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup', { estado: 'OFICIAL' })))
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup', { pozoId: 'pozo2' })))
  })
  it('DENIEGA al SUP_AREA de otra zona', async () => {
    await assertFails(updateDoc(doc(as('supF', SUP_FAJA), ruta), promedios('supF')))
  })
  it('DENIEGA al Operador y al Supervisor de Campo', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), ruta), promedios('op1')))
    await assertFails(updateDoc(doc(as('sc1', SUP_CAMPO), ruta), promedios('sc1')))
  })
  it('DENIEGA recalcular una evaluación que ya no está pendiente (aprobada o en curso)', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), ruta), evalNueva({ estado: 'APROBADA_SUPERVISOR', resultados: { bpdPromedio: 1, netosPromedio: 1, qgPromedio: 1, aysBls: 1, horasTotales: 1, proyeccion24H: 1, tipoCalculo: 'FINAL_24H', calculadoEn: new Date() } }))
    })
    await assertFails(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), promedios('sup')))
  })
  it('sigue permitiendo aprobar (solo estado + aprobaciones) — la regla de aprobar no cambió', async () => {
    await assertSucceeds(updateDoc(doc(as('sup', SUP_MONAGAS), ruta), { estado: 'APROBADA_SUPERVISOR', aprobaciones: [{ rol: 'SUP_AREA', uid: 'sup', accion: 'APROBAR', timestamp: new Date() }] }))
  })
})

describe('/pozos — update por el Supervisor de Campo', () => {
  it('permite fijar el Reductor (pulg) de SU pozo junto con tanques y límites (WellDetailPage)', async () => {
    await assertSucceeds(updateDoc(doc(as('sc1', SUP_CAMPO), 'pozos/pozo1'), {
      tanques: [], limResorte: 300, limGamma: 60, reductorPulgadas: '1/2"',
    }))
  })
  it('permite fijar Placa (diamOrif) y Meter Run de SU pozo (el Qg del Operador depende de ambos)', async () => {
    await assertSucceeds(updateDoc(doc(as('sc1', SUP_CAMPO), 'pozos/pozo1'), { diamOrif: 3.25, meterRun: 3.826 }))
  })
  it('DENIEGA que el Operador cambie Placa o Meter Run', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), 'pozos/pozo1'), { diamOrif: 3.25 }))
  })
  it('DENIEGA editar la Placa de un pozo que no es el suyo', async () => {
    await assertFails(updateDoc(doc(as('sc1', SUP_CAMPO), 'pozos/pozo2'), { diamOrif: 3.25 }))
  })
  it('DENIEGA editar el Reductor de un pozo que no es el suyo', async () => {
    await assertFails(updateDoc(doc(as('sc1', SUP_CAMPO), 'pozos/pozo2'), { reductorPulgadas: '1/2"' }))
  })
  it('DENIEGA que el Operador cambie el Reductor (solo lo consulta)', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), 'pozos/pozo1'), { reductorPulgadas: '1/2"' }))
  })
  it('sigue DENEGANDO campos fuera de la lista (nombre) aunque vaya con el Reductor', async () => {
    await assertFails(updateDoc(doc(as('sc1', SUP_CAMPO), 'pozos/pozo1'), { reductorPulgadas: '1/2"', nombre: 'otro' }))
  })
})

describe('/usuarios — read', () => {
  it('permite leer el propio documento', async () => {
    await assertSucceeds(getDoc(doc(as('op1', OPERADOR), 'usuarios/op1')))
  })
  it('DENIEGA a un Operador leer el documento de otro usuario (y su fcmToken)', async () => {
    await assertFails(getDoc(doc(as('op1', OPERADOR), 'usuarios/op2')))
  })
  it('DENIEGA a un Operador listar a todo el personal', async () => {
    await assertFails(getDocs(collection(as('op1', OPERADOR), 'usuarios')))
  })
  it('permite al SUP_AREA listar personal de SU zona (query de usePersonal)', async () => {
    await assertSucceeds(
      getDocs(query(collection(as('sup', SUP_MONAGAS), 'usuarios'), where('rol', 'in', ['OPERADOR', 'SUP_CAMPO']), where('zona', '==', 'MONAGAS')))
    )
  })
  it('DENIEGA al SUP_AREA leer personal de otra zona', async () => {
    await assertFails(getDoc(doc(as('sup', SUP_MONAGAS), 'usuarios/opFaja')))
  })
  it('permite al GERENTE listar todo el personal (query de usePersonal)', async () => {
    await assertSucceeds(getDocs(query(collection(as('ger', GERENTE), 'usuarios'), where('rol', 'in', ['OPERADOR', 'SUP_CAMPO']))))
  })
  it('sigue permitiendo al usuario guardar SU propio fcmToken (useNotifications)', async () => {
    await assertSucceeds(updateDoc(doc(as('op1', OPERADOR), 'usuarios/op1'), { fcmToken: 'nuevo' }))
  })
  it('DENIEGA que un usuario cambie su propio rol', async () => {
    await assertFails(updateDoc(doc(as('op1', OPERADOR), 'usuarios/op1'), { rol: 'GERENTE' }))
  })
})
