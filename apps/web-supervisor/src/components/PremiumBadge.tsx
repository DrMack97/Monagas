// TODO: Componente premium badge - Player 2 (Frontend)
// Paso 1: Mostrar badge premium
// Paso 2: Features exclusivas
// Paso 3: Upgrade CTA
// Prompt de implementación rápida:
// "Crear PremiumBadge con features, upgrade CTA"
import React from 'react'

interface PremiumBadgeProps {
  isPremium: boolean
  onUpgrade?: () => void
}

export default function PremiumBadge({
  isPremium,
  onUpgrade
}: PremiumBadgeProps) {
  if (isPremium) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 rounded-full text-sm font-semibold">
        <span>⭐</span>
        <span>Premium</span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg">✨ Sube a Premium</h3>
        <span className="text-2xl">👑</span>
      </div>

      <ul className="space-y-2 mb-4">
        <li className="flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>Reportes ilimitados</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>Análisis avanzado</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>Soporte prioritario</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>Exportación ilimitada</span>
        </li>
        <li className="flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>Integraciones avanzadas</span>
        </li>
      </ul>

      <button
        onClick={onUpgrade}
        className="w-full px-4 py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors"
      >
        Comenzar Prueba Gratis
      </button>

      <p className="text-xs text-center mt-2 text-purple-100">
        14 días de prueba • Luego $29/mes
      </p>
    </div>
  )
}
