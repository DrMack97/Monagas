// src/pages/TablaPage.tsx
//
// Historial de lecturas de la evaluación EN_CURSO del pozo asignado.
// Antes leía un mock con campos que no existen en IPozo (produccion,
// ultimaLectura) — ahora lee lecturas reales de la subcolección
// evaluaciones/{evalId}/lecturas vía useLecturasEvaluacion.

import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePozoInfo } from '../hooks/usePozoInfo'
import { useEvaluacionActual } from '../hooks/useEvaluacionActual'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import { fmt, dateFormat } from '../utils/formatters'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function TablaPage() {
  const navigate = useNavigate()
  const { user, pozoAsignado } = useAuth()
  const { pozo, loading: loadingPozo } = usePozoInfo(pozoAsignado ?? undefined)
  const { evalId } = useEvaluacionActual(pozoAsignado ?? undefined, user?.uid, pozo?.zona)
  const { lecturas, loading: loadingLecturas } = useLecturasEvaluacion(evalId ?? undefined)

  const loading = loadingPozo || loadingLecturas

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400">←</button>
        <h1 className="text-lg font-bold text-white">Tabla de Lecturas</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <LoadingSpinner message="Cargando lecturas..." />
        ) : lecturas.length === 0 ? (
          <EmptyState
            icon="📋"
            title="Sin lecturas todavía"
            message="Registra la primera lectura desde la pantalla de Registro."
            actionLabel={pozo ? 'Ir a Registro' : undefined}
            onAction={pozo ? () => navigate(`/registro/${pozo.id}`) : undefined}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-800">
                    <th className="py-2 pr-3">Hora</th>
                    <th className="py-2 pr-3">Netos (Bls)</th>
                    <th className="py-2 pr-3">Qg (MPCGD)</th>
                    <th className="py-2">Alertas</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturas.map((l) => {
                    const netos = l.tanques.reduce((acc, t) => acc + t.netos, 0)
                    return (
                      <tr key={l.id} className="border-b border-slate-900 text-slate-300">
                        <td className="py-2 pr-3">{dateFormat(l.timestamp)}</td>
                        <td className="py-2 pr-3">{fmt(netos)}</td>
                        <td className="py-2 pr-3">{l.gas ? fmt(l.gas.qg, 2) : '—'}</td>
                        <td className="py-2">
                          {l.alertas && l.alertas.length > 0 ? (
                            <span className="text-amber-400">⚠️ {l.alertas.join(', ')}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {pozo && evalId && (
              <button
                onClick={() => navigate(`/reporte/${pozo.id}/${evalId}`)}
                className="w-full bg-amber-500 text-slate-950 font-medium rounded-lg py-3"
              >
                Ver Reporte
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
