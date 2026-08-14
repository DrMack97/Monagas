// src/pages/SettingsPage.tsx
//
// Antes leía `user.nombre/rol` de AuthContext (un objeto Firebase User
// no tiene esos campos — undefined siempre). Ahora usa useAuth real:
// email y rol vienen del propio User/Custom Claims; logout es real.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, rol, logout } = useAuth()
  const { requestPermission } = useNotifications()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      setNotificationsEnabled(false)
    } else {
      const granted = await requestPermission()
      setNotificationsEnabled(granted)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  if (!user) return <div className="p-4 text-slate-400">Cargando...</div>

  return (
    <div className="min-h-screen bg-slate-950 p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400"><FiArrowLeft aria-label="Volver" /></button>
        <h1 className="text-xl font-bold text-white">Configuración</h1>
      </div>

      {/* Información de Usuario */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Información de Usuario</h2>
        <div className="space-y-2 text-sm">
          <div>
            <p className="text-slate-500">Correo</p>
            <p className="text-white">{user.email}</p>
          </div>
          <div>
            <p className="text-slate-500">Rol</p>
            <p className="text-white">{rol ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Notificaciones push</p>
            <p className="text-sm text-slate-500">Recibir alertas de aprobaciones</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full transition-colors ${
              notificationsEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Modo Offline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Guardar offline</p>
            <p className="text-sm text-slate-500">Guardar lecturas sin conexión</p>
          </div>
          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-12 h-6 rounded-full transition-colors ${
              offlineMode ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              offlineMode ? 'translate-x-6' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
