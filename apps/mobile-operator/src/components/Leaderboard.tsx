// TODO: Componente leaderboard - Player 2 (Frontend)
// Paso 1: Mostrar top 10
// Paso 2: Posición del usuario
// Paso 3: XP y level
// Prompt de implementación rápida:
// "Crear Leaderboard con top 10, user position, XP"
import React from 'react'

interface LeaderboardEntry {
  rank: number
  nombre: string
  totalXP: number
  level: number
  isCurrentUser?: boolean
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  userPosition?: LeaderboardEntry
  title?: string
}

export default function Leaderboard({
  entries,
  userPosition,
  title = 'Tabla de Líderes'
}: LeaderboardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
        <span>🏆</span>
        {title}
      </h2>

      <div className="space-y-3">
        {entries.slice(0, 5).map((entry, index) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between p-3 rounded-lg ${
              entry.isCurrentUser
                ? 'bg-purple-50 border-2 border-purple-300'
                : index < 3
                ? 'bg-yellow-50'
                : 'bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                index === 0 ? 'bg-yellow-400 text-yellow-900' :
                index === 1 ? 'bg-gray-300 text-gray-700' :
                index === 2 ? 'bg-orange-400 text-orange-900' :
                'bg-gray-200 text-gray-600'
              }`}>
                {entry.rank}
              </div>
              
              <div>
                <p className="font-medium">{entry.nombre}</p>
                <p className="text-sm text-gray-500">Nivel {entry.level}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-purple-600">{entry.totalXP.toLocaleString()} XP</p>
            </div>
          </div>
        ))}
      </div>

      {userPosition && !userPosition.isCurrentUser && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">
                {userPosition.rank}
              </div>
              
              <div>
                <p className="font-medium">Tú</p>
                <p className="text-sm text-gray-500">Nivel {userPosition.level}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-purple-600">{userPosition.totalXP.toLocaleString()} XP</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
