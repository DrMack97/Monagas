// firebase/functions/scripts/create-operator-user.js
//
// Da de alta un OPERADOR (o SUP_CAMPO) asignado a un pozo, haciendo exactamente lo que hace la Cloud
// Function crearPersonal cuando un Gerente lo crea desde la pantalla Usuarios del panel:
//   1. crea la cuenta en Firebase Auth,
//   2. escribe /usuarios/{uid} (eso dispara assignRole, que asigna el rol y el pozo en el token),
//   3. añade el uid a pozos/{pozoId}.asignados.
// Sirve para crear cuentas de PRUEBA sin pasar por el panel (p. ej. cuando no hay un Gerente con la
// sesión abierta) y para dar de alta personal desde la terminal. Se niega a tocar una cuenta existente.
//
// La contraseña NO se imprime nunca. Dos formas de darla:
//   - variable de entorno NEW_USER_PASSWORD, o
//   - --generar-clave: crea una aleatoria y la guarda en un archivo local ignorado por git
//     (firebase/functions/.cuentas-locales/<correo>.txt); el script solo dice la ruta.
//
// Uso:
//   node scripts/create-operator-user.js --project well-testing-staging --pozo <pozoId> \
//     --nombre "Operador Prueba" --email correo@ejemplo.com [--rol OPERADOR|SUP_CAMPO] [--generar-clave]

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const ROLES = ['OPERADOR', 'SUP_CAMPO']
const ESPERA_CLAIMS_MS = Number(process.env.ESPERA_CLAIMS_MS || 90000)

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue
    const k = argv[i].slice(2)
    if (k === 'generar-clave') out[k] = true
    else { out[k] = argv[i + 1]; i++ }
  }
  return out
}

/** Valida los argumentos y devuelve los datos normalizados, o lanza Error con el motivo. */
function validar(args, env = process.env) {
  const faltan = ['project', 'pozo', 'nombre', 'email'].filter((k) => !args[k])
  if (faltan.length) throw new Error('Faltan argumentos: ' + faltan.join(', '))
  const rol = args.rol ?? 'OPERADOR'
  if (!ROLES.includes(rol)) throw new Error(`--rol debe ser ${ROLES.join(' o ')} (recibido: ${rol})`)
  if (!/^\S+@\S+\.\S+$/.test(args.email)) throw new Error('--email no parece un correo válido')
  const generar = !!args['generar-clave']
  const password = generar ? crypto.randomBytes(9).toString('base64url') + 'aA1' : env.NEW_USER_PASSWORD
  if (!password) throw new Error('Falta la contraseña: usa --generar-clave o la variable NEW_USER_PASSWORD')
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')
  return { project: args.project, pozoId: args.pozo, nombre: args.nombre, email: args.email, rol, password, generar }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const d = validar(parseArgs(process.argv.slice(2)))
  initializeApp({ projectId: d.project })
  const auth = getAuth()
  const db = getFirestore()

  const pozoSnap = await db.collection('pozos').doc(d.pozoId).get()
  if (!pozoSnap.exists) throw new Error(`El pozo ${d.pozoId} no existe en ${d.project}.`)
  const zona = pozoSnap.data().zona

  try {
    await auth.getUserByEmail(d.email)
    throw new Error(`Ya existe una cuenta con ${d.email}: este script solo crea usuarios nuevos.`)
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
  }

  // Si hay que guardar la clave, se escribe ANTES de crear la cuenta: así nunca queda una cuenta
  // cuya clave nadie conoce.
  let ruta = null
  if (d.generar) {
    const dir = path.join(__dirname, '..', '.cuentas-locales')
    fs.mkdirSync(dir, { recursive: true })
    ruta = path.join(dir, d.email.replace(/[^a-z0-9@._+-]/gi, '_') + '.txt')
    fs.writeFileSync(ruta, `proyecto: ${d.project}\ncorreo: ${d.email}\nclave: ${d.password}\nrol: ${d.rol}\npozo: ${d.pozoId}\ncreada: ${new Date().toISOString()}\n`)
  }

  const user = await auth.createUser({ email: d.email, password: d.password, displayName: d.nombre })
  console.log(`Cuenta creada: ${user.uid}`)

  // Mismos campos que escribe crearPersonal.ts.
  await db.collection('usuarios').doc(user.uid).set({
    uid: user.uid, nombre: d.nombre, email: d.email, rol: d.rol, zona, pozoAsignado: d.pozoId, activo: true,
    creadoEn: FieldValue.serverTimestamp(),
  })
  await db.collection('pozos').doc(d.pozoId).update({ asignados: FieldValue.arrayUnion(user.uid) })
  console.log(`Perfil /usuarios/${user.uid} escrito (${d.rol}, zona ${zona}) y asignado al pozo ${d.pozoId}. Esperando a assignRole...`)

  const limite = Date.now() + ESPERA_CLAIMS_MS
  let claims
  while (Date.now() < limite) {
    claims = (await auth.getUser(user.uid)).customClaims
    if (claims?.rol) break
    await dormir(2000)
  }
  if (claims?.rol) {
    console.log('assignRole asignó los claims:', JSON.stringify(claims))
  } else {
    claims = { rol: d.rol, pozoAsignado: d.pozoId, zona }
    await auth.setCustomUserClaims(user.uid, claims)
    console.log(`AVISO: assignRole no respondió en ${ESPERA_CLAIMS_MS / 1000}s; claims asignados directamente: ${JSON.stringify(claims)}`)
  }

  console.log(`Listo: ${d.email} (${user.uid}) es ${d.rol} del pozo ${d.pozoId}.`)
  if (ruta) console.log(`La contraseña quedó SOLO en este archivo local (no se sube a git): ${ruta}`)
  process.exit(0)
}

module.exports = { validar }

if (require.main === module) {
  main().catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
}
