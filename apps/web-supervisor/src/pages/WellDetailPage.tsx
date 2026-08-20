// src/pages/WellDetailPage.tsx
//
// Detalle y edición de un pozo. El alcance de edición depende del rol:
//   SUP_CAMPO (solo en SU propio pozo) — únicamente tanques y límites.
//   SUP_AREA/GERENTE — tanques, límites, y además Empresa/Equipo
//     (encabezado del reporte PDVSA — ver checklist Fase 4). Nombre/
//     campo/zona siguen sin ser editables desde acá (se fijan una vez
//     al crear el pozo en NewWellPage.tsx).
//
// El update de SUP_CAMPO envía EXCLUSIVAMENTE {tanques, limResorte,
// limGamma} — nada más — para coincidir exacto con hasOnly([...]) de
// canEditOwnTanquesYLimites() en firestore.rules. Enviar cualquier
// otro campo, aunque no cambie de valor, arriesga que Firestore
// rechace el write completo. SUP_AREA/GERENTE (canManagePozoEnZona, sin
// hasOnly) sí pueden mandar empresa/equipo en el mismo payload.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiDownload } from 'react-icons/fi'
import { doc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { usePozo } from '../hooks/usePozo'
import { useEvaluacionesOficiales } from '../hooks/useEvaluacionesOficiales'
import { exportarInformeOficialExcel } from '../utils/exportExcel'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { LoadingState, ErrorState } from '../components/dashboard/DashboardStates'
import type { ITank, IPozo, IEvaluacion, ILectura } from '@core/types'

function fechaCorta(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Exporta bajo demanda — las lecturas de cada evaluación se traen con
// un getDocs puntual al hacer click, no con un onSnapshot en vivo por
// fila: esta sección puede listar varios ciclos históricos y no tiene
// sentido mantener una suscripción abierta a cada uno solo para
// habilitar un botón.
function FilaEvaluacionOficial({ pozo, evaluacion }: { pozo: IPozo; evaluacion: IEvaluacion }) {
  const [exportando, setExportando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function exportar() {
    setExportando(true)
    setError(null)
    try {
      const snap = await getDocs(
        query(collection(db, 'evaluaciones', evaluacion.id, 'lecturas'), orderBy('hora', 'asc'))
      )
      const lecturas = snap.docs.map((d) => {
        const data = d.data()
        const timestamp = data.timestamp && typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate() : data.timestamp
        return { id: d.id, ...data, timestamp } as ILectura
      })
      exportarInformeOficialExcel({ pozo, evaluacion, lecturas })
    } catch (err: any) {
      setError('No se pudo exportar. Intenta de nuevo.')
    } finally {
      setExportando(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
      <div>
        <p className="text-sm text-white">{fechaCorta(evaluacion.fechaCierre)}</p>
        <p className="text-xs text-slate-500">
          Netos: <span className="font-mono">{(evaluacion.resultados?.netosPromedio ?? 0).toFixed(1)}</span> Bls
          {' · '}{evaluacion.estado === 'OFICIAL' ? 'Oficial' : 'Aprobada'}
        </p>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
      <button
        onClick={exportar}
        disabled={exportando}
        className="flex items-center gap-1.5 text-xs text-amber-400 whitespace-nowrap disabled:opacity-50"
      >
        <FiDownload aria-hidden="true" /> {exportando ? 'Exportando...' : 'Exportar Excel'}
      </button>
    </div>
  )
}

export default function WellDetailPage() {
  const { pozoId } = useParams<{ pozoId: string }>()
  const navigate = useNavigate()
  const { rol } = useAuth()
  const { pozo, loading, error } = usePozo(pozoId)
  const { evaluaciones: evaluacionesOficiales, loading: loadingEvaluaciones, error: errorEvaluaciones } = useEvaluacionesOficiales(pozoId, pozo?.zona)

  const puedeEditarTodo = rol === 'SUP_AREA' || rol === 'GERENTE'
  const puedeEditarTanquesYLimites = puedeEditarTodo || rol === 'SUP_CAMPO'

  const [tanques, setTanques] = useState<ITank[]>([])
  const [limResorte, setLimResorte] = useState('')
  const [limGamma, setLimGamma] = useState('')
  const [empresa, setEmpresa] = useState('')
  const [equipo, setEquipo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  useEffect(() => {
    if (pozo) {
      setTanques(pozo.tanques)
      setLimResorte(String(pozo.limResorte))
      setLimGamma(String(pozo.limGamma))
      setEmpresa(pozo.empresa ?? '')
      setEquipo(pozo.equipo ?? '')
    }
  }, [pozo])

  function actualizarTank(idx: number, campo: 'mi' | 'ft', valor: string) {
    setTanques((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [campo]: parseFloat(valor) || 0 } : t))
    )
    setGuardadoOk(false)
  }

  async function guardarTanquesYLimites() {
    if (!pozoId) return
    setGuardando(true)
    setErrorGuardar(null)
    try {
      // Payload EXACTO para SUP_CAMPO — solo estos 3 campos, para que
      // coincida con hasOnly([...]) de canEditOwnTanquesYLimites() en
      // firestore.rules. SUP_AREA/GERENTE (canManagePozoEnZona, sin
      // restricción de campos) sí pueden mandar empresa/equipo además
      // — agregados aquí condicionalmente, nunca para SUP_CAMPO.
      await updateDoc(doc(db, 'pozos', pozoId), {
        tanques,
        limResorte: parseFloat(limResorte) || 0,
        limGamma: parseFloat(limGamma) || 0,
        ...(puedeEditarTodo && { empresa, equipo }),
      })
      setGuardadoOk(true)
    } catch (err: any) {
      setErrorGuardar(
        err.code === 'permission-denied'
          ? 'No tienes permiso para editar este pozo.'
          : 'No se pudo guardar. Intenta de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-950"><LoadingState /></div>
  if (error) return <div className="min-h-screen bg-slate-950 p-6"><ErrorState message={error} /></div>
  if (!pozo) return <div className="p-6 text-slate-400">Pozo no encontrado.</div>

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 max-w-2xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400"><FiArrowLeft aria-label="Volver" /></button>
        <div>
          <h1 className="text-lg font-bold text-white">{pozo.nombre}</h1>
          <p className="text-xs text-slate-500">{pozo.campo} · {pozo.zona}</p>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {!puedeEditarTanquesYLimites && (
          <div className="text-sm text-slate-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2">
            Solo lectura — no tienes permiso de edición sobre este pozo.
          </div>
        )}

        {puedeEditarTodo && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-slate-300">Identificación (encabezado de reporte)</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Empresa" value={empresa} onChange={(e) => { setEmpresa(e.target.value); setGuardadoOk(false) }} placeholder="ej: Del Sur International, S.A." />
              <Input label="Equipo" value={equipo} onChange={(e) => { setEquipo(e.target.value); setGuardadoOk(false) }} placeholder="ej: WT-DSI-01" />
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Tanques</h2>
          {tanques.map((tank, idx) => (
            <div key={tank.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-sm text-white mb-3">{tank.nombre}</p>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Medida Inicial (pulg)"
                  type="number"
                  step="0.01"
                  value={tank.mi}
                  onChange={(e) => actualizarTank(idx, 'mi', e.target.value)}
                  disabled={!puedeEditarTanquesYLimites}
                />
                <Input
                  label="Factor Tanque — kk"
                  type="number"
                  step="0.01"
                  value={tank.ft}
                  onChange={(e) => actualizarTank(idx, 'ft', e.target.value)}
                  disabled={!puedeEditarTanquesYLimites}
                />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Límites de Alerta</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Resorte (psi)"
              type="number"
              value={limResorte}
              onChange={(e) => { setLimResorte(e.target.value); setGuardadoOk(false) }}
              disabled={!puedeEditarTanquesYLimites}
            />
            <Input
              label="Gamma (inH₂O)"
              type="number"
              value={limGamma}
              onChange={(e) => { setLimGamma(e.target.value); setGuardadoOk(false) }}
              disabled={!puedeEditarTanquesYLimites}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-slate-300">Evaluaciones Oficiales</h2>
          {loadingEvaluaciones ? (
            <p className="text-xs text-slate-500">Cargando historial...</p>
          ) : errorEvaluaciones ? (
            <p className="text-xs text-red-400">No se pudo cargar el historial de evaluaciones.</p>
          ) : evaluacionesOficiales.length === 0 ? (
            <p className="text-xs text-slate-500">
              Este pozo todavía no tiene ninguna evaluación aprobada.
            </p>
          ) : (
            <div className="space-y-2">
              {evaluacionesOficiales.map((evaluacion) => (
                <FilaEvaluacionOficial key={evaluacion.id} pozo={pozo} evaluacion={evaluacion} />
              ))}
            </div>
          )}
        </section>

        {!puedeEditarTodo && (
          <p className="text-xs text-slate-500">
            Personal asignado: {pozo.asignados.length}. Solo Supervisor de Área o
            Gerente pueden gestionar el equipo de este pozo.
          </p>
        )}

        {errorGuardar && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {errorGuardar}
          </div>
        )}
        {guardadoOk && (
          <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
            Guardado correctamente.
          </div>
        )}

        {puedeEditarTanquesYLimites && (
          <Button fullWidth loading={guardando} onClick={guardarTanquesYLimites}>
            Guardar Cambios
          </Button>
        )}
      </div>
    </div>
  )
}
