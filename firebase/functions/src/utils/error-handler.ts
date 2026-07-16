// TODO: Error handler para Cloud Functions - Player 1 (Backend)
// Paso 1:clasificar errores
// Paso 2: Log to Sentry
// Paso 3: Convertir a functions.https.HttpsError
// Prompt de implementación rápida:
// "Crear handleError para Cloud Functions con Sentry"
import * as functions from 'firebase-functions'
import * as Sentry from '@sentry/node'

// Init Sentry para Cloud Functions
const SENTRY_DSN = process.env.SENTRY_DSN
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV || 'production',
    tracesSampleRate: 0.1
  })
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public fields?: string[]) {
    super('validation-error', message, 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super('authentication-error', message, 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Forbidden') {
    super('authorization-error', message, 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super('not-found', `${resource} not found`, 404)
    this.name = 'NotFoundError'
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'Internal error') {
    super('internal-error', message, 500)
    this.name = 'InternalError'
  }
}

export function handleError(
  error: unknown,
  context?: any
): functions.https.HttpsError {
  console.error('Error en Cloud Function:', error)

  // Sentry capture
  if (SENTRY_DSN && error instanceof Error) {
    Sentry.captureException(error, {
      extra: context
    })
  }

  if (error instanceof functions.https.HttpsError) {
    return error
  }

  if (error instanceof AppError) {
    const codeMap: Record<string, functions.https.HttpsError['code']> = {
      'validation-error': 'invalid-argument',
      'authentication-error': 'unauthenticated',
      'authorization-error': 'permission-denied',
      'not-found': 'not-found',
      'internal-error': 'internal'
    }

    return new functions.https.HttpsError(
      codeMap[error.code] || 'internal',
      error.message,
      error.details
    )
  }

  // Unknown error
  return new functions.https.HttpsError(
    'internal',
    error instanceof Error ? error.message : 'Unknown error'
  )
}

// Decorator para自动 error handling
export function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<T | functions.https.HttpsError> {
  try {
    return fn()
  } catch (error) {
    throw handleError(error)
  }
}
