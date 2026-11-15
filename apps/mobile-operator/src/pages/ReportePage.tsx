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

import { useId, useState } from 'react'
import { FiArrowLeft, FiSend, FiAlertTriangle, FiCheckCircle, FiSave, FiFileText, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import { useReporteAnterior } from '../hooks/useReporteAnterior'
import { aInputDatetimeLocal } from '../utils/fechaInput'
import { usePozoInfo } from '../hooks/usePozoInfo'
import { calcularPromedioEvaluacion } from '@core/calculos'
import { construirReporteEstandar, reporteAWhatsApp } from '@core/utils/reporteEstandar'
import { horaEnteraTexto } from '@core/utils/hora'
import { resumenTrasegado } from '@core/utils/trasegado'
import { existenciaMedida, aTextoBls } from '@core/utils/existencia'
import { validarExistencia, validarTrasegadoAcumulado, BLS_POR_PULGADA_DEFECTO, type NivelAlerta } from '@core/utils/balanceMasas'
import { fmt, dateFormat } from '../utils/formatters'
import { exportarInformeExcel } from '../utils/exportExcel'
import type { IResultadosEval, IReporteOperativo, IViajeVacuum } from '@core/types'

type CampoTesting = 'fechaAlineacion' | 'fechaCulminacion' | 'estadoActual' | 'asunto' | 'plan' | 'api'
type CampoSupervisor = 'supervisorPDVSA' | 'supervisorPDVSANocturno' | 'cuadrillaDiurno' | 'cuadrillaNocturno'

interface ViajeForm {
  fechaHora: string // datetime-local
  chofer: string
  volumen: string
  destino: string
}

interface ReportePageProps {
  pozoId: string
  evalId: string
  /** Volver a la pantalla anterior; lo resuelve la ruta (App.tsx) para que esta pantalla siga aislada y testeable. */
  onVolver?: () => void
}

export default function ReportePage({ pozoId, evalId, onVolver }: ReportePageProps) {
  const { pozo } = usePozoInfo(pozoId)
  const { lecturas, loading } = useLecturasEvaluacion(evalId)

  const [resultados, setResultados] = useState<IResultadosEval | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [exportando, setExportando] = useState(false)
  const [supervisorArea, setSupervisorArea] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Campos de cierre del "REPORTE OPERACIONES DE WT" estándar (Gerencia de
  // Producción, División Punta de Mata; Informe Técnico Willytank 04/11/2026,
  // sección 2) — se llenan una sola vez, no por lectura horaria (ver
  // IReporteOperativo en @monagas/core). El texto lo arma construirReporteEstandar.
  // Reporte anterior del pozo (ciclo actual y anteriores): fuente del prefill. Los nombres de los supervisores no se
  // escriben hora a hora: tras el primer registro se autocompletan en los reportes posteriores.
  const { anterior } = useReporteAnterior(pozoId, evalId)
  // Supervisores: lo editado por el operador; si no lo ha tocado, el del reporte anterior; si no, vacío.
  const [supEditado, setSupEditado] = useState<Partial<Record<CampoSupervisor, string>>>({})
  const supAnterior = (campo: CampoSupervisor): string | undefined => {
    const v = anterior?.[campo]
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }
  const valorSup = (campo: CampoSupervisor): string => supEditado[campo] ?? supAnterior(campo) ?? ''
  const supPrefill = (campo: CampoSupervisor): boolean => supEditado[campo] === undefined && supAnterior(campo) !== undefined
  const editarSup = (campo: CampoSupervisor) => (valor: string) => setSupEditado((prev) => ({ ...prev, [campo]: valor }))
  const supervisorPDVSA = valorSup('supervisorPDVSA')                       // Supv. Producción PDVSA — diurno
  const supervisorPDVSANocturno = valorSup('supervisorPDVSANocturno')
  const cuadrillaDiurno = valorSup('cuadrillaDiurno')                       // Supv. Well Testing (DSI)
  const cuadrillaNocturno = valorSup('cuadrillaNocturno')
  const hayPrefillSupervisores = (['supervisorPDVSA', 'supervisorPDVSANocturno', 'cuadrillaDiurno', 'cuadrillaNocturno'] as CampoSupervisor[]).some(supPrefill)
  // Datos del testing (fecha de inicio y de culminación, estatus actual, asunto, plan y API): se precargan desde el
  // reporte anterior; lo editado por el operador manda y, si lo borra a propósito, no se vuelve a rellenar.
  const [testingEditado, setTestingEditado] = useState<Partial<Record<CampoTesting, string>>>({})
  const testingAnterior = (campo: CampoTesting): string | undefined => {
    if (!anterior) return undefined
    if (campo === 'fechaAlineacion' || campo === 'fechaCulminacion') return aInputDatetimeLocal(anterior[campo])
    if (campo === 'api') {
      const api = anterior.tipoFluido?.api
      return typeof api === 'number' && Number.isFinite(api) ? String(api) : undefined
    }
    const v = anterior[campo]
    return typeof v === 'string' && v.trim() !== '' ? v : undefined
  }
  const valorTesting = (campo: CampoTesting): string => testingEditado[campo] ?? testingAnterior(campo) ?? ''
  const testingPrefill = (campo: CampoTesting): boolean => testingEditado[campo] === undefined && testingAnterior(campo) !== undefined
  const editarTesting = (campo: CampoTesting) => (valor: string) => setTestingEditado((prev) => ({ ...prev, [campo]: valor }))
  const fechaAlineacion = valorTesting('fechaAlineacion')                   // Fecha Inicio Well Testing
  const fechaCulminacion = valorTesting('fechaCulminacion')
  const estadoActual = valorTesting('estadoActual')
  const asunto = valorTesting('asunto')
  const plan = valorTesting('plan')
  const api = valorTesting('api')
  const hayPrefillTesting = (['fechaAlineacion', 'fechaCulminacion', 'estadoActual', 'asunto', 'plan', 'api'] as CampoTesting[]).some(testingPrefill)
  // Existencia y Trasegable: la Existencia carga la medición de los tanques en la última lectura (Σ medida final × factor
  // del tanque) y ese mismo valor se refleja en Trasegable como previsión de fluidos incarreables. Ambos siguen siendo
  // editables; Trasegable acompaña a la Existencia mientras el operador no lo cambie.
  const medidaTanques = existenciaMedida(pozo?.tanques ?? [], lecturas[lecturas.length - 1])
  const [existenciaEditada, setExistenciaEditada] = useState<string | undefined>(undefined)
  const [trasegableEditado, setTrasegableEditado] = useState<string | undefined>(undefined)
  const existencia = existenciaEditada ?? (medidaTanques !== undefined ? aTextoBls(medidaTanques) : '')
  const trasegable = trasegableEditado ?? existencia
  const existenciaPrefill = existenciaEditada === undefined && medidaTanques !== undefined
  const trasegablePrefill = trasegableEditado === undefined && existencia.trim() !== ''
  const [totalTrasegado, setTotalTrasegado] = useState('')
  const [nivelCellar, setNivelCellar] = useState('')
  const [viajesVacuum, setViajesVacuum] = useState('')
  const [viajes24h, setViajes24h] = useState<ViajeForm[]>([])
  const [mostrarDatosPDVSA, setMostrarDatosPDVSA] = useState(false)

  function actualizarViaje(idx: number, campo: keyof ViajeForm, valor: string) {
    setViajes24h((prev) => prev.map((v, i) => (i === idx ? { ...v, [campo]: valor } : v)))
  }

  function construirReporteOperativo(): IReporteOperativo {
    // Un viaje sin fecha y hora no se puede ubicar en las últimas 24 h: se descarta.
    const viajes: IViajeVacuum[] = viajes24h
      .filter((v) => v.fechaHora)
      .map((v) => ({
        fechaHora: new Date(v.fechaHora),
        chofer: v.chofer.trim(),
        volumen: parseFloat(v.volumen) || 0,
        destino: v.destino.trim(),
      }))
    return {
      ...(supervisorPDVSA.trim() && { supervisorPDVSA: supervisorPDVSA.trim() }),
      ...(supervisorPDVSANocturno.trim() && { supervisorPDVSANocturno: supervisorPDVSANocturno.trim() }),
      ...(cuadrillaDiurno.trim() && { cuadrillaDiurno: cuadrillaDiurno.trim() }),
      ...(cuadrillaNocturno.trim() && { cuadrillaNocturno: cuadrillaNocturno.trim() }),
      ...(fechaAlineacion && { fechaAlineacion: new Date(fechaAlineacion) }),
      ...(fechaCulminacion && { fechaCulminacion: new Date(fechaCulminacion) }),
      ...(estadoActual.trim() && { estadoActual: estadoActual.trim() }),
      ...(asunto.trim() && { asunto: asunto.trim() }),
      ...(plan.trim() && { plan: plan.trim() }),
      ...(viajes.length > 0 && { viajesVacuum24h: viajes }),
      ...(api && { tipoFluido: { api: parseFloat(api) || 0 } }),
      ...(() => {
        // Solo se guarda lo que realmente hay: un campo vacío no se convierte en 0 ("—" en el reporte, no un 0 inventado).
        const num = (t: string) => (t.trim() !== '' ? parseFloat(t) || 0 : undefined)
        const exi = num(existencia)
        const tra = num(trasegable)
        const tot = num(totalTrasegado)
        if (exi === undefined && tra === undefined && tot === undefined) return {}
        return {
          resumenTanques: {
            ...(exi !== undefined && { existencia: exi }),
            ...(tra !== undefined && { trasegable: tra }),
            ...(tot !== undefined && { totalTrasegado: tot }),
          },
        }
      })(),
      ...(nivelCellar && { nivelCellar: parseFloat(nivelCellar) || 0 }),
      ...(viajesVacuum && { viajesVacuum: parseFloat(viajesVacuum) || 0 }),
    }
  }

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
      const reporteOperativo = construirReporteOperativo()
      await updateDoc(doc(db, 'evaluaciones', evalId), {
        resultados,
        ...(Object.keys(reporteOperativo).length > 0 && { reporteOperativo }),
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
          : 'No se pudo guardar el avance. Intenta de nuevo.'
      )
    } finally {
      setEnviando(false)
    }
  }

  // La exportación puede fallar (guardar el archivo, abrir el menú de compartir): se avisa en pantalla;
  // antes un fallo quedaba en silencio y el botón parecía roto sin explicación.
  async function handleExportarExcel() {
    if (!resultados || !pozo) return
    setExportando(true)
    setError(null)
    try {
      await exportarInformeExcel({ pozo, resultados, lecturas, supervisorArea, reporteOperativo: construirReporteOperativo() })
    } catch (err) {
      console.error('Exportar Excel', err)
      setError('No se pudo exportar el Excel. Intenta de nuevo.')
    } finally {
      setExportando(false)
    }
  }

  // Reporte operacional estándar (Informe Técnico Willytank, 04/11/2026, sección 2): la estructura
  // vive en el núcleo (construirReporteEstandar) y es la MISMA del Excel. Los valores puntuales
  // (presiones, gas) salen de la ÚLTIMA lectura; BPH/BPD/BSW de los promedios de la evaluación.
  // Las alertas operativas no forman parte del reporte (control interno).
  function datosReporte() {
    if (!resultados || !pozo) return null
    return {
      pozo,
      reporte: construirReporteOperativo(),
      resultados,
      lecturas,
      ahora: new Date(),
      fechaInicioFallback: lecturas[0] ? new Date(lecturas[0].timestamp) : undefined,
    }
  }

  function generarTextoWhatsApp(): string {
    const datos = datosReporte()
    return datos ? reporteAWhatsApp(construirReporteEstandar(datos)) : ''
  }

  // Alerta de balance de masas al cierre (preventiva, NO bloquea): lo que el Operador digita se contrasta con lo
  // medido. Existencia digitada vs. Σ (medida final × factor del tanque) de la última lectura; Total trasegado
  // acumulado digitado no puede ser menor que lo trasegado en este ciclo.
  const avisosCierre = (() => {
    const ultimaLectura = lecturas[lecturas.length - 1]
    const tanquesPozo = pozo?.tanques ?? []
    const medida = ultimaLectura
      ? tanquesPozo.reduce((acc, t) => acc + (ultimaLectura.tanques.find((x) => x.tanqueId === t.id)?.mf ?? 0) * t.ft, 0)
      : 0
    const umbral = tanquesPozo.length > 0 ? Math.max(...tanquesPozo.map((t) => t.ft)) : BLS_POR_PULGADA_DEFECTO
    const trasegadoCiclo = resumenTrasegado(lecturas).totalBls
    const f = (n: number) => n.toFixed(2)
    const sinAviso = { nivel: 'OK' as NivelAlerta, aviso: undefined as string | undefined }

    const exi = existencia.trim() !== '' && ultimaLectura
      ? (() => {
          const v = validarExistencia(parseFloat(existencia) || 0, medida, umbral)
          return v.nivel === 'OK'
            ? sinAviso
            : {
                nivel: v.nivel,
                aviso: `${v.nivel === 'ROJA' ? 'Alerta roja' : 'Alerta amarilla'}: difiere ${f(Math.abs(v.diferencia))} Bls de la medida por nivel (${f(medida)} Bls).${v.posibleDecimal ? ' ¿Se omitió o sobra un decimal?' : ''}`,
              }
        })()
      : sinAviso
    const tra = totalTrasegado.trim() !== ''
      ? (() => {
          const v = validarTrasegadoAcumulado(parseFloat(totalTrasegado) || 0, trasegadoCiclo)
          return v.nivel === 'OK'
            ? sinAviso
            : {
                nivel: v.nivel,
                aviso: `Alerta roja: el acumulado (${f(parseFloat(totalTrasegado) || 0)} Bls) es menor que lo trasegado en este ciclo (${f(trasegadoCiclo)} Bls); no puede serlo.${v.posibleDecimal ? ' ¿Se omitió un decimal?' : ''}`,
              }
        })()
      : sinAviso
    return { existencia: exi, totalTrasegado: tra }
  })()

  // Sin esto la pantalla no tenía cómo retroceder y el usuario tenía que cerrar la app.
  const botonVolver = (
    <button
      type="button"
      onClick={onVolver}
      className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white"
    >
      <FiArrowLeft aria-hidden="true" /> Volver
    </button>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="p-4 max-w-2xl mx-auto space-y-5">
          {botonVolver}
          <p className="text-slate-400">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {botonVolver}

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
            {horaEnteraTexto(new Date())} Hrs.
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

      {/* Datos de cierre del formato PDVSA — opcionales, se llenan una
          sola vez por reporte (ver IReporteOperativo, checklist Fase 4). */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <button
          onClick={() => setMostrarDatosPDVSA((v) => !v)}
          className="flex items-center justify-between w-full text-sm font-semibold text-slate-300"
        >
          Datos del Reporte
          {mostrarDatosPDVSA ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
        </button>

        {mostrarDatosPDVSA && (
          <div className="mt-3 space-y-3">
            {hayPrefillSupervisores && (
              <p className="text-xs text-slate-500">Nombres tomados del reporte anterior; edítalos si cambiaron.</p>
            )}
            <p className="text-xs text-slate-500">Supv. Producción PDVSA</p>
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="Diurno" value={supervisorPDVSA} onChange={editarSup('supervisorPDVSA')} prefill={supPrefill('supervisorPDVSA')} />
              <CampoTexto label="Nocturno" value={supervisorPDVSANocturno} onChange={editarSup('supervisorPDVSANocturno')} prefill={supPrefill('supervisorPDVSANocturno')} />
            </div>

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-800">Supv. Well Testing</p>
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="Diurno" value={cuadrillaDiurno} onChange={editarSup('cuadrillaDiurno')} prefill={supPrefill('cuadrillaDiurno')} />
              <CampoTexto label="Nocturno" value={cuadrillaNocturno} onChange={editarSup('cuadrillaNocturno')} prefill={supPrefill('cuadrillaNocturno')} />
            </div>

            {hayPrefillTesting && (
              <p className="text-xs text-slate-500 pt-1 border-t border-slate-800">Datos del testing tomados del reporte anterior; edítalos si cambiaron.</p>
            )}
            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
              <CampoTexto label="Fecha Inicio Well Testing" value={fechaAlineacion} onChange={editarTesting('fechaAlineacion')} type="datetime-local" prefill={testingPrefill('fechaAlineacion')} />
              <CampoTexto label="Fecha Culminación" value={fechaCulminacion} onChange={editarTesting('fechaCulminacion')} type="datetime-local" prefill={testingPrefill('fechaCulminacion')} />
            </div>
            <p className="text-xs text-slate-500">Sin fecha de culminación el reporte dice "En progreso".</p>

            <CampoArea label="Estatus actual" value={estadoActual} onChange={editarTesting('estadoActual')} prefill={testingPrefill('estadoActual')}
              placeholder="ej: Pozo fluyendo a través del SWT en superficie y quema de gas en sitio" />
            <CampoArea label="Asunto" value={asunto} onChange={editarTesting('asunto')} prefill={testingPrefill('asunto')}
              placeholder="ej: Inicia prueba de producción a las 09:00 am por orden del representante del cliente" />
            <CampoArea label="Plan" value={plan} onChange={editarTesting('plan')} prefill={testingPrefill('plan')}
              placeholder="ej: Evaluar comportamiento operacional de pozo con unidad WT" />

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-800">Calidad del fluido</p>
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="API (°)" value={api} onChange={editarTesting('api')} type="number" prefill={testingPrefill('api')} />
            </div>
            <p className="text-xs text-slate-500">
              BSW: se toma del AyS% ya registrado en las lecturas — no se repite acá.
            </p>

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-800">Tanques de almacenamiento</p>
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="Existencia (Bls)" value={existencia} onChange={setExistenciaEditada} type="number" nivel={avisosCierre.existencia.nivel} aviso={avisosCierre.existencia.aviso} prefill={existenciaPrefill} />
              <CampoTexto label="Trasegable (Bls)" value={trasegable} onChange={setTrasegableEditado} type="number" prefill={trasegablePrefill} />
              <CampoTexto label="Total Trasegado Acumulado (Bls)" value={totalTrasegado} onChange={setTotalTrasegado} type="number" nivel={avisosCierre.totalTrasegado.nivel} aviso={avisosCierre.totalTrasegado.aviso} />
            </div>
            <p className="text-xs text-slate-500">
              {existenciaPrefill || trasegablePrefill
                ? 'Existencia tomada de la medición de los tanques en la última lectura (medida final × factor del tanque); Trasegable la repite como previsión de fluidos incarreables. Edítalos si cambiaron.'
                : 'Existencia: medición de los tanques (medida final × factor del tanque). Trasegable: previsión de fluidos incarreables.'}
            </p>

            <p className="text-xs text-slate-500 pt-1 border-t border-slate-800">Control de vacuum y disposición</p>
            <div className="grid grid-cols-2 gap-3">
              <CampoTexto label="Nivel de Celler (%)" value={nivelCellar} onChange={setNivelCellar} type="number" />
              <CampoTexto label="Total Viajes Vacuum Acumulados" value={viajesVacuum} onChange={setViajesVacuum} type="number" />
            </div>

            <p className="text-xs text-slate-500">Viajes de vacuum — últimas 24 Hrs</p>
            {viajes24h.map((v, idx) => (
              <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Viaje #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => setViajes24h((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-xs text-red-400"
                  >
                    Quitar
                  </button>
                </div>
                <CampoTexto label={`Fecha y hora (viaje #${idx + 1})`} value={v.fechaHora} onChange={(x) => actualizarViaje(idx, 'fechaHora', x)} type="datetime-local" />
                <div className="grid grid-cols-2 gap-3">
                  <CampoTexto label={`Chófer (viaje #${idx + 1})`} value={v.chofer} onChange={(x) => actualizarViaje(idx, 'chofer', x)} />
                  <CampoTexto label={`Volumen en Bls (viaje #${idx + 1})`} value={v.volumen} onChange={(x) => actualizarViaje(idx, 'volumen', x)} type="number" />
                </div>
                <CampoTexto label={`Destino (viaje #${idx + 1})`} value={v.destino} onChange={(x) => actualizarViaje(idx, 'destino', x)} />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setViajes24h((prev) => [...prev, { fechaHora: '', chofer: '', volumen: '', destino: '' }])}
              className="text-sm text-amber-400"
            >
              + Agregar viaje
            </button>
            <p className="text-xs text-slate-500">
              El total trasegado de 24 Hrs se suma de los viajes. Un viaje sin fecha y hora no se incluye.
            </p>
          </div>
        )}
      </div>

      {/* Botón de cálculo — siempre disponible, sin condición de 24h */}
      <button
        onClick={handleCalcular}
        disabled={calculando || lecturas.length === 0}
        className="w-full bg-amber-500 text-slate-950 font-medium rounded-lg py-3 disabled:opacity-50"
      >
        {calculando ? 'Calculando...' : cicloCompleto ? 'Calcular Promedio Final (24H)' : 'Calcular Promedio'}
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
              <><FiAlertTriangle aria-hidden="true" /> Cálculo Preliminar — {resultados.horasTotales}H de {pozo?.horasEval ?? '?'}H</>
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
              {resultados.tipoCalculo === 'FINAL_24H' ? 'Enviado a supervisión.' : 'Avance guardado.'}
            </div>
          ) : (
            <div className="space-y-1.5">
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
                <><FiSave aria-hidden="true" /> Guardar avance</>
              )}
            </button>
            {resultados.tipoCalculo !== 'FINAL_24H' && (
              <p className="text-xs text-slate-500 text-center">Si no hay señal se envía sola al volver la red.</p>
            )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(generarTextoWhatsApp())}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-center bg-slate-800 border border-slate-700 text-white font-medium rounded-lg py-3"
            >
              Compartir por WhatsApp
            </a>
            <button
              onClick={handleExportarExcel}
              disabled={exportando}
              className="flex items-center justify-center gap-1.5 bg-slate-800 border border-slate-700 text-white font-medium rounded-lg py-3"
            >
              <FiFileText aria-hidden="true" /> {exportando ? 'Exportando...' : 'Excel'}
            </button>
          </div>
        </>
      )}
    </div>
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

function CampoArea({
  label,
  value,
  onChange,
  placeholder,
  prefill = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** El valor viene del reporte anterior (prefill) y el operador aún no lo ha tocado. */
  prefill?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-500 mb-1">{label}</label>
      <textarea
        id={id}
        value={value}
        data-prefill={prefill}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-sm"
      />
    </div>
  )
}

function CampoTexto({
  label,
  value,
  onChange,
  type = 'text',
  nivel = 'OK',
  aviso,
  prefill = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  /** Alerta preventiva (no bloquea): resalta el borde del campo. */
  nivel?: NivelAlerta
  aviso?: string
  /** El valor viene del reporte anterior (prefill) y el operador aún no lo ha tocado. */
  prefill?: boolean
}) {
  const id = useId()
  const borde =
    nivel === 'ROJA' ? 'border-red-500 ring-1 ring-red-500/40' : nivel === 'AMARILLA' ? 'border-amber-500 ring-1 ring-amber-500/40' : 'border-slate-800'
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-slate-500 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-nivel={nivel}
        data-prefill={prefill}
        aria-describedby={aviso ? `${id}-aviso` : undefined}
        className={`w-full bg-slate-950 border rounded-lg px-3 py-2 text-white text-sm ${borde}`}
      />
      {aviso && (
        <p id={`${id}-aviso`} role="status" className={`text-xs mt-1 ${nivel === 'ROJA' ? 'text-red-400' : 'text-amber-400'}`}>
          {aviso}
        </p>
      )}
    </div>
  )
}
