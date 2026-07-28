import { getAnalytics, logEvent, setUserProperties } from 'firebase/analytics';

const analytics = typeof window !== 'undefined' ? getAnalytics() : null;

export function useAnalytics() {
  const logDashboardView = async () => {
    if (!analytics) return;
    await logEvent(analytics, 'dashboard_view');
  };

  const logApprovalQueueView = async (pendingCount: number) => {
    if (!analytics) return;
    await logEvent(analytics, 'approval_queue_view', { pendingCount });
  };

  const logApproval = async (evaluationId: string, approved: boolean, timeToApprove: number) => {
    if (!analytics) return;
    await logEvent(analytics, 'approval', { evaluationId, approved, timeToApprove });
  };

  const logExport = async (format: 'PDF' | 'EXCEL', count: number, filtros: any) => {
    if (!analytics) return;
    await logEvent(analytics, 'export', { format, count, filtros: JSON.stringify(filtros) });
  };

  const logTableFilter = async (filtro: string, resultadoCount: number) => {
    if (!analytics) return;
    await logEvent(analytics, 'table_filter', { filtro, resultadoCount });
  };

  const setUserProperties = async (properties: Record<string, string>) => {
    if (!analytics) return;
    await setUserProperties(properties);
  };

  return {
    logDashboardView,
    logApprovalQueueView,
    logApproval,
    logExport,
    logTableFilter,
    setUserProperties,
  };
}