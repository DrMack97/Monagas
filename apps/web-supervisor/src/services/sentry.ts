// TODO: Configuración Sentry para web - Player 3 (Fullstack)
// Paso 1: Importar @sentry/react
// Paso 2: Configurar Sentry con DSN
// Paso 3: Performance monitoring
// Prompt de implementación rápida:
// "Configurar Sentry web con ReactRouter, performance"
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('SENTRY_DSN not configured')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: import.meta.env.PROD,
    
    // Performance monitoring
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV5Instrumentation(
          // router instance
        ),
      }),
      new Sentry.Replay(),
    ],

    // Traces sample rate
    tracesSampleRate: 0.1,

    // Session replay sample rate
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Release
    release: import.meta.env.VITE_APP_VERSION,

    // Environment
    environment: import.meta.env.VITE_NODE_ENV || 'development',

    // Filter敏感 data
    beforeSend: (event) => {
      if (event.user) {
        event.user = { id: event.user.id }
      }
      return event
    },
  })

  console.log('Sentry initialized for web')
}

// Set user
export function setSentryUser(user: { uid: string; rol: string }) {
  Sentry.setUser({
    id: user.uid,
    data: {
      rol: user.rol
    }
  })
}

// Clear user
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
