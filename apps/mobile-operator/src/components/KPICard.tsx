// TODO: Componente Card de KPIs - Player 2 (Frontend)
// Paso 1: Mostrar label, valor, unidad
// Paso 2: Mostrar tendencia (up/down/stable) con color
// Paso 3: Icono opcional
// Prompt de implementación rápida:
// "Crear KPICard con label, value, unit, trend, icon"
// Entregable:
// - Card con layout vertical
// - Trend con flecha y color
// - Icono opcional
import React from 'react'

interface KPICardProps {
  label: string
  value: number | string
  unit?: string
  trend?: 'up' | 'down' | 'stable'
  trendPercentage?: number
  icon?: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

export default function KPICard({
  label,
  value,
  unit,
  trend,
  trendPercentage,
  icon,
  color = 'blue'
}: KPICardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200'
  }

  const trendIcons = {
    up: '↑',
    down: '↓',
    stable: '→'
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  }

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm text-gray-600">{unit}</span>}
          </div>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
              <span>{trendIcons[trend]}</span>
              {trendPercentage && (
                <span>{trendPercentage > 0 ? '+' : ''}{trendPercentage}%</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-2xl">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
