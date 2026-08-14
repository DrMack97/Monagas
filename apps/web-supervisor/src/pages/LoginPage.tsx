// src/pages/LoginPage.tsx
//
// Entrada exclusiva para SUP_CAMPO, SUP_AREA y GERENTE. Un OPERADOR
// autenticado aquí es rechazado con un mensaje explícito — su app es
// mobile-operator, no este panel.

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiDroplet } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, loading, error, rol } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

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
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <FiDroplet className="text-3xl mx-auto" aria-hidden="true" />
          <h1 className="text-xl font-bold text-white mt-2">Well Testing</h1>
          <p className="text-sm text-slate-400">Panel de Supervisión</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {rol === 'OPERADOR' && (
            <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
              Este panel es para supervisión. Usa la app móvil para registrar lecturas.
            </div>
          )}

          <Button type="submit" fullWidth loading={loading}>
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  )
}
