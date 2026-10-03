// firebase/functions/scripts/e2e-cloud.cjs
//
// Recorrido completo Operador -> Supervisor -> OFICIAL contra un proyecto de
// Firebase REAL (staging o, para el smoke test del #52, producción). Siembra
// datos de prueba, ejercita las REGLAS DESPLEGADAS con el SDK de cliente (no
// con el Admin SDK, que las ignora), verifica que las Cloud Functions
// disparen en la nube, y limpia todo al terminar. No usa contraseñas: los
// usuarios de prueba se autentican con custom tokens.
//
// Uso:
//   GOOGLE_APPLICATION_CREDENTIALS=<adc.json> node scripts/e2e-cloud.cjs //     <projectId> <webApiKey> <serviceAccountEmail>
//   ej. well-testing-staging, la apiKey de "firebase apps:sdkconfig WEB ...",
//   y firebase-adminsdk-XXXXX@well-testing-staging.iam.gserviceaccount.com
//
// Requisitos (aprendidos en el #49):
//  - Tu cuenta necesita el rol "Service Account Token Creator" sobre esa
//    cuenta de servicio (firmar custom tokens usa iam.serviceAccounts.signBlob).
//  - Si el reloj de tu equipo está desfasado respecto al de Google, Google
//    rechaza los tokens con INVALID_CUSTOM_TOKEN (iat en el futuro); el script
//    firma con la hora de Google para no depender de eso.
//  - Hay que haber corrido "pnpm build" antes (usa packages/core/dist).
const path = require('path')
const { pathToFileURL } = require('url')
const admin = require('firebase-admin')
const { initializeApp } = require('firebase/app')
const { getAuth, signInWithCustomToken } = require('firebase/auth')
const F = require('firebase/firestore')

const [PROJECT, WEB_API_KEY, SERVICE_ACCOUNT] = process.argv.slice(2)
if (!PROJECT || !WEB_API_KEY || !SERVICE_ACCOUNT) {
  console.error('Uso: node scripts/e2e-cloud.cjs <projectId> <webApiKey> <serviceAccountEmail>')
  process.exit(2)
}
admin.initializeApp({ projectId: PROJECT, serviceAccountId: SERVICE_ACCOUNT })
const adb = admin.firestore(), aauth = admin.auth()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const resultados = []
const check = (nombre, ok, detalle = '') => { resultados.push({ nombre, ok }); console.log(`${ok ? 'OK  ' : 'FAIL'} ${nombre}${detalle ? ' — ' + detalle : ''}`) }

const SUF = Date.now().toString(36)
const ids = { pozo: 'pozo49-' + SUF, pozoOtro: 'pozo49x-' + SUF, op: 'op49-' + SUF, intruso: 'int49-' + SUF, sup: 'sup49-' + SUF }

async function esperar(fn, ms = 90000, paso = 2000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(paso) }
  return null
}

async function cliente(uid, nombre) {
  const app = initializeApp({ projectId: PROJECT, apiKey: WEB_API_KEY, authDomain: PROJECT + '.firebaseapp.com' }, nombre)
  const auth = getAuth(app)
  // El reloj local va adelantado respecto a Google: se firma con la hora de Google.
  const g = new Date((await fetch('https://www.googleapis.com')).headers.get('date')).getTime()
  const offset = Date.now() - g
  const realNow = Date.now
  Date.now = () => realNow() - offset
  let token
  try { token = await aauth.createCustomToken(uid) } finally { Date.now = realNow }
  await signInWithCustomToken(auth, token)
  await auth.currentUser.getIdToken(true)
  const tok = await auth.currentUser.getIdTokenResult()
  return { db: F.getFirestore(app), claims: tok.claims }
}

async function falla(p) { try { await p; return false } catch (e) { return /permission|PERMISSION/i.test(e.code + e.message) } }

;(async () => {
  const core = await import(pathToFileURL(path.resolve(__dirname, '../../../packages/core/dist/index.js')).href)
  try {
    // ---- 1. Siembra (Admin) ----
    await adb.collection('pozos').doc(ids.pozo).set({ nombre: 'E2E-49', campo: 'Muscar', zona: 'MONAGAS', estado: 'EN_CURSO', horasEval: 3, limResorte: 300, limGamma: 60,
      tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }], asignados: [ids.op], empresa: 'Del Sur International, S.A.', equipo: 'WT-DSI-01', evalEnCursoId: null, meterRun: 4, diamOrif: 2 })
    await adb.collection('pozos').doc(ids.pozoOtro).set({ nombre: 'E2E-49-otro', campo: 'Muscar', zona: 'MONAGAS', estado: 'EN_CURSO', horasEval: 3, asignados: [ids.intruso], evalEnCursoId: null })
    const usuarios = [[ids.op, 'OPERADOR', ids.pozo], [ids.intruso, 'OPERADOR', ids.pozoOtro], [ids.sup, 'SUP_AREA', null]]
    for (const [uid, rol, pozoAsignado] of usuarios) {
      await aauth.createUser({ uid, email: uid + '@e2e49.invalid' })
      await adb.collection('usuarios').doc(uid).set({ nombre: uid, rol, zona: 'MONAGAS', pozoAsignado, activo: true })
    }
    const claimsOk = await esperar(async () => { for (const [uid] of usuarios) { if (!(await aauth.getUser(uid)).customClaims?.rol) return false } return true })
    check('assignRole (nube) asignó claims a los 3 usuarios', !!claimsOk)
    if (!claimsOk) throw new Error('sin claims, no se puede seguir')

    const op = await cliente(ids.op, 'op'), intruso = await cliente(ids.intruso, 'int'), sup = await cliente(ids.sup, 'sup')
    check('token del Operador trae rol/pozo/zona', op.claims.rol === 'OPERADOR' && op.claims.pozoAsignado === ids.pozo && op.claims.zona === 'MONAGAS')

    // ---- 2. Operador: ciclo (igual que useEvaluacionActual) ----
    const evalRef = F.doc(F.collection(op.db, 'evaluaciones'))
    await F.runTransaction(op.db, async (tx) => {
      const pozoRef = F.doc(op.db, 'pozos', ids.pozo)
      const snap = await tx.get(pozoRef)
      if (snap.data().evalEnCursoId) throw new Error('ya había ciclo')
      tx.set(evalRef, { pozoId: ids.pozo, operadorId: ids.op, estado: 'EN_CURSO', fechaInicio: F.serverTimestamp(), horasEvaluadas: 0, zona: 'MONAGAS', config: { apiXp: 0, aysPct: 0 }, creadoEn: F.serverTimestamp() })
      tx.update(pozoRef, { evalEnCursoId: evalRef.id })
    })
    check('Operador abre el ciclo (transacción + candado del pozo)', true, evalRef.id)

    // Negativos del #51b en vivo
    check('DENEGADO: Operador crea evaluación ya OFICIAL', await falla(F.setDoc(F.doc(F.collection(op.db, 'evaluaciones')), { pozoId: ids.pozo, operadorId: ids.op, estado: 'OFICIAL', fechaInicio: new Date(), horasEvaluadas: 0, zona: 'MONAGAS', config: {}, creadoEn: new Date() })))
    check('DENEGADO: Operador se auto-aprueba (estado → OFICIAL)', await falla(F.updateDoc(evalRef, { estado: 'OFICIAL' })))

    // ---- 3. Lecturas (3 = horasEval) ----
    const mf = [10, 20.5, 30.8]
    for (let i = 0; i < 3; i++) {
      const tk = core.calcTanque({ mi: i ? mf[i - 1] : 0, mf: mf[i], ft: 2.4, th: 1, reductor: 0, aysPct: 2 })
      const gi = { pf: 60 + i, hw: 0.8, tGas: 95, gg: 0.65, diam: 2, meterRun: 4 }
      await F.addDoc(F.collection(op.db, 'evaluaciones', evalRef.id, 'lecturas'), {
        hora: i + 1, timestamp: new Date(),
        tanques: [{ tanqueId: 't1', mi: i ? mf[i - 1] : 0, mf: mf[i], dif: tk.dif, th: 1, reductor: 0, bph: tk.bph, bpd: tk.bpd, aysBls: tk.aysBls, netos: tk.netos }],
        gas: { ...gi, ...core.calcAGA3(gi) }, operativos: { pCab: 120, pSep: 45, pCsg: 0 }, alertas: [] })
      await F.updateDoc(evalRef, { horasEvaluadas: F.increment(1) })
    }
    check('Operador registra 3 lecturas + horas', true)
    const lecOp = await F.getDocs(F.query(F.collection(op.db, 'evaluaciones', evalRef.id, 'lecturas'), F.orderBy('hora')))
    const lecturas = lecOp.docs.map((d) => ({ id: d.id, ...d.data() }))
    check('Operador lee sus 3 lecturas', lecturas.length === 3)
    check('DENEGADO: otro Operador lee esas lecturas', await falla(F.getDocs(F.collection(intruso.db, 'evaluaciones', evalRef.id, 'lecturas'))))
    check('DENEGADO: otro Operador agrega una lectura', await falla(F.addDoc(F.collection(intruso.db, 'evaluaciones', evalRef.id, 'lecturas'), { hora: 9, tanques: [], operativos: {} })))

    // ---- 4. Cierre (igual que ReportePage) ----
    const prom = core.calcularPromedioEvaluacion(lecturas)
    await F.updateDoc(evalRef, { resultados: { ...prom, tipoCalculo: 'FINAL_24H', calculadoEn: new Date() },
      reporteOperativo: { supervisorPDVSA: 'Supv E2E', cuadrillaDiurno: 'Diurna', cuadrillaNocturno: 'Nocturna', tipoFluido: { api: 45.1, h2s: 'Negativo' }, nivelCellar: 10, viajesVacuum: 4 },
      estado: 'PENDIENTE_SUPERVISOR', fechaCierre: F.serverTimestamp() })
    check('Operador cierra y envía a supervisión', true, 'netos promedio ' + prom.netosPromedio.toFixed(2))
    check('DENEGADO: agregar lectura a ciclo ya cerrado', await falla(F.addDoc(F.collection(op.db, 'evaluaciones', evalRef.id, 'lecturas'), { hora: 4, tanques: [], operativos: {} })))

    const sync = await esperar(async () => { const p = (await adb.collection('pozos').doc(ids.pozo).get()).data(); return p.estado === 'PENDIENTE_SUPERVISOR' && p.evalEnCursoId === null })
    check('onEvalSubmit (nube): pozo → PENDIENTE_SUPERVISOR y candado liberado', !!sync)

    // ---- 5. Supervisor ----
    const q = F.query(F.collection(sup.db, 'evaluaciones'), F.where('estado', '==', 'PENDIENTE_SUPERVISOR'), F.where('zona', '==', 'MONAGAS'))
    const pend = (await F.getDocs(q)).docs.map((d) => d.id)
    check('Supervisor ve la evaluación en su cola (query de useApprovals)', pend.includes(evalRef.id))
    const lecSup = await F.getDocs(F.collection(sup.db, 'evaluaciones', evalRef.id, 'lecturas'))
    check('Supervisor abre las 3 lecturas', lecSup.size === 3)
    const per = await F.getDocs(F.query(F.collection(sup.db, 'usuarios'), F.where('rol', 'in', ['OPERADOR', 'SUP_CAMPO']), F.where('zona', '==', 'MONAGAS')))
    check('Supervisor lista su personal (query de usePersonal)', per.size >= 2)
    check('DENEGADO: Operador lista a todo el personal', await falla(F.getDocs(F.collection(op.db, 'usuarios'))))

    // corrección de una lectura → onLecturaEdit recalcula
    const antes = (await adb.collection('evaluaciones').doc(evalRef.id).get()).data().resultados.netosPromedio
    const l1 = lecSup.docs.find((d) => d.data().hora === 1)
    const tq = l1.data().tanques.map((t) => ({ ...t, netos: t.netos + 30 }))
    await F.updateDoc(F.doc(sup.db, 'evaluaciones', evalRef.id, 'lecturas', l1.id), { tanques: tq })
    const recal = await esperar(async () => { const n = (await adb.collection('evaluaciones').doc(evalRef.id).get()).data().resultados.netosPromedio; return Math.abs(n - antes - 10) < 0.01 ? n : null })
    check('onLecturaEdit (nube): corregir una lectura recalcula el promedio (+30/3 = +10)', !!recal, `${antes.toFixed(2)} → ${recal ? recal.toFixed(2) : 'sin cambio'}`)

    // aprobar (igual que useApprovals.aprobar)
    await F.updateDoc(F.doc(sup.db, 'evaluaciones', evalRef.id), { estado: 'APROBADA_SUPERVISOR', aprobaciones: F.arrayUnion({ rol: 'SUP_AREA', uid: ids.sup, accion: 'APROBAR', timestamp: new Date() }) })
    const oficial = await esperar(async () => { const e = (await adb.collection('evaluaciones').doc(evalRef.id).get()).data(), p = (await adb.collection('pozos').doc(ids.pozo).get()).data(); return e.estado === 'OFICIAL' && p.estado === 'OFICIAL' })
    check('onApprove (nube): evaluación y pozo → OFICIAL', !!oficial)

    // historial de oficiales (query de useEvaluacionesOficiales) + datos para el Excel
    const hist = await F.getDocs(F.query(F.collection(sup.db, 'evaluaciones'), F.where('pozoId', '==', ids.pozo), F.where('zona', '==', 'MONAGAS'), F.where('estado', 'in', ['OFICIAL', 'APROBADA_SUPERVISOR'])))
    check('Historial de oficiales del pozo lista la evaluación', hist.size === 1)
    const e = (await adb.collection('evaluaciones').doc(evalRef.id).get()).data()
    check('Evaluación final trae reporteOperativo y aprobación registrada', !!e.reporteOperativo?.supervisorPDVSA && e.aprobaciones?.length === 1)
  } catch (err) {
    check('EJECUCIÓN SIN EXCEPCIONES', false, err.message)
  } finally {
    // ---- limpieza ----
    try {
      for (const col of ['evaluaciones']) { const s = await adb.collection(col).where('pozoId', 'in', [ids.pozo, ids.pozoOtro]).get(); for (const d of s.docs) { const l = await d.ref.collection('lecturas').get(); for (const x of l.docs) await x.ref.delete(); await d.ref.delete() } }
      for (const p of [ids.pozo, ids.pozoOtro]) await adb.collection('pozos').doc(p).delete()
      for (const u of [ids.op, ids.intruso, ids.sup]) { await adb.collection('usuarios').doc(u).delete().catch(() => {}); await aauth.deleteUser(u).catch(() => {}) }
      console.log('limpieza hecha')
    } catch (e) { console.log('LIMPIEZA INCOMPLETA:', e.message, JSON.stringify(ids)) }
    const bad = resultados.filter((r) => !r.ok).length
    console.log(`\n${resultados.length - bad}/${resultados.length} verificaciones OK`)
    process.exit(bad ? 1 : 0)
  }
})()
