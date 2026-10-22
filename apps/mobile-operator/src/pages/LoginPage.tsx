// src/pages/LoginPage.tsx
//
// Entrada exclusiva para OPERADOR. Un usuario autenticado con otro
// rol (SUP_CAMPO, SUP_AREA, GERENTE) es rechazado con un mensaje
// explícito — su panel es apps/web-supervisor, no esta app.
//
// Una cuenta que inicia sesión pero NO tiene rol (p. ej. creada a mano desde la consola
// de Firebase, que no pasa por assignRole) antes rebotaba de vuelta a esta pantalla SIN
// ningún mensaje: parecía que "las credenciales no funcionan". Ahora se explica qué pasa.
//
// Diseño: el del mockup original (fondo degradado, logo, tarjeta oscura), con la paleta del
// Operador (esmeralda/azul y botón ámbar).

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/LoginForm'
import MarcaLogin from '../components/MarcaLogin'
import { URL_PANEL } from '../config/enlaces'

const FONDO = 'linear-gradient(160deg, #060d1a 0%, #0a1528 50%, #060d14 100%)'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, rol, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && rol === 'OPERADOR') {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, rol, navigate])

  const rolIncorrecto = !loading && rol !== null && rol !== 'OPERADOR'
  const sinRol = !loading && !!user && rol === null

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6" style={{ background: FONDO }}>
      <div className="w-full max-w-sm">
        <MarcaLogin subtitulo="App del Operador" />

        {rolIncorrecto || sinRol ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2"
            >
              {rolIncorrecto
                ? 'Esta app es exclusiva del Operador. Usa el panel de supervisión web con tu cuenta.'
                : 'Tu cuenta existe, pero todavía no tiene un rol asignado. Pídele al Gerente o al Supervisor que te dé de alta desde el panel (pantalla Usuarios). Si ya lo hicieron, cierra sesión y vuelve a entrar.'}
            </div>
            <button onClick={() => logout()} className="w-full text-sm text-slate-400 underline">
              {rolIncorrecto ? 'Volver a intentar con otra cuenta' : 'Cerrar sesión'}
            </button>
          </div>
        ) : (
          <div className="bg-slate-900 border border-emerald-900/40 rounded-2xl p-5 shadow-2xl">
            <LoginForm onSuccess={() => navigate('/dashboard')} />
          </div>
        )}

        {/* Como en el mockup original: acceso al panel de supervisión (Supervisores y Gerentes). En el APK el
            sistema lo abre en el navegador del teléfono. */}
        {URL_PANEL && (
          <a
            href={URL_PANEL}
            className="mt-5 block text-center text-xs font-semibold text-violet-400 border border-violet-500/30 rounded-lg py-2 hover:bg-violet-500/10"
          >
            Acceso al Panel de Supervisión →
          </a>
        )}
      </div>
    </div>
  )
}
