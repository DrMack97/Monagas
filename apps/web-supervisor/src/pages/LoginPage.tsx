// src/pages/LoginPage.tsx
//
// Entrada exclusiva para SUP_CAMPO, SUP_AREA y GERENTE. Un OPERADOR
// autenticado aquí es rechazado con un mensaje explícito — su app es
// mobile-operator, no este panel.
//
// Una cuenta que inicia sesión pero NO tiene rol (p. ej. creada a mano desde la consola de
// Firebase, que no pasa por assignRole) antes entraba a un panel vacío sin explicación. Ahora
// App.tsx la devuelve aquí y esta pantalla explica qué pasa.
//
// Diseño: el del mockup original ("SUP LOGIN": fondo degradado, logo, tarjeta con borde violeta,
// botón con degradado violeta/índigo).

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import MarcaLogin from '../components/common/MarcaLogin'

const FONDO = 'linear-gradient(160deg, #060d1a 0%, #0a1528 50%, #060d14 100%)'

export default function LoginPage() {
  const navigate = useNavigate()
  const { user, login, logout, loading, error, rol } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const sinRol = !loading && !!user && rol === null

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch {
      // El error ya queda reflejado en el estado de useAuth
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6" style={{ background: FONDO }}>
      <div className="w-full max-w-sm">
        <MarcaLogin subtitulo="Panel de Supervisión" />

        {sinRol ? (
          <div className="space-y-4">
            <div
              role="alert"
              className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2"
            >
              Tu cuenta existe, pero todavía no tiene un rol asignado. Pídele a un Gerente o Supervisor de
              Área que te dé de alta desde la pantalla Usuarios. Si ya lo hicieron, cierra sesión y vuelve
              a entrar.
            </div>
            <button onClick={() => logout()} className="w-full text-sm text-slate-400 underline">
              Cerrar sesión
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-slate-900 border border-violet-900/40 rounded-2xl p-5 shadow-2xl"
          >
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            {error && (
              <div role="alert" className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            {rol === 'OPERADOR' && (
              <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
                Este panel es para supervisión. Usa la app móvil para registrar lecturas.
              </div>
            )}

            <Button type="submit" variant="acceso" fullWidth loading={loading}>
              Iniciar Sesión
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
