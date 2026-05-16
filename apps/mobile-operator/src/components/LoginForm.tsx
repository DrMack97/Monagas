// TODO: Componente UI Login - Player 2 (Frontend)
// Paso 1: Crear formulario con email, password, botón login
// Paso 2: Validar email con regex, password mínimo 6 caracteres
// Paso 3: Mostrar error de login con AlertBanner
// Prompt de implementación rápida:
// "Crear componente React LoginForm con email, password, validación y estado de error"
// Entregable:
// - Formulario con 2 inputs y 1 botón
// - Validaciones frontend funcionando
// - State: loading, error, handleSubmit
import React, { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementar login con Firebase Auth
    setError('Login no implementado todavía')
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      {error && <div>{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? 'Cargando...' : 'Login'}
      </button>
    </form>
  )
}
