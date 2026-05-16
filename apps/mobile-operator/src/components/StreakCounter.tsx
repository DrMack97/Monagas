// TODO: Componente contador de racha - Player 2 (Frontend)
// Paso 1: Mostrar días de racha
// Paso 2: Animación fuego
// Paso 3: Próximo achievement
// Prompt de implementación rápida:
// "Crear StreakCounter con días, fire animation, next milestone"
import React from 'react'

interface StreakCounterProps {
  streakDays: number
  nextMilestone?: number
}

export default function StreakCounter({
  streakDays,
  nextMilestone = 7
}: StreakCounterProps) {
  const isHot = streakDays >= 3
  const progress = (streakDays % nextMilestone) / nextMilestone * 100

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`text-4xl ${isHot ? 'animate-pulse' : ''}`}>
            🔥
          </div>
          
          <div>
            <p className="text-sm text-orange-100">Racha Actual</p>
            <p className="text-3xl font-bold">
              {streakDays} {streakDays === 1 ? 'día' : 'días'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm text-orange-100">Próximo logro</p>
          <p className="text-xl font-bold">
            {nextMilestone - (streakDays % nextMilestone)} días más
          </p>
        </div>
      </div>

      {nextMilestone && (
        <div className="mt-3">
          <div className="w-full bg-orange-700 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
