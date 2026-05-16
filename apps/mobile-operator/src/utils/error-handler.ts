// TODO: Centralized error handler - Player 3 (Fullstack)
// Paso 1: Clasificar errores (network, auth, validation, server)
// Paso 2: Log to Sentry automáticamente
// Paso 3: Mostrar error amigable al usuario
// Prompt de implementación rápida:
// "Crear handleError con classification, Sentry, user message"
// Entregable:
// - NetworkError, AuthError, ValidationError, ServerError
// - handleError(error) → clasificación automática
// - getUserFriendlyMessage(error)
import * as Sentry from '../services/sentry'

export class NetworkError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class AuthError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public fields?: string[]) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ServerError extends Error {
  constructor(message: string, public statusCode?: number, public code?: string) {
    super(message)
    this.name = 'ServerError'
  }
}

export class OfflineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OfflineError'
  }
}

export function handleError(error: unknown): {
  type: string
  message: string
  userFriendlyMessage: string
  shouldRetry: boolean
} {
  console.error('Error tratado:', error)

  // Sentry capture automático
  if (error instanceof Error) {
    Sentry.captureException(error)
  }

  // Network error
  if (error instanceof NetworkError) {
    return {
      type: 'NETWORK',
      message: error.message,
      userFriendlyMessage: 'No hay conexión a internet. Verifica tu conexión y reintenta.',
      shouldRetry: true
    }
  }

  // Auth error
  if (error instanceof AuthError) {
    return {
      type: 'AUTH',
      message: error.message,
      userFriendlyMessage: 'Sesión expirada. Por favor inicia sesión nuevamente.',
      shouldRetry: false
    }
  }

  // Validation error
  if (error instanceof ValidationError) {
    return {
      type: 'VALIDATION',
      message: error.message,
      userFriendlyMessage: 'Por favor verifica los datos ingresados.',
      shouldRetry: false
    }
  }

  // Server error
  if (error instanceof ServerError) {
    return {
      type: 'SERVER',
      message: error.message,
      userFriendlyMessage: 'Error del servidor. Intenta más tarde.',
      shouldRetry: error.statusCode === 503
    }
  }

  // Offline error
  if (error instanceof OfflineError) {
    return {
      type: 'OFFLINE',
      message: error.message,
      userFriendlyMessage: 'Guardado offline. Se sincronizará cuando estés online.',
      shouldRetry: false
    }
  }

  // Unknown error
  return {
    type: 'UNKNOWN',
    message: error instanceof Error ? error.message : 'Error desconocido',
    userFriendlyMessage: 'Ocurrió un error inesperado. Intenta nuevamente.',
    shouldRetry: true
  }
}

// Helper para Firebase errors
export function handleFirebaseError(error: any): {
  type: string
  message: string
  userFriendlyMessage: string
} {
  const code = error?.code || ''
  const message = error?.message || 'Error desconocido'

  let userFriendlyMessage = message

  if (code.includes('network')) {
    userFriendlyMessage = 'No hay conexión a internet'
  } else if (code.includes('unauthenticated')) {
    userFriendlyMessage = 'Sesión expirada'
  } else if (code.includes('permission-denied')) {
    userFriendlyMessage = 'No tienes permiso para realizar esta acción'
  } else if (code.includes('not-found')) {
    userFriendlyMessage = 'Recurso no encontrado'
  } else if (code.includes('already-exists')) {
    userFriendlyMessage = 'El recurso ya existe'
  } else if (code.includes('invalid-argument')) {
    userFriendlyMessage = 'Datos inválidos'
  } else if (code.includes('internal')) {
    userFriendlyMessage = 'Error del servidor, intenta más tarde'
  }

  return {
    type: 'FIREBASE',
    message,
    userFriendlyMessage
  }
}
