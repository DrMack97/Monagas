// src/pages/SettingsPage.tsx
//
// Antes leía `user.nombre/rol` de AuthContext (un objeto Firebase User
// no tiene esos campos — undefined siempre). Ahora usa useAuth real:
// email y rol vienen del propio User/Custom Claims; logout es real.

import { useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useNotifications } from '../hooks/useNotifications'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, rol, logout } = useAuth()
  const { soportado, habilitadas, permisoDenegado, activar, desactivar } = useNotifications()

  // Interruptor real (antes era estado local que arrancaba "encendido" sin
  // haber pedido nunca el permiso — ver useNotifications.ts).
  const handleToggleNotifications = async () => {
    if (habilitadas) await desactivar()
    else await activar()
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-white font-medium">Notificaciones push</p>
            <p className="text-sm text-slate-500">
              {soportado
                ? 'Recibir un aviso cuando tu supervisor apruebe o rechace una evaluación'
                : 'Disponible solo en la app instalada en el teléfono'}
            </p>
          </div>
          <button
            onClick={handleToggleNotifications}
            disabled={!soportado}
            role="switch"
            aria-checked={soportado && habilitadas}
            aria-label="Notificaciones push"
            className={`w-12 h-6 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
              soportado && habilitadas ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
              soportado && habilitadas ? 'translate-x-6' : 'translate-x-1'
            }`}></div>
          </button>
        </div>
        {soportado && habilitadas && permisoDenegado && (
          <p className="text-xs text-amber-400 mt-3">
            Android bloqueó las notificaciones de esta app. Actívalas en Ajustes del teléfono
            → Aplicaciones → WillyTank → Notificaciones.
          </p>
        )}
      </div>

      {/* Guardado offline: siempre activo, no es una opción que se pueda
          apagar — Firestore guarda todo localmente por su cuenta y lo
          envía solo cuando vuelve la señal (ver docs/technical/
          offline-strategy.md). Antes había un switch aquí que no hacía
          nada (estado local sin ningún efecto real) — daba a entender
          que había que "activarlo" para que funcionara, cuando en
          realidad nunca se apaga. Se reemplaza por un indicador fijo. */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium">Guardado offline</p>
            <p className="text-sm text-slate-500">
              Siempre activo — tus lecturas se guardan en el dispositivo y
              se envían solas cuando vuelve la señal.
            </p>
          </div>
          <span className="text-xs font-medium text-emerald-400 border border-emerald-900 rounded-full px-2.5 py-1 whitespace-nowrap">
            Activo
          </span>
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
