# Error Tracking con Sentry

**Proyecto:** Monagas  
**Versión:** 3.0  
**Autor:** Player 3 (Fullstack)  
**Fecha:** Mayo 2026

---

## 1. Configuración de Sentry

### 1.1 Mobile (React Native)

```typescript
// apps/mobile-operator/src/services/sentry.ts
import * as Sentry from '@sentry/react-native'

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  tracesSampleRate: 0.1,
  release: 'monagas-mobile@' + process.env.EXPO_PUBLIC_APP_VERSION,
})
```

### 1.2 Web (React)

```typescript
// apps/web-supervisor/src/services/sentry.ts
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  enabled: import.meta.env.PROD,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
```

### 1.3 Cloud Functions (Node.js)

```typescript
// firebase/functions/src/utils/error-handler.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'production',
  tracesSampleRate: 0.1,
})
```

---

## 2. Capture de Errores

### 2.1 Auto Capture con ErrorBoundary

```typescript
// todos los componentes raíz envueltos
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### 2.2 Manual Capture

```typescript
// Capturar exception
Sentry.captureException(error, {
  extra: {
    userId: '123',
    evaluationId: 'eval-456'
  }
})

// Capturar message
Sentry.captureMessage('Evaluación creada', 'info')

// Add breadcrumb
Sentry.addBreadcrumb({
  message: 'Usuario inició sesión',
  level: 'info'
})
```

### 2.3 Set User Context

```typescript
// Después de login
Sentry.setUser({
  id: user.uid,
  data: {
    rol: user.rol
  }
})

// Después de logout
Sentry.setUser(null)
```

---

## 3. Clasificación de Errores

### 3.1 Tipos de Errores

| Tipo | Código | Mensaje Usuario | Retry |
|------|--------|-----------------|-------|
| Network | NetworkError | "No hay conexión" | Sí |
| Auth | AuthError | "Sesión expirada" | No |
| Validation | ValidationError | "Verifica datos" | No |
| Server | ServerError (5xx) | "Intenta más tarde" | 503 |
| Firebase | Firebase errors | Según code | Según |

### 3.2 Error Handler Centralizado

```typescript
import { handleError } from './utils/error-handler'

const result = handleError(error)

console.log(result.type) // 'NETWORK', 'AUTH', 'VALIDATION', etc.
console.log(result.userFriendlyMessage) // Mensaje amigable
console.log(result.shouldRetry) // Si se puede reintentar
```

---

## 4. Performance Monitoring

### 4.1 Transaction Tracing

```typescript
// Inicio de transaction
const transaction = Sentry.startTransaction({
  name: 'create-evaluation',
  op: 'form.submit'
})

try {
  // Lógica
  await createEvaluation(data)
  transaction.setStatus('ok')
} catch (error) {
  transaction.setStatus('error')
  throw error
} finally {
  transaction.finish()
}
```

### 4.2 Span Tracing

```typescript
const transaction = Sentry.startTransaction({ name: 'save-evaluation' })
const span = transaction.startChild({ op: 'firestore.write' })

await firestore.collection('evaluations').add(data)

span.finish()
transaction.finish()
```

---

## 5. Session Replay (Web)

### 5.1 Configuración

```typescript
Sentry.init({
  replaysSessionSampleRate: 0.1, // 10% de sesiones
  replaysOnErrorSampleRate: 1.0, // 100% de errores
})
```

### 5.2 Qué se Captura

- ✅ Clicks y scroll
- ✅ Navegación
- ✅ Console logs
- ✅ Network requests
- ❌ Input values (PII filtrado)

---

## 6. Dashboard de Sentry

### 6.1 Métricas Clave

| Métrica | Objetivo |
|---------|----------|
| Error rate | < 1% |
| Crash-free users | > 99% |
| Average load time | < 2s |
| Transaction p95 | < 500ms |

### 6.2 Alerts Configuradas

| Alerta | Umbral | Accion |
|--------|--------|--------|
| Error rate | > 5% | Notify team Slack |
| Crash-free | < 95% | Page on-call |
| Load time p95 | > 3s | Create ticket |

---

## 7. Privacy y PII

### 7.1 Qué NO Enviar a Sentry

```typescript
beforeSend: (event) => {
  // Remover PII
  event.user = { id: event.user?.id }
  
  // Remover sensitive data de request
  if (event.request?.data) {
    delete event.request.data.password
    delete event.request.data.token
  }
  
  return event
}
```

### 7.2 Data Filtered

- ❌ Email completo
- ❌ Nombres completos
- ❌ Passwords
- ❌ Tokens
- ❌ Precios exactos
- ✅ User ID (anónimo)
- ✅ Rol
- ✅ Language

---

## 8. Troubleshooting

### 8.1 Sentry no captura errores

** Problema:** Errores no aparecen en Sentry

** Solución:**
1. Verificar DSN configurado correctamente
2. Verificar `enabled: true` en production
3. Verificar network requests a Sentry.io
4. Check console para errores de init

### 8.2 Too many errors

** Problema:** Demasiados errors, costs altos

** Solución:**
1. Reducir `tracesSampleRate` a 0.01
2. Reducir `replaysSessionSampleRate` a 0.05
3. Filter errors by level
4. Ignore known errors con `ignoreErrors`

---

**Fin de Error Tracking Docs**
