// src/pages/DashboardPage.tsx
//
// Vista principal del Supervisor. La visibilidad de pozos está
// completamente delegada a usePozosVisibles, que aplica la lógica
// de rol (SUP_CAMPO: 1 pozo · SUP_AREA: su zona · GERENTE: todos) —
// esta página no filtra nada por su cuenta, solo consume lo que el
// hook ya devolvió correctamente autorizado.
//
// Nota de diseño: las métricas de pozos (en curso, pendientes,
// personal asignado) se calculan a partir de IPozo directamente, sin
// queries adicionales a /evaluaciones. "Total Netos Fiscalizado" SÍ
// necesita esas queries — en vez de denormalizar el dato en el pozo
// (la opción que se descartó a propósito, ver checklist Fase 5 #40),
// se reutiliza useAnalyticsData.ts tal cual, que ya resuelve esto
// mismo para AnalyticsPage.tsx con el scoping correcto por rol/zona
// (SUP_CAMPO: 1 pozo · SUP_AREA: su zona · GERENTE: todos) — sin
// inventar un segundo cálculo en paralelo.

import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiDroplet, FiCheckCircle, FiClock, FiUsers, FiTrendingUp } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { usePozosVisibles } from '../hooks/usePozosVisibles'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'
import MetricCard from '../components/dashboard/MetricCard'
import PozoSupervisorCard from '../components/dashboard/PozoSupervisorCard'
import { LoadingState, ErrorState, EmptyState } from '../components/dashboard/DashboardStates'

const CONTEXTO_POR_ROL: Record<string, (zona: string | null) => string> = {
  SUP_CAMPO: () => 'Tu pozo asignado',
  SUP_AREA: (zona) => `Zona ${zona ?? '—'}`,
  GERENTE: () => 'Todos los pozos del sistema',
}

// Coincide exactamente con canManagePozoEnZona() en firestore.rules —
// SUP_CAMPO queda fuera a propósito, no crea ni gestiona pozos.
const PUEDE_CREAR_POZO: Record<string, boolean> = {
  SUP_AREA: true,
  GERENTE: true,
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, rol, zona, pozoAsignado, loading: loadingAuth, logout } = useAuth()
  const { pozos, loading: loadingPozos, error } = usePozosVisibles(rol, zona, pozoAsignado)
  // useAnalyticsData ya se auto-restringe a SUP_AREA/GERENTE (mismo
  // alcance que Analytics) — SUP_CAMPO no gestiona zona/portafolio,
  // así que no aplica mostrarle un total fiscalizado agregado.
  const puedeVerFiscalizado = rol === 'SUP_AREA' || rol === 'GERENTE'
  const { kpis, loading: loadingKpis } = useAnalyticsData(rol, zona)

  const metricas = useMemo(() => {
    const enCurso = pozos.filter((p) => p.estado === 'EN_CURSO').length
    const pendientes = pozos.filter(
      (p) => p.estado === 'PENDIENTE_SUPERVISOR' || p.estado === 'CERRADA'
    ).length
    const totalPersonal = pozos.reduce((acc, p) => acc + (p.asignados?.length ?? 0), 0)
    return { total: pozos.length, enCurso, pendientes, totalPersonal }
  }, [pozos])

  const loading = loadingAuth || loadingPozos
  const contexto = rol ? CONTEXTO_POR_ROL[rol]?.(zona) ?? '' : ''
  const puedeCrearPozo = rol ? PUEDE_CREAR_POZO[rol] ?? false : false

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar rol={rol} />

      <div className="flex-1 min-w-0">
        <Header nombre={user?.displayName ?? user?.email ?? null} rol={rol} onLogout={logout} />

        {/* Sub-header con contexto de alcance */}
        <div className="p-4 md:p-6 pb-0 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Supervisión de Pozos</h1>
            <p className="text-sm text-slate-400 mt-0.5">{contexto}</p>
          </div>
          {puedeCrearPozo && (
            <button
              onClick={() => navigate('/pozos/nuevo')}
              className="text-sm font-medium bg-amber-500 text-slate-950 rounded-lg px-4 py-2 hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              + Crear Pozo
            </button>
          )}
        </div>

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
          {/* Métricas clave */}
          <div className={`grid grid-cols-2 gap-3 ${puedeVerFiscalizado ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
            <MetricCard label="Pozos visibles" value={String(metricas.total)} icon={<FiDroplet />} accent="slate" />
            <MetricCard label="En Curso" value={String(metricas.enCurso)} icon={<FiCheckCircle />} accent="amber" />
            <MetricCard label="Pendientes" value={String(metricas.pendientes)} icon={<FiClock />} accent="blue" />
            <MetricCard label="Personal asignado" value={String(metricas.totalPersonal)} icon={<FiUsers />} accent="emerald" />
            {puedeVerFiscalizado && (
              <MetricCard
                label="Total Netos Fiscalizado"
                value={loadingKpis ? '—' : kpis.produccionTotal.toFixed(1)}
                unit="Bls"
                icon={<FiTrendingUp />}
                accent="emerald"
              />
            )}
          </div>

          {/* Lista de pozos */}
          <div>
            <h2 className="text-sm font-semibold text-slate-400 mb-3 uppercase tracking-wide">
              Pozos
            </h2>

            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState message={error} />
            ) : pozos.length === 0 ? (
              <EmptyState rol={rol} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {pozos.map((pozo) => (
                  <PozoSupervisorCard
                    key={pozo.id}
                    pozo={pozo}
                    onPress={() => navigate(`/pozo/${pozo.id}`)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
