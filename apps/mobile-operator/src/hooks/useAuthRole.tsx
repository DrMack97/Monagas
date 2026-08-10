// src/hooks/useAuthRole.tsx
//
// Guard de rutas para esta app: exclusiva de OPERADOR. Cualquier
// usuario autenticado con otro rol (SUP_CAMPO, SUP_AREA, GERENTE,
// ROOT) queda fuera — su panel es apps/web-supervisor, no esta app.

import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './useAuth'

export function useAuthRole() {
  const { user, rol, loading } = useAuth()

  return {
    rol,
    isLoading: loading,
    isOperador: rol === 'OPERADOR',
    isAuthenticated: !!user,
  }
}

export function RequireOperador({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, isOperador } = useAuthRole()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Cargando...
      </div>
    )
  }

  if (!isAuthenticated || !isOperador) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
