// firebase/functions/scripts/probar-clave-web.cjs
//
// Comprueba que la restricción por sitio web ("HTTP referrers") de la clave de API
// del panel/app móvil funciona DE VERDAD, no solo que quedó guardada (checklist
// Fase 6, #52, C4). Llama a una API pública de Firebase Auth con un token inválido a
// propósito y mira cómo responde Google según el origen declarado:
//   HTTP 400 (INVALID_ID_TOKEN)             → la clave FUE ACEPTADA para ese origen
//   HTTP 403 (API_KEY_HTTP_REFERRER_BLOCKED) → la clave fue BLOQUEADA para ese origen
// No imprime la clave, no crea nada y no necesita credenciales de Google.
//
// Uso:
//   node scripts/probar-clave-web.cjs <ruta-al-.env> <permitido1,permitido2,...>
//   ej. node scripts/probar-clave-web.cjs ../../apps/web-supervisor/.env.production \
//         https://well-testing-prod.web.app/,https://well-testing-prod.firebaseapp.com/,https://localhost/
//
// Los orígenes permitidos deben ser aceptados; además se prueba un sitio ajeno y una
// llamada sin Referer, que deben ser bloqueados. Sale con código 1 si algo no cumple.
//
// Ojo: una restricción por Referer frena el uso casual de la clave, no a quien falsee
// la cabecera. La protección real son las reglas de Firestore/Storage.
const fs = require('fs')

const [rutaEnv, lista] = process.argv.slice(2)
if (!rutaEnv || !lista) {
  console.error('Uso: node scripts/probar-clave-web.cjs <ruta-al-.env> <origen1,origen2,...>')
  process.exit(2)
}
const key = (fs.readFileSync(rutaEnv, 'utf8').match(/VITE_FIREBASE_API_KEY=(\S+)/) || [])[1]
if (!key) {
  console.error('No encontré VITE_FIREBASE_API_KEY en ' + rutaEnv)
  process.exit(2)
}

const permitidos = lista.split(',').map((s) => s.trim()).filter(Boolean)
const casos = [
  ...permitidos.map((o) => [o, o, true]),
  ['https://sitio-ajeno.example/', 'sitio AJENO', false],
  [null, 'sin Referer', false],
]

;(async () => {
  let mal = 0
  for (const [ref, nombre, debePasar] of casos) {
    const headers = { 'content-type': 'application/json' }
    if (ref) headers.referer = ref
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ idToken: 'x' }),
    })
    const j = await r.json().catch(() => ({}))
    const aceptada = r.status !== 403
    const ok = aceptada === debePasar
    if (!ok) mal++
    console.log(
      `${ok ? 'OK   ' : 'FALLA'} ${nombre.padEnd(48)} HTTP ${r.status} ${(j.error?.status || '').padEnd(18)} ` +
        `${aceptada ? 'aceptada ' : 'BLOQUEADA'} (esperado: ${debePasar ? 'aceptada' : 'bloqueada'})`
    )
  }
  console.log(mal ? `\n${mal} caso(s) no cumplen lo esperado` : `\nRestricción correcta en los ${casos.length} casos`)
  process.exit(mal ? 1 : 0)
})()
