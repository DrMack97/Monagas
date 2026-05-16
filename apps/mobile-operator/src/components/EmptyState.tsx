// TODO: Componente estado vacío - Player 2 (Frontend)
// Paso 1: Icono grande
// Paso 2: Título y mensaje
// Paso 3: Botón opcional para acción
// Prompt de implementación rápida:
// "Crear EmptyState con icon, title, message, action"
// Entregable:
// - Icono centrado
// - Título y mensaje
// - Botón opcional
import React from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({
  icon,
  title,
  message,
  actionLabel,
  onAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
