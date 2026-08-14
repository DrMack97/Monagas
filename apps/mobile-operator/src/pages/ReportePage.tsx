// src/pages/ReportePage.tsx
//
// Reporte de evaluación con formato profesional de encabezado.
//
// El botón "Calcular Promedio" funciona BAJO DEMANDA — con las
// lecturas que existan hasta ese momento, sin importar si se
// completaron las horasEval del pozo. El resultado queda marcado
// como:
//   FINAL_24H          — si horasEvaluadas >= horasEval del pozo
//   PRELIMINAR_FORZADO — si se calculó antes de completar el ciclo
//
// El cálculo FINAL_24H envía la evaluación a revisión de supervisor
// (estado → PENDIENTE_SUPERVISOR) — ya NO cierra directo a CERRADA.
// Ese estado queda sin uso en este flujo; ver checklist Fase 2.
// El preliminar forzado guarda un snapshot de resultados pero deja
// la evaluación EN_CURSO — el operador puede seguir registrando
// lecturas después de generar un reporte preliminar.
//
// Lo que pasa después de PENDIENTE_SUPERVISOR (aprobar/rechazar) lo
// resuelve useApprovals.ts en web-supervisor. La sincronización de
// pozo.estado y el ascenso automático a OFICIAL al aprobar quedan a
// cargo de Cloud Functions (Admin SDK) — el Operador no tiene permiso
// de escritura sobre /pozos/{pozoId} en firestore.rules, así que esa
// sincronización no puede hacerse desde este cliente.

import { useState } from 'react'
import { FiSend, FiAlertTriangle } from 'react-icons/fi'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import { usePozoInfo } from '../hooks/usePozoInfo'
import { calcularPromedioEvaluacion } from '@core/calculos'
import { fmt, dateFormat } from '../utils/formatters'
import type { IResultadosEval } from '@core/types'

interface ReportePageProps {
  pozoId: string
  evalId: string
}

export default function ReportePage({ pozoId, evalId }: ReportePageProps) {
  const { pozo } = usePozoInfo(pozoId)
  const { lecturas, loading } = useLecturasEvaluacion(evalId)

  const [resultados, setResultados] = useState<IResultadosEval | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [supervisorArea, setSupervisorArea] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cicloCompleto = pozo ? lecturas.length >= pozo.horasEval : false

  async function handleCalcular() {
    if (lecturas.length === 0) {
      setError('No hay lecturas registradas todavía.')
      return
    }
    setCalculando(true)
    setError(null)
    try {
      const promedio = calcularPromedioEvaluacion(lecturas)
      const tipoCalculo = cicloCompleto ? 'FINAL_24H' : 'PRELIMINAR_FORZADO'

      const nuevosResultados: IResultadosEval = {
        ...promedio,
        tipoCalculo,
        calculadoEn: new Date(),
      }

      await updateDoc(doc(db, 'evaluaciones', evalId), {
        resultados: nuevosResultados,
        ...(tipoCalculo === 'FINAL_24H' && {
          estado: 'PENDIENTE_SUPERVISOR',
          fechaCierre: serverTimestamp(),
        }),
      })

      setResultados(nuevosResultados)
    } catch (err: any) {
      setError('No se pudo calcular. Intenta de nuevo.')
    } finally {
      setCalculando(false)
    }
  }

  function generarTextoWhatsApp(): string {
    if (!resultados || !pozo) return ''
    const primera = lecturas[0]
    const ultima = lecturas[lecturas.length - 1]
    const esPreliminar = resultados.tipoCalculo === 'PRELIMINAR_FORZADO'

    return `📊 *${pozo.empresa ?? '—'}*
📅 Fecha: ${dateFormat(new Date())}
🛢️ Pozo: ${pozo.nombre}
👤 Supervisor de Área: ${supervisorArea || '—'}
⏰ Hora: ${new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} Hrs.
📋 Asunto: ${esPreliminar ? 'Prueba preliminar (cálculo forzado)' : `Finaliza prueba de producción por ${pozo.horasEval} horas`}

*Tiempos de Prueba*
Inicio: ${primera ? dateFormat(primera.timestamp) : '—'}
${esPreliminar ? 'Corte parcial' : 'Finaliza'}: ${ultima ? dateFormat(ultima.timestamp) : '—'}

*Parámetros de Producción (Promediados)*
Bpd: ${fmt(resultados.bpdPromedio)} Bls
Netos: ${fmt(resultados.netosPromedio)} Bls
Q.G: ${fmt(resultados.qgPromedio, 2)} MMSCFD
AyS/BSW: ${fmt((resultados.aysBls / (resultados.bpdPromedio || 1)) * 100, 1)}%

${esPreliminar ? '⚠️ *CÁLCULO PRELIMINAR — no representa el cierre oficial de 24H*' : '📤 *Enviado a Supervisión — pendiente de aprobación*'}`
  }

  if (loading) return <div className="p-6 text-slate-400">Cargando...</div>

  return (
    <div className="min-h-screen bg-slate-950 p-4 max-w-md mx-auto space-y-5">

      {/* Encabezado del reporte */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h1 className="text-lg font-bold text-white mb-3">{pozo?.empresa ?? 'Empresa'}</h1>
        <div className="grid grid-cols-2 gap-y-1.5 text-sm">
          <span className="text-slate-500">Fecha</span>
          <span className="text-white text-right">{dateFormat(new Date())}</span>
          <span className="text-slate-500">Pozo</span>
          <span className="text-white text-right">{pozo?.nombre}</span>
          <span className="text-slate-500">Hora</span>
          <span className="text-white text-right">
            {new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })} Hrs.
          </span>
        </div>

        <div className="mt-3">
          <label className="block text-xs text-slate-500 mb-1">Supervisor de Área</label>
          <input
            value={supervisorArea}
            onChange={(e) => setSupervisorArea(e.target.value)}
            placeholder="Nombre del supervisor"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
      </div>

      {/* Botón de cálculo — siempre disponible, sin condición de 24h */}
      <button
        onClick={handleCalcular}
        disabled={calculando || lecturas.length === 0}
        className="w-full bg-amber-500 text-slate-950 font-medium rounded-lg py-3 disabled:opacity-50"
      >
        {calculando ? 'Calculando...' : cicloCompleto ? 'Calcular Promedio Final (24H)' : 'Calcular Promedio (Forzado)'}
      </button>

      {error && (
        <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Resultado — con badge claro del tipo de cálculo */}
      {resultados && (
        <>
          <div className={`flex items-center justify-center gap-1.5 text-center text-sm font-medium rounded-lg py-2 ${
            resultados.tipoCalculo === 'FINAL_24H'
              ? 'bg-orange-950/40 border border-orange-900 text-orange-400'
              : 'bg-amber-950/40 border border-amber-900 text-amber-400'
          }`}>
            {resultados.tipoCalculo === 'FINAL_24H' ? (
              <><FiSend aria-hidden="true" /> Enviado a Supervisión — 24 Horas Completas</>
            ) : (
              <><FiAlertTriangle aria-hidden="true" /> Cálculo Preliminar Forzado — {resultados.horasTotales}H de {pozo?.horasEval ?? '?'}H</>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Parámetros de Producción</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Dato label="Bpd" valor={`${fmt(resultados.bpdPromedio)} Bls`} />
              <Dato label="Netos" valor={`${fmt(resultados.netosPromedio)} Bls`} />
              <Dato label="Q.G" valor={`${fmt(resultados.qgPromedio, 2)} MMSCFD`} />
              <Dato label="AyS/BSW" valor={`${fmt((resultados.aysBls / (resultados.bpdPromedio || 1)) * 100, 1)}%`} />
              <Dato label="Proyección 24H" valor={`${fmt(resultados.proyeccion24H)} Bls`} />
              <Dato label="Horas evaluadas" valor={`${resultados.horasTotales}H`} />
            </div>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-emerald-600 text-white font-medium rounded-lg py-3"
          >
            Enviar por WhatsApp
          </a>
        </>
      )}
    </div>
  )
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-white font-mono">{valor}</p>
    </div>
  )
}
