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
CI en verde en `4ec97f7`. **Verificación completa 2026-11-15 (rama `feat-excel-dos-formatos`, 31 commits sobre `main`, árbol limpio):** tipos sin errores; pruebas núcleo 138, Operador 220, panel 98, reglas de Firestore 51/51 (emulador); compilaciones de producción de Operador y panel OK; panel y reglas desplegados en staging idénticos a la rama (comparado); Operador web y APK 1.0.7 atrasados A PROPÓSITO (estado ANTERIOR a la publicación de la 1.0.8, ver abajo). Pruebas de Functions no re-ejecutadas en esta ronda (código de Functions sin cambios).

**VERSIÓN 1.0.8 PUBLICADA (2026-11-15, por confirmación expresa del dueño). Solo STAGING; producción NO.** (a) **APK 1.0.8 (versionCode 8)**, verificado con `aapt2` (`com.monagas.operator`, 1.0.8/8) y construido con el `google-services` de staging; distribuido por App Distribution a los 2 testers (`delgadoantolinezdavidalejandro@gmail.com`, `willymotorsca@gmail.com`); **Willy debe instalarla él mismo** (APK de prueba: no se actualiza solo; hasta entonces tiene la 1.0.7). (b) **Operador web** desplegado en `willytank-operador-staging.web.app` en el mismo paso; el paquete que sirve (`index-QlJ2xwRP.js`) es IDÉNTICO al que lleva el APK (comparado). (c) Panel y reglas de Firestore ya estaban desplegados (idénticos al código). (d) **Git:** `feat-excel-dos-formatos` (33 commits, contiene todas las ramas de trabajo) se fusionó a `main` con `--no-ff` → `b235ef8`; `main` pushed; **CI en verde** (Test 2m21s, Build 1m33s). Se subieron a GitHub las 42 ramas locales que no estaban (todas ancestras de la fusionada; solo refs, sin código nuevo); NO se tocó `claude/vigilant-swartz-266c64` (ya estaba en remoto y su historia es distinta). Los 7 archivos `Conceptos/` que el dueño borró siguen sin commitear. **No verificado:** instalación y uso del APK en un teléfono, ningún Excel abierto en la app de Excel real, pantallas autenticadas en el web desplegado, datos reales de campo. Siguiente APK = 1.0.9 (versionCode 9), solo con confirmación.

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

**Ronda de ajustes del Informe Técnico Willytank (04/11/2026), 2026-11-08 — rama `feat-ajustes-informe-tecnico` (mergeada a `main` en la 1.0.8, 2026-11-15). DESPLEGADA SOLO EN STAGING el 2026-11-08: reglas, panel, Operador web y APK 1.0.5 (versionCode 5) distribuido a los 2 testers. En producción NO.** Puntos hechos (con pruebas): **(1)** hora entera más cercana (min 00–29 → esa hora, 30–59 → la siguiente; `redondearAHoraEntera`,
el timestamp real no se toca) y fecha una sola vez por día en la tabla y el Excel; **(2)** columna Netos y **(3)** P. Casing solo en la Faja
(`capacidadesZona(zona)`: MONAGAS oculta, FAJA conserva; zona desconocida = MONAGAS; se oculta, no se borra código; `pCsg` no se guarda en
Monagas); **(4)** las alertas (`lectura.alertas`) siguen en la pantalla del Operador y en la cola de aprobación del panel, pero ya NO salen en
ningún Excel ni en el texto de WhatsApp; **(5) Qg** reescrito: `calcAGA3` devuelve **MMSCFD por día** (antes Mscf/hora con la etiqueta
MPCGD, 24× menor), con Cd Reader-Harris/Gallagher (tomas en brida, iterado con Re), Y (ISO 5167, κ=1.3), Z Hall-Yarborough (pseudocríticas
de Standing, sin corrección CO₂/H₂S/N₂), viscosidad Lee, y **presión estática psig + 14.73 → absoluta, toma aguas arriba**; sin recorte de β a
0.75. Validación: hoja Halliburton **−0.43 %** (objetivo ±0.5 %), ejemplo del informe (9.80 MMSCFD, β=0.849 fuera de rango ISO) **−1.65 %**
(solo indicativo; no se sabe con qué herramienta lo calcularon). Si la toma fuese aguas abajo los resultados suben ~0.4–0.8 % (decisión
abierta, ver abajo). La lectura guarda además `Fpv, Y, Cd, Z`. **Las lecturas viejas de staging (Mscf/h, otra fórmula) no son comparables
con las nuevas; producción aún no tiene datos reales.** **Placa (`diamOrif`) y Meter Run (`meterRun`) por pozo:** se piden en `NewWellPage`,
los edita SUP_CAMPO/SUP_AREA/GERENTE en `WellDetailPage` (0 = sin configurar), el Operador los ve de solo lectura y **si faltan NO se calcula
Qg** (antes se usaba 2"/4" en silencio) → **los pozos de staging ya existentes no darán Qg hasta que se les cargue Placa y Meter Run.**
**Cambio de permisos:** `firestore.rules` añade `diamOrif` y `meterRun` al `hasOnly` de SUP_CAMPO (reglas 36/36 en el emulador; desplegadas en staging).
**(7) Reporte estándar de WhatsApp:** `construirReporteEstandar` (núcleo) es la única fuente del texto de WhatsApp y de la hoja Resumen de los
dos Excel; reproduce línea a línea el ejemplo del informe (prueba de oro). Campos nuevos en `IReporteOperativo`: `supervisorPDVSANocturno`
(`supervisorPDVSA` = diurno), `fechaCulminacion` (vacío = "En progreso"), `asunto`, `plan`, `viajesVacuum24h[]` (fecha/hora, chófer, volumen,
destino; "Total trasegado 24 h" se suma). Derivados: existencia por tanque = medida final × kk; Total Despachado General = Total Trasegado
Acumulado + Existencia (así cuadra el ejemplo: 2,542.92 + 117 = 2,659.92 — **inferido de la aritmética del ejemplo, confirmar con PDVSA**);
el Qg del reporte es el de la ÚLTIMA lectura. Se quitaron del formulario H2S y "Nota" (el estándar no los lleva; los tipos siguen).
**(6) Excel igual a la planilla física: PENDIENTE a propósito** (el usuario lo dejó para cuando haya mejor imagen y los cálculos que
faltan). Lo leído de la foto del anexo (512×384 px, `Informe Técnico…pdf` pág. 3), en orden: HORA, P.CAB, [3ª col. sin leer — vacía en la
foto, probablemente Casing], RED, P.ESTÁTICA, T.GAS, P.DIF, ORIF, Q.GAS(MMSCFD), por tanque MEDIDA y VOLUMEN, BPH, BPD, TOTAL DESPLAZADO,
EXIST. NETA, TRASEGABLE, VIAJES VACUUM, TOTAL TRASEGADO, BSW %, [última col. sin leer, BBL]; las horas de la planilla ya vienen redondeadas.
Hoy no se capturan por hora: total desplazado, trasegable, viajes y total trasegado. Las hojas "Lecturas" siguen con el formato anterior
(sin alertas/Casing/Netos en Monagas). Tests: núcleo 64, Operador 68, panel 65. Una prueba con 20 000 entradas aleatorias halló y corrigió un fallo: con gas pesado/frío/casi crítico la Z de Hall-Yarborough tomaba la raíz líquida (ahora toma la primera raíz). Con un diferencial > 40 % de la presión absoluta (p. ej. 250 inH₂O a 5 psig) el Qg deja de ser monótono: es fuera de la validez de la norma y no se avisa en pantalla.
**CORRECCIÓN 1.0.6 (2026-11-08, APK versionCode 6 en staging): el botón Excel no hacía nada dentro del APK.** Causa (probable; no se pudo reproducir en
un teléfono, no hay emulador ni dispositivo en el equipo): `XLSX.writeFile` "descarga" con un enlace temporal `download`, y el WebView de Capacitor NO tiene
`DownloadListener` (verificado: ningún código del proyecto ni de `@capacitor/android` lo define), así que en el APK el clic no hace nada y sin error. El código de
datos sí funciona (probado con la librería real y el flujo completo de la pantalla). Arreglo: `src/utils/guardarArchivo.ts` — en nativo escribe el .xlsx en caché
(`@capacitor/filesystem`) y abre el menú de compartir (`@capacitor/share`, FileProvider ya configurado); en navegador mantiene la descarga. Un fallo ahora se muestra
("No se pudo exportar el Excel"). También: el reporte estándar tolera un pozo sin `tanques` (antes lanzaba excepción). Contra recaída: pruebas de la ruta nativa y web, del
error visible, y una **guardia que falla si cualquier archivo de la app llama `XLSX.writeFile` fuera de `guardarArchivo.ts`**. El panel web (navegador) no cambia.
**NO verificado:** el menú de compartir en un teléfono real (hay que probar: Reporte → Calcular → Excel → elegir Drive/WhatsApp/Archivos y abrir el .xlsx).
**CORRECCIÓN 1.0.7 (2026-11-08, APK versionCode 7 en staging): calculadora del tanque 2 "no funcionaba".** Diagnóstico con datos reales de staging
(pozo SBC-61L, lecturas 1–14): el tanque 2 calculó bien 13 lecturas (nivel 1"→14"); en la 14 el nivel cayó a 1" (tanque vaciado por vacuum) y `calcTanque`
cortaba el cambio de nivel a 0 → BPD 0.00 sin explicación y esa lectura (guardada con bpd 0) entra al promedio como producción cero. El tanque 1 "funcionaba" porque
su medida inicial es 0 y nunca baja. **No era un fallo de la calculadora sino un caso no modelado.** Decisión del dueño: campo opcional **Trasegado (Bls)** por tanque;
producción del intervalo = (mf − mi) × kk + trasegado (sin recortar el cambio de nivel; sin trasegado todo calcula igual que antes, los tests de oro no cambian).
`ILecturaTanque.trasegado?` se guarda solo si > 0; la pantalla avisa cuando la medida baja sin trasegado. **La lectura 14 de SBC-61L en staging sigue con BPD 0** (dato de
prueba; no se tocó). **Id de tanque duplicado (hallazgo, ARREGLADO; el panel con el arreglo ya está desplegado en staging):** `NewWellPage` numeraba el tanque nuevo como "cantidad + 1"; quitar uno del medio y agregar otro dejaba dos con el mismo id y compartían medidas en Registro. Ahora toma el primer número libre (`siguienteTankDraft`). Revisados staging (2 pozos) y producción (0): ningún pozo existente tiene ids repetidos. **NO verificado:** en un teléfono real.
**CACHÉ DEL HOSTING (2026-11-08):** Firebase Hosting servía `index.html` con `Cache-Control: max-age=3600`: tras cada despliegue el navegador podía seguir usando la versión anterior hasta 1 h (se veían pantallas ya corregidas, p. ej. "En Curso" sin color en Analytics → Actividad Reciente, aunque el despliegue estaba bien). Ahora `apps/web-supervisor/firebase.json` y `apps/mobile-operator/firebase.staging.json` ponen `no-cache` a todo (`**`, incluye rutas internas) y `public, max-age=31536000, immutable` a `/assets/**` (archivos con huella); verificado con curl en staging; prueba `src/__tests__/hosting-cache.test.ts` en cada app. El panel de producción usa el mismo `firebase.json`; **el Operador web de producción aún no tiene su propio archivo de hosting: al crearlo copiar estas cabeceras.** Una pestaña que ya cargó el `index.html` viejo necesita un Ctrl+F5 una vez.
**CORRECCIÓN EN APROBACIONES (2026-11-08):** al corregir una lectura en la cola de aprobaciones del panel, `ApprovalQueuePage` guardaba `operativos: { pCab, pSep }`, que REEMPLAZA el mapa completo y borraba `reductorPulgadas` y `pCsg` de esa lectura. Ahora escribe `'operativos.pCab'` y `'operativos.pSep'` (rutas anidadas); las reglas lo aceptan (el campo afectado de primer nivel sigue siendo `operativos`). Pruebas: la de pantalla emula la semántica de `updateDoc` y comprueba el documento resultante; 3 pruebas nuevas de reglas (39/39 en el emulador). **RESUELTO después (2026-11-08, rama `fix-aprobaciones-promedios-y-tabla`, reglas + panel desplegados en staging):** (a) al corregir una lectura el panel recalcula los promedios de la evaluación (`calcularPromedioEvaluacion`: Bpd, Netos, Qg, AyS, proyección 24 h) y los escribe JUNTO con la lectura en un `writeBatch` (atómico), con `resultados.recalculadoEn` y `resultados.recalculadoPor` (uid); la tarjeta avisa "Promedios recalculados…". **Cambio de permisos:** nueva función `canCorregirResultados` en `firestore.rules`: SUP_AREA/GERENTE de la zona pueden actualizar SOLO `resultados` y dentro de él solo `bpdPromedio, netosPromedio, qgPromedio, aysBls, proyeccion24H, recalculadoEn, recalculadoPor`, solo mientras la evaluación está PENDIENTE_SUPERVISOR y con `recalculadoPor == su uid`; aprobar/rechazar siguen limitados a estado + aprobaciones (reglas 48/48 en el emulador). Riesgo aceptado: el supervisor ya podía alterar cada lectura, ahora también el promedio (queda su uid). Si no hay `resultados` (evaluación no cerrada por el Operador) solo se guarda la lectura. (b) La tabla de lecturas del supervisor usa la hora entera más cercana, fecha una vez por día y oculta Netos en zona MONAGAS (la tarjeta conserva el promedio de Netos y el formulario de corrección el campo Netos). Pruebas panel: 95. Las lecturas de staging ya corregidas antes de este arreglo pueden haber perdido su Reductor/Casing.
**Decisiones abiertas del usuario:** (a) toma de presión estática aguas arriba (supuesto) o abajo; (b) confirmar fórmula de "Total Despachado
General"; (c) la planilla (6). Jest de ambas apps ahora resuelve los imports `.js` del núcleo (`moduleNameMapper`), ya no hace falta mockearlo.
**NO verificado:** nada de esto en un teléfono (APK 1.0.5 subido y verificado con aapt2: paquete, versión, proyecto staging; sin instalar), ni con sesión real, ni desplegado; el Qg no se comparó con una medición real de campo
(solo con la hoja Halliburton y el ejemplo del informe).

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
00. **Ronda de ajustes del Informe Técnico:** ya en staging (APK 1.0.5). Falta: **cargar Placa y Meter Run en el pozo de prueba** (panel → detalle del pozo; sin ellos el Operador no ve Qg), que los testers prueben (YA mergeada a `main` y publicada en la 1.0.8, 2026-11-15; lo que falta es la prueba en teléfono y en campo, y cargar el desplazado inicial por pozo, p. ej. 2542.92 en SBC-61L, desde el panel); luego producción (reglas + panel + APK con google-services de prod, y el archivo de hosting de producción del Operador con las mismas cabeceras de caché `no-cache` / `immutable` en `/assets/**`, que aún no existe).
   Pendiente: punto (6) la planilla, cuando haya mejor imagen.
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
- **APK: SOLO CON CONFIRMACIÓN EXPLÍCITA DEL DUEÑO (regla del 2026-11-15).** No subir `versionCode`, no compilar ni distribuir un APK hasta que lo confirme, aunque un arreglo de la app del Operador lo "pida"; una confirmación vale para UNA versión. Entre tanto se commitea y se despliega solo la web de staging (Operador web y panel) y se acumula la lista de cambios pendientes de APK. **ACTUALIZADO 2026-11-15: SALIÓ LA 1.0.8 (ver sección 2) y todo lo que esta viñeta llama "pendiente" ya está incluido en ella; web y APK están a la par.** Estado previo: el último APK era el 1.0.7 (versionCode 7, 2026-11-08); la web de staging llevaba cambios del Operador que el APK NO tiene: pantallas a ancho completo, botón "← Volver" en Reporte, textos sin "(PDVSA)"/"(Forzado)", "Guardar avance" en vez de "Guardar Snapshot", logo en el encabezado del Dashboard y "Preliminar" en el Excel (verificado comparando el paquete web que lleva el APK con el desplegado; lo desplegado coincide con el código de la rama). La siguiente versión será la 1.0.9 (versionCode 9), cuando el dueño lo diga. **Regla ampliada (2026-11-15): el Operador web y el APK salen SIEMPRE JUNTOS** (sin desfase entre plataformas): un cambio del Operador no se despliega suelto a la web; se acumula y sale con el APK cuando el dueño confirma, y después se verifica que el paquete web del APK sea idéntico al desplegado. El panel de supervisión sí puede desplegarse solo. **Incluido en la 1.0.8 (antes pendiente):** los de arriba más las dos ventanas "Total trasegado" y "Número de viajes" en Registro (corrección del cliente, 2026-11-15; rama `feat-ventanas-trasegado-viajes`; valores automáticos de `tanques[].trasegado` de las lecturas del ciclo — total = suma de Bls, viajes = veces que se registró un trasegado — más lo "por guardar" que se está escribiendo; `packages/core/src/utils/trasegado.ts`). Antes de este cambio ni el Operador web, ni el APK 1.0.7, ni el panel tenían esas ventanas. **También incluido en la 1.0.8 (rama `feat-alertas-balance-masas`, 2026-11-15): alerta de balance de masas** (Desplazamiento − Trasegado − Existente = 0, por tanque; no bloqueante; amarilla = desviación menor (> 0.5 Bls y ≤ 1 pulgada del tanque o salto de producción ≥ 5× la mediana anterior), roja = discrepancia crítica (> 1 pulgada) o dato imposible). Motor en `packages/core/src/utils/balanceMasas.ts`; resalta Medida Final/Trasegado en Registro y Existencia/Total Trasegado Acumulado en Reporte; al guardar con alerta queda como constancia en `lectura.alertas` (interna, no sale en exportables). Explicación para el cliente: `docs/manuals/alerta-balance-masas.md`. Umbrales ajustables en una sola constante. NO verificado en teléfono. **También incluido en la 1.0.8: PREFILL (rama `feat-prefill-registro`, pedido del cliente 2026-11-15, una ventana a la vez).** Tabla del cliente: AGA-3 y Presiones Operativas conservan la data de la carga anterior; Tanques sin cambio (ya toma la medida anterior); Supervisores del reporte se autocompletan; Datos del testing (fecha inicio/culminación, estatus, asunto, plan, API) precargados; Existencia = último valor y se refleja en Trasegable; Total trasegado acumulado y Total de viajes precargados o calculados. **Hecho: (1) AGA-3** — Pf, hw, T y GE toman la última carga (última lectura con gas del ciclo; en la 1.ª lectura de un ciclo nuevo, la del ciclo anterior vía `useLecturaPrevia`, consulta de mejor esfuerzo sin permisos nuevos); editables, marcados `data-prefill` y con aviso "Valores de la carga anterior; edítalos si cambiaron"; sin carga anterior quedan los valores por defecto (0, 0, 80, 0.6 — OJO: 80 °F y 0.6 se guardan en silencio si nadie los toca). **(2) Presiones Operativas — hecho:** P. Cabezal y P. Separador (y P. Casing solo en zonas que lo usan, Faja) toman la última carga con la misma regla (editado > carga anterior > 0), `data-prefill`, aviso; el Reductor sigue siendo el del pozo (solo lectura). **(3) Supervisores — hecho:** PDVSA diurno/nocturno y Well Testing diurno/nocturno se autocompletan desde el reporte anterior (`useReporteAnterior`: lee las evaluaciones del pozo y fusiona `reporteOperativo` CAMPO POR CAMPO — primero el ciclo actual, luego los anteriores del más reciente al más viejo; mejor esfuerzo, sin permisos nuevos; reutilizable para las ventanas 4–6); editables, `data-prefill`, aviso; si el operador borra un nombre no se vuelve a rellenar; los nombres prefillados entran al texto de WhatsApp y al reporte guardado aunque la sección esté plegada. OJO: el nombre solo queda para los reportes siguientes cuando se GUARDA el avance o se ENVÍA a supervisión (compartir por WhatsApp o Excel no guarda). **(4) Datos del testing — hecho:** fecha de inicio (`fechaAlineacion`), fecha de culminación, estatus actual, asunto, plan y API se precargan desde el reporte anterior (mismo `useReporteAnterior`, campo por campo; las fechas llegan como Timestamp y se convierten al campo datetime-local en hora local con `utils/fechaInput.ts`; API desde `tipoFluido.api`); editables, `data-prefill`, aviso; si el operador borra un campo no se vuelve a rellenar. **Decisión a vigilar:** la fecha de culminación se precarga como pide la tabla del cliente, así que si el reporte anterior ya la traía el siguiente dirá culminado en vez de "En progreso" hasta que el operador la borre. **(5) Existencia y Trasegable — hecho:** la Existencia carga la medición de los tanques de la ÚLTIMA lectura (`existenciaMedida` en el núcleo: Σ medida final × factor; si a algún tanque le falta la medida no se precarga un total parcial) y Trasegable repite ese valor como previsión de fluidos incarreables y lo acompaña mientras el operador no lo edite; ambos editables, `data-prefill`, aviso; la alerta de balance (existencia digitada vs medida) sigue funcionando. **Cambio de datos:** `IReporteOperativo.resumenTanques` ahora tiene los tres campos OPCIONALES y solo se guarda lo que hay (antes, rellenando uno, los otros dos se guardaban como 0 y el reporte mostraba un 0 inventado; ahora sale "—"). **(6) Acumulados — hecho (cierra los 6 puntos del cliente):** Total Trasegado Acumulado y Total Viajes Vacuum Acumulados se CALCULAN = acumulado antes de este ciclo + lo trasegado en este ciclo (`resumenTrasegado(lecturas)`: Bls y número de registros de trasegado). Base, en orden: `reporteOperativo.acumuladosBase` que este ciclo ya guardó, o el acumulado con que cerró el ciclo anterior (`useReporteAnterior` ahora devuelve `anterior`, `actual` y `previo`, con fusión también subcampo a subcampo en `resumenTanques`/`tipoFluido`; las fechas/Timestamp se toman atómicas). Sin base (primer reporte del pozo) NO se inventa: el operador digita el acumulado una vez y desde entonces se calcula solo. Al guardar se escribe `acumuladosBase` (acumulado − lo del ciclo) para no contar dos veces lo del ciclo al reabrir. Editables, `data-prefill`, aviso. Definición de "viaje" = cada vez que se registró un trasegado (un camión extra en el mismo intervalo y tanque no se cuenta aparte). **Resumen del prefill:** el nombre/dato solo queda para el siguiente reporte al GUARDAR el avance o ENVIAR a supervisión. Incluido en la 1.0.8 junto con lo anterior; NO verificado en teléfono ni con datos reales de campo. **TAMBIÉN INCLUIDO EN LA 1.0.8 (rama `feat-excel-dos-formatos`, pedido del cliente 2026-11-15): EXCEL EN DOS FORMATOS INDEPENDIENTES.** (1) *Data Histórica del Equipo* y (2) *Datos de Evaluación Diaria*, cada uno su archivo (`Data_Historica_Equipo_<pozo>_<fecha>.xlsx` / `Evaluacion_Diaria_<pozo>_<fecha>.xlsx`). Estructura en el núcleo (`packages/core/src/utils/exportesExcel.ts`, puro y probado); entrega con `entregarLibroExcel` (descarga en navegador, menú de compartir en APK). Desplazado = Σ por tanque de bph×th guardado por lectura. Diario: arranca en 0 en la primera lectura y es exclusivo de la prueba (no suma el desplazado inicial). Histórico: `desplazadoInicial` del pozo + producción de TODAS las evaluaciones desde `desplazadoInicialDesde` ("a partir de ahora": lo anterior a esa fecha ya está en la base; no se cuenta dos veces); hojas "Data histórica" y "Resumen por evaluación". **Pozo:** nuevos campos `desplazadoInicial` (Bls) y `desplazadoInicialDesde` (se fija sola, a hoy, al cambiar el valor); los carga el Supervisor en Nuevo Pozo / detalle del pozo (panel); `firestore.rules` los añade al `hasOnly` de SUP_CAMPO (reglas 51/51). La pantalla Reporte del Operador reemplaza el botón "Excel" por dos botones. El Excel del panel (informe oficial) NO se tocó. **Limitación:** el total trasegado y los viajes del histórico cuentan solo lo registrado por la app (no hay "trasegado inicial"), así que desplazado − trasegado − existencia del histórico no cuadra a cero si hay desplazado inicial. NO verificado en teléfono.
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
La ronda de ajustes del Informe Técnico completa (Qg, hora entera, Netos/Casing por zona, reporte estándar, Placa/Meter Run) en pantalla real y contra una medición real · 
El Reductor (pulg) de la 1.0.4 en pantalla real (Operador, SUP_CAMPO editando) · Cualquier llamada real a `crearPersonal` / `reassignPozo` / `setPersonalActivo` desde el navegador (en staging el permiso se restauró el 2026-11-02, ver sección 2; en
producción están públicas; ninguna se ha llamado con sesión real) · Entrega real de notificaciones push (APK y navegador) · el enlace "Acceso al Panel de Supervisión" abierto dentro del APK en un
teléfono · la barra móvil del panel con sesión real · inicio de sesión en producción con una cuenta real · subida real de un
archivo a Storage y CORS · restauración desde PITR/backup · `getMessaging().send()` real · captura visual del login del panel.
