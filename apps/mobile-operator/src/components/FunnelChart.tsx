// TODO: Componente funnel chart - Player 2 (Frontend)
// Paso 1: Mostrar funnel steps
// Paso 2: Percentage por step
// Paso 3: Drop-off visualization
// Prompt de implementación rápida:
// "Crear FunnelChart con steps, percentages, drop-off"
import React from 'react'

interface FunnelStep {
  name: string
  count: number
  percentage: number
  dropOff: number
}

interface FunnelChartProps {
  steps: FunnelStep[]
  title?: string
}

export default function FunnelChart({
  steps,
  title = 'Funnel'
}: FunnelChartProps) {
  const maxWidth = Math.max(...steps.map(s => s.count))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{step.name}</span>
              <div className="text-right">
                <span className="text-sm font-semibold">{step.count}</span>
                <span className="text-xs text-gray-500 ml-1">({step.percentage.toFixed(1)}%)</span>
              </div>
            </div>
            
            <div className="relative">
              <div
                className="h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded transition-all"
                style={{ width: `${(step.count / maxWidth) * 100}%` }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-xs font-medium">
                {step.percentage.toFixed(0)}%
              </div>
            </div>

            {step.dropOff > 0 && index < steps.length - 1 && (
              <div className="text-xs text-red-600 text-right mt-1">
                -{step.dropOff} ({((step.dropOff / step.count) * 100).toFixed(1)}% drop-off)
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
