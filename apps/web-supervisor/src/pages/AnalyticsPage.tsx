// src/pages/AnalyticsPage.tsx
//
// Exclusiva SUP_AREA/GERENTE (App.tsx la protege con RutaSoloGestion,
// igual que Aprobaciones y Usuarios). KPIs reales vía useAnalyticsData
// — nada de cifras inventadas. Los gráficos de línea/barras quedan
// como placeholder honesto (sin librería de gráficos en el proyecto
// todavía) en vez de fabricar un gráfico con datos falsos.

import { useMemo } from 'react'
import { FiDroplet, FiTrendingUp, FiCheckCircle, FiClock, FiBarChart2 } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { useAnalyticsData } from '../hooks/useAnalyticsData'
import { usePozosVisibles } from '../hooks/usePozosVisibles'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'
import MetricCard from '../components/dashboard/MetricCard'

const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO: 'En Curso',
  PENDIENTE_SUPERVISOR: 'Pendiente Supervisor',
  APROBADA_SUPERVISOR: 'Aprobada',
  OFICIAL: 'Oficial',
  CERRADA: 'Cerrada',
}

function fecha(valor: any): string {
  if (!valor) return '—'
  const d = typeof valor.toDate === 'function' ? valor.toDate() : new Date(valor)
  return new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AnalyticsPage() {
  const { user, rol, zona, pozoAsignado, logout } = useAuth()
  const { evaluaciones, kpis, loading, error } = useAnalyticsData(rol, zona)
  const { pozos } = usePozosVisibles(rol, zona, pozoAsignado)

  const pozoPorId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of pozos) map[p.id] = p.nombre
    return map
  }, [pozos])

  const recientes = useMemo(
    () =>
      [...evaluaciones]
        .sort((a, b) => {
          const fa = (a.fechaCierre as any)?.toDate?.() ?? a.fechaCierre ?? a.creadoEn
          const fb = (b.fechaCierre as any)?.toDate?.() ?? b.fechaCierre ?? b.creadoEn
          return new Date(fb as any).getTime() - new Date(fa as any).getTime()
        })
        .slice(0, 5),
    [evaluaciones]
  )

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar rol={rol} />

      <div className="flex-1 min-w-0">
        <Header nombre={user?.displayName ?? user?.email ?? null} rol={rol} onLogout={logout} />

        <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Analytics</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {rol === 'GERENTE' ? 'Todos los pozos del sistema' : `Zona ${zona ?? '—'}`}
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard label="Pozos visibles" value={String(pozos.length)} icon={<FiDroplet />} accent="slate" />
            <MetricCard
              label="Producción Oficial"
              value={loading ? '—' : kpis.produccionTotal.toFixed(1)}
              unit="Bls"
              icon={<FiTrendingUp />}
              accent="emerald"
            />
            <MetricCard
              label="Aprobaciones Hoy"
              value={loading ? '—' : String(kpis.aprobacionesHoy)}
              icon={<FiCheckCircle />}
              accent="amber"
            />
            <MetricCard
              label="Tiempo Prom. Aprobación"
              value={loading || kpis.tiempoPromedioAprobacionHoras === null ? '—' : kpis.tiempoPromedioAprobacionHoras.toFixed(1)}
              unit={kpis.tiempoPromedioAprobacionHoras === null ? undefined : 'horas'}
              icon={<FiClock />}
              accent="blue"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Producción por Día</h2>
              <div className="h-48 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <FiBarChart2 aria-hidden="true" /> Gráfico pendiente — sin librería de gráficos en el proyecto todavía
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold text-slate-300 mb-3">Aprobaciones por Supervisor</h2>
              <div className="h-48 flex items-center justify-center gap-2 text-slate-500 text-sm">
                <FiBarChart2 aria-hidden="true" /> Gráfico pendiente — sin librería de gráficos en el proyecto todavía
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Actividad Reciente</h2>
            {loading ? (
              <p className="text-sm text-slate-500">Cargando...</p>
            ) : recientes.length === 0 ? (
              <p className="text-sm text-slate-500">Sin evaluaciones todavía.</p>
            ) : (
              <div className="space-y-2">
                {recientes.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 p-3 bg-slate-950/60 rounded-lg text-sm">
                    <div>
                      <p className="text-white font-medium">{pozoPorId[e.pozoId] ?? e.pozoId}</p>
                      <p className="text-slate-500 text-xs">{fecha(e.fechaCierre ?? e.creadoEn)}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 whitespace-nowrap">
                      {ESTADO_LABEL[e.estado] ?? e.estado}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
