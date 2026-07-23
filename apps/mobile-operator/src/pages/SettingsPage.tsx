// TODO: Página de configuración - Player 2 (Frontend)
// Paso 1: Mostrar usuario actual
// Paso 2: Toggle notificaciones
// Paso 3: Toggle offline mode
// Prompt de implementación rápida:
// "Crear SettingsPage con user info, notification toggle, offline toggle"
// Entregable:
// - Info usuario (nombre, email, rol)
// - Toggle notificaciones push
// - Toggle offline mode
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'

export default function SettingsPage() {
  const { user } = useAuth()
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

  if (!user) return <div>Cargando...</div>

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>

      {/* Información de Usuario */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Información de Usuario</h2>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-gray-600">Nombre</p>
            <p className="font-medium">{user.nombre}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Rol</p>
            <p className="font-medium">{user.rol}</p>
          </div>
        </div>
      </div>

      {/* Notificaciones */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Notificaciones</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Notificaciones push</p>
            <p className="text-sm text-gray-600">Recibir alertas de aprobaciones</p>
          </div>
          <button
            onClick={handleToggleNotifications}
            className={`w-12 h-6 rounded-full transition-colors ${
              notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Modo Offline */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Modo Offline</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Guardar offline</p>
            <p className="text-sm text-gray-600">Guardar evaluaciones sin conexión</p>
          </div>
          <button
            onClick={() => setOfflineMode(!offlineMode)}
            className={`w-12 h-6 rounded-full transition-colors ${
              offlineMode ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              offlineMode ? 'translate-x-6' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
      </div>

      {/* Cerrar sesión */}
      <button
        onClick={() => {
          // TODO: Implementar logout
          console.log('Logout')
        }}
        className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
