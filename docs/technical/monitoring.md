# Monitoring y Observability

**Proyecto:** Monagas  
**Versión:** 3.0  
**Autor:** Player 3 (Fullstack)

---

## 1. Stack de Monitoring

| Herramienta | Propósito |
|-------------|-----------|
| **Sentry** | Error tracking, performance |
| **Firebase Analytics** | Event tracking, user behavior |
| **Cloud Functions Logs** | Server logs, debugging |
| **Custom Metrics** | Business KPIs |

---

## 2. Error Tracking (Sentry)

### 2.1 Métricas

- **Error Rate:** % de sesiones con errores
- **Crash-Free Users:** % usuarios sin crashes
- **Affected Users:** Usuarios afectados por error
- **Occurrences:** Número de veces que ocurrió

### 2.2 Alertas

```yaml
# .sentry/alerts.yml
alerts:
  - name: High Error Rate
    condition: error_rate > 5%
    action: notify-slack '#monagas-alerts'
    
  - name: Crash-Free Below 95%
    condition: crash_free < 95%
    action: page-oncall
```

---

## 3. Performance Monitoring

### 3.1 Client-Side Metrics

| Métrica | Medición | Objetivo |
|---------|----------|----------|
| FCP | Time to first paint | < 1.5s |
| LCP | Largest contentful paint | < 2.5s |
| FID | First input delay | < 100ms |
|CLS| Cumulative layout shift | < 0.1 |

### 3.2 Server-Side Metrics

| Métrica | Medición | Objetivo |
|---------|----------|----------|
| Function duration | Cloud Functions logs | < 1s |
| Cold start | First invocation | < 500ms |
| Error rate | 5xx errors | < 1% |

---

## 4. Business Metrics (Analytics)

### 4.1 Eventos Trackeados

| Evento | Trigger | Props |
|--------|---------|-------|
| `login` | Usuario inicia sesión | method, rol |
| `create_evaluation` | Evaluación guardada | pozoId, netos, tanquesCount |
| `approval` | Supervisor aprueba/rechaza | evaluationId, approved, timeToApprove |
| `export` | Export PDF/Excel | format, count |
| `offline_sync` | Sync offline | operationsCount |

### 4.2 Funnels

** Evaluación Funnel:**
1. Abrir registro (100%)
2. Ingresar lecturas (95%)
3. Agregar tanques (90%)
4. Cerrar evaluación (85%)
5. Aprobado (80%)

---

## 5. Logging (Cloud Functions)

### 5.1 Niveles de Log

```typescript
import { functions } from 'firebase-functions'

functions.logger.info('Mensaje info', { metadata })
functions.logger.warn('Warning message', { metadata })
functions.logger.error('Error message', { error })
functions.logger.debug('Debug message', { metadata })
```

### 5.2 Structured Logging

```typescript
functions.logger.info('Evaluation created', {
  evaluationId: 'eval-123',
  pozoId: 'MFB-950',
  operadorId: 'user-456',
  netos: 1234
})
```

### 5.3 Query Logs

```bash
# Ver logs últimos 10 min
firebase functions:log --severity INFO

# Filter por función
firebase functions:log --function onApprove

# Export to BigQuery
firebase logging export create --bucket=logs-bucket
```

---

## 6. Custom Dashboards

### 6.1 KPIs en Dashboard

```typescript
const kpis = {
  totalEvaluaciones: 1234,
  aprobacionesHoy: 45,
  tiempoPromedioAprobacion: 2.5, // horas
  errorRate: 0.8, // %
  crashFree: 99.5 // %
}
```

### 6.2 Gráficos

- **Evaluaciones por día:** Line chart
- **Aprobaciones por supervisor:** Bar chart
- **Error rate por hora:** Area chart
- **Top errores:** Table

---

## 7. Alerting

### 7.1 Canales

| Canal | Uso |
|-------|-----|
| **Slack** | Alerts normales (#monagas-alerts) |
| **Email** | Alerts importantes |
| **PagerDuty** | Page on-call (críticos) |

### 7.2 Escalamiento

| Nivel | Umbral | Canal | Tiempo Respuesta |
|-------|--------|-------|------------------|
| Info | Error rate 1-3% | Slack | 24h |
| Warning | Error rate 3-5% | Slack + Email | 4h |
| Critical | Error rate > 5% | PagerDuty | 15min |

---

## 8. Review de Logs

### 8.1 Daily

- Revisar errores nuevos
- Check error rate
- Verificar alertas

### 8.2 Weekly

- Top 10 errores
- Trends de error rate
- Performance bottlenecks

### 8.3 Monthly

- Crash-free rate
- User-affected errors
- Capacity planning

---

**Fin de Monitoring Docs**
