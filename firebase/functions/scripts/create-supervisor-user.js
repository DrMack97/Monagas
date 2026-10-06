// firebase/functions/scripts/create-supervisor-user.js
//
// Da de alta al PRIMER Gerente o Supervisor de Área de un proyecto (checklist
// Fase 6, #52). Existe porque no hay ningún otro camino:
//   - crearPersonal (Cloud Function) solo crea OPERADOR y SUP_CAMPO, y solo la
//     pueden llamar SUP_AREA o GERENTE — alguien tiene que existir antes.
//   - ROOT no puede llamarla, y el panel web le bloquea la pantalla de Usuarios
//     (App.tsx: RutaSoloGestion solo deja pasar a SUP_AREA/GERENTE).
//   - create-root-user.js crea ROOT, no estos roles.
// (La guía de administración decía que ROOT podía dar de alta al primer
// Supervisor desde el panel: era incorrecto.)
//
// Qué hace, igual que lo haría el flujo normal de la app:
//   1. Crea la cuenta en Firebase Auth (se niega a tocar una que ya exista).
//   2. Escribe /usuarios/{uid} con el rol y la zona. Eso dispara assignRole
//      (Cloud Function), que asigna los Custom Claims que leen las reglas.
//   3. Espera a que los claims aparezcan. Si no aparecen a tiempo (p. ej. las
//      Functions aún no están desplegadas) los asigna directamente con los
//      MISMOS valores que assignRole, y lo avisa — nunca deja un usuario sin claims.
//
// Zona: SUP_AREA necesita FAJA o MONAGAS (ve solo su zona). GERENTE ve todo sin
// restricción de zona; por convención del proyecto lleva 'TODOS'.
//
// Uso:
//   node scripts/create-supervisor-user.js --project <projectId> --rol GERENTE \
//     --nombre "Nombre Apellido" --email correo@ejemplo.com --password "claveSegura" [--zona TODOS]
//   (la clave también puede ir en la variable de entorno NEW_USER_PASSWORD, para no
//   dejarla en el historial del shell)
//
//   Contra el emulador: FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
//   Contra un proyecto real: sin esas variables y con credenciales
//   (GOOGLE_APPLICATION_CREDENTIALS o `gcloud auth application-default login`).

const { initializeApp } = require('firebase-admin/app')
const { getAuth } = require('firebase-admin/auth')
const { getFirestore, FieldValue } = require('firebase-admin/firestore')

const ROLES = ['GERENTE', 'SUP_AREA']
const ZONAS = ['FAJA', 'MONAGAS', 'TODOS']
const ESPERA_CLAIMS_MS = Number(process.env.ESPERA_CLAIMS_MS || 90000)

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      out[argv[i].slice(2)] = argv[i + 1]
      i++
    }
  }
  return out
}

/** Valida los argumentos y devuelve los datos normalizados, o lanza Error con el motivo. */
function validar(args, env = process.env) {
  const password = args.password ?? env.NEW_USER_PASSWORD
  const faltan = ['project', 'rol', 'nombre', 'email'].filter((k) => !args[k])
  if (!password) faltan.push('password (o NEW_USER_PASSWORD)')
  if (faltan.length) throw new Error('Faltan argumentos: ' + faltan.join(', '))
  if (!ROLES.includes(args.rol)) throw new Error(`--rol debe ser ${ROLES.join(' o ')} (recibido: ${args.rol})`)
  if (!/^\S+@\S+\.\S+$/.test(args.email)) throw new Error('--email no parece un correo válido')
  if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres')

  const zona = args.zona ?? (args.rol === 'GERENTE' ? 'TODOS' : undefined)
  if (!zona) throw new Error('--zona es obligatoria para SUP_AREA (FAJA o MONAGAS)')
  if (!ZONAS.includes(zona)) throw new Error(`--zona debe ser ${ZONAS.join(', ')} (recibido: ${zona})`)
  if (args.rol === 'SUP_AREA' && zona === 'TODOS') {
    throw new Error('Un SUP_AREA ve solo SU zona: usa FAJA o MONAGAS. TODOS es para GERENTE.')
  }
  return { project: args.project, rol: args.rol, nombre: args.nombre, email: args.email, password, zona }
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  const datos = validar(parseArgs(process.argv.slice(2)))
  initializeApp({ projectId: datos.project })
  const auth = getAuth()
  const db = getFirestore()

  try {
    await auth.getUserByEmail(datos.email)
    throw new Error(`Ya existe una cuenta con ${datos.email}: este script solo crea usuarios nuevos.`)
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
  }

  const user = await auth.createUser({ email: datos.email, password: datos.password, displayName: datos.nombre })
  console.log(`Cuenta creada: ${user.uid}`)

  // Mismos campos que escribe crearPersonal.ts.
  await db.collection('usuarios').doc(user.uid).set({
    uid: user.uid,
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol,
    zona: datos.zona,
    pozoAsignado: null,
    activo: true,
    creadoEn: FieldValue.serverTimestamp(),
  })
  console.log(`Perfil /usuarios/${user.uid} escrito (${datos.rol}, zona ${datos.zona}). Esperando a assignRole...`)

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
    claims = { rol: datos.rol, pozoAsignado: null, zona: datos.zona }
    await auth.setCustomUserClaims(user.uid, claims)
    console.log(
      `AVISO: assignRole no respondió en ${ESPERA_CLAIMS_MS / 1000}s (¿Functions sin desplegar?). ` +
        'Claims asignados directamente: ' + JSON.stringify(claims)
    )
  }

  console.log(`Listo: ${datos.email} (${user.uid}) es ${datos.rol}. Puede iniciar sesión en el panel web.`)
  process.exit(0)
}

module.exports = { validar }

if (require.main === module) {
  main().catch((err) => {
    console.error('Error:', err.message)
    process.exit(1)
  })
}
