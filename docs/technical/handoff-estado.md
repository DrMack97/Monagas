# Handoff de estado — WillyTank (leer PRIMERO tras un reinicio de contexto)

Escrito el 2026-11-02. Complementa, no sustituye, a `prod-deploy-runbook.md` (el paso a paso de producción con
todo lo que pasó de verdad) y `go-live-checklist.md` (registro de hallazgos). Si algo de aquí contradice a esos
documentos o al código, **manda el código**; comprobar antes de actuar (las secciones 4 y 8 dan las recetas).

## 1. Objetivo
Llevar **WillyTank** (app Android del Operador con Capacitor + panel web de Supervisor/Gerente + backend Firebase,
para PDVSA Punta de Mata) a producción: ítem **#52** de la Fase 6. Éxito = prueba de humo en producción 22/22,
aceptación (#50) con personas reales, APK de release firmado entregado al dueño operativo y, al final, Google Play.

## 2. Estado (2026-11-02)
**Hecho y verificado:** Fases 0–5; Fase 6 salvo lo indicado; Functions en Node 22 / 2.ª gen (7 triggers en
`southamerica-east1`, 3 callables en `us-central1`); staging completo (login habilitado el 2026-10-20); producción
Fases A, B, C (salvo clave Android), D (primer Gerente) y F (panel desplegado); nombre WillyTank; logo recuperado;
logins rediseñados; barra móvil en el panel; enlaces entre apps; APK **1.0.4 (versionCode 4)** distribuido a los 2 testers de staging (2026-11-03).
CI en verde en `4ec97f7`. Tests: Operador 45, panel 55, Functions 36 + 11 + 8 (validación de scripts).

**BUG RESUELTO EN PERMISOS (2026-11-02), pendiente de la prueba real de Wily: asignar un Operador a un pozo desde el panel daba
error.** Causa: en **staging las 3 funciones callable** (`reassignPozo`, `crearPersonal`, `setPersonalActivo`, las de la pantalla
Usuarios) no tenían el permiso público de invocación (`allUsers` → `roles/run.invoker` en su servicio de Cloud Run; lista vacía), así
que Google rechazaba al navegador (y su petición previa CORS, sin Authorization) ANTES de llegar a la función; los registros de
`reassignPozo` mostraban 5 avisos *"The request was not authenticated… Empty Authorization header value"* el 2026-10-22. Por qué
staging perdió el permiso: **no determinado** (se crearon el 2026-10-04/05 y luego se actualizaron); si se vuelve a desplegar `functions`
allí, repetir la comprobación de abajo. `assignRole` no es pública en ningún ambiente y está bien (trigger de Firestore).
*Arreglo aplicado (OK del dueño, 2026-11-02):* `allUsers` → `roles/run.invoker` en `reassignpozo`, `crearpersonal` y
`setpersonalactivo` de `well-testing-staging` (`us-central1`), por la API REST de Cloud Run v2 (`setIamPolicy`; `gcloud` no tiene cuenta
activa, solo ADC: `gcloud auth application-default print-access-token`). **No hubo cambio de código ni hace falta un APK nuevo**: es
permisos de la nube. *Comprobado:* POST sin token a `https://us-central1-<proyecto>.cloudfunctions.net/<función>` con `{"data":{}}` ya
devuelve el `PERMISSION_DENIED` propio de la función (*"Solo Supervisor de Área o Gerente pueden…"*) en **staging y en producción**, y
el OPTIONS (CORS) da 204 con `Access-Control-Allow-Origin` del panel. **NO verificado:** una llamada real con sesión de Gerente. Falta que Wily
asigne un Operador a un pozo desde Usuarios en staging y reporte el mensaje exacto si falla.

**Cambio de la ronda 1.0.4 (2026-11-03, desplegado SOLO en staging; en producción NO):** se quitan de la app del Operador los campos
Diluyente y Reductor (Bls) (en el estado van en 0: `calcTanque` y los datos no cambian; el código de Diluyente se conserva por si la Faja
lo vuelve a usar). El **Reductor (pulg)** pasó a ser una medida de tubería del POZO (`IPozo.reductorPulgadas`, texto libre, ej. `1/2"`):
se pide en `NewWellPage` (solo SUP_AREA/GERENTE crean pozos, sin cambios), la edita SUP_CAMPO/SUP_AREA/GERENTE en `WellDetailPage`, y el
Operador la ve de solo lectura ("-" si el pozo no la tiene) y se copia a `operativos.reductorPulgadas` de cada lectura. **Cambio de
permisos:** `firestore.rules` añade `reductorPulgadas` al `hasOnly` de SUP_CAMPO (solo eso). Desplegado en staging (reglas, panel,
Operador web y APK); **antes de producción hay que desplegar reglas + panel allí y compilar el APK con el google-services de prod.**
Tests: Operador 50, panel 58, reglas 33 (emulador). El pozo de prueba aún no tiene reductor (el Operador ve "-") y NO se ha
probado en un teléfono ni con sesión real de SUP_CAMPO.

**Bloqueado:**
- **Fase E** (prueba de humo en producción): la cuenta del dueño NO tiene el rol *Service Account Token Creator* sobre
  `firebase-adminsdk-fbsvc@well-testing-prod.iam.gserviceaccount.com` (prueba real de `signBlob`: 403, repetida el
  2026-11-02). Lo concede el dueño: IAM → lápiz de su fila → añadir ese rol (1–2 min en propagarse). *Su captura de IAM
  mostraba ese rol en la fila de la cuenta de servicio, no en la suya: fue un malentendido.*
- **C4 clave Android** (restricción por paquete + SHA-1): necesita el keystore de release (Fase G).
- Wily **nunca ha iniciado sesión en producción** ("último login: NUNCA"); el mecanismo está probado (5/5), no su cuenta.

## 3. Decisiones tomadas (y su razón)
- Región de Firestore **southamerica-east1** (permanente; igual que los triggers). Bucket de la app: `well-testing-prod`
  (southamerica-east1), reglas del repo desplegadas por *target* a él y al bucket por defecto (US-EAST1).
- Primer Gerente de producción = **Wily Vargas** (`willymotorsca@gmail.com`), dueño operativo.
- Hosting: **Firebase Hosting** (panel). Distribución: APK por **App Distribution** ahora; **Google Play** al final.
- **PITR y backups desactivados** hasta pasar a producción real (no había datos que proteger; el PITR lo propuse yo, no
  fue un pedido). Protección contra borrado: activada. Al pasar a producción real: `firestore:databases:update
  "(default)" --point-in-time-recovery ENABLED --project well-testing-prod` + backups + ensayo de restauración.
- Identificador técnico **`com.monagas.operator`** se queda (permanente al publicar). Nombre visible **WillyTank** (pedido del cliente).
- Clave de API filtrada del historial público: **eliminada**. App Android antigua `Willy.Tank` de prod: eliminada con
  borrado suave, **recuperable solo hasta el 2026-11-09**.
- Limpieza de imágenes de funciones: 30 días. Cuentas: crear SIEMPRE por panel (pantalla Usuarios) o scripts; nunca
  desde la consola de Firebase (queda sin rol).

**Preguntas abiertas (NO decididas):** tipo de cuenta de Google Play (personal exige prueba cerrada con 12 testers
14 días, organización exige D-U-N-S; verificar reglas vigentes); revisión de seguridad externa; traspaso de propiedad
del proyecto de Google (el dueño dijo "llegado el momento"); crear también una cuenta de Gerente del dueño (David)
en producción; si borrar o no
los 7 archivos de `Conceptos/` (ver sección 7).

## 4. Identificadores y accesos
| Cosa | Valor |
|---|---|
| Proyectos | `well-testing-dev` (155108939008, solo emuladores), `well-testing-staging` (319215096785), `well-testing-prod` (301184874401). Facturación Blaze en EUR, misma cuenta para staging y prod |
| Web apps | staging `1:319215096785:web:21e6a2b53b83abab6406f0` · prod `1:301184874401:web:abf2d5ae5d0e83c601fde0` |
| Android (`com.monagas.operator`, registrada como "WillyTank") | staging `1:319215096785:android:44f4d025328b21d36406f0` · prod `1:301184874401:android:a27a77dfa2ad768401fde0` |
| Hosting | panel staging https://well-testing-staging.web.app · Operador web staging https://willytank-operador-staging.web.app · panel prod https://well-testing-prod.web.app |
| Cuenta de servicio Admin SDK (prod) | `firebase-adminsdk-fbsvc@well-testing-prod.iam.gserviceaccount.com` |
| Pozo de prueba (staging) | `o5R7VUJkkHlXD8FUksnO` ("pozo prueba", zona MONAGAS) |
| Testers App Distribution (staging) | `delgadoantolinezdavidalejandro@gmail.com`, `willymotorsca@gmail.com` |
| Cuentas staging | Gerentes: `delgadoantolinezdavidalejandro@gmail.com`, `willymotorsca@gmail.com` · Operadores de prueba: `delgadoantolinezdavidalejandro+operador@gmail.com`, `willymotorsca+operador@gmail.com` (alias Gmail; contraseñas SOLO en `firebase/functions/.cuentas-locales/`, ignorada por git) |
| Cuentas prod | solo `willymotorsca@gmail.com` (GERENTE, zona TODOS) |

**Cómo me autentico (no está en ningún otro sitio):**
- `firebase-tools` ya tiene sesión del dueño en `~/.config/configstore/firebase-tools.json`. De ahí salen un token de
  acceso para las APIs REST (billing, claves de API, IAM, Identity Toolkit admin, reglas): `POST
  https://oauth2.googleapis.com/token` con `client_id = user.azp`, `client_secret = j9iVZfS8kkCEFUPaAeJV0sAi` (el secreto
  público de firebase-tools) y `refresh_token = tokens.refresh_token`.
- `gcloud` 588.0.0 instalado; credenciales de aplicación en `%APPDATA%\gcloud\application_default_credentials.json`.
  Úsalo **solo desde PowerShell** (Git Bash falla por rutas). El Admin SDK de los scripts las toma solo. **Su proyecto de
  cuota apunta hoy a `well-testing-prod`**; cámbialo con `gcloud auth application-default set-quota-project <proyecto>`
  (sin él, Auth falla con `auth/internal-error` aunque Firestore funcione).
- Admin SDK desde `firebase/functions`: `initializeApp({ projectId })` + los imports modulares (`firebase-admin/auth`...).

## 5. Restricciones y descubrimientos (no repetir errores)
- **Contraseñas jamás en el chat**: las escribe el dueño en su terminal (`$env:NEW_USER_PASSWORD`) o las genera
  `create-operator-user.js --generar-clave` a un archivo local. En staging se pegó una por error: recomendar restablecerla.
- **Git:** `git add <rutas explícitas>`, nunca `-A` (el dueño borra archivos de su disco; una vez entraron 7 borrados ajenos
  a un commit mío, ya restaurados). Rama por cambio, merge `--no-ff` a `main`, push, mirar el CI.
- **Node:** los tests de Functions con emuladores exigen **Node 22** (con el Node 26 del equipo el worker de `assignRole`
  muere). Receta: instalar `node@22` en una carpeta temporal (`npm i node@22`, `npm install-scripts approve node`, `npm rebuild
  node`) y anteponer su `bin` al PATH. Con `emulators:exec` quedan procesos Java huérfanos: matar por puerto (8080, 9099, 5001).
- **Despliegue de funciones:** la primera vez en un proyecto falla por Eventarc (esperar ~25 min y repetir). El `pnpm install`
  del predeploy dejó una vez `node_modules` roto → `pnpm install --frozen-lockfile --force` desde la raíz. `pnpm build` compila
  `core` primero (si no, carrera con las Functions).
- **Login:** el proveedor Correo/Contraseña de staging no estaba habilitado y nadie lo notó; `probar-login.cjs` lo detecta. Una
  cuenta sin rol inicia sesión pero las apps la rechazan con aviso.
- **Claves de API:** las claves automáticas se llaman igual en todos los proyectos ("Android key (auto created by
  Firebase)"): distinguirlas por el valor, no por el nombre. La "Browser key" de prod está restringida a
  `well-testing-prod.web.app`, `well-testing-prod.firebaseapp.com` y **`https://localhost/*`** (la app móvil la comparte y corre
  en ese origen): quitar el último rompe al Operador.
- **Hosting:** la CLI rechaza un `public` fuera de la carpeta del proyecto → el panel lleva su propio
  `apps/web-supervisor/firebase.json`; despliegue con `--config`.
- **Windows:** Python escribe CRLF en archivos LF (usar Node o la herramienta de edición); Git Bash cuelga con `python3`;
  `deploy.yml` NO sirve (apunta a Hosting sin config y no distingue ambientes); las capturas del navegador integrado a veces
  agotan el tiempo (verificar por estilos computados).
- **Descartado:** `hosting.public` fuera de carpeta; `hosting:rollback` (no existe en la CLI).

## 6. Próximos pasos
0. **Wily:** probar en staging la pantalla Usuarios (asignar un Operador a un pozo, dar de alta, desactivar); es lo único que falta del bug de las callables (ver sección 2). Producción ya responde igual, pero tampoco se ha probado con sesión real.
1. **Dueño:** conceder el rol de firma (sección 2). **Yo:** Fase E → `node scripts/e2e-cloud.cjs well-testing-prod <apiKeyWeb>
   firebase-adminsdk-fbsvc@well-testing-prod.iam.gserviceaccount.com` (con `GOOGLE_APPLICATION_CREDENTIALS` apuntando a un ADC;
   ver el encabezado del script) y `node scripts/probar-login.cjs well-testing-prod ../../apps/web-supervisor/.env.production
   https://well-testing-prod.web.app/`.
2. **Dueño:** pruebas en staging (ciclo completo; **notificaciones reales** en el teléfono, nunca verificadas); reportar el
   mensaje exacto de cualquier fallo. Hoy hay 1 evaluación `EN_CURSO` con 0 lecturas en staging. (Segundo pozo de prueba para Wily: el dueño dijo que NO hace falta.)
3. **Fase G:** el dueño genera el keystore (`keytool`, fuera del repo, 2 copias); yo configuro la firma en
   `android/app/build.gradle` leyendo `keystore.properties` (ya ignorado por git), compilo `assembleRelease`, saco el SHA-1 y
   restrinjo la clave Android (C4). Play Store (G5) después.
4. **#50** aceptación con personas reales. Antes de abrir a usuarios reales: PITR + backups + ensayo de restauración.
5. Si hace falta recuperar la app antigua de prod: **antes del 2026-11-09**.

**Bloqueos externos:** rol IAM (dueño), keystore (dueño), cuenta de Google Play, personas reales de campo.

## 7. Convenciones
- Español; ítem por ítem; **verificación real** (emuladores/staging/producción, no solo compilar); decir con honestidad lo que
  NO se pudo probar. Resúmenes no técnicos cuando se pidan. Los ítems del checklist se numeran #41–#52.
- Commits detallados en español con `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Comandos: `pnpm build` (raíz); `npx jest` dentro de cada app; Functions: `pnpm --filter @monagas/functions test` (Node 22).
- Scripts en `firebase/functions/scripts/`: `create-supervisor-user.js` (Gerente/Sup. de Área), `create-operator-user.js`
  (Operador/Sup. de Campo, `--generar-clave`), `create-root-user.js`, `e2e-cloud.cjs` (22 verificaciones), `probar-login.cjs`,
  `probar-clave-web.cjs`. Panel: `npm run deploy:staging|production` (en `apps/web-supervisor`); Operador web:
  `npm run deploy:web:staging`.
- **Archivos locales NO versionados que hay que conservar o regenerar:** `.env.staging` / `.env.production` de ambas apps (se
  regeneran con `npx firebase apps:sdkconfig WEB <appId> --project <p>`; en prod corregir `VITE_FIREBASE_STORAGE_BUCKET=well-testing-prod`;
  opcionales `VITE_URL_PANEL` / `VITE_URL_OPERADOR`), `android/app/google-services.{staging,production}.json`
  (`apps:sdkconfig ANDROID <appId>`; **copiar el del ambiente a `google-services.json` antes de compilar el APK** y comprobar su
  `project_id`), `.cuentas-locales/`. Receta del APK: `npx vite build --mode <amb>` → `npx cap sync android` → `cd android &&
  ./gradlew assembleDebug` (subir `versionCode` en `build.gradle`) → verificar con `aapt2 dump badging` → `npx firebase
  appdistribution:distribute <apk> --app <appId> --testers <correos> --project <p>`.
- **Pendiente del dueño, no mío:** 7 archivos de `Conceptos/` borrados de su disco y sin confirmar en git; yo no los toco.

## 8. Lo que NO está verificado (no darlo por hecho)
El Reductor (pulg) de la 1.0.4 en pantalla real (Operador, SUP_CAMPO editando) · Cualquier llamada real a `crearPersonal` / `reassignPozo` / `setPersonalActivo` desde el navegador (en staging el permiso se restauró el 2026-11-02, ver sección 2; en
producción están públicas; ninguna se ha llamado con sesión real) · Entrega real de notificaciones push (APK y navegador) · el enlace "Acceso al Panel de Supervisión" abierto dentro del APK en un
teléfono · la barra móvil del panel con sesión real · inicio de sesión en producción con una cuenta real · subida real de un
archivo a Storage y CORS · restauración desde PITR/backup · `getMessaging().send()` real · captura visual del login del panel.
