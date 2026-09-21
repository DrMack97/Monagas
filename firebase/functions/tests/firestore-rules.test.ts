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

import { describe, it, beforeAll, afterAll, beforeEach } from '@jest/globals'
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
  })
})

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
