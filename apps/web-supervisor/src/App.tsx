// src/App.tsx
//
// Routing del panel de supervisión. Solo se registran rutas hacia
// páginas que YA tienen contenido real — NewWellPage, WellDetailPage
// y UsersPage siguen en 0 líneas (próximos pasos del checklist de
// Fase 1) y se agregan aquí en cuanto existan, no antes: importar un
// archivo vacío rompe la compilación.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function RutaProtegida({ children }: { children: ReactNode }) {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Cargando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (rol === 'OPERADOR') return <Navigate to="/login" replace />

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <RutaProtegida>
              <DashboardPage />
            </RutaProtegida>
          }
        />

        {/* Próximas rutas — se activan cuando cada página exista:
            <Route path="/pozos/nuevo" element={<RutaProtegida><NewWellPage /></RutaProtegida>} />
            <Route path="/pozos/:pozoId" element={<RutaProtegida><WellDetailPage /></RutaProtegida>} />
            <Route path="/usuarios" element={<RutaProtegida><UsersPage /></RutaProtegida>} />
        */}

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
