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

Todo producción está por construir. Eso es bueno: no hay datos que migrar ni
nada que romper, y las 10 funciones se crean directamente en 2.ª generación
(sin el corte que sí hubo en staging).

## 2. Decisiones que necesito de ti (con mi recomendación)

1. **Dónde se aloja el panel web del Supervisor.** El repo **no lo define**:
   `.github/workflows/deploy.yml` apunta a Firebase Hosting pero `firebase.json`
   no tiene configuración de hosting, y hay un `.vercel` ignorado en
   `apps/web-supervisor`. **Recomiendo Firebase Hosting**: mismo proyecto, HTTPS
   automático (obligatorio para las notificaciones web), dominio
   `well-testing-prod.web.app` sin configurar nada. Si prefieres Vercel u otro,
   avísame: cambia la Fase F y hay que autorizar ese dominio en Authentication.
2. **Región de Firestore: `southamerica-east1`** (la de staging y la de los
   triggers). **Es permanente**: no se puede cambiar después. Recomiendo no
   moverla.
3. **Quién es el primer Gerente.** Es el dueño operativo de la app. Recomiendo
   crearlo ya con el correo de la persona que va a quedarse a cargo (el tema de
   traspaso de propiedad lo retomamos aparte; mientras tanto tu cuenta de Google
   sigue siendo *Owner* del proyecto).
4. **App Android antigua "WellTesting"**: recomiendo eliminarla una vez que la
   nueva funcione (su `google-services.json` es público y apunta a un paquete
   que no es el real). Es irreversible, por eso lo decides tú.
5. **Cómo se distribuye el APK** (¿se pasa el archivo a mano o por Play Store?).
   Este runbook asume a mano. Play Store añade pasos (cuenta de desarrollador,
   ficha, revisión) que no están preparados.

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
US$5/mes con avisos al 50 / 90 / 100 %. Es una alerta, no un tope: no corta el
servicio, solo te avisa.

**A3. Crear Firestore** (🤖, **tras tu confirmación explícita de la región**,
porque es permanente):

```bash
cd firebase
npx firebase firestore:databases:create "(default)" --location southamerica-east1 --delete-protection ENABLED --point-in-time-recovery ENABLED --project well-testing-prod
```

- `--delete-protection ENABLED`: nadie puede borrar la base por accidente.
- `--point-in-time-recovery ENABLED`: se puede volver a cualquier minuto de los
  últimos 7 días (en staging no se activó a propósito).
- ✅ `npx firebase firestore:databases:list --project well-testing-prod` muestra
  `southamerica-east1`, protección y PITR activos.

**A4. Backups programados** (🤖), además del PITR:

```bash
npx firebase firestore:backups:schedules:create --recurrence DAILY --retention 14d --project well-testing-prod
```

✅ aparece al listarlos con `firestore:backups:schedules:list`.

**A5. Activar Storage** (🙋). Consola → *Build* → *Storage* → **Get started** →
modo producción → ubicación **`southamerica-east1`** (la misma región; también
permanente). No se activa solo.

**A6. Activar Authentication** (🙋). Consola → *Build* → *Authentication* →
**Get started** → *Sign-in method* → **Email/Password** → habilitar. En staging
el deploy de Functions/Storage no avisa que falta hasta que se prueba un login.
- ✅ 🤖 lo compruebo por API (proveedor de correo habilitado).

### Fase B — Backend: reglas, índices, Storage y Functions (🤖)

Orden obligatorio (cada uno depende del anterior):

```bash
cd firebase
npx firebase deploy --only firestore:rules,firestore:indexes --project well-testing-prod
npx firebase deploy --only storage --project well-testing-prod
npx firebase deploy --only functions --project well-testing-prod
```

- Las reglas de Storage leen Firestore (`firestore.get()`), por eso Firestore
  va primero.
- **Primer deploy de Functions 2.ª gen en un proyecto nuevo:** puede fallar una
  vez con un error de permisos de *Eventarc* (la cuenta de servicio recién creada
  tarda unos minutos en propagarse). **No es un fallo del código**: esperar
  5–10 min y repetir el mismo comando.
- Los índices tardan unos minutos en construirse; la primera consulta compuesta
  puede dar *"The query requires an index"* hasta que terminen.
- ✅ `npx firebase functions:list --project well-testing-prod`: **las 10 en
  `v2`, `nodejs22`**; los 7 triggers en `southamerica-east1` y los 3 callables en
  `us-central1`. ✅ Reglas: consola → Firestore → *Rules* muestra la fecha de
  hoy.
- 🛑 Si alguna función sale en `v1` o en `nodejs20`: parar (se desplegó otro
  código).

### Fase C — Claves de API y apps (🙋 + 🤖) — **el orden importa**

La clave de la app Android antigua está **en el historial público de git** y es
la clave activa del proyecto. Firebase reutiliza las claves automáticas del
proyecto para las apps nuevas, así que si no se elimina primero, la app nueva
nacería con una clave ya pública.

**C1. (🙋) Eliminar la clave filtrada.** Google Cloud Console (proyecto
`well-testing-prod`) → *APIs & Services* → *Credentials* → la clave que empieza
por **`AIzaSyDo3_`** (llamada "Android key" o similar) → eliminar. Se puede
recuperar durante 30 días si te equivocas. Nadie la usa: producción no tiene
ni base de datos.

**C2. (🤖) Registrar las apps nuevas** (Firebase crea claves nuevas):

```bash
npx firebase apps:create WEB "Monagas Supervisor" --project well-testing-prod
npx firebase apps:create ANDROID "Monagas Operator" --package-name com.monagas.operator --project well-testing-prod
npx firebase apps:list --project well-testing-prod
```

**C3. (🤖) Generar la configuración** (ninguno de estos archivos se versiona):

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

**C4. (🙋) Restringir las claves nuevas.** Google Cloud Console → *Credentials*:
- Clave **web**: *Application restrictions* → *HTTP referrers* → el dominio final
  del panel (p. ej. `https://well-testing-prod.web.app/*`). Sin restricción,
  cualquiera puede usar la clave desde cualquier sitio.
- Clave **Android**: *Android apps* → paquete `com.monagas.operator` + la huella
  SHA-1 del keystore de **release** (se obtiene en la Fase G; este paso se puede
  completar entonces).
- 🛑 Restringir mal rompe el login: probar login justo después de cada cambio.

### Fase D — Primer usuario (🙋, yo te guío)

**Hallazgo al preparar esto:** no existía ninguna forma de crear al primer
Gerente o Supervisor de Área. `crearPersonal` solo crea Operadores y Supervisores
de Campo, solo la pueden llamar Supervisores de Área/Gerentes, y ROOT no puede
llamarla (ni el panel le deja entrar a Usuarios). La guía anterior decía lo
contrario y era incorrecta. Por eso se escribió
`firebase/functions/scripts/create-supervisor-user.js` (verificado contra
staging real y contra emuladores sin Functions).

**Por qué lo ejecutas tú y no yo:** crea una cuenta con contraseña en producción.
Prefiero que la clave del Gerente solo la conozcas tú.

**Credenciales para correr el script** (este equipo no tiene `gcloud`). Elige una:
- *Opción A (recomendada):* instalar Google Cloud CLI y ejecutar
  `gcloud auth application-default login` (inicias sesión con tu cuenta Google).
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

### Fase E — Prueba de humo en producción (🤖, con un permiso tuyo)

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

### Fase F — Panel web del Supervisor (🤖)

*(Asume Firebase Hosting, decisión 1. Se ensaya primero en staging.)*

1. Añadir a `firebase/firebase.json`:
   ```json
   "hosting": {
     "public": "../apps/web-supervisor/dist",
     "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
     "rewrites": [{ "source": "**", "destination": "/index.html" }],
     "headers": [{ "source": "/firebase-messaging-sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] }]
   }
   ```
   (La ruta `public` fuera de la carpeta de `firebase.json` **no está probada**: se confirma en el ensayo en staging; si la CLI la rechazara, se mueve el `firebase.json` o se copia `dist`.) `rewrites`: el panel es una SPA y las rutas como `/aprobaciones` no existen
   como archivos. `no-cache` en el service worker: si se cacheara, un cambio no
   llegaría a los navegadores.)
2. **Ensayo en staging:** `npm run build:staging` → `firebase deploy --only
   hosting --project well-testing-staging` → entrar, iniciar sesión, abrir
   `/aprobaciones` directo (prueba el rewrite) y comprobar que
   `https://…/firebase-messaging-sw.js` responde con el `projectId` de staging.
3. **Producción:** `npm run build` en `apps/web-supervisor` (carga
   `.env.production`) → `npx firebase deploy --only hosting --project
   well-testing-prod`.
- ✅ Antes de desplegar: `dist/firebase-messaging-sw.js` contiene
  `"projectId":"well-testing-prod"`. 🛑 Si dice dev/staging, el build tomó otro
  `.env`.
- ✅ Iniciar sesión como el Gerente; la pantalla *Usuarios* abre; "Activar
  avisos" pide permiso (HTTPS, así que el push web puede funcionar).
- Si el dominio no es `*.web.app`/`*.firebaseapp.com`, agregarlo en
  Authentication → *Settings* → *Authorized domains*.

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

**G3. (🤖)**

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
- [ ] Ensayo de restauración con PITR hecho (o riesgo aceptado por escrito).
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
