// TODO: Hook analytics Firebase Analytics - Player 3 (Fullstack)
// Paso 1: Importar Firebase Analytics SDK
// Paso 2: Configurar analytics instance
// Paso 3: Log events personalizados (login, create_evaluation, approve)
// Paso 4: Set user properties (rol, supervisorId)
// Prompt de implementación rápida:
// "Crear useAnalytics con logEvent, setUserProperties, custom events"
// Entregable:
// - logLogin() → event: login
// - logCreateEvaluation(pozoId, netos) → event: create_evaluation
// - logApproval(evaluationId, approved) → event: approval
// - setUserProperty('rol', 'OPERADOR')
import { useState, useEffect } from 'react'
import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics'
import { auth } from '../services/firebase'

// Inicializar Analytics
const analytics = typeof window !== 'undefined' ? getAnalytics() : null

export function useAnalytics() {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (analytics) {
      setInitialized(true)
    }
  }, [])

  // Login event
  const logLogin = async (rol: string) => {
    if (!analytics) return
    await logEvent(analytics, 'login', {
      method: 'email',
      rol
    })
  }

  // Create evaluation event
  const logCreateEvaluation = async (pozoId: string, netos: number, tanquesCount: number) => {
    if (!analytics) return
    await logEvent(analytics, 'create_evaluation', {
      pozoId,
      netos,
      tanquesCount,
      timestamp: new Date().toISOString()
    })
  }

  // Approval event (supervisor)
  const logApproval = async (evaluationId: string, approved: boolean, timeToApprove: number) => {
    if (!analytics) return
    await logEvent(analytics, 'approval', {
      evaluationId,
      approved,
      timeToApprove, // segundos
      timestamp: new Date().toISOString()
    })
  }

  // Export event
  const logExport = async (format: 'PDF' | 'EXCEL', filtros: any) => {
    if (!analytics) return
    await logEvent(analytics, 'export', {
      format,
      filtros: JSON.stringify(filtros),
      timestamp: new Date().toISOString()
    })
  }

  // Offline sync event
  const logOfflineSync = async (operationsCount: number) => {
    if (!analytics) return
    await logEvent(analytics, 'offline_sync', {
      operationsCount,
      timestamp: new Date().toISOString()
    })
  }

  // Set user properties
  const setUserProperty = async (key: string, value: string) => {
    if (!analytics) return
    await setUserProperties(analytics, { [key]: value })
  }

  // Set all user properties
  const setUserProperties = async (properties: { [key: string]: string }) => {
    if (!analytics) return
    await setUserProperties(analytics, properties)
  }

  return {
    initialized,
    logLogin,
    logCreateEvaluation,
    logApproval,
    logExport,
    logOfflineSync,
    setUserProperty,
    setUserProperties
  }
}
