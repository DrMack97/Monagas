// firebase/functions/scripts/vendor-core.js
//
// Copia el @monagas/core ya compilado a firebase/functions/vendor/monagas-core,
// con un package.json plano (sin "private", con dependencies reales si las
// hubiera — hoy no tiene ninguna).
//
// Por qué existe: el despliegue real de Cloud Functions NO usa pnpm ni el
// node_modules local — sube firebase/functions/ tal cual y corre un `npm
// install` remoto contra package.json. firebase/functions/package.json
// declaraba "@monagas/core": "workspace:*" (protocolo de pnpm), que ese npm
// remoto no entiende — falla con "npm error code EUNSUPPORTEDPROTOCOL:
// Unsupported URL Type 'workspace:'" en TODAS las funciones Gen1
// (onEvalSubmit, onApprove, onReject, onLecturaEdit, notifyOperator,
// notifyMgr), confirmado en dos intentos reales de deploy a
// well-testing-staging (checklist Fase 6, #45). Nunca se había visto porque
// nunca se había desplegado nada de verdad — solo emuladores.
//
// La solución: package.json declara "@monagas/core": "file:./vendor/monagas-core"
// (protocolo que npm SÍ entiende) apuntando a esta carpeta, generada por este
// script y subida junto con el resto de firebase/functions/. El desarrollo
// local (emuladores, tests) sigue exactamente igual: node_modules/@monagas/core
// nunca se toca aquí — solo lo gestiona pnpm en su propio install, resolviendo
// el mismo paquete de siempre.
const fs = require('fs')
const path = require('path')

const coreDir = path.resolve(__dirname, '../../../packages/core')
const outDir = path.resolve(__dirname, '../vendor/monagas-core')

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

fs.rmSync(outDir, { recursive: true, force: true })
copyDir(path.join(coreDir, 'dist'), path.join(outDir, 'dist'))

const corePkg = JSON.parse(fs.readFileSync(path.join(coreDir, 'package.json'), 'utf8'))
const vendoredPkg = {
  name: corePkg.name,
  version: corePkg.version,
  type: corePkg.type,
  main: corePkg.main,
  types: corePkg.types,
  // "exports" con condición "default" apuntando a src/*.ts no sirve aquí —
  // no se vendorea el código fuente, solo dist/. main/types ya bastan.
  dependencies: corePkg.dependencies ?? {},
}
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify(vendoredPkg, null, 2) + '\n')

console.log(`vendor-core: ${coreDir}/dist -> ${outDir}`)
