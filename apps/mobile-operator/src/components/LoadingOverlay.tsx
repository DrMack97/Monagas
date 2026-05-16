// TODO: Loading overlay full-screen - Player 2 (Frontend)
// Paso 1: Overlay con spinner
// Paso 2: Mensaje configurable
// Paso 3: Prevent interactions
// Prompt de implementación rápida:
// "Crear LoadingOverlay con message, fullScreen"
import React from 'react'

interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export default function LoadingOverlay({
  message = 'Cargando...',
  fullScreen = true
}: LoadingOverlayProps) {
  const content = (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium text-gray-900">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
