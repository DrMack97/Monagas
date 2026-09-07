# Error Tracking

**Estado real, verificado leyendo el código.** Este documento reemplaza una
versión anterior ("Error Tracking con Sentry", autoría "Player 3
(Fullstack)") que describía una integración completa de Sentry en las tres
apps (mobile, web, Cloud Functions) — nada de eso existe ni existió nunca en
el código real; ni siquiera la ruta de archivo que citaba
(`apps/mobile-operator/src/services/sentry.ts`) llegó a crearse. Es del
mismo origen que el resto del scaffold ficticio limpiado en este proyecto
(ver checklist Fase 3 y `.security-review.md`).

## Qué existe hoy

- **`ErrorBoundary`** ([apps/web-supervisor/src/components/ErrorBoundary.tsx](../../apps/web-supervisor/src/components/ErrorBoundary.tsx)),
  envuelto alrededor de `<App/>` en `main.tsx`. Si algo revienta al renderizar,
  el usuario ve una pantalla de "Algo salió mal" con botones de
  Reintentar/Recargar, en vez de una pantalla en blanco. El error se manda a
  `console.error` — nada más, no hay ningún servicio externo detrás. Solo
  existe en **web-supervisor**; mobile-operator no tiene un ErrorBoundary
  propio todavía.
- **Mensajes de error amigables caso por caso.** No hay un clasificador
  centralizado de errores (`handleError()`, tipos `NetworkError`/`AuthError`,
  etc. — eso tampoco existe). Cada hook maneja sus propios casos: por
  ejemplo `usePozoInfo.ts` y `useEvaluacionActual.ts` (mobile-operator)
  traducen códigos puntuales de Firebase (`unavailable`,
  `sin-conexion-timeout`) a mensajes en español para el operador — ver
  checklist Fase 3, ítem #35 (modo offline).
- **Logs de Cloud Functions** vía `logger.info`/`logger.warn` de
  `firebase-functions/v2` en las funciones que ya se auditan en este
  proyecto (`setPersonalActivo.ts`, `notifyMgr.ts`, etc.), consultables
  desde la consola de Firebase o `firebase functions:log`. Esto es logging
  operativo, no tracking de errores de cliente.

## Qué NO existe

- Ningún servicio de error tracking de terceros (Sentry ni ningún otro).
- Ninguna captura automática de excepciones fuera de React (ej. promesas
  rechazadas sin `.catch`, errores async fuera de un componente).
- Ninguna alerta automática (Slack, PagerDuty, email) ante una tasa de
  errores alta — no hay ninguna tasa de errores medida, para empezar.
- Ningún session replay ni tracing de performance.
- Ningún filtrado de PII, porque no hay ningún destino externo al que
  filtrarle datos.

## Antes de producción

Decidir si el volumen esperado de uso justifica una herramienta de error
tracking real (Sentry u otra) antes de ir a producción, o si el logging
actual (Cloud Functions + `console.error` del ErrorBoundary) es aceptable
para el lanzamiento inicial y se agrega después con datos reales de uso.
Si se decide que sí, esto es trabajo nuevo — no hay nada parcialmente hecho
que retomar.
