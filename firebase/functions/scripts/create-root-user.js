// firebase/functions/scripts/create-root-user.js
//
// Crea (o repara) el primer usuario ROOT del proyecto. ROOT no es un rol
// que la app pueda asignar por su cuenta — es la única forma de tener
// acceso administrativo total (bypassa todas las reglas de zona/rol en
// firestore.rules vía isRoot()) y a propósito no existe ningún flujo en
// la interfaz para crearlo.
//
// TRAMPA REAL si intentas hacerlo "a mano" desde la consola de Firebase o
// un script ingenuo: crear un documento en /usuarios/{uid} con rol:"ROOT"
// DISPARA assignRole.ts (onDocumentCreated en 'usuarios/{uid}'), y esa
// función solo reconoce ['OPERADOR','SUP_CAMPO','SUP_AREA','GERENTE'] —
// cualquier otro valor, incluyendo "ROOT", lo reescribe a "OPERADOR" en
// el Custom Claim. El resultado: tu usuario ROOT termina con permisos de
// Operador, sin ningún error visible.
//
// Este script evita esa trampa a propósito:
//   1. Crea (o reutiliza) el usuario en Firebase Auth.
//   2. Asigna el Custom Claim {rol:'ROOT', pozoAsignado:null, zona:null}
//      DIRECTAMENTE con el Admin SDK.
//   3. Deliberadamente NO crea ningún documento en /usuarios/{uid} — ROOT
//      no participa en los flujos de gestión de personal (crearPersonal,
//      reassignPozo, setPersonalActivo todos excluyen ROOT de
//      ROLES_GESTIONABLES/ROLES_VALIDOS a propósito), así que no necesita
//      un perfil ahí. Si en el futuro hiciera falta uno para mostrarlo en
//      alguna pantalla, hay que crearlo con el Admin SDK en un paso
//      aparte DESPUÉS de este script (nunca antes, nunca disparando
//      assignRole con rol:"ROOT").
//
// Uso:
//   Contra el emulador (requiere que auth+firestore estén corriendo):
//     FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
//     FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
//     node scripts/create-root-user.js --project well-testing-dev --email root@ejemplo.com --password "unaClaveSegura123"
//
//   Contra un proyecto real (dev/staging/prod): igual, pero SIN las dos
//   variables *_EMULATOR_HOST, y con credenciales válidas disponibles
//   (GOOGLE_APPLICATION_CREDENTIALS apuntando a una service account, o
//   `firebase login` + Application Default Credentials).

const admin = require('firebase-admin')

function parseArgs() {
  const args = process.argv.slice(2)
  const out = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      out[args[i].slice(2)] = args[i + 1]
      i++
    }
  }
  return out
}

async function main() {
  const { project, email, password } = parseArgs()

  if (!project || !email || !password) {
    console.error(
      'Uso: node create-root-user.js --project <projectId> --email <correo> --password <clave>'
    )
    process.exit(1)
  }

  admin.initializeApp({ projectId: project })
  const auth = admin.auth()

  let user
  try {
    user = await auth.getUserByEmail(email)
    console.log(`Usuario ya existía (${user.uid}), se actualiza su password y claims.`)
    await auth.updateUser(user.uid, { password })
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err
    user = await auth.createUser({ email, password })
    console.log(`Usuario creado: ${user.uid}`)
  }

  // El paso que importa: claim directo, SIN pasar por /usuarios/{uid}.
  await auth.setCustomUserClaims(user.uid, {
    rol: 'ROOT',
    pozoAsignado: null,
    zona: null,
  })

  console.log(`Listo. ${email} (${user.uid}) es ROOT.`)
  console.log(
    'Si el usuario ya tenía una sesión abierta en algún dispositivo, debe cerrar sesión y volver a entrar para que el nuevo Custom Claim tome efecto.'
  )
  process.exit(0)
}

main().catch((err) => {
  console.error('Error creando el usuario ROOT:', err)
  process.exit(1)
})
