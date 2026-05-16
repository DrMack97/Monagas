// TODO: Componente achievement badge - Player 2 (Frontend)
// Paso 1: Mostrar badge
// Paso 2: Animación unlock
// Paso 3: Tooltip info
// Prompt de implementación rápida:
// "Crear AchievementBadge con icon, name, description, unlock animation"
import React, { useState } from 'react'

interface AchievementBadgeProps {
  icon: string
  name: string
  description: string
  unlocked: boolean
  onUnlock?: () => void
}

export default function AchievementBadge({
  icon,
  name,
  description,
  unlocked,
  onUnlock
}: AchievementBadgeProps) {
  const [justUnlocked, setJustUnlocked] = useState(false)

  React.useEffect(() => {
    if (unlocked && !justUnlocked) {
      setJustUnlocked(true)
      onUnlock?.()
      
      setTimeout(() => {
        setJustUnlocked(false)
      }, 2000)
    }
  }, [unlocked, justUnlocked, onUnlock])

  return (
    <div className={`relative ${justUnlocked ? 'animate-bounce' : ''}`}>
      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
        unlocked 
          ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg' 
          : 'bg-gray-200 grayscale opacity-50'
      }`}>
        {icon}
      </div>
      
      {justUnlocked && (
        <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          ¡NEW!
        </div>
      )}

      <div className="mt-2 text-center">
        <p className={`text-sm font-medium ${
          unlocked ? 'text-gray-900' : 'text-gray-400'
        }`}>
          {name}
        </p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  )
}
