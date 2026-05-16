// TODO: Componente banner de error - Player 2 (Frontend)
// Paso 1: Mostrar error con icono
// Paso 2: Botón para cerrar
// Paso 3: Botón para reintentar (opcional)
// Prompt de implementación rápida:
// "Crear ErrorBanner con message, onDismiss, onRetry"
// Entregable:
// - Banner rojo con icono ✕
// - Message de error
// - Botón dismiss y retry
import React from 'react'

interface ErrorBannerProps {
  message: string
  onDismiss: () => void
  onRetry?: () => void
}

export default function ErrorBanner({
  message,
  onDismiss,
  onRetry
}: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-500 text-xl">✕</div>
        <div className="flex-1">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-700 text-sm mt-1">{message}</p>
          <div className="flex gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                Reintentar
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-3 py-1 bg-white text-red-600 text-sm rounded border border-red-300 hover:bg-red-50 transition-colors"
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
