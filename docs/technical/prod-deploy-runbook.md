# Runbook: despliegue a producción (Fase 6, #52)

**Estado: preparado, NO ejecutado.** Escrito el 2026-10-06 a partir de lo que de
verdad se hizo y verificó en `well-testing-staging` y de una lectura (solo
lectura) del estado real de `well-testing-prod`. Cada comando de aquí existe en
la CLI instalada (firebase-tools 15.29) o se ejecutó contra staging.

Leyenda: 🙋 lo haces tú (consola de Google/Firebase, claves, decisiones) ·
🤖 lo hago yo cuando digas "adelante" en ese paso · ✅ cómo comprobar que quedó
bien · 🛑 si pasa esto, **parar** y no seguir.

> Regla de oro del proyecto: un paso a la vez, comprobando cada uno. Si un ✅ no
> da lo esperado, no se pasa al siguiente.

---

## 1. Estado real de producción hoy (comprobado 2026-10-06)

| Cosa | Estado |
|---|---|
| Facturación (Blaze) | **No vinculada** (staging sí). Sin esto no se puede usar Firestore, Functions ni Storage de forma real. |
| Firestore | No existe (la API ni siquiera está activada). |
| Functions | Ninguna (el listado falla: faltan APIs). |
| Storage / Authentication | Sin activar (es un clic de consola, ver Fase A). |
| Apps registradas | Solo **una app Android antigua** "WellTesting" (paquete `Willy.Tank`, que no es el real `com.monagas.operator`). Ninguna app web. |
| Clave de API de esa app | **Es la misma que quedó en el historial público de git** (commit `2d73b34`). Sigue viva. Ver Fase C. |

### La app Android antigua "WellTesting" (qué es exactamente)

Es solo un **registro dentro de Firebase**, no una aplicación que exista en
algún sitio. Datos comprobados:

- Nombre "WellTesting", paquete **`Willy.Tank`**, ID
  `1:301184874401:android:b3a1d5dda339dec901fde0`, dentro de `well-testing-prod`.
- Sin huellas SHA registradas (nunca se firmó ni se probó un APK contra ella).
- Su `google-services.json` se subió al repositorio el 2026-07-13 (commit
  `2d73b34`, "85% de la fase 0"), en una carpeta donde Gradle nunca lo leía, y
  **ningún código del proyecto la usa**: la app real se llama
  `com.monagas.operator`.
- No tiene funciones propias: no almacena datos ni hace nada. Lo único que "tiene"
  es la **clave de API** del proyecto, que es lo que quedó expuesto (Fase C).
- *Inferencia, no comprobada:* por el nombre de paquete, parece un registro hecho
  a mano desde la consola en la primera etapa del proyecto, antes de decidir
  Capacitor con `com.monagas.operator`.

Por eso es seguro eliminarla: no hay nada que perder. Se deja para después de
que la app nueva funcione, para no tocar dos cosas a la vez.

Todo producción está por construir. Eso es bueno: no hay datos que migrar ni
nada que romper, y las 10 funciones se crean directamente en 2.ª generación
(sin el corte que sí hubo en staging).

## 2. Decisiones (respondidas el 2026-10-07, salvo las marcadas)

1. **Alojamiento del panel web: Firebase Hosting** — decisión *provisional*:
   se ensayó en staging y funciona (ver Fase F). Las alternativas se
   explicaron aparte (Vercel exige plan de pago para uso comercial; Netlify y
   Cloudflare Pages son equivalentes técnicos; alojar en servidores propios solo
   si PDVSA/Del Sur lo exigen). Si se cambia, cambia solo la Fase F.
2. **Región de Firestore: `southamerica-east1`.** ✅ Confirmada. Es permanente.
3. **Primer Gerente: el dueño operativo de la app.** ✅ Confirmado. Se crea con
   su correo en la Fase D (el tema de traspaso de propiedad del proyecto de
   Google se retoma aparte; mientras tanto tu cuenta sigue siendo *Owner*).
4. **App Android antigua "WellTesting": ✅ ELIMINADA el 2026-10-10** (borrado *suave*: queda en
   estado `DELETED` y **se puede recuperar hasta el 2026-11-09** con `androidApps:undelete`; después
   desaparece sola). No servía para nada (ver sección 1). Con ella fuera, el
   `google-services.production.json` quedó con un solo cliente (`com.monagas.operator`).
5. **Distribución: dos etapas.** ✅ (a) APK firmado enviado **directamente al
   dueño operativo** para que lo pruebe; (b) **Google Play Store** como objetivo
   final, cuando la app "marche correctamente". La etapa (b) tiene sus propios
   pasos (Fase G5).
6. **Recuperación a un punto en el tiempo (PITR): ✅ DESACTIVADO por ahora**
   (decisión del 2026-10-08). Mientras la app esté en fase de pruebas, perder datos
   no es un problema. **Hay que activarlo cuando se entregue a producción real**
   (ver Fase A3 y la puerta de salida, sección 6). No fue un pedido original: lo
   propuse yo como seguro extra.

7. **Nombre visible: ✅ "WillyTank"** (lo pidió el cliente; 2026-10-10). Aplicado en la app del
   Operador (icono, pantallas, manifest), en el panel web (título, cabecera, login) y en el registro
   de las apps Android de Firebase. Los reportes conservan el nombre oficial PDVSA "REPORTE DE
   OPERACIONES DE WELL TESTING".
8. **Identificador técnico: ✅ se queda `com.monagas.operator`** (decisión del dueño, 2026-10-10).
   Recordatorio: es **permanente** una vez publicada la app en Play Store.

## 3. Puerta de entrada (antes de tocar producción)

- [ ] `main` limpio, igual que `origin/main`, **CI en verde** (Build + Test).
- [ ] La E2E de nube pasa **22/22 en staging con ese mismo commit** (ver Fase E
      para el comando). Si algo cambió desde la última vez, se repite.
- [ ] Reloj de Windows sincronizado (iba ~7 h adelantado): rompe la firma de
      tokens de la prueba E2E.
- [ ] Node.js 22 instalado si se van a correr los tests de Functions en local
      (con Node 26 el emulador de Functions no ejecuta los triggers; el CI ya
      usa 22).
- [ ] Decisiones 1–5 de arriba respondidas.
- [ ] Revisión de seguridad externa: **pendiente** (ver `.security-review.md`).
      Es tu decisión si se hace antes o después de un primer arranque limitado.

---

## 4. Paso a paso

### Fase A — Cuenta de Google y servicios (🙋, ~30 min)

**A1. Vincular facturación.** Consola de Firebase → proyecto `well-testing-prod`
→ engranaje ⚙ → *Usage and billing* → *Modify plan* → **Blaze**, y elige la
cuenta de facturación **abierta** (la misma de staging).
- 🛑 Si dice *"Billing account … is not open"*: la cuenta está vinculada pero no
  activa (pasó en staging). Hay que abrirla en Google Cloud Billing.
- ✅ 🤖 lo compruebo: `billingEnabled: true` (consulta de solo lectura).

**A2. Alerta de presupuesto** (hazla ya, antes de que haya tráfico). Google
Cloud Console → *Billing* → *Budgets & alerts* → *Create budget*, p. ej.
5 EUR/mes (la cuenta factura en euros) con avisos al 50 / 90 / 100 %. Es una alerta, no un tope: no corta el
servicio, solo te avisa.

**A3. Crear Firestore** — ✅ **HECHO el 2026-10-08** (🤖, con tu confirmación de la
región). Hizo falta activar antes la API de Firestore en el proyecto (en producción
estaba apagada; se activó con Service Usage y la creación funcionó tras propagarse).

```bash
cd firebase
npx firebase firestore:databases:create "(default)" --location southamerica-east1 --delete-protection ENABLED --point-in-time-recovery DISABLED --project well-testing-prod
```

- ✅ Verificado con `firestore:databases:get`: `southamerica-east1`, `STANDARD` /
  `FIRESTORE_NATIVE`, **`DELETE_PROTECTION_ENABLED`** (nadie puede borrar la base por
  accidente; es gratis y se quita con `--delete-protection DISABLED` si hiciera
  falta rehacerla durante las pruebas) y **`POINT_IN_TIME_RECOVERY_DISABLED`**.
- **PITR desactivado por decisión tuya** mientras dure la fase de pruebas. Qué es:
  versiones de la base minuto a minuto durante 7 días, para volver a un instante
  anterior a un borrado o una escritura errónea. Se factura el almacenamiento de
  esas versiones (GB-mes, **sin capa gratuita**, exige facturación activa; tarifa
  exacta no confirmada). **Para activarlo al pasar a producción real:**

  ```bash
  npx firebase firestore:databases:update "(default)" --point-in-time-recovery ENABLED --project well-testing-prod
  ```

  Y entonces hacer el ensayo de restauración de la sección 5.

**A4. Backups programados** — ⏳ **diferido** (misma lógica que el PITR: durante las
pruebas no hay datos que proteger; se hace al pasar a producción real). (🤖), además
del PITR:

```bash
npx firebase firestore:backups:schedules:create --recurrence DAILY --retention 14d --project well-testing-prod
```

✅ aparece al listarlos con `firestore:backups:schedules:list`.

**A5. Activar Storage** — ✅ **hecho por ti el 2026-10-09** (🙋). Consola → *Build* →
*Storage* → **Get started** → modo producción. **Detalle verificado:** el bucket quedó
en **`US-EAST1`**, no en `southamerica-east1`; **igual que el de staging** (que se probó
completo), y es permanente. Impacto práctico: ninguno hoy, porque la app todavía no
sube archivos (0 objetos) y las reglas de Storage leen Firestore sin importar la
región. Solo añadiría algo de latencia si más adelante se suben fotos. Se deja así por
paridad con staging. (La recomendación original de este runbook, `southamerica-east1`,
era más estricta de lo que hace falta.)

**A5b. Bucket de la app en `southamerica-east1`** — ✅ **DECIDIDO y APLICADO el 2026-10-10.** El
dueño creó `well-testing-prod` (gs://well-testing-prod) en `SOUTHAMERICA-EAST1`, y la consola le
puso reglas "denegar todo". Se decidió **usarlo como el bucket de la app**:
- **Reglas:** `firebase.json` ahora usa un *target* de Storage (`"storage": [{"target": "app",
  "rules": "storage.rules"}]`) y `firebase/.firebaserc` mapea `app` a los buckets de cada ambiente
  (`well-testing-prod` **y** `well-testing-prod.firebasestorage.app` en prod;
  `well-testing-staging.firebasestorage.app` en staging; `well-testing-dev.firebasestorage.app` en
  dev). `firebase deploy --only storage --project <proyecto>` deja las reglas del repositorio en
  todos los buckets del ambiente. **Verificado** leyendo de Google el contenido de las reglas de
  ambos buckets de producción: idénticas a `storage.rules`, ya sin "denegar todo". El bucket por
  defecto (US-EAST1) queda con las mismas reglas, sin uso.
- **Configuración:** `VITE_FIREBASE_STORAGE_BUCKET=well-testing-prod` en ambos `.env.production`
  (el `apps:sdkconfig` devuelve el bucket por defecto, **hay que cambiarlo a mano cada vez que se
  regeneren**); verificado que el build de producción incrusta `storageBucket:"well-testing-prod"`.
- **Ensayado:** el despliegue con target en staging (sin cambios) y que el emulador de Storage sigue
  arrancando con el nuevo `firebase.json` (el aviso de Java `NullPointerException … line is null`
  al apagarlo es ruido preexistente: sale igual con la configuración original).
- ⏳ **No verificado:** una subida real de archivo (la app todavía no sube nada) ni CORS desde el
  dominio del panel; se prueba al implementar la primera subida.

**A6. Activar Authentication** — ✅ **hecho por ti el 2026-10-09** (🙋). Consola →
*Build* → *Authentication* → **Get started** → *Sign-in method* → **Email/Password**.
- ✅ Verificado por API: proveedor de correo habilitado; dominios autorizados
  `localhost`, `well-testing-prod.firebaseapp.com` y `well-testing-prod.web.app`.

**Alerta de presupuesto (A2)** — ✅ creada por ti: **5 USD** (dato del dueño; no pude
verificarla por API). La cuenta de facturación está en **EUR**: si Google la convirtió
o la tomó en euros, el umbral real es 5 EUR. Conviene mirarla una vez en la consola.

### Fase B — Backend: reglas, índices, Storage y Functions (🤖) — ✅ **HECHA el 2026-10-09**

Orden obligatorio (cada uno depende del anterior):

```bash
cd firebase
npx firebase deploy --only firestore:rules,firestore:indexes --project well-testing-prod
npx firebase deploy --only storage --project well-testing-prod
npx firebase deploy --only functions --project well-testing-prod
```

- Las reglas de Storage leen Firestore (`firestore.get()`), por eso Firestore
  va primero.
- ✅ **Resultado verificado:** reglas e índices de Firestore y reglas de Storage
  desplegados a la primera. `functions:list`: **las 10 en `v2`, `nodejs22`**; los 7
  triggers en `southamerica-east1` y los 3 callables en `us-central1`. Un re-despliegue
  final dio `exit=0` con las 10 "Skipped (No changes detected)".
- **Lo que pasó de verdad con las Functions (tres intentos, ~1 h en total):**
  1. *Falló el predeploy* con errores de TypeScript. Causa: el `pnpm install` del
     predeploy tardó **14 min** y dejó `node_modules` roto (faltaban las carpetas
     `@google-cloud+firestore` y `@google-cloud+storage` del almacén de pnpm; avisó
     "Failed to remove re2", un archivo bloqueado en Windows). Falló **antes de subir
     nada**, así que no dejó producción a medias. Reparación:
     `pnpm install --frozen-lockfile --force` desde la raíz (4 min 25 s). No pude
     determinar qué lo provocó la primera vez; no se repitió. **Si el predeploy vuelve a
     tardar minutos o a fallar con tipos, es esto.**
  2. *Segundo intento:* creó las 3 funciones callable, y las 7 con disparador de
     Firestore fallaron con *"Permission denied while using the Eventarc Service Agent …
     Retry the deployment in a few minutes"* (y antes, "Failed to verify … IAM
     bindings"). **Es el error de "primera vez con 2.ª gen" que este runbook anticipaba**;
     no es del código. Tu cuenta es *Owner*, así que no era un tema de permisos: era
     propagación. No hizo falta tocar ningún permiso a mano.
  3. *Tercer intento* (≈ 25 min después): las 7 se crearon bien.
- **Política de limpieza de imágenes:** la CLI exige una (si no, las imágenes de las
  funciones se acumulan y cobran). Se fijó en **30 días** en `us-central1` y
  `southamerica-east1`
  (`firebase functions:artifacts:setpolicy --location <región> --days 30 --force`); el
  valor por defecto de la CLI es 1 día, se eligió más margen para poder volver a
  versiones anteriores. Es un comando para cambiarlo si se quisiera.
- Los índices tardan unos minutos en construirse; la primera consulta compuesta
  puede dar *"The query requires an index"* hasta que terminen.
- 🛑 Si alguna función sale en `v1` o en `nodejs20`: parar (se desplegó otro código).

### Fase C — Claves de API y apps (🙋 + 🤖) — **el orden importa**

La clave de la app Android antigua está **en el historial público de git** y es
la clave activa del proyecto. Firebase reutiliza las claves automáticas del
proyecto para las apps nuevas, así que si no se elimina primero, la app nueva
nacería con una clave ya pública.

**C1. (🙋) Eliminar la clave filtrada** — ✅ **HECHO el 2026-10-09 22:37 UTC y verificado por API**
(activas en prod: solo la "Browser key"; staging conserva sus 2 claves; dev intacto). *Historia:* el
primer intento (2026-10-09) eliminó
la clave del proyecto equivocado
la clave del proyecto equivocado** (`well-testing-staging`) y se restauró sin daño con la API de
claves (`keys:undelete`; la restaurada coincide con la del `google-services.json` de staging,
`AIzaSyDhaE…`). **Trampa:** las claves de TODOS los proyectos se llaman igual, "Android key (auto
created by Firebase)". Se distinguen por su valor: la filtrada de **producción** empieza por
**`AIzaSyDo3_`**; la de staging por `AIzaSyDhaE`. Antes de eliminar: confirmar en el selector
de proyecto (arriba a la izquierda) que dice `well-testing-prod`, y usar *Mostrar clave* para
ver el valor. Comprobable después por API (`apikeys.googleapis.com`, `showDeleted=true`). Google Cloud Console (proyecto
`well-testing-prod`) → *APIs & Services* → *Credentials* → la clave que empieza
por **`AIzaSyDo3_`** (llamada "Android key" o similar) → eliminar. Se puede
recuperar durante 30 días si te equivocas. Nadie la usa: la app antigua no tiene
código y la base de producción no tiene ni un dato.

**C2. (🤖) Registrar las apps nuevas** — ✅ **HECHO el 2026-10-10** (Firebase creó una clave
Android nueva, `AIzaSyCcwe…`; la web usa la "Browser key" existente, `AIzaSyDB6y…`):
- Web "Monagas Supervisor": `1:301184874401:web:abf2d5ae5d0e83c601fde0`
- Android "Monagas Operator" (`com.monagas.operator`): `1:301184874401:android:a27a77dfa2ad768401fde0`

```bash
npx firebase apps:create WEB "Monagas Supervisor" --project well-testing-prod
npx firebase apps:create ANDROID "Monagas Operator" --package-name com.monagas.operator --project well-testing-prod
npx firebase apps:list --project well-testing-prod
```

**C3. (🤖) Generar la configuración** — ✅ **HECHO el 2026-10-10** (ninguno de estos archivos se versiona).
Generados `apps/web-supervisor/.env.production`, `apps/mobile-operator/.env.production` y
`apps/mobile-operator/android/app/google-services.production.json`. **Verificado:** ninguna usa
la clave filtrada; `projectId` = `well-testing-prod` en todo; los builds de ambas apps con
`--mode production` incrustan `well-testing-prod` y **cero** rastro de dev/staging; el service
worker del panel sale con el `projectId` de producción. *Detalles:* (a) los `google-services` de
cada ambiente ahora viven con nombre propio (`.staging.json`, `.production.json`; el `.gitignore`
cubre `google-services.*.json`) y **hay que copiar el del ambiente a `google-services.json` antes de
compilar el APK** (Gradle solo lee ese nombre); (b) el de producción trae **dos clientes** (la app
antigua `Willy.Tank` y la nueva) mientras la antigua exista: funciona, se limpia al eliminarla;
(c) el bucket de `.env.production` es el por defecto (`well-testing-prod.firebasestorage.app`),
ver A5b.
Comandos originales:

```bash
npx firebase apps:sdkconfig WEB <appId-web> --project well-testing-prod      # → .env.production de AMBAS apps
npx firebase apps:sdkconfig ANDROID <appId-android> --project well-testing-prod --out ../apps/mobile-operator/android/app/google-services.json
```

`.env.production` va en `apps/web-supervisor/` y `apps/mobile-operator/` (mismas
variables `VITE_FIREBASE_*` que `.env.staging`). Vite lo carga solo con
`npm run build`.
- ✅ Que la clave nueva **no** empiece por `AIzaSyDo3_`.
- ✅ Que `projectId` sea `well-testing-prod` en los tres archivos.
- 🛑 Si sale `well-testing-dev` o `staging`: parar; se mezclaron ambientes.

**C4. (🙋) Restringir las claves nuevas** — 🟡 **clave web HECHA y verificada el 2026-10-10; clave Android
pendiente** (necesita el SHA-1 del keystore, Fase G4). **Verificado para la web:** configuración
leída de la API (exactamente los 3 referrers) y prueba activa con la clave desde 5 orígenes
(`firebase/functions/scripts/probar-clave-web.cjs`, reutilizable): panel, dominio de Auth y `https://localhost/`
**aceptados**; un sitio ajeno y una llamada sin Referer **bloqueados (403)**. Antes de la
restricción los 5 se aceptaban. Al guardar, la consola descartó 2 APIs que la app no usa
(`cloudconfig`, `play`); las críticas (identitytoolkit, securetoken, firestore, fcmregistrations,
firebaseinstallations, firebasestorage) siguen. **No verificado:** la app móvil real en un
teléfono (solo se probó el origen `https://localhost/` simulado). *Procedimiento original:* Google Cloud Console → *Credentials*
(**comprobando antes el proyecto del selector y el valor de la clave**, ver C1):
- Clave **web** ("Browser key", empieza por `AIzaSyDB6y`): *Application restrictions* → *HTTP
  referrers*. Hoy **no tiene ninguna restricción de aplicación** (comprobado por API: solo
  restringe qué APIs puede llamar). ⚠️ **Esta misma clave la usa también la app móvil**, cuyo
  WebView de Capacitor corre con origen `https://localhost` (`androidScheme: 'https'`). Si se
  restringe solo al dominio del panel, **la app del Operador deja de funcionar**. Referrers
  necesarios: `https://well-testing-prod.web.app/*`, `https://well-testing-prod.firebaseapp.com/*`
  y `https://localhost/*`. (Honestidad: una restricción por referrer frena el uso casual de la
  clave, no a un atacante que falsee la cabecera; la protección real son las reglas de Firestore.)
  Probar login en panel **y** en el APK justo después.
- Clave **Android**: *Android apps* → paquete `com.monagas.operator` + la huella
  SHA-1 del keystore de **release** (se obtiene en la Fase G; este paso se puede
  completar entonces).
- 🛑 Restringir mal rompe el login: probar login justo después de cada cambio.

### Fase D — Primer usuario (🙋, yo te guío) — ✅ **HECHA el 2026-10-10**

**Resultado verificado por API en producción:** exactamente **1 usuario**, `willymotorsca@gmail.com` (Wily
Vargas), creado por el dueño con `create-supervisor-user.js`; claims `{rol: GERENTE, pozoAsignado: null,
zona: TODOS}` asignados por la Cloud Function `assignRole` (no por la rama de respaldo); perfil
`/usuarios/{uid}` activo; cuenta no deshabilitada. Antes se apuntó el proyecto de cuota de `gcloud` a
`well-testing-prod` y se verificó con lectura de Auth y Firestore. **Aviso:** esa contraseña no debe
pegarse nunca en un chat (en staging se pegó una por error y se recomendó cambiarla).

**Hallazgo al preparar esto:** no existía ninguna forma de crear al primer
Gerente o Supervisor de Área. `crearPersonal` solo crea Operadores y Supervisores
de Campo, solo la pueden llamar Supervisores de Área/Gerentes, y ROOT no puede
llamarla (ni el panel le deja entrar a Usuarios). La guía anterior decía lo
contrario y era incorrecta. Por eso se escribió
`firebase/functions/scripts/create-supervisor-user.js` (verificado contra
staging real y contra emuladores sin Functions).

**Por qué lo ejecutas tú y no yo:** crea una cuenta con contraseña en producción.
Prefiero que la clave del Gerente solo la conozcas tú.

**Credenciales para correr el script.** Elige una:
- *Opción A (recomendada) — ✅ ya hecha y verificada el 2026-10-08:* Google Cloud
  CLI 588.0.0 instalado con `winget install -e --id Google.CloudSDK`, y sesión
  iniciada con `gcloud auth application-default login` (cuenta dueña del proyecto).
  Las credenciales quedan en `%APPDATA%\gcloud\application_default_credentials.json`,
  fuera del repositorio. Verificado con una lectura de solo lectura contra staging
  (Auth y Firestore responden).
  - **Usa PowerShell o CMD para `gcloud`**, no Git Bash: su script de arranque se
    confunde con las rutas (`...\Monagas\Users\usuario\...: No such file`).
  - **Hace falta un "proyecto de cuota"**: sin él, las llamadas de Auth fallan con
    `auth/internal-error` (Firestore sí funciona, lo que despista). Se configura una
    vez por proyecto con
    `gcloud auth application-default set-quota-project <proyecto>`. Hoy está en
    `well-testing-staging`; **antes de la Fase D hay que cambiarlo a
    `well-testing-prod`** (solo se puede cuando la facturación y Authentication de
    producción estén activos).
- *Opción B:* consola → ⚙ → *Service accounts* → *Generate new private key*;
  `GOOGLE_APPLICATION_CREDENTIALS` apuntando al `.json`. **Bórralo al terminar**
  y nunca lo guardes dentro del repo.

**D1. Gerente** (la clave por variable de entorno, así no queda en el historial):

```bash
cd firebase/functions
# PowerShell:
$env:NEW_USER_PASSWORD = "una-clave-larga-y-unica"
node scripts/create-supervisor-user.js --project well-testing-prod --rol GERENTE --nombre "Nombre Apellido" --email correo@ejemplo.com
```

El script crea la cuenta, escribe `/usuarios/{uid}`, espera a que la Cloud
Function `assignRole` asigne los permisos y lo confirma. Si las Functions aún no
estuvieran desplegadas, los asigna él mismo y lo avisa. Se niega a tocar una
cuenta que ya existe.
- ✅ Imprime `assignRole asignó los claims: {"rol":"GERENTE",…,"zona":"TODOS"}`.

**D2. (opcional) Usuario ROOT de emergencia** — acceso administrativo total por
consola/scripts, **no** sirve para usar el panel:

```bash
node scripts/create-root-user.js --project well-testing-prod --email otro@ejemplo.com --password "…"
```

**D3.** Si hace falta, un Supervisor de Área por zona: mismo script con
`--rol SUP_AREA --zona MONAGAS` (o `FAJA`). A partir de ahí, Operadores y
Supervisores de Campo se crean desde la pantalla *Usuarios* del panel.

### Fase E — Prueba de humo en producción (🤖, con un permiso tuyo) — ⏳ **BLOQUEADA SOLO POR EL ROL**

**Comprobado el 2026-10-10:** la cuenta de servicio es
`firebase-adminsdk-fbsvc@well-testing-prod.iam.gserviceaccount.com` y tu cuenta **no** tiene sobre ella el
rol *Service Account Token Creator* (prueba real de `signBlob`: 403). Es lo único que falta; todo lo
demás (credenciales, base, funciones, claves) está listo.

Es la misma E2E de staging (`firebase/functions/scripts/e2e-cloud.cjs`, 22
verificaciones: ciclo completo, rechazo, reglas y funciones). Crea datos de
prueba y **los borra al terminar**. Hay que correrla **antes** de que entre
ningún usuario real, porque los datos de prueba son visibles unos segundos.

Requisitos (los mismos que en staging):
- 🙋 Tu cuenta con el rol **Service Account Token Creator** sobre la cuenta
  `firebase-adminsdk-…@well-testing-prod.iam.gserviceaccount.com` (IAM de Google
  Cloud). Tarda 1–2 min en propagarse.
- La clave web de la Fase C y las credenciales de la Fase D.

```bash
GOOGLE_APPLICATION_CREDENTIALS=<adc.json> node scripts/e2e-cloud.cjs well-testing-prod <webApiKey> firebase-adminsdk-XXXX@well-testing-prod.iam.gserviceaccount.com
```

- ✅ **22/22** y la línea `limpieza hecha`. Después compruebo en la consola que
  no quedó nada (pozos, evaluaciones, usuarios `e2e…`).
- 🛑 Cualquier `FAIL`: parar. No se abre a usuarios.

### Fase F — Panel web del Supervisor (🤖) — ✅ **DESPLEGADO A PRODUCCIÓN el 2026-10-10**

**Producción:** https://well-testing-prod.web.app. Verificado en vivo (HTTPS): `/` y `/aprobaciones`
devuelven 200 (rewrite de SPA), título "WillyTank - Panel de Supervisión", `firebase-messaging-sw.js`
200 con `Cache-Control: no-cache` y `projectId` = `well-testing-prod`; antes de desplegar, el build
no tenía rastro de dev/staging. La clave web restringida sigue aceptando ese dominio (5/5 en la
prueba activa). *Se desplegó antes de la Fase E* (no estaba prohibido: solo publica la pantalla de
login); **no** se invita a usuarios hasta pasar la prueba de humo. ⏳ **No verificado:** iniciar
sesión en el sitio de producción ni las notificaciones (requieren una persona / un Chrome con
permiso).

*(Firebase Hosting, decisión 1. **Ensayada y verificada en staging el 2026-10-07**:
https://well-testing-staging.web.app.)*

**Hallazgo del ensayo:** poner `"public": "../apps/web-supervisor/dist"` en
`firebase/firebase.json` **no funciona**: la CLI responde *"is outside of project
directory"*. La solución es que el panel lleve su **propio**
`apps/web-supervisor/firebase.json` (solo hosting, `"public": "dist"`) y se
despliegue con `--config`. Ya está creado y es el que se probó:

```json
{ "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }],
    "headers": [{ "source": "/firebase-messaging-sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }]
} }
```

(`rewrites`: el panel es una SPA y rutas como `/aprobaciones` no existen como
archivos. `no-cache` en el service worker: si se cacheara, un cambio no llegaría a
los navegadores.)

**Comandos** (también como scripts de `apps/web-supervisor/package.json`):

```bash
cd apps/web-supervisor
npm run deploy:staging      # compila con .env.staging y despliega a well-testing-staging
npm run deploy:production   # compila con .env.production y despliega a well-testing-prod
```

- ✅ **Verificado en staging** (sitio real, HTTPS): carga el login; abrir
  `/aprobaciones` directamente devuelve la aplicación (200) y redirige a `/login`
  (prueba del `rewrite`); `/firebase-messaging-sw.js` responde 200 con
  `Cache-Control: no-cache` y `projectId` de staging, y el worker se instala y
  se activa; sin errores en la consola.
- ⏳ **No verificado:** iniciar sesión en el sitio desplegado (requiere una
  contraseña real: lo prueba una persona). Tampoco las notificaciones, que
  necesitan un Chrome con permiso.
- ✅ Antes de desplegar a producción: `dist/firebase-messaging-sw.js` contiene
  `"projectId":"well-testing-prod"`. 🛑 Si dice dev/staging, el build tomó otro
  `.env`.
- Al terminar: restringir la clave web a ese dominio (Fase C4). Si el dominio no
  es `*.web.app`/`*.firebaseapp.com`, agregarlo en Authentication → *Settings* →
  *Authorized domains*.
- ⚠️ El sitio de staging quedó **público en internet** (cualquiera puede ver la
  pantalla de login, igual que lo estará el de producción). No expone datos: las
  reglas de Firestore exigen sesión.

### Fase G — APK firmado de release (🙋 + 🤖)

Hoy `android/app/build.gradle` no tiene configuración de firma: un
`assembleRelease` sale **sin firmar** y Android no lo instala. Hace falta un
*keystore* (la identidad de la app).

**G1. (🙋) Generar el keystore** — **fuera del repositorio** (p. ej.
`C:\Users\usuario\Documents\claves\monagas-release.jks`):

```bash
keytool -genkeypair -v -keystore monagas-release.jks -alias monagas -keyalg RSA -keysize 2048 -validity 10000
```

Guarda la contraseña y **dos copias del archivo** en sitios distintos. **Si se
pierde, no se pueden publicar actualizaciones que reemplacen a la app
instalada**: habría que desinstalar y reinstalar en cada teléfono.

**G2. (🤖)** Añadir la firma a `build.gradle` leyendo la ruta y las claves desde
un `keystore.properties` local (no versionado), y `*.jks`, `*.keystore` y
`keystore.properties` al `.gitignore` (ya hecho en este cambio: **antes no
estaban**, un keystore dentro del repo público se habría subido).

**G3. (🤖)** — antes, copiar la configuración de producción:
`copy apps\mobile-operator\android\app\google-services.production.json apps\mobile-operator\android\app\google-services.json`
(y a la inversa con `.staging.json` para un APK de staging). **Comprobar el `project_id` del archivo
copiado antes de compilar.**

```bash
cd apps/mobile-operator
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease
```

- ✅ `apksigner verify --verbose app-release.apk` dice *Verified*; y el APK trae
  el `projectId` de producción (no staging).
- **G4. (🙋)** Sacar la huella SHA-1 (`keytool -list -v -keystore … -alias
  monagas`) y completar la restricción de la clave Android (C4).
- Instalar en un teléfono: iniciar sesión, aceptar el permiso de notificaciones,
  comprobar que `usuarios/{uid}.fcmToken` aparece en Firestore.

**G5. Etapa 2: Google Play Store (objetivo final, más adelante).** No se hace
ahora; esto es lo que hay que saber para no cerrarse puertas:

- **El nombre de paquete `com.monagas.operator` es permanente** una vez
  publicada la app. Es el que ya usa el proyecto; conviene darlo por definitivo
  *antes* de empezar con la Fase G.
- **Cuenta de desarrollador de Google Play:** pago único de US$25 (no
  reembolsable). Según lo publicado, una cuenta **personal** nueva debe pasar una
  *prueba cerrada con 12 testers durante 14 días* antes de poder publicar; una
  cuenta de **organización** (requiere número D-U-N-S) tiene otro camino.
  *Estas reglas cambian: verificarlas en la consola de Play el día que se haga.*
  Si la app va a ser de la empresa, conviene la cuenta de organización, no una
  personal.
- Play pide un **AAB** (`./gradlew bundleRelease`), no un APK, y usa *Play App
  Signing*: Google guarda la clave final y tú firmas con una "clave de subida".
  Se prepara con el mismo keystore de G1.
- También exige: ficha de la tienda (descripción, capturas, icono), **política de
  privacidad** publicada en una URL, formulario *Data safety* (qué datos se
  recogen: correo, ubicación si se usara, token de notificaciones) y cumplir el
  nivel mínimo de API de Android vigente. *(De memoria; verificar al hacerlo.)*
- La app debe haber pasado antes la aceptación (#50) con personas reales.

**Etapa 1 (ahora): APK al dueño operativo.** El APK firmado de G3 se le envía
como archivo (correo, nube o mensajería). Él debe habilitar *"instalar apps de
orígenes desconocidos"* para esa app. Como no hay Play de por medio, **cada
actualización la instala a mano** y **debe estar firmada con el mismo keystore**
(por eso G1 importa tanto); si cambia la firma, Android exige desinstalar primero.

### Fase H — Aceptación y apertura (🙋, ítem #50)

Con una persona real de campo y otra de supervisión, en el APK y el panel de
**producción** (o de staging si se prefiere el ensayo previo): el recorrido
completo, más las notificaciones en ambos sentidos. Solo si sale bien se crean
los usuarios reales. No se invita a nadie antes de la Fase E.

---

## 5. Si algo sale mal (qué existe de verdad)

| Qué falló | Cómo volver atrás |
|---|---|
| Reglas de Firestore/Storage | Consola → *Rules* → historial → publicar la versión anterior (inmediato). O `git checkout <commit>` y `firebase deploy --only firestore:rules`. |
| Functions | `git checkout <commit-bueno>` y `firebase deploy --only functions`. No hay rollback automático. Una función rota solo afecta a su tarea (p. ej. sincronizar estados), no tumba la app. |
| Panel web | Hosting guarda versiones: consola → *Hosting* → *Release history* → **Rollback**. (La CLI instalada **no** tiene un comando de rollback.) |
| APK | Conservar el APK anterior; no hay canal de distribución que lo revierta solo. |
| Datos (borrado o escritura masiva errónea) | PITR: clonar la base a un instante anterior en una base nueva `firebase firestore:databases:clone "(default)" restaurada --snapshot-time <ISO-8601>` y copiar de allí. También los backups diarios (`firestore:databases:restore`). **No se ha ensayado nunca** (staging no tiene PITR): conviene un ensayo con datos de prueba justo después de la Fase A. |
| Eliminaste algo por error (clave de API) | Las claves se pueden recuperar 30 días. La base tiene protección contra borrado. |

## 6. Puerta de salida de producción

- [ ] Fases A–G en ✅, E con **22/22** y limpieza confirmada.
- [ ] Alerta de presupuesto creada; claves restringidas; clave filtrada eliminada.
- [ ] Gerente creado y con sesión probada; ROOT de emergencia guardado donde
      corresponda.
- [ ] APK firmado instalado y con push verificado; **keystore con 2 copias**.
- [ ] Aceptación (#50) con personas reales superada.
- [ ] **PITR activado** (está desactivado durante las pruebas, ver Fase A3) y ensayo
      de restauración hecho; o riesgo aceptado por escrito.
- [ ] Decisión sobre la revisión de seguridad externa tomada.

## 7. Qué NO hacer

- No usar `.github/workflows/deploy.yml` tal cual: despliega a Hosting un
  proyecto sin configuración de hosting y no distingue ambientes. Si se quiere
  automatizar, hay que reescribirlo (y crear los secretos a propósito).
- No correr `firebase deploy` sin `--project` explícito: el proyecto por defecto
  es **dev**, y desplegar a ciegas ya causó confusiones en este proyecto.
- No poner credenciales (keystore, claves de servicio, `.env.production`,
  `google-services.json`) dentro del repositorio: es público.
- No crear usuarios reales antes de la prueba de humo (Fase E).
- No saltarse el orden reglas → índices → Storage → Functions.
