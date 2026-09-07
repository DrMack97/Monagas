# Monitoring y Observability

**Estado real, verificado leyendo el código.** Este documento reemplaza una
versión anterior ("Monitoring y Observability", autoría "Player 3
(Fullstack)") que describía un stack completo (Sentry, alertas por Slack y
PagerDuty, funnels de Analytics, export a BigQuery, dashboards de KPIs) —
nada de eso existe en el código real. Es del mismo origen que el resto del
scaffold ficticio limpiado en este proyecto (ver checklist Fase 3,
[error-tracking.md](error-tracking.md) y `.security-review.md`).

## Qué existe hoy

- **Logs de Cloud Functions.** Las funciones más sensibles registran su
  actividad con `logger.info` de `firebase-functions/v2` — por ejemplo
  `setPersonalActivo.ts` deja constancia de quién desactivó/reactivó a
  quién, `notifyMgr.ts` de a quién se le notificó. Se consultan desde la
  consola de Firebase (pestaña Functions → Logs) o con
  `firebase functions:log --only <nombreFuncion>`. Esto es lo único que
  realmente se puede llamar "observabilidad" en este proyecto hoy.
- **Métricas de negocio en pantalla, calculadas en vivo — no trackeadas.**
  `AnalyticsPage.tsx` y `DashboardPage.tsx` (web-supervisor) muestran KPIs
  reales como producción total fiscalizada (`useAnalyticsData.ts`), pero
  se calculan al vuelo consultando Firestore cada vez que alguien abre la
  pantalla — no hay ningún evento grabado en el momento en que ocurre la
  acción (crear evaluación, aprobar, exportar), y no hay ninguna serie
  histórica más allá de lo que ya vive en `/evaluaciones`.

## Qué NO existe

- **Firebase Analytics no está en uso real.** Existía un hook
  `apps/mobile-operator/src/hooks/useAnalytics.ts` que envolvía
  `logEvent`/`setUserProperties` del SDK de Analytics — nunca se importó
  desde ninguna pantalla (confirmado buscando en todo el repo) y además
  tenía un bug real: declaraba una función local `setUserProperties` con
  el mismo nombre que la función importada del SDK, lo cual pisa el
  import. Era scaffold muerto, se eliminó al sanear este documento
  (checklist Fase 6, ítem #42).
- Ningún dashboard de error rate, crash-free users, ni performance
  (FCP/LCP/FID/CLS) — nada de eso se mide.
- Ninguna alerta automática por ningún canal (Slack, email, PagerDuty).
- Ningún export de logs a BigQuery ni ningún pipeline de analítica.
- Ningún proceso periódico (diario/semanal/mensual) de revisión de logs —
  hoy es 100% manual y bajo demanda.

## Antes de producción

- Decidir si vale la pena instrumentar eventos reales de negocio (ej. con
  Firebase Analytics, ahora que se sabe que el hook anterior estaba muerto
  y con un bug) para tener series históricas de uso real, en vez de solo
  el estado actual de Firestore.
- Definir, aunque sea de forma simple, quién revisa los logs de Cloud
  Functions y con qué frecuencia una vez el sistema esté en producción —
  hoy no hay ningún proceso definido para esto.
