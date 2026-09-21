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

- 🙋 Plan Blaze con cuenta de facturación **abierta** (en staging el deploy de
  Functions falla con *"Billing account … is not open"*).
- 🙋 Elegir región de Firestore y crear la base de datos — es **permanente**.
  Recomendación: `southamerica-east1`, igual que staging.
- ⬜ Al crearla, activar protección contra borrado y recuperación a un punto en
  el tiempo (`firebase firestore:databases:create "(default)" --location
  southamerica-east1 --delete-protection ENABLED --point-in-time-recovery
  ENABLED`) y programar backups.
- 🙋 Alerta de presupuesto en Google Cloud Billing (ej. US$5).
- ⬜ `.env.production` de ambas apps (hoy solo existe `.env` de dev).
- ⬜ Crear el primer usuario ROOT con `firebase/functions/scripts/create-root-user.js`
  (ver `docs/manuals/admin-setup.md`, sección 4).
- ⬜ Storage: ver checklist #45 (bucket sin crear, requiere Blaze).
- ⬜ VAPID key (#47) — solo aplica a notificaciones web; ver punto 4.

## 4. App móvil

- ⚠️ Las notificaciones push web (`firebase/messaging` + VAPID) **no funcionan
  dentro del WebView de Android** que empaqueta Capacitor. Para push nativo
  hace falta `@capacitor/push-notifications` + `google-services.json` correcto.
  Esto cambia el alcance del ítem #47.
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

## 6. Puertas de salida (todas deben ser ✅)

- [x] Los 5 huecos de reglas corregidos y con tests (#51b)
- [ ] `well-testing-staging` completo: Firestore + Storage + Functions (#45)
- [ ] Ciclo completo Operador → Supervisor → exportación en staging (#49)
- [ ] Aceptación con una persona real de campo (#50)
- [ ] PITR + protección contra borrado + alerta de presupuesto en producción
- [ ] Revisión de seguridad por alguien con experiencia dedicada
- [ ] Rollback ensayado al menos una vez en staging
