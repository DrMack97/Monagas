// TODO: Página de experimentos A/B - Player 2 (Frontend)
// Paso 1: Listar experimentos
// Paso 2: Mostrar resultados
// Paso 3: Stats significance
// Prompt de implementación rápida:
// "Crear ExperimentsPage con experiments, resultados, stats"
import React from 'react'

interface Experiment {
  id: string
  name: string
  status: 'running' | 'completed' | 'paused'
  startDate: string
  endDate: string
  variants: Array<{
    id: string
    name: string
    users: number
    conversions: number
    conversionRate: number
  }>
  winner?: string
}

export default function ExperimentsPage() {
  const experiments: Experiment[] = [
    {
      id: 'onboarding_v2',
      name: 'Onboarding V2',
      status: 'running',
      startDate: '2026-05-01',
      endDate: '2026-06-01',
      variants: [
        { id: 'control', name: 'Original', users: 500, conversions: 350, conversionRate: 70 },
        { id: 'variant_a', name: 'Simplified', users: 520, conversions: 420, conversionRate: 81 }
      ]
    },
    {
      id: 'button_color',
      name: 'Button Color',
      status: 'completed',
      startDate: '2026-05-01',
      endDate: '2026-05-15',
      variants: [
        { id: 'blue', name: 'Blue', users: 480, conversions: 320, conversionRate: 67 },
        { id: 'green', name: 'Green', users: 500, conversions: 380, conversionRate: 76 }
      ],
      winner: 'green'
    },
    {
      id: 'evaluation_form',
      name: 'Evaluation Form Layout',
      status: 'running',
      startDate: '2026-05-01',
      endDate: '2026-06-15',
      variants: [
        { id: 'vertical', name: 'Vertical', users: 330, conversions: 240, conversionRate: 73 },
        { id: 'horizontal', name: 'Horizontal', users: 340, conversions: 250, conversionRate: 74 },
        { id: 'compact', name: 'Compact', users: 350, conversions: 280, conversionRate: 80 }
      ]
    }
  ]

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Experimentos A/B</h1>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Nuevo Experimento
        </button>
      </div>

      <div className="space-y-6">
        {experiments.map(exp => (
          <div key={exp.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-semibold">{exp.name}</h2>
                <p className="text-sm text-gray-600">
                  {exp.startDate} - {exp.endDate}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${
                exp.status === 'running' 
                  ? 'bg-green-100 text-green-800'
                  : exp.status === 'completed'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {exp.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {exp.variants.map(variant => (
                <div
                  key={variant.id}
                  className={`p-4 rounded-lg border-2 ${
                    exp.winner === variant.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{variant.name}</span>
                    {exp.winner === variant.id && (
                      <span className="text-green-600">🏆</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>{variant.users} usuarios</p>
                    <p className="font-semibold text-lg">
                      {variant.conversionRate}% conversion
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {exp.status === 'completed' && exp.winner && (
              <div className="p-3 bg-green-50 rounded border border-green-200">
                <p className="text-green-800 font-medium">
                  ✅ Ganador: {exp.variants.find(v => v.id === exp.winner)?.name} 
                  (+{exp.variants.find(v => v.id === exp.winner)?.conversionRate - exp.variants.find(v => v.id === 'control')?.conversionRate}%)
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
