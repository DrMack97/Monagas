// TODO: Configuración Sentry para mobile - Player 3 (Fullstack)
// Paso 1: Importar @sentry/react-native
// Paso 2: Configurar Sentry con DSN
// Paso 3: Set user context cuando login
// Paso 4: Capture exceptions自动
// Prompt de implementación rápida:
// "Configurar Sentry con init, setUser, captureException"
// Entregable:
// - Sentry.init con DSN
// - setUser en login
// - captureException en errores
import * as Sentry from '@sentry/react-native'

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: process.env.NODE_ENV === 'production',
    
    // Sample rate para traces
    tracesSampleRate: 0.1, // 10% sampling en production

    // Release name
    release: 'monagas-mobile@' + process.env.EXPO_PUBLIC_APP_VERSION,

    // Environment
    environment: process.env.EXPO_PUBLIC_NODE_ENV || 'development',

    // Filter敏感的 data
    beforeSend: (event) => {
      // Remover PII antes enviar a Sentry
      event.user = {
        id: event.user?.id,
        // No enviar email, nombre
      }
      return event
    },

    // Integrations
    integrations: [
      new Sentry.ReactNativeTracing({
        routingInstrumentation: Sentry.reactNavigationInstrumentation,
      }),
    ],
  })

  console.log('Sentry initialized')
}

// Set user context
export function setSentryUser(user: { uid: string; rol: string }) {
  Sentry.setUser({
    id: user.uid,
    data: {
      rol: user.rol
    }
  })
}

// Clear user context
export function clearSentryUser() {
  Sentry.setUser(null)
}

// Capture exception
export function captureException(error: Error, context?: any) {
  Sentry.captureException(error, {
    extra: context
  })
}

// Capture message
export function captureMessage(message: string, level?: Sentry.SeverityLevel) {
  Sentry.captureMessage(message, level)
}

// Add breadcrumb
export function addBreadcrumb(breadcrumb: Sentry.Breadcrumb) {
  Sentry.addBreadcrumb(breadcrumb)
}

// Start transaction (performance tracing)
export function startTransaction(name: string, op: string = 'task') {
  return Sentry.startTransaction({ name, op })
}
