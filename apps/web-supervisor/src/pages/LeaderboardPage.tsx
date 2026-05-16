// TODO: Página leaderboard web - Player 2 (Frontend)
// Paso 1: Top 50 usuarios
// Paso 2: Filtros (rol, campo)
// Paso 3: Estadísticas
// Prompt de implementación rápida:
// "Crear LeaderboardPage con top 50, filtros, stats"
import React, { useState } from 'react'

interface User {
  rank: number
  nombre: string
  rol: string
  campo: string
  totalXP: number
  level: number
  evaluaciones: number
  aprobaciones: number
}

export default function LeaderboardPage() {
  const [filterRol, setFilterRol] = useState('')
  const [filterCampo, setFilterCampo] = useState('')

  const users: User[] = Array.from({ length: 50 }, (_, i) => ({
    rank: i + 1,
    nombre: `Usuario ${i + 1}`,
    rol: i < 10 ? 'GERENTE' : i < 30 ? 'SUP_CAMPO' : 'OPERADOR',
    campo: i % 3 === 0 ? 'Monagas' : i % 3 === 1 ? 'Anzoátegui' : 'Falcón',
    totalXP: 10000 - (i * 150),
    level: Math.floor(Math.sqrt((10000 - (i * 150)) / 50)) + 1,
    evaluaciones: 200 - (i * 3),
    aprobaciones: 180 - (i * 3)
  }))

  const filteredUsers = users.filter(user => {
    if (filterRol && user.rol !== filterRol) return false
    if (filterCampo && user.campo !== filterCampo) return false
    return true
  })

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🏆 Tabla de Líderes</h1>
        
        <div className="flex gap-3">
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Todos los roles</option>
            <option value="OPERADOR">Operador</option>
            <option value="SUP_CAMPO">Supervisor de Campo</option>
            <option value="GERENTE">Gerente</option>
          </select>

          <select
            value={filterCampo}
            onChange={(e) => setFilterCampo(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Todos los campos</option>
            <option value="Monagas">Monagas</option>
            <option value="Anzoátegui">Anzoátegui</option>
            <option value="Falcón">Falcón</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Total Usuarios</p>
          <p className="text-2xl font-bold">{users.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Nivel Promedio</p>
          <p className="text-2xl font-bold">
            {(users.reduce((sum, u) => sum + u.level, 0) / users.length).toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">XP Total</p>
          <p className="text-2xl font-bold">
            {users.reduce((sum, u) => sum + u.totalXP, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600">Evaluaciones</p>
          <p className="text-2xl font-bold">
            {users.reduce((sum, u) => sum + u.evaluaciones, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nivel</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">XP</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evaluaciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map(user => (
              <tr key={user.rank} className={user.rank <= 3 ? 'bg-yellow-50' : ''}>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    user.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                    user.rank === 2 ? 'bg-gray-300 text-gray-700' :
                    user.rank === 3 ? 'bg-orange-400 text-orange-900' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {user.rank}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">{user.nombre}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.rol}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.campo}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">{user.level}</td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-600 font-semibold">
                  {user.totalXP.toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {user.evaluaciones}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-gray-600">
        Mostrando {filteredUsers.length} de {users.length} usuarios
      </p>
    </div>
  )
}
