// firebase/functions/scripts/probar-login.cjs
//
// Prueba de inicio de sesión REAL por correo y contraseña contra un proyecto de Firebase
// (checklist Fase 6, #52). Existe porque en staging el proveedor "Correo/Contraseña" NUNCA estuvo
// habilitado, y nadie lo notó durante semanas: las pruebas creaban usuarios con el Admin SDK y
// firmaban con tokens personalizados, ninguna iniciaba sesión como lo hace la app. Resultado:
// "las credenciales no funcionan" para todos (error PASSWORD_LOGIN_DISABLED).
//
// Qué hace: crea DOS cuentas desechables (una con rol OPERADOR y una SIN rol, como las que se
// crean a mano desde la consola de Firebase), inicia sesión con cada una por la API REST exactamente
// como lo hace el SDK de las apps, comprueba también una contraseña incorrecta y un correo
// inexistente, y BORRA las cuentas al terminar (también si algo falla). No toca cuentas reales.
//
// Uso (PowerShell o bash, con credenciales de gcloud ya configuradas):
//   node scripts/probar-login.cjs <projectId> <ruta-al-.env> <origen-permitido-por-la-clave>
//   ej. node scripts/probar-login.cjs well-testing-staging ../../apps/web-supervisor/.env.staging https://well-testing-staging.web.app/
//   ej. node scripts/probar-login.cjs well-testing-prod ../../apps/web-supervisor/.env.production https://well-testing-prod.web.app/
//
// El tercer argumento simula el origen (Referer) de la página: la clave de producción está
// restringida por sitio web y rechazaría uno ajeno.
//
// Resultados esperados: 1) y 2) iniciar sesión OK (la cuenta sin rol entra, pero su token NO trae
// rol: las apps la devuelven al login con un aviso), 3) y 4) INVALID_LOGIN_CREDENTIALS.
// Sale con código 1 si algo no cumple.
const fs = require('fs')
const crypto = require('crypto')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')

const [projectId, rutaEnv, origen] = process.argv.slice(2)
if (!projectId || !rutaEnv || !origen) {
  console.error('Uso: node scripts/probar-login.cjs <projectId> <ruta-al-.env> <origen-permitido>')
  process.exit(2)
}
const KEY = (fs.readFileSync(rutaEnv, 'utf8').match(/VITE_FIREBASE_API_KEY=(\S+)/) || [])[1]
if (!KEY) {
  console.error('No encontré VITE_FIREBASE_API_KEY en ' + rutaEnv)
  process.exit(2)
}

initializeApp({ projectId })
const auth = getAuth()
const sufijo = Date.now().toString(36)
const clave = crypto.randomBytes(9).toString('base64url') + 'aA1'
const resultados = []
const check = (nombre, ok, detalle) => {
  resultados.push(ok)
  console.log(`${ok ? 'OK   ' : 'FALLA'} ${nombre}${detalle ? ' — ' + detalle : ''}`)
}

async function entrar(email, password) {
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${KEY}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', referer: origen },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const j = await r.json()
  if (!r.ok) return { ok: false, error: j.error?.message || 'HTTP ' + r.status }
  const payload = JSON.parse(Buffer.from(j.idToken.split('.')[1], 'base64url').toString())
  return { ok: true, rol: payload.rol ?? null }
}

;(async () => {
  const creadas = []
  try {
    const sinRol = `prueba-sinrol-${sufijo}@example.test`
    const conRol = `prueba-operador-${sufijo}@example.test`
    creadas.push((await auth.createUser({ email: sinRol, password: clave })).uid)
    const u2 = await auth.createUser({ email: conRol, password: clave })
    creadas.push(u2.uid)
    await auth.setCustomUserClaims(u2.uid, { rol: 'OPERADOR', pozoAsignado: null, zona: 'MONAGAS' })

    const a = await entrar(sinRol, clave)
    check('1) cuenta SIN rol (como una creada en la consola) puede iniciar sesión', a.ok, a.ok ? `su token trae rol=${a.rol} (debe ser null)` : a.error)
    if (a.ok) check('   y su token NO trae rol (las apps la devuelven al login con un aviso)', a.rol === null)

    const b = await entrar(conRol, clave)
    check('2) cuenta CON rol OPERADOR puede iniciar sesión', b.ok && b.rol === 'OPERADOR', b.ok ? `rol=${b.rol}` : b.error)

    const c = await entrar(conRol, 'incorrecta-xyz-1')
    check('3) contraseña incorrecta se rechaza', !c.ok && c.error === 'INVALID_LOGIN_CREDENTIALS', c.error || 'ENTRÓ (mal)')

    const d = await entrar('no-existe-' + sufijo + '@example.test', clave)
    check('4) correo inexistente se rechaza', !d.ok && d.error === 'INVALID_LOGIN_CREDENTIALS', d.error || 'ENTRÓ (mal)')

    if ([a, b, c, d].some((x) => x.error === 'PASSWORD_LOGIN_DISABLED')) {
      console.log('\n>>> PASSWORD_LOGIN_DISABLED: el proveedor "Correo/Contraseña" NO está habilitado en ' + projectId + '.')
      console.log('>>> Consola de Firebase → Authentication → Método de acceso → Correo electrónico/contraseña → Habilitar.')
    }
  } catch (err) {
    check('EJECUCIÓN SIN EXCEPCIONES', false, err.message)
  } finally {
    for (const uid of creadas) await auth.deleteUser(uid).catch(() => {})
    console.log(`\ncuentas desechables borradas (${creadas.length})`)
    const mal = resultados.filter((x) => !x).length
    console.log(mal ? `${mal} verificación(es) fallaron` : `${resultados.length}/${resultados.length} verificaciones OK`)
    process.exit(mal ? 1 : 0)
  }
})()
