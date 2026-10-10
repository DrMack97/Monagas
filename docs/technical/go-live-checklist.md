# Checklist de "go live" (Fase 6, ítem #51)

Estado al escribirse: **el proyecto NO está listo para producción.** Este
documento separa lo que ya se verificó de lo que está pendiente, con
evidencia — no es una auditoría de seguridad profesional (ver
`.security-review.md`, que sigue recomendando una revisión externa).

Leyenda: ✅ verificado · ⚠️ hallazgo real sin corregir · ⬜ pendiente · 🙋 solo lo puede hacer el dueño del proyecto

## 1. Revisión final de `firestore.rules` — corregida (#51b)

Revisadas línea por línea. La revisión encontró **cinco huecos** que ninguna
fase anterior cubrió. Todos quedaron **corregidos y cubiertos por tests
automáticos** (`firebase/functions/tests/firestore-rules.test.ts`, 29 casos,
corren en `pnpm test` y en CI). Antes de corregir, esos tests se corrieron
contra las reglas viejas: **14 fallaban** (cada uno = un hueco explotable);
con las reglas nuevas pasan 29/29.

- ✅ **Un Operador podía fabricar una evaluación "OFICIAL".** `create` no
  restringía ningún campo. Ahora exige `estado == 'EN_CURSO'`,
  `operadorId == uid`, `zona` igual a la del pozo (`get()`) y solo los 8
  campos que escribe `useEvaluacionActual.ts`.
- ✅ **Un Operador podía auto-aprobarse** (hallazgo nuevo, no estaba en la
  primera revisión): `estado` era editable por el Operador sin restringir el
  valor destino, así que un `update` directo a `OFICIAL` o
  `APROBADA_SUPERVISOR` saltaba al supervisor. Ahora solo puede quedar en
  `EN_CURSO` o `PENDIENTE_SUPERVISOR`.
- ✅ **Lecturas de cualquier zona legibles por cualquier autenticado.** Ahora
  `lecturas` se lee con el mismo criterio que su evaluación padre.
- ✅ **Se podían agregar lecturas a una evaluación cerrada.** Ahora `create`
  exige que la evaluación esté `EN_CURSO`.
- ✅ **`/usuarios` legible por cualquier autenticado (con `fcmToken`).** Ahora:
  el propio usuario, SUP_AREA de esa zona, GERENTE y ROOT. *Residual:* el
  `fcmToken` sigue dentro del documento, visible a supervisores de la zona
  (no permite enviar push sin la clave de servidor).
- Las reglas ya no dependen de verificación ad hoc: hay 29 tests con casos
  permitidos (los flujos reales de las apps) y denegados.
- ⬜ **Redesplegar las reglas** en cada ambiente al que ya se hayan llevado
  (staging: ver checklist #45).

## 2. Repositorio público

- ✅ `apps/mobile-operator/google-services.json` (del proyecto
  `well-testing-prod`, con `package_name` `Willy.Tank` que no coincide con
  el `appId` `com.monagas.operator`, y en la carpeta equivocada: Gradle
  nunca lo leyó) **dejó de versionarse** y `google-services.json` /
  `GoogleService-Info.plist` quedaron en `.gitignore`. El archivo local
  sigue en disco.
- ⚠️ **Sigue en el historial de git** (commit `2d73b34`) de un repo público.
  Purgarlo exige reescribir el historial con `push --force` (destructivo:
  no se hizo). Son claves de *cliente* (no secretas), pero sin App Check
  cualquiera puede usarlas: la mitigación real es 🙋 **restringir esa API key**
  en Google Cloud Console (APIs y servicios → Credenciales → restricciones de
  aplicación/API) y considerar App Check. Para push nativo habrá que generar un
  `google-services.json` nuevo con el package correcto y sin commitearlo.
- ⬜ Confirmar si el repositorio debe seguir público (se decidió mantenerlo
  público al hacer el primer push, tras el #43; conviene revisarlo antes de
  producción, dado lo documentado en `.security-review.md`).

## 3. Infraestructura de producción (`well-testing-prod`)

> **Paso a paso preparado:** [`prod-deploy-runbook.md`](prod-deploy-runbook.md) (#52), con el
> estado real de producción, las decisiones pendientes, el orden de cada paso, cómo
> comprobarlo y el rollback. Esta sección es la lista de cosas; el runbook es el orden.

- ✅ **Producción, Fase B completa (2026-10-09):** Storage y Authentication activados por el
  dueño; reglas, índices, Storage y las **10 funciones desplegadas** (v2, Node 22, triggers en
  `southamerica-east1`); política de limpieza de imágenes a 30 días. Detalle y tropiezos
  (predeploy que dejó `node_modules` roto, error de propagación de Eventarc) en el runbook.
  El bucket de Storage quedó en `US-EAST1` (igual que staging). **Siguiente: Fase C** (el dueño
  elimina la clave de API filtrada; luego se registran las apps nuevas).
- ✅ **Producción, avance previo (2026-10-08):** facturación vinculada (misma cuenta de
  staging, en EUR), API de Firestore activada y **base de datos creada** en
  `southamerica-east1` con protección contra borrado. **PITR desactivado a propósito**
  durante las pruebas; hay que activarlo al pasar a producción real (`firestore:databases:update
  --point-in-time-recovery ENABLED`). Pendiente de Fase A: alerta de presupuesto
  (confirmar monto, la cuenta factura en euros), Storage y Authentication (clics de consola).
- ⚠️ **Hallazgo al prepararlo: no había forma de crear al primer Gerente/Supervisor de
  Área** (`crearPersonal` no la puede llamar ROOT y solo crea Operadores/Sup. de Campo; el
  panel bloquea Usuarios a ROOT; la guía decía lo contrario). Resuelto con
  `firebase/functions/scripts/create-supervisor-user.js`, verificado contra staging real
  (los permisos los asignó la Cloud Function `assignRole`) y contra emuladores sin
  Functions (rama de respaldo), con 11 tests de validación.
- ⚠️ **La clave de API filtrada en el historial público (`2d73b34`) sigue siendo la clave
  activa de la app Android de producción** (comprobado). Hay que eliminarla *antes* de
  registrar las apps nuevas (si no, Firebase la reutiliza): runbook, Fase C.
- ✅ Se añadieron `*.jks`, `*.keystore` y `keystore.properties` al `.gitignore`: antes no
  estaban y un keystore de firma dentro del repo público se habría subido.
- ✅ **Hosting del panel web ensayado en staging** (https://well-testing-staging.web.app):
  Firebase Hosting, decisión provisional. La CLI **rechaza** un `public` fuera de la
  carpeta de `firebase.json` ("outside of project directory"), así que el panel lleva su
  propio `apps/web-supervisor/firebase.json` y se despliega con `--config`
  (`npm run deploy:staging` / `deploy:production`). Verificado: carga, rewrite de SPA en
  rutas profundas, service worker con `no-cache` y `projectId` correcto, sin errores.
  *No verificado:* iniciar sesión en el sitio y las notificaciones (necesitan una persona
  / un Chrome). `deploy.yml` sigue sin servir (apunta a Hosting sin config y no distingue
  ambientes).
- ⚠️ El `build.gradle` de Android no tiene configuración de firma: `assembleRelease` sale
  sin firmar. Preparado en el runbook (Fase G), pendiente de ejecutar con el keystore.

`well-testing-staging` ya pasó por todo esto (checklist #45, resuelto) —
sirve de referencia exacta de los pasos para producción:

- 🙋 Plan Blaze con cuenta de facturación **abierta** — en staging dio el
  error *"Billing account … is not open"* hasta que se abrió de verdad; no
  basta con vincularla.
- 🙋 Elegir región de Firestore y crear la base de datos — es **permanente**.
  Recomendación: `southamerica-east1`, igual que staging.
- ⬜ A diferencia de staging: activar protección contra borrado y
  recuperación a un punto en el tiempo
  (`firebase firestore:databases:create "(default)" --location
  southamerica-east1 --delete-protection ENABLED --point-in-time-recovery
  ENABLED`) y programar backups — en staging no se activó a propósito.
- 🙋 Alerta de presupuesto en Google Cloud Billing (ej. 5 EUR: la cuenta factura en euros).
- ⬜ `.env.production` de ambas apps (ya existe el mecanismo —
  `build:staging`/`dev:staging` en `package.json` con Vite `--mode` — falta
  repetirlo con `production` y los datos reales de ese proyecto).
- ⬜ 🙋 Activar Storage (botón "Comenzar") y Authentication (proveedor
  correo/contraseña) desde la consola — ninguno de los dos se activa solo;
  en staging el deploy de Functions/Storage no avisa que falta Auth hasta
  que de verdad se prueba un login.
- ⬜ Crear el primer usuario ROOT con `firebase/functions/scripts/create-root-user.js`
  (ver `docs/manuals/admin-setup.md`, sección 4).
- ⬜ 🙋 Registrar la app Android de producción (`firebase apps:create ANDROID
  "Monagas Operator" --package-name com.monagas.operator --project
  well-testing-prod`), bajar su `google-services.json` a `android/app/` y
  compilar el APK de release con ese archivo — el de staging no sirve (otro
  proyecto de Firebase).
- ✅ No hace falta ninguna VAPID key: el SDK web usa la suya por defecto (ver
  punto 4). Basta con registrar la app web de producción y poner sus datos en
  `apps/web-supervisor/.env.production`.
- ✅ **Runtime de Functions actualizado a Node.js 22** (Node 20 se retira el
  2026-10-30; un despliegue nuevo a producción con Node 20 habría quedado
  fuera de soporte a las pocas semanas). `firebase-functions` 4.9 → 7.4 y
  `firebase-admin` 11 → 14. Dos cambios de ruptura, ya migrados: (1) `firebase-functions`
  7 usa por defecto la API v2, así que los 6 triggers v1 (`onEvalSubmit`,
  `onApprove`, `onReject`, `onLecturaEdit`, `notifyOperator`, `notifyMgr`)
  pasaron primero a `firebase-functions/v1` y luego a 2.ª gen (ver el punto siguiente);
  (2) `firebase-admin` 14 eliminó `admin.firestore()`/`messaging()`/`auth()`
  → imports modulares (`getFirestore`, `getMessaging`, `getAuth`). Se retiró
  `firebase-functions-test` (sin ningún uso). CI y `engines` en Node 22.
  **Verificado:** tests contra emuladores con Node 22 real; despliegue a
  `well-testing-staging` (las 10 funciones "Node.js 22") y **E2E de nube** con logs
  sin errores. *No ejercitado:* `getMessaging().send()` real
  (necesita un token válido; se verá en la prueba con dispositivo, ver sección 4).
  Hallazgos: `firebase-admin` 14 arrastra `jose` 6 (solo ESM) y Jest 29 no lo
  carga — `jest.config.js` lo transpila con ts-jest; en la nube Node 22 lo carga
  nativo (verificado). Con **Node 26 local** el emulador de Functions no ejecuta
  los triggers (usar Node 22; ver `admin-setup.md`).
- ✅ **Los 6 triggers de evaluaciones migrados de 1.ª a 2.ª generación** y ahora
  corren en `southamerica-east1`, la región de la base (antes `us-central1`: salto
  de región en cada evento y aviso de la CLI en cada deploy). Son
  `onDocumentUpdated`/`onDocumentWritten` de `firebase-functions/v2/firestore`
  (evento `event` en vez de `change, context`); no llevan región fija: el CLI
  coloca los triggers v2 de Firestore en la región de la base. Google no permite
  convertir 1.ª → 2.ª gen en el lugar: en staging se **borraron las 6 viejas y se
  crearon las nuevas** (hubo un corte de unos minutos, sin datos reales). **En
  producción no habrá corte** porque se desplegarán ya como 2.ª gen.
  **Verificado:** `tests/triggers.test.ts` (nuevo, 5 pruebas contra el emulador:
  enviar → corregir lectura → rechazar → reenviar → aprobar) — pasa idéntico
  contra el código v1 original y contra el v2, lo que demuestra que la migración
  conserva el comportamiento; suite completa **36/36**; despliegue a staging
  (`functions:list`: las 10 en v2, `nodejs22`, triggers en `southamerica-east1`);
  y **E2E de nube 22/22** (se añadió el rechazo y el reenvío, que no tenían
  ninguna prueba en la nube) con logs sin errores. *Se hallaron de paso:* Jest
  corría las suites en paralelo y `firestore-rules.test.ts` (que limpia Firestore en
  cada prueba) borraba los datos de las otras → fallos intermitentes; ahora
  `maxWorkers: 1`.
- ℹ️ Los 3 callables (`crearPersonal`, `reassignPozo`, `setPersonalActivo`) siguen
  en `us-central1` porque los clientes los llaman con la región por defecto
  (`getFunctions(app)`); moverlos exigiría cambiar ambas apps. Solo afecta a la
  latencia de esas 3 operaciones administrativas, no es un problema de
  corrección.

## 4. App móvil

- ✅ **Push nativo del Operador construido (#47)**, con `@capacitor/push-notifications`
  + FCM. El flujo web anterior (`Notification` + `firebase/messaging` + VAPID)
  no funciona en el WebView de Android y se eliminó. Verificado: 38/38 tests de
  `mobile-operator` (de 12 a 38: 19 del servicio y 9 del hook, sobre permisos, token, listeners y cierre de
  sesión sin señal) y APK que compila con el plugin de Google Services aplicado,
  `POST_NOTIFICATIONS` + `c2dm.RECEIVE` en el manifiesto final y la
  configuración de **staging**; la API de FCM responde en staging.
- ⚠️ **No verificado: la entrega real a un teléfono.** Sin dispositivo, no se
  probó que el diálogo de permiso aparezca, que el token llegue a Firestore ni
  que la notificación se vea. Prueba manual con el APK de staging: iniciar sesión
  como Operador → aceptar el permiso → comprobar `usuarios/{uid}.fcmToken` en
  la consola → cerrar la evaluación y aprobarla como Supervisor → debe llegar
  "Evaluación aprobada" (con la app abierta, cerrada y en segundo plano).
- ⚠️ **Hallazgos corregidos por el camino:** el Operador nunca registraba su
  token (el interruptor de Ajustes arrancaba "encendido" sin haber pedido jamás
  el permiso); `@capacitor/push-notifications` no declara `POST_NOTIFICATIONS`
  (sin él, Android 13+ ni muestra el diálogo — se agregó al manifiesto); el
  canal `evaluaciones` que usa `notifyOperator` no existía en el dispositivo;
  y al cerrar sesión el token quedaba en el usuario anterior (se borra ahora,
  con tope de 3 s para no colgar el cierre sin señal).
- ✅ **Push web del Supervisor construido (#47b)** para SUP_AREA y GERENTE (los
  que recibe `notifyMgr`): botón "Activar avisos" en el Header (el permiso solo
  se pide con un clic), service worker `/firebase-messaging-sw.js`, aviso
  emergente con la pestaña visible, y limpieza del token al cerrar sesión (tope
  de 3 s). **Corrección a lo dicho antes: la VAPID key propia NO es necesaria**
  — `getToken()` sin clave usa `DEFAULT_VAPID_KEY` del SDK (verificado en
  `@firebase/messaging`). El service worker no puede leer `import.meta.env`:
  lo genera un plugin de `vite.config.ts` desde `sw/firebase-messaging-sw.template.js`
  con la configuración del ambiente (dev, build y CI sin `.env` no fallan).
  Verificado: 31 tests nuevos (web-supervisor), build de staging con el worker
  correcto, y en un navegador real contra staging: el worker se instala y
  activa (carga el SDK desde gstatic), el inicio de sesión funciona y el botón
  muestra "Avisos bloqueados" cuando el permiso está denegado.
- ⚠️ **No verificado: la entrega real al navegador.** Este equipo no tiene un
  Chrome conectado y el panel integrado no admite push (permiso denegado), así
  que no se vio el diálogo de permiso, el token real ni la notificación. Prueba
  manual: `pnpm --filter @monagas/web-supervisor dev:staging` (o la web
  desplegada) → entrar como SUP_AREA/GERENTE → "Activar avisos" → Permitir →
  comprobar `usuarios/{uid}.fcmToken` → cerrar una evaluación de su zona como
  Operador → debe llegar "Nueva evaluación pendiente" (pestaña visible, en
  segundo plano y cerrada). Tras "Salir" el campo `fcmToken` debe desaparecer.
- ⚠️ Un token web es por navegador: el campo `usuarios/{uid}.fcmToken` guarda
  uno solo, así que quien use dos navegadores solo recibe en el último activado.
- ⬜ APK firmado de release (keystore propio, guardado fuera del repo).
- ⬜ Prueba en dispositivo real (ver #48 / #50).
- ✅ Dependencias muertas retiradas de `apps/mobile-operator/package.json`
  (cero usos reales, verificado): `expo`, `expo-clipboard`,
  `expo-notifications`, `@expo/metro-runtime`, `@sentry/react-native`,
  `react-native`, `react-native-maps`, `react-native-web`,
  `@testing-library/react-native`, el `main` de Expo y los scripts
  `expo start`. Los plugins de Capacitor (cámara, geolocalización,
  preferencias) se dejan: hoy ningún código los usa, pero añaden permisos al
  APK — quitarlos si no van a usarse antes del release.

## 5. Plan de despliegue y rollback

Orden recomendado, verificando cada paso: reglas de Firestore → índices →
Storage → Functions → apps. Antes de cada paso, `pnpm build` y `pnpm test`
en verde y CI verde en GitHub.

Rollback (no hay nada automatizado; esto es lo que existe):
- **Reglas / Functions:** redesplegar el commit anterior
  (`git checkout <commit> && firebase deploy --only firestore:rules` o
  `--only functions`). Las reglas se pueden volver a una versión previa desde
  la consola (Firestore → Reglas → historial).
- **Datos:** Firestore no se revierte solo. Sin PITR/backups (ver sección 3)
  un borrado o una escritura errónea masiva **no es recuperable**.
- **App móvil:** conservar el APK anterior; no hay canal de distribución
  definido todavía.

## 5b. Ciclo completo — local y staging real (#49)

Con las reglas corregidas del #51b, contra los emuladores reales (Auth +
Firestore + Functions) y las **apps reales en el navegador** (no scripts):

1. Operador inicia sesión → la app crea el ciclo (`evaluaciones` create con
   los 8 campos permitidos) y `assignRole` había asignado sus claims.
2. Registra una lectura desde el formulario real (lectura creada con el ciclo
   `EN_CURSO`; la tabla la lee).
3. Con las 5 lecturas del ciclo (4 sembradas clonando la estructura de la
   primera), el reporte ofrece "Calcular Promedio Final" y "Enviar a
   Supervisor": la evaluación pasa a `PENDIENTE_SUPERVISOR` (netos 557.07 Bls)
   y `onEvalSubmit` sincroniza el pozo y libera el candado.
4. Supervisor de Área inicia sesión: Personal lista a su Operador (regla nueva
   de `/usuarios`), la cola de aprobaciones muestra la evaluación, sus 5
   lecturas se abren, y **Aprobar** deja evaluación y pozo en `OFICIAL`
   (`onApprove`).
5. El historial de "Evaluaciones Oficiales" del pozo la lista y "Exportar
   Excel" lee las lecturas sin error de permisos; consola sin errores de
   permisos en ninguna de las dos apps.

### Staging real (#49)

El mismo recorrido contra `well-testing-staging` con el SDK de cliente real y
las reglas desplegadas (`firebase/functions/scripts/e2e-cloud.cjs`, reutilizable
para el smoke test de producción, #52): **22/22 verificaciones** (20 en el recorrido original
+ rechazo y reenvío, añadidos al migrar los triggers a 2.ª gen).

- Operador abre el ciclo (transacción + candado), registra 3 lecturas, cierra y
  envía; Supervisor ve la cola, abre las lecturas, corrige una, **rechaza** (el
  Operador la reenvía) y aprueba → evaluación y pozo `OFICIAL`; historial lista
  la evaluación.
- **Funciones en la nube**, confirmadas en `functions:log` y por sus efectos:
  `assignRole`, `onEvalSubmit`, `onLecturaEdit` (la corrección +30 recalculó el
  promedio de 579.53 a 589.53), `onApprove`, `notifyMgr` y `notifyOperator`
  (estas dos se omiten limpiamente: los usuarios de prueba no tienen token de
  push). *Nota histórica:* en esta primera corrida los triggers eran de 1.ª gen en
  `us-central1` (salto de región); hoy son de 2.ª gen en `southamerica-east1` (ver
  sección 3) y la prueba se repitió en ese estado.
- **6 intentos prohibidos, todos denegados por las reglas reales:** crear una
  evaluación ya OFICIAL, auto-aprobarse, leer/agregar lecturas de un ciclo
  ajeno, agregar lecturas a un ciclo cerrado, y que un Operador liste a todo el
  personal.
- Sin datos residuales en staging (pozos, evaluaciones, usuarios, Auth: 0).

**Lo que esto NO cubre** (por eso la puerta de salida solo cubre datos y
reglas): no se usaron las pantallas — la prueba usa el SDK directo con tokens
personalizados, no inicia sesión por el formulario (login real con
correo/contraseña y UI contra staging siguen sin probarse), no probó modo
offline ni el APK, ni la exportación a Excel (que se generó contra datos
locales en el recorrido anterior). Una evaluación de ciclo parcial (`Guardar
Snapshot`) guarda `resultados` sin cerrarla (esperado).

**Aprendizajes de la prueba (útiles para #52):**
- Firmar custom tokens exige el rol *Service Account Token Creator* sobre la
  cuenta `firebase-adminsdk-*` (`iam.serviceAccounts.signBlob`); tarda 1–2
  minutos en propagarse.
- **El reloj de este equipo iba ~7 horas adelantado** respecto a Google; con
  eso Google rechaza tokens firmados localmente (`INVALID_CUSTOM_TOKEN`, iat en
  el futuro). Conviene sincronizar la hora de Windows: los tokens normales de
  inicio de sesión los emite Google y no se ven afectados, pero otros procesos
  que firmen o validen con la hora local sí.

## 6. Puertas de salida (todas deben ser ✅)

- [x] Los 5 huecos de reglas corregidos y con tests (#51b)
- [x] `well-testing-staging` completo: Firestore + Storage + Auth + Functions (#45)
- [x] Ciclo completo Operador → Supervisor → OFICIAL en staging real (#49, nivel de datos y reglas; ver 5b)
- [ ] Aceptación con una persona real de campo (#50)
- [ ] PITR + protección contra borrado + alerta de presupuesto en producción
- [ ] Revisión de seguridad por alguien con experiencia dedicada
- [ ] Rollback ensayado al menos una vez en staging
