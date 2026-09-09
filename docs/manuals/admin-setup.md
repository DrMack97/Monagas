# Guía de Administración

Para quien instala, configura y mantiene el proyecto en sí — no es una
guía de uso de la app, es para desarrollo/infraestructura. Todo lo de acá
se verificó leyendo el código y contra los emuladores reales a fecha de
la Fase 6 del proyecto (ver `.security-review.md` para el estado de
seguridad y `docs/technical/offline-strategy.md` para el diseño offline).

## 1. Requisitos

- Node.js — el proyecto declara `nodejs20` como runtime en
  `firebase/firebase.json` (`functions.runtime`) y `>=20` en
  `firebase/functions/package.json` (`engines`). **Importante:** ver la
  sección 5 (Problemas conocidos) — tener un Node global muy por encima
  de 20 rompe el emulador de Functions.
- pnpm `8.15.0` — fijado en `package.json` raíz (`packageManager`). Con
  Corepack activado (`corepack enable`) se usa automáticamente esa
  versión exacta.
- Firebase CLI (`firebase-tools`) — cualquier versión reciente sirve para
  desarrollo local; verificada contra `15.22.4`.
- `gh` CLI, si vas a tocar GitHub Actions o secrets del repositorio.

## 2. Instalación local

```bash
pnpm install
```

`apps/mobile-operator/.env` y `apps/web-supervisor/.env` están en
`.gitignore` — no vienen en un clon nuevo del repositorio, y **no existe
ningún `.env.example`** todavía para copiar como plantilla. Hay que
crearlos a mano con la configuración del proyecto de Firebase (`apiKey`,
`authDomain`, `projectId`, etc. — se consiguen desde la consola de
Firebase, Configuración del proyecto → Tus apps). Los que ya existen en
esta máquina solo tienen credenciales de **`well-testing-dev`** — no
existe todavía ningún `.env` de staging o producción (ver checklist
Fase 6, #45).

## 3. Levantar los emuladores

```bash
cd firebase
npx firebase emulators:start --project well-testing-dev
```

Puertos: Auth `9099`, Firestore `8080`, Functions `5001`, Storage `9199`,
UI en `4000`. `firebase.json` tiene `singleProjectMode: true`, necesario
para que Storage Rules pueda consultar Firestore con `firestore.get()`
(usado en `storage.rules` para resolver la zona de un pozo — ver
checklist Fase 6, #41b).

No existe ningún `firestore.emulator.rules` con reglas permisivas — si lo
viste mencionado en algún lado, era un archivo huérfano (nunca estuvo
referenciado en `firebase.json`) que se eliminó al escribir esta guía. El
emulador siempre corre con las mismas reglas reales de producción
(`firestore.rules`), a propósito — para que lo que se prueba localmente
sea representativo de verdad.

## 4. Crear el primer usuario ROOT

`ROOT` es el único rol con acceso administrativo total (bypassa toda
restricción de zona/rol en `firestore.rules`). **No existe ningún flujo
en la interfaz para crearlo** — es intencional, y crearlo a mano tiene una
trampa real:

Si creas un documento en `/usuarios/{uid}` con `rol: "ROOT"` (a mano desde
la consola, o con un script ingenuo), disparás `assignRole.ts` — esa
función solo reconoce
`['OPERADOR', 'SUP_CAMPO', 'SUP_AREA', 'GERENTE']`, y reescribe cualquier
otro valor (incluido `"ROOT"`) a `"OPERADOR"` en el Custom Claim, **sin
ningún error visible**. Terminás con un usuario que parece ROOT pero tiene
permisos de Operador.

Usa el script que evita esa trampa a propósito —
[create-root-user.js](../../firebase/functions/scripts/create-root-user.js):

```bash
cd firebase/functions

# Contra el emulador local:
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
node scripts/create-root-user.js --project well-testing-dev --email tu@correo.com --password "unaClaveSegura"

# Contra un proyecto real (dev/staging/prod), sin las dos variables
# *_EMULATOR_HOST, con credenciales válidas disponibles:
node scripts/create-root-user.js --project well-testing-staging --email tu@correo.com --password "unaClaveSegura"
```

El script asigna el Custom Claim directamente y **no crea** ningún
documento en `/usuarios/{uid}` a propósito (ROOT no participa de los
flujos de gestión de personal). Verificado end-to-end contra el emulador
de Auth+Firestore: el claim queda `{rol:'ROOT', pozoAsignado:null,
zona:null}` y no se crea ningún documento de perfil.

Con ese usuario ya podés entrar al panel web y, desde ahí, usar
`crearPersonal` (Cloud Function) para dar de alta al primer Supervisor de
Área real de cada zona — a partir de ahí, la gestión de personal sigue el
flujo normal descrito en la Guía del Supervisor.

## 5. Problemas conocidos (sin resolver todavía)

- **El emulador de Functions no carga ninguna función, confirmado en
  vivo.** Con Node global muy por encima de v20 (probado con v26), el
  arranque completo (`auth,firestore,functions,storage`) siempre falla
  con `Failed to load function definition from source: ... Cannot
  determine backend specification. Timeout after 10000`. No es solo un
  aviso — se confirmó escribiendo un documento en `/usuarios/{uid}` con
  el emulador corriendo y esperando: `assignRole.ts` (trigger de
  Firestore) nunca se ejecutó. Esto bloquea CUALQUIER prueba real de
  Cloud Functions (triggers y callables por igual) mientras no se
  resuelva — más urgente y más amplio que el problema puntual de
  `jest.config.js` (checklist Fase 6, #46). Sospecha, sin confirmar
  todavía: incompatibilidad entre el SDK `firebase-functions@4.9.0`
  (viejo — la propia CLI recomienda `>=5.1.0`) y una versión de Node muy
  nueva. Workaround mientras tanto: instalar Node 20 específicamente
  para este proyecto (con un gestor de versiones como `nvm-windows`) en
  vez de depender del Node global de la máquina.
- **`jest.config.js` roto** en `firebase/functions` (checklist Fase 6,
  #46) — apunta a un `src/setupTests.ts` inexistente.
- **VAPID key** de notificaciones push no configurada en
  `apps/mobile-operator/.env` — paso manual en la consola de Firebase
  (checklist Fase 6, #47).
- **Ningún ambiente real desplegado todavía** — `well-testing-staging` y
  `well-testing-prod` existen en `.firebaserc` pero nunca se les desplegó
  nada; todo el desarrollo se verificó contra emuladores locales
  (checklist Fase 6, #45 y #52).

## 6. CI/CD

Ver `.github/workflows/`. `build.yml` y `test.yml` corren en cada push;
`deploy.yml` es manual a propósito (`workflow_dispatch`) — no hay ningún
secret de Firebase configurado en el repositorio todavía
(`FIREBASE_SERVICE_ACCOUNT`, `FIREBASE_PROJECT_ID`), y no debería
activarse en automático hasta completar el resto del checklist Fase 6.
