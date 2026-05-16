// TODO: Componente sugerencias inteligentes - Player 2 (Frontend)
// Paso 1: Sugerir pozo frecuente
// Paso 2: Sugerir hora óptima
// Paso 3: Tips personalizados
// Prompt de implementación rápida:
// "Crear SmartSuggestions con pozos frecuentes, tips"
import React, { useState, useEffect } from 'react'

interface Suggestion {
  type: 'well' | 'tip' | 'reminder'
  title: string
  message: string
  action?: string
  onAction?: () => void
}

export default function SmartSuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    // Generate smart suggestions based on user behavior
    const userSuggestions: Suggestion[] = [
      {
        type: 'well',
        title: 'Pozo frecuente',
        message: 'MFB-950 es tu pozo más evaluado esta semana',
        action: 'Evaluar ahora',
        onAction: () => console.log('Evaluar MFB-950')
      },
      {
        type: 'tip',
        title: 'Tip',
        message: 'Puedes evaluar hasta 10 tanques en una sola evaluación',
        action: 'Ver más tips'
      },
      {
        type: 'reminder',
        title: 'Recordatorio',
        message: 'Tienes 3 evaluaciones pendientes de hoy',
        action: 'Ver pendientes',
        onAction: () => console.log('Ver pendientes')
      }
    ]

    setSuggestions(userSuggestions)
  }, [])

  if (suggestions.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900">
        💡 Sugerencias
      </h3>
      
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">
                  {suggestion.type === 'well' && '🛢️'}
                  {suggestion.type === 'tip' && '💡'}
                  {suggestion.type === 'reminder' && '⏰'}
                </span>
                <h4 className="font-medium text-gray-900">
                  {suggestion.title}
                </h4>
              </div>
              <p className="text-sm text-gray-600">{suggestion.message}</p>
            </div>
            
            {suggestion.action && suggestion.onAction && (
              <button
                onClick={suggestion.onAction}
                className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded hover:bg-blue-200"
              >
                {suggestion.action}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
