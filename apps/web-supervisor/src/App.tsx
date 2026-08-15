// src/App.tsx
//
// Routing del panel de supervisión. NewWellPage, WellDetailPage y
// UsersPage ya tienen contenido real (dejaron de estar en 0 líneas)
// y DashboardPage ya navega a ellas — quedaban huérfanas sin ruta
// registrada, lo que hacía que "Crear Pozo" y las tarjetas de pozo
// cayeran en el catch-all y rebotaran a /dashboard.
//
// El path de detalle es "/pozo/:pozoId" (singular) porque así es como
// DashboardPage arma el link: navigate(`/pozo/${pozo.id}`).

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './hooks/useAuth'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewWellPage from './pages/NewWellPage'
import WellDetailPage from './pages/WellDetailPage'
import UsersPage from './pages/UsersPage'
import ApprovalQueuePage from './pages/ApprovalQueuePage'

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

// Igual que RutaProtegida, pero además bloquea a SUP_CAMPO — para
// pantallas exclusivas de SUP_AREA/GERENTE (crear pozo, gestionar
// personal), coincidiendo con canManagePozos() en firestore.rules.
function RutaSoloGestion({ children }: { children: ReactNode }) {
  const { user, rol, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Cargando...
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (rol !== 'SUP_AREA' && rol !== 'GERENTE') return <Navigate to="/dashboard" replace />

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

        <Route
          path="/pozos/nuevo"
          element={
            <RutaSoloGestion>
              <NewWellPage />
            </RutaSoloGestion>
          }
        />

        <Route
          path="/pozo/:pozoId"
          element={
            <RutaProtegida>
              <WellDetailPage />
            </RutaProtegida>
          }
        />

        <Route
          path="/usuarios"
          element={
            <RutaSoloGestion>
              <UsersPage />
            </RutaSoloGestion>
          }
        />

        <Route
          path="/aprobaciones"
          element={
            <RutaSoloGestion>
              <ApprovalQueuePage />
            </RutaSoloGestion>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
