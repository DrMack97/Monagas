// src/App.tsx
//
// Routing de la app del Operador. Todo detrás de RequireOperador
// excepto /login. El flujo real: Dashboard (pozo asignado) → Registro
// (captura lecturas) → Reporte (promedio + cierre). TablaPage y
// SettingsPage son accesorias, no bloquean el flujo principal.

import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { RequireOperador } from './hooks/useAuthRole'

import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RegistroPage from './pages/RegistroPage'
import TablaPage from './pages/TablaPage'
import ReportePage from './pages/ReportePage'
import SettingsPage from './pages/SettingsPage'

// ReportePage se diseñó recibiendo {pozoId, evalId} por props (no lee
// la URL directamente) para quedar testeable de forma aislada — este
// wrapper es el único punto que traduce params de ruta a esas props.
function ReporteRoute() {
  const { pozoId, evalId } = useParams<{ pozoId: string; evalId: string }>()
  if (!pozoId || !evalId) return <Navigate to="/dashboard" replace />
  return <ReportePage pozoId={pozoId} evalId={evalId} />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/dashboard"
          element={
            <RequireOperador>
              <DashboardPage />
            </RequireOperador>
          }
        />

        <Route
          path="/registro/:pozoId"
          element={
            <RequireOperador>
              <RegistroPage />
            </RequireOperador>
          }
        />

        <Route
          path="/tabla"
          element={
            <RequireOperador>
              <TablaPage />
            </RequireOperador>
          }
        />

        <Route
          path="/reporte/:pozoId/:evalId"
          element={
            <RequireOperador>
              <ReporteRoute />
            </RequireOperador>
          }
        />

        <Route
          path="/ajustes"
          element={
            <RequireOperador>
              <SettingsPage />
            </RequireOperador>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
