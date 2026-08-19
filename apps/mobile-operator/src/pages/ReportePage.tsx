// src/pages/ReportePage.tsx
//
// Reporte de evaluación con formato profesional de encabezado.
//
// Flujo en DOS pasos, separados a propósito (ver checklist Fase 2):
//   1. "Calcular" — cómputo 100% local con las lecturas existentes,
//      sin importar si se completaron las horasEval. NO escribe a
//      Firestore — es una vista previa real, el operador puede
//      revisarla y exportarla (WhatsApp/Excel) antes de decidir nada.
//   2. Acción de persistencia, explícita y separada del cálculo:
//      - FINAL_24H (cicloCompleto): "Enviar a Supervisor" — guarda
//        resultados y pasa estado → PENDIENTE_SUPERVISOR. Antes de
//        este cambio, calcular Y enviar pasaban en el mismo click.
//      - PRELIMINAR_FORZADO: "Guardar Snapshot" — guarda resultados
//        como referencia, la evaluación se queda EN_CURSO. Mismo
//        comportamiento de antes, ahora como paso explícito en vez
//        de automático.
//
// Lo que pasa después de PENDIENTE_SUPERVISOR (aprobar/rechazar) lo
// resuelve useApprovals.ts en web-supervisor. La sincronización de
// pozo.estado y el ascenso automático a OFICIAL al aprobar quedan a
// cargo de Cloud Functions (Admin SDK) — el Operador no tiene permiso
// de escritura sobre /pozos/{pozoId} en firestore.rules, así que esa
// sincronización no puede hacerse desde este cliente.

import { useState } from 'react'
import { FiSend, FiAlertTriangle, FiCheckCircle, FiSave } from 'react-icons/fi'
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
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [supervisorArea, setSupervisorArea] = useState('')
  const [error, setError] = useState<string | null>(null)

  const cicloCompleto = pozo ? lecturas.length >= pozo.horasEval : false

  // Paso 1: solo cómputo local — nada de esto toca Firestore. El
  // operador puede calcular tantas veces como quiera mientras revisa
  // la vista previa, sin efectos secundarios hasta que decida enviar.
  function handleCalcular() {
    if (lecturas.length === 0) {
      setError('No hay lecturas registradas todavía.')
      return
    }
    setCalculando(true)
    setError(null)
    setEnviado(false)
    try {
      const promedio = calcularPromedioEvaluacion(lecturas)
      const tipoCalculo = cicloCompleto ? 'FINAL_24H' : 'PRELIMINAR_FORZADO'

      setResultados({
        ...promedio,
        tipoCalculo,
        calculadoEn: new Date(),
      })
    } catch (err: any) {
      setError('No se pudo calcular. Intenta de nuevo.')
    } finally {
      setCalculando(false)
    }
  }

  // Paso 2: persistencia explícita — solo se ejecuta cuando el
  // operador confirma, después de revisar la vista previa.
  async function handleEnviar() {
    if (!resultados) return
    setEnviando(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'evaluaciones', evalId), {
        resultados,
        ...(resultados.tipoCalculo === 'FINAL_24H' && {
          estado: 'PENDIENTE_SUPERVISOR',
          fechaCierre: serverTimestamp(),
        }),
      })
      setEnviado(true)
    } catch (err: any) {
      setError(
        resultados.tipoCalculo === 'FINAL_24H'
          ? 'No se pudo enviar a supervisión. Intenta de nuevo.'
          : 'No se pudo guardar el snapshot. Intenta de nuevo.'
      )
    } finally {
      setEnviando(false)
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

${esPreliminar
  ? '⚠️ *CÁLCULO PRELIMINAR — no representa el cierre oficial de 24H*'
  : enviado
  ? '📤 *Enviado a Supervisión — pendiente de aprobación*'
  : '👁️ *VISTA PREVIA — todavía no enviado a supervisión*'}`
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

      {/* Vista previa — nada de esto se guardó todavía hasta que el
          operador confirme con el botón de abajo. */}
      {resultados && (
        <>
          <div className={`flex items-center justify-center gap-1.5 text-center text-sm font-medium rounded-lg py-2 ${
            resultados.tipoCalculo !== 'FINAL_24H'
              ? 'bg-amber-950/40 border border-amber-900 text-amber-400'
              : enviado
              ? 'bg-orange-950/40 border border-orange-900 text-orange-400'
              : 'bg-slate-800/60 border border-slate-700 text-slate-300'
          }`}>
            {resultados.tipoCalculo !== 'FINAL_24H' ? (
              <><FiAlertTriangle aria-hidden="true" /> Cálculo Preliminar Forzado — {resultados.horasTotales}H de {pozo?.horasEval ?? '?'}H</>
            ) : enviado ? (
              <><FiSend aria-hidden="true" /> Enviado a Supervisión — 24 Horas Completas</>
            ) : (
              <>Vista Previa — 24 Horas Completas</>
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

          {/* Paso 2 — persistencia explícita, separada de calcular */}
          {enviado ? (
            <div className="flex items-center justify-center gap-1.5 text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg py-2.5">
              <FiCheckCircle aria-hidden="true" />
              {resultados.tipoCalculo === 'FINAL_24H' ? 'Enviado a supervisión.' : 'Snapshot guardado.'}
            </div>
          ) : (
            <button
              onClick={handleEnviar}
              disabled={enviando}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-medium rounded-lg py-3 disabled:opacity-50"
            >
              {enviando ? (
                'Guardando...'
              ) : resultados.tipoCalculo === 'FINAL_24H' ? (
                <><FiSend aria-hidden="true" /> Enviar a Supervisor</>
              ) : (
                <><FiSave aria-hidden="true" /> Guardar Snapshot</>
              )}
            </button>
          )}

          <a
            href={`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-slate-800 border border-slate-700 text-white font-medium rounded-lg py-3"
          >
            Compartir por WhatsApp
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
