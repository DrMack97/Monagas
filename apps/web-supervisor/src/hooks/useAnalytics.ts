// TODO: Analytics web supervisor - Player 3 (Fullstack)
// Paso 1: Igual que mobile pero con events web-specific
// Prompt de implementación rápida:
// "Adaptar useAnalytics para web con events específicos supervisor"
import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics'
import { auth } from '../services/firebase'

const analytics = typeof window !== 'undefined' ? getAnalytics() : null

export function useAnalytics() {
  const logDashboardView = async () => {
    if (!analytics) return
    await logEvent(analytics, 'dashboard_view', {
      timestamp: new Date().toISOString()
    })
  }

  const logApprovalQueueView = async (pendingCount: number) => {
    if (!analytics) return
    await logEvent(analytics, 'approval_queue_view', {
      pendingCount,
      timestamp: new Date().toISOString()
    })
  }

  const logApproval = async (evaluationId: string, approved: boolean, timeToApprove: number) => {
    if (!analytics) return
    await logEvent(analytics, 'approval', {
      evaluationId,
      approved,
      timeToApprove,
      timestamp: new Date().toISOString()
    })
  }

  const logExport = async (format: 'PDF' | 'EXCEL', count: number, filtros: any) => {
    if (!analytics) return
    await logEvent(analytics, 'export', {
      format,
      count,
      filtros: JSON.stringify(filtros),
      timestamp: new Date().toISOString()
    })
  }

  const logTableFilter = async (filtro: string, resultadoCount: number) => {
    if (!analytics) return
    await logEvent(analytics, 'table_filter', {
      filtro,
      resultadoCount,
      timestamp: new Date().toISOString()
    })
  }

  const setUserProperties = async (properties: { [key: string]: string }) => {
    if (!analytics) return
    await setUserProperties(analytics, properties)
  }

  return {
    logDashboardView,
    logApprovalQueueView,
    logApproval,
    logExport,
    logTableFilter,
    setUserProperties
  }
}
