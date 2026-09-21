# Checklist de "go live" (Fase 6, ítem #51)

Estado al escribirse: **el proyecto NO está listo para producción.** Este
documento separa lo que ya se verificó de lo que está pendiente, con
evidencia — no es una auditoría de seguridad profesional (ver
`.security-review.md`, que sigue recomendando una revisión externa).

Leyenda: ✅ verificado · ⚠️ hallazgo real sin corregir · ⬜ pendiente · 🙋 solo lo puede hacer el dueño del proyecto

## 1. Revisión final de `firestore.rules` — hallazgos reales

Revisadas línea por línea. Las reglas de aprobación, zona y edición de pozos
están bien acotadas y probadas contra el emulador (ver checklist Fases 2–5),
pero esta revisión encontró **cuatro huecos** que ninguna fase anterior cubrió:

- ⚠️ **Un Operador puede fabricar una evaluación "OFICIAL".**
  `/evaluaciones` → `allow create` solo exige `isOperador()` y estar asignado
  al pozo; **no restringe ningún campo**. El cliente (`useEvaluacionActual.ts`)
  escribe `estado`, `zona` y demás, pero nada impide que un cliente modificado
  cree una evaluación con `estado: 'OFICIAL'`, `resultados` inventados o una
  `zona` ajena. Corrección propuesta: exigir en la regla
  `request.resource.data.estado == 'EN_CURSO'`,
  `operadorId == request.auth.uid` y que `zona` coincida con la del pozo
  (`get()` al pozo), más `keys().hasOnly([...])`.
- ⚠️ **Lecturas de cualquier zona legibles por cualquier usuario autenticado.**
  `/evaluaciones/{id}/lecturas` → `allow read: if request.auth != null`. Es el
  mismo tipo de hueco que se cerró en `storage.rules` (#41b): alguien con
  sesión (incluso un Operador de otro pozo) que conozca un `evalId` puede leer
  las mediciones. Corrección: `get()` a la evaluación padre y aplicar el mismo
  predicado que su regla de lectura.
- ⚠️ **Un Operador puede agregar lecturas a una evaluación ya cerrada.**
  `lecturas` → `allow create` verifica `operadorId` pero **no `estado ==
  'EN_CURSO'`**. Tras cerrar/aprobar un ciclo se podrían añadir lecturas, y
  `onLecturaEdit` solo recalcula en *update*, no en *create*.
- ⚠️ **`/usuarios` legible por cualquier usuario autenticado, incluido
  `fcmToken`.** Cualquier Operador puede listar a todo el personal (nombre,
  rol, zona, pozo) y los tokens de push de todos. Corrección: lectura propia +
  SUP_AREA de su zona + GERENTE/ROOT, y mover `fcmToken` a un documento
  privado.
- ⬜ **Las reglas no tienen tests automatizados.** Toda la verificación fue
  con scripts ad hoc contra el emulador. Antes de tocar las reglas (por los
  cuatro puntos de arriba) conviene agregar `@firebase/rules-unit-testing`
  para no reabrir huecos ya cerrados.

Sugerencia: convertir estos cuatro puntos en **un ítem nuevo (#51b)** —
corrección + tests — antes de cualquier deploy a producción.

## 2. Repositorio público

- ⚠️ `apps/mobile-operator/google-services.json` está **commiteado en un repo
  público** y pertenece al proyecto `well-testing-prod` (con `package_name`
  `Willy.Tank`, que además no coincide con el `appId`
  `com.monagas.operator` de Capacitor). Las claves de cliente de Firebase no
  son secretas, pero sin App Check cualquiera puede usarlas contra el
  proyecto. Decidir: sacarlo del repo (`.gitignore`), regenerarlo con el
  package correcto, y considerar App Check.
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
- ⬜ Dependencias de Expo (`expo`, `expo-notifications`, `expo-clipboard`,
  `@expo/metro-runtime`) y scripts `expo start` en
  `apps/mobile-operator/package.json`: sin ningún uso en el código — retirar.

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

- [ ] Los 4 huecos de reglas corregidos y con tests (#51b)
- [ ] `well-testing-staging` completo: Firestore + Storage + Functions (#45)
- [ ] Ciclo completo Operador → Supervisor → exportación en staging (#49)
- [ ] Aceptación con una persona real de campo (#50)
- [ ] PITR + protección contra borrado + alerta de presupuesto en producción
- [ ] Revisión de seguridad por alguien con experiencia dedicada
- [ ] Rollback ensayado al menos una vez en staging
