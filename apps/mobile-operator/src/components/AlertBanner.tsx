// TODO: Componente Banner de alertas - Player 2 (Frontend)
// Paso 1: Mostrar mensaje de alerta con tipo (info, warning, error)
// Paso 2: Color según tipo (azul=info, amarillo=warning, rojo=error)
// Paso 3: Botón para cerrar alerta
// Prompt de implementación rápida:
// "Crear componente React AlertBanner con tipo, mensaje, onClose"
// Entregable:
// - Banner visible con mensaje
// - Color según tipo
// - Botón cerrar que llama onClose
import React from 'react'

interface AlertBannerProps {
  type: 'info' | 'warning' | 'error'
  message: string
  onClose: () => void
}

export default function AlertBanner({ type, message, onClose }: AlertBannerProps) {
  const tipoColor = {
    'info': 'bg-blue-100 text-blue-800',
    'warning': 'bg-yellow-100 text-yellow-800',
    'error': 'bg-red-100 text-red-800'
  }[type]

  return (
    <div className={`p-4 rounded ${tipoColor} flex justify-between`}>
      <span>{message}</span>
      <button onClick={onClose}>✕</button>
    </div>
  )
}
