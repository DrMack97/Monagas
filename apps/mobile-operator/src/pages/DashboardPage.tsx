// src/pages/DashboardPage.tsx
//
// Vista principal del Operador. A diferencia del panel de supervisión,
// aquí no hay lista de pozos: el Operador tiene UN (1) solo pozo
// asignado (Custom Claim `pozoAsignado`, ver firestore.rules), leído
// vía usePozoInfo. Sin pozo asignado no hay nada que registrar.

import { useNavigate } from 'react-router-dom'
import { FiSettings, FiDroplet } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { usePozoInfo } from '../hooks/usePozoInfo'
import EmptyState from '../components/EmptyState'
import LoadingSpinner from '../components/LoadingSpinner'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, pozoAsignado, logout } = useAuth()
  const { pozo, loading } = usePozoInfo(pozoAsignado ?? undefined)

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Well Testing App</h1>
          <p className="text-xs text-slate-500">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/ajustes')} className="text-slate-400 text-sm">
            <FiSettings aria-label="Ajustes" />
          </button>
          <button onClick={() => logout()} className="text-slate-400 text-sm">
            Salir
          </button>
        </div>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-4">
        {loading ? (
          <LoadingSpinner message="Cargando pozo asignado..." />
        ) : !pozoAsignado || !pozo ? (
          <EmptyState
            icon={<FiDroplet />}
            title="Sin pozo asignado"
            message="Todavía no tienes un pozo asignado. Contacta a tu Supervisor de Área."
          />
        ) : (
          <>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">{pozo.nombre}</h2>
                <span className="px-2 py-1 text-xs rounded bg-amber-950/40 text-amber-400 border border-amber-900">
                  {pozo.estado}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                Campo: {pozo.campo} · Zona: {pozo.zona}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                Ciclo de evaluación: {pozo.horasEval}H
              </p>
            </div>

            <button
              onClick={() => navigate(`/registro/${pozo.id}`)}
              className="w-full bg-amber-500 text-slate-950 font-medium rounded-lg py-3"
            >
              Registrar Lectura
            </button>

            <button
              onClick={() => navigate('/tabla')}
              className="w-full bg-slate-900 border border-slate-800 text-white font-medium rounded-lg py-3"
            >
              Ver Tabla de Lecturas
            </button>
          </>
        )}
      </div>
    </div>
  )
}
