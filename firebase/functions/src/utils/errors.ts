// TODO: Custom error classes - Player 1 (Backend)
// Paso 1: Crear AppError con code, message, statusCode
// Paso 2: Crear ValidationError, AuthenticationError, NotFoundError
// Paso 3: Helper para convertir a functions.https.HttpsError
// Prompt de implementación rápida:
// "Crear AppError, ValidationError, NotFoundError, toHttpsError"
// Entregable:
// - new AppError('CODE', 'message')
// - new ValidationError('message')
// - new NotFoundError('resource')
// - toHttpsError(error) → functions.https.HttpsError
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
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

import * as functions from 'firebase-functions'

export function toHttpsError(error: Error): functions.https.HttpsError {
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
      error.message
    )
  }

  return new functions.https.HttpsError('internal', error.message)
}
