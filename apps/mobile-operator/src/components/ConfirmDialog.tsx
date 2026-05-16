// TODO: Componente diálogo de confirmación - Player 2 (Frontend)
// Paso 1: Modal con título y mensaje
// Paso 2: Botón confirmar (rojo si es destructivo)
// Paso 3: Botón cancelar
// Prompt de implementación rápida:
// "Crear ConfirmDialog con title, message, onConfirm, onCancel, destructive"
// Entregable:
// - Modal centrado con overlay
// - Título y mensaje
// - Botones Confirmar/Cancelar
import React from 'react'

interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  destructive?: boolean
  confirmLabel?: string
  cancelLabel?: string
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  destructive = false,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar'
}: ConfirmDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${
              destructive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
