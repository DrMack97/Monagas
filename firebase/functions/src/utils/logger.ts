// TODO: Logging centralizado - Player 1 (Backend)
// Paso 1: Crear logger con levels (info, warn, error)
// Paso 2: Incluir timestamp, function name, context
// Paso 3: Usar functions.logger
// Prompt de implementación rápida:
// "Crear logger(info), logger.warn(), logger.error() con metadata"
// Entregable:
// - logger.info(message, metadata)
// - logger.warn(message, metadata)
// - logger.error(message, metadata, error)
import * as functions from 'firebase-functions'

export function info(message: string, metadata?: any) {
  functions.logger.info(message, { ...metadata, level: 'info' })
}

export function warn(message: string, metadata?: any) {
  functions.logger.warn(message, { ...metadata, level: 'warn' })
}

export function error(message: string, metadata?: any, err?: Error) {
  functions.logger.error(message, { 
    ...metadata, 
    level: 'error',
    error: err?.message 
  })
}

export function debug(message: string, metadata?: any) {
  if (process.env.NODE_ENV === 'development') {
    functions.logger.debug(message, { ...metadata, level: 'debug' })
  }
}

export function createLogger(functionName: string) {
  return {
    info: (message: string, metadata?: any) => 
      info(message, { functionName, ...metadata }),
    warn: (message: string, metadata?: any) => 
      warn(message, { functionName, ...metadata }),
    error: (message: string, metadata?: any, err?: Error) => 
      error(message, { functionName, ...metadata }, err),
    debug: (message: string, metadata?: any) => 
      debug(message, { functionName, ...metadata })
  }
}
