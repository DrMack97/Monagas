// src/components/dashboard/DashboardStates.tsx

import { FiAlertTriangle, FiDroplet } from 'react-icons/fi'

export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-sm text-slate-500">Cargando pozos...</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <FiAlertTriangle className="text-3xl" aria-hidden="true" />
      <p className="text-sm text-red-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-amber-400 border border-amber-500/30 rounded-lg px-3 py-1.5 hover:bg-amber-500/10 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ rol }: { rol: string | null }) {
  const mensaje =
    rol === 'SUP_CAMPO'
      ? 'No tienes un pozo asignado todavía. Contacta a tu Supervisor de Área.'
      : rol === 'SUP_AREA'
      ? 'No hay pozos registrados en tu zona todavía.'
      : 'No hay pozos registrados en el sistema todavía.'

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
      <FiDroplet className="text-3xl" aria-hidden="true" />
      <p className="text-sm text-slate-500">{mensaje}</p>
    </div>
  )
}
