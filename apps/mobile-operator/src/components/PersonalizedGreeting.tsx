// TODO: Componente saludo personalizado - Player 2 (Frontend)
// Paso 1: Saludo según hora
// Paso 2: Nombre del usuario
// Paso 3: Stats rápidas
// Prompt de implementación rápida:
// "Crear PersonalizedGreeting con horario, nombre, stats"
import React from 'react'
import { useAuth } from '../context/AuthContext';
export default function PersonalizedGreeting() {
  const { user } = useAuth()

  if (!user) return null

  const hour = new Date().getHours()
  let greeting = 'Hola'
  
  if (hour >= 5 && hour < 12) {
    greeting = 'Buenos días'
  } else if (hour >= 12 && hour < 18) {
    greeting = 'Buenas tardes'
  } else {
    greeting = 'Buenas noches'
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
      <h1 className="text-2xl font-bold mb-1">
        {greeting}, {user.nombre}! 👋
      </h1>
      <p className="text-blue-100 text-sm mb-4">
        ¿Listo para registrar evaluaciones hoy?
      </p>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{user.totalEvaluaciones || 0}</p>
          <p className="text-xs text-blue-100">Evaluaciones</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{user.pozosActivos || 0}</p>
          <p className="text-xs text-blue-100">Pozos</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {user.streakDays || 0}d
          </p>
          <p className="text-xs text-blue-100">Racha</p>
        </div>
      </div>
    </div>
  )
}
