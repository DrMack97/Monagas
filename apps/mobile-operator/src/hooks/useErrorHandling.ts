// TODO: Hook centralized error handling - Player 3 (Fullstack)
// Paso 1: Wrapper para async operations
// Paso 2: Auto error capture Sentry
// Paso 3: Mostrar error UI
// Prompt de implementación rápida:
// "Crear useErrorHandling con useAsync, auto capture"
// Entregable:
// - useAsync(fn) → loading, error, execute
// - Auto Sentry capture
// - Error state accesible
import { useState, useCallback } from 'react'
import { handleError, handleFirebaseError } from '../utils/error-handler'
import * as Sentry from '../services/sentry'

interface UseAsyncResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  userFriendlyMessage: string | null
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate: boolean = false
): UseAsyncResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userFriendlyMessage, setUserFriendlyMessage] = useState<string | null>(null)

  const execute = useCallback(async (...args: any[]) => {
    setLoading(true)
    setError(null)
    setUserFriendlyMessage(null)

    try {
      const result = await asyncFunction(...args)
      setData(result)
      return result
    } catch (err) {
      // Firebase error
      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = handleFirebaseError(err)
        setError(firebaseError.message)
        setUserFriendlyMessage(firebaseError.userFriendlyMessage)
      } else {
        // Generic error
        const errorResult = handleError(err)
        setError(errorResult.message)
        setUserFriendlyMessage(errorResult.userFriendlyMessage)
      }

      throw err
    } finally {
      setLoading(false)
    }
  }, [asyncFunction])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setUserFriendlyMessage(null)
    setLoading(false)
  }, [])

  return {
    data,
    loading,
    error,
    userFriendlyMessage,
    execute,
    reset
  }
}

// Hook para múltiples async operations
export function useMultiAsync() {
  const [operations, setOperations] = useState<Record<string, any>>({})

  const addOperation = useCallback((key: string, asyncFn: () => Promise<any>) => {
    const { execute, ...result } = useAsync(asyncFn)
    
    setOperations(prev => ({
      ...prev,
      [key]: { execute, ...result }
    }))
  }, [])

  const anyLoading = Object.values(operations).some((op: any) => op.loading)
  const anyError = Object.values(operations).some((op: any) => op.error)

  return {
    operations,
    anyLoading,
    anyError
  }
}
