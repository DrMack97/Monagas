// src/pages/LoginPage.tsx
//
// Entrada exclusiva para OPERADOR. Un usuario autenticado con otro
// rol (SUP_CAMPO, SUP_AREA, GERENTE) es rechazado con un mensaje
// explícito — su panel es apps/web-supervisor, no esta app.

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiDroplet } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import LoginForm from '../components/LoginForm'

export default function LoginPage() {
  const navigate = useNavigate()
  const { rol, loading, logout } = useAuth()

  useEffect(() => {
    if (!loading && rol === 'OPERADOR') {
      navigate('/dashboard', { replace: true })
    }
  }, [loading, rol, navigate])

  const rolIncorrecto = !loading && rol !== null && rol !== 'OPERADOR'

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FiDroplet className="text-3xl mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white mt-2">Well Testing</h1>
          <p className="text-sm text-slate-400">App del Operador</p>
        </div>

        {rolIncorrecto ? (
          <div className="space-y-4">
            <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
              Esta app es exclusiva del Operador. Usa el panel de supervisión web con tu cuenta.
            </div>
            <button
              onClick={() => logout()}
              className="w-full text-sm text-slate-400 underline"
            >
              Volver a intentar con otra cuenta
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-5 shadow-xl">
            <LoginForm onSuccess={() => navigate('/dashboard')} />
          </div>
        )}
      </div>
    </div>
  )
}
