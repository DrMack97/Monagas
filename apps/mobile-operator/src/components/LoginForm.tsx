// src/components/LoginForm.tsx
//
// Formulario de login real — llama a useAuth().login() con Firebase
// Auth. El manejo de "no soy OPERADOR" queda en LoginPage, que es
// quien conoce el rol resuelto después del login.

import { useState, type FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import Input from './Input'
import Button from './Button'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { login, loading, error } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

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

      {(localError || error) && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {localError || error}
        </div>
      )}

      <Button type="submit" fullWidth loading={loading}>
        Iniciar Sesión
      </Button>
    </form>
  )
}
