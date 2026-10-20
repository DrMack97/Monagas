// src/components/LoginForm.tsx
//
// Formulario de login real — llama a useAuth().login() con Firebase
// Auth. El manejo de "no soy OPERADOR" queda en LoginPage, que es
// quien conoce el rol resuelto después del login.
//
// Estilo oscuro (el mockup original): ya no usa el componente Input genérico, que es de
// tema claro y desentonaba dentro de la tarjeta oscura del login.

import { useId, useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import Button from './Button'

interface LoginFormProps {
  onSuccess?: () => void
}

const CLASE_ETIQUETA = 'block text-[10px] font-bold text-slate-500 uppercase tracking-[0.08em] mb-1.5'
const CLASE_CAMPO =
  'w-full bg-slate-800 border border-slate-700 rounded-[10px] px-3 py-2.5 text-sm text-amber-50 ' +
  'placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-700 transition-shadow'

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const idCorreo = useId()
  const idClave = useId()

  function validar(): boolean {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setLocalError('Ingresa un correo válido.')
      return false
    }
    if (password.length < 6) {
      setLocalError('La contraseña debe tener al menos 6 caracteres.')
      return false
    }
    setLocalError('')
    return true
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validar()) return
    try {
      await login(email, password)
      onSuccess?.()
    } catch {
      // El error ya queda reflejado en el estado de useAuth
    }
  }

  return (
    // noValidate: sin esto, la validación nativa de type="email" +
    // required bloquea el evento submit ANTES de que handleSubmit
    // corra si el valor no matchea el patrón del navegador — nuestro
    // mensaje de error estilizado nunca llegaría a mostrarse.
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <label htmlFor={idCorreo} className={CLASE_ETIQUETA}>
          Correo electrónico
        </label>
        <input
          id={idCorreo}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="username"
          className={CLASE_CAMPO}
        />
      </div>
      <div>
        <label htmlFor={idClave} className={CLASE_ETIQUETA}>
          Contraseña
        </label>
        <input
          id={idClave}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className={CLASE_CAMPO}
        />
      </div>

      {(localError || error) && (
        <div role="alert" className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {localError || error}
        </div>
      )}

      <Button type="submit" variant="acceso" fullWidth loading={loading} className="py-3">
        Iniciar Sesión
      </Button>
    </form>
  )
}
