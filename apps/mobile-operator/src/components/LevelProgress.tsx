// TODO: Componente progreso de nivel - Player 2 (Frontend)
// Paso 1: Mostrar nivel actual
// Paso 2: Barra de XP
// Paso 3: XP para next level
// Prompt de implementación rápida:
// "Crear LevelProgress con level, XP bar, next level"
import React from 'react'

interface LevelProgressProps {
  level: number
  totalXP: number
  xpProgress: number
  nextLevelXP: number
}

export default function LevelProgress({
  level,
  totalXP,
  xpProgress,
  nextLevelXP
}: LevelProgressProps) {
  return (
    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm text-purple-200">Nivel Actual</p>
          <p className="text-3xl font-bold">{level}</p>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-purple-200">Total XP</p>
          <p className="text-2xl font-bold">{totalXP.toLocaleString()}</p>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between text-sm text-purple-200 mb-1">
          <span>Progreso</span>
          <span>{xpProgress.toFixed(0)}%</span>
        </div>
        
        <div className="w-full bg-purple-700 rounded-full h-3">
          <div
            className="bg-white rounded-full h-3 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-purple-200 text-center">
        {nextLevelXP - totalXP} XP para nivel {level + 1}
      </p>
    </div>
  )
}
