// src/pages/TablaPage.tsx
//
// Historial de lecturas de la evaluación EN_CURSO del pozo asignado.
// Antes leía un mock con campos que no existen en IPozo (produccion,
// ultimaLectura) — ahora lee lecturas reales de la subcolección
// evaluaciones/{evalId}/lecturas vía useLecturasEvaluacion.

import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiClipboard, FiAlertTriangle } from 'react-icons/fi'
import { useAuth } from '../hooks/useAuth'
import { usePozoInfo } from '../hooks/usePozoInfo'
import { useEvaluacionActual } from '../hooks/useEvaluacionActual'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import { fmt, dateFormat } from '../utils/formatters'
import { redondearAHoraEntera, horaEnteraTexto } from '@core/utils/hora'
import { capacidadesZona } from '@core/constants/zonas'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'

export default function TablaPage() {
  const navigate = useNavigate()
  const { user, pozoAsignado } = useAuth()
  const { pozo, loading: loadingPozo } = usePozoInfo(pozoAsignado ?? undefined)
  const { evalId } = useEvaluacionActual(pozoAsignado ?? undefined, user?.uid, pozo?.zona)
  const { lecturas, loading: loadingLecturas } = useLecturasEvaluacion(evalId ?? undefined)

  const loading = loadingPozo || loadingLecturas

  // Norte de Monagas no muestra la columna Netos (Bls); la Faja sí (ver capacidadesZona).
  const { netosEnLecturas } = capacidadesZona(pozo?.zona)
  const columnas = netosEnLecturas ? 4 : 3

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400"><FiArrowLeft aria-label="Volver" /></button>
        <h1 className="text-lg font-bold text-white">Tabla de Lecturas</h1>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <LoadingSpinner message="Cargando lecturas..." />
        ) : lecturas.length === 0 ? (
          <EmptyState
            icon={<FiClipboard />}
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
                    {netosEnLecturas && <th className="py-2 pr-3">Netos (Bls)</th>}
                    <th className="py-2 pr-3">Qg (MMSCFD)</th>
                    <th className="py-2">Alertas</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturas.map((l, i) => {
                    const netos = l.tanques.reduce((acc, t) => acc + t.netos, 0)
                    // La fecha se muestra UNA vez por día (fila separadora), no repetida en cada
                    // fila horaria; la hora va redondeada a la hora entera más cercana.
                    const dia = dateFormat(redondearAHoraEntera(new Date(l.timestamp)))
                    const diaAnterior = i > 0 ? dateFormat(redondearAHoraEntera(new Date(lecturas[i - 1].timestamp))) : null
                    return (
                      <Fragment key={l.id}>
                        {dia !== diaAnterior && (
                          <tr className="text-xs text-slate-500">
                            <td colSpan={columnas} className="pt-3 pb-1">Fecha: {dia}</td>
                          </tr>
                        )}
                        <tr className="border-b border-slate-900 text-slate-300">
                          <td className="py-2 pr-3">{horaEnteraTexto(new Date(l.timestamp))}</td>
                          {netosEnLecturas && <td className="py-2 pr-3">{fmt(netos)}</td>}
                          <td className="py-2 pr-3">{l.gas ? fmt(l.gas.qg, 2) : '—'}</td>
                          <td className="py-2">
                            {l.alertas && l.alertas.length > 0 ? (
                              <span className="text-amber-400 flex items-center gap-1"><FiAlertTriangle aria-hidden="true" /> {l.alertas.join(', ')}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      </Fragment>
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
