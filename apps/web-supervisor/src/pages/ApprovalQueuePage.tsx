// src/pages/ApprovalQueuePage.tsx
//
// Cola de aprobaciones — exclusiva SUP_AREA/GERENTE (App.tsx bloquea
// esta ruta para SUP_CAMPO vía RutaSoloGestion, igual que UsersPage).
// Consume useApprovals.ts, que ya trae las evaluaciones en
// PENDIENTE_SUPERVISOR con scoping por zona.
//
// El nombre/campo del pozo no vive en IEvaluacion (solo pozoId) — se
// resuelve con usePozosVisibles, que ya trae exactamente los pozos
// que este rol puede ver (mismo scoping que las evaluaciones
// pendientes, así que el lookup nunca debería fallar en la práctica).
//
// Aprobar/rechazar mueven la evaluación a APROBADA_SUPERVISOR/
// EN_CURSO — el ascenso automático a OFICIAL y la sincronización de
// pozo.estado quedan a cargo de una Cloud Function aparte (Admin SDK,
// ver checklist Fase 2), así que no se reflejan de inmediato en esta
// página más allá de que la evaluación desaparece de la cola.

import { useMemo, useState } from 'react'
import { FiCheck, FiX, FiAlertTriangle, FiInbox, FiChevronDown, FiChevronUp, FiEdit2 } from 'react-icons/fi'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { useApprovals } from '../hooks/useApprovals'
import { usePozosVisibles } from '../hooks/usePozosVisibles'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import Header from '../components/common/Header'
import Sidebar from '../components/common/Sidebar'
import Button from '../components/common/Button'
import type { IEvaluacion, ILectura, ILecturaTanque } from '@core/types'

function fmt(n: number | undefined, decimales = 1): string {
  return typeof n === 'number' ? n.toFixed(decimales) : '—'
}

function fecha(d: Date | undefined): string {
  if (!d) return '—'
  const date = (d as any)?.toDate ? (d as any).toDate() : d
  return new Date(date).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

// Corrección directa de valores finales (bph/bpd/netos por tanque +
// presiones operativas) — NO una re-derivación desde mi/mf. Firestore
// no guarda el aysPct% original usado en el cálculo de campo (solo el
// aysBls resultante), así que no hay forma de reconstruir la fórmula
// completa (calcTanque) fielmente desde aquí. Esto es una corrección
// administrativa de "este número está mal, el correcto es este otro",
// no un recálculo científico.
function FilaLecturaEditable({
  evalId,
  lectura,
}: {
  evalId: string
  lectura: ILectura
}) {
  const [editando, setEditando] = useState(false)
  const [tanques, setTanques] = useState<ILecturaTanque[]>(lectura.tanques)
  const [pCab, setPCab] = useState(String(lectura.operativos.pCab))
  const [pSep, setPSep] = useState(String(lectura.operativos.pSep))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const netos = lectura.tanques.reduce((acc, t) => acc + t.netos, 0)
  const ts = (lectura.timestamp as any)?.toDate ? (lectura.timestamp as any).toDate() : lectura.timestamp

  function actualizarTanque(idx: number, campo: 'bph' | 'bpd' | 'netos', valor: string) {
    setTanques((prev) => prev.map((t, i) => (i === idx ? { ...t, [campo]: parseFloat(valor) || 0 } : t)))
  }

  async function guardar() {
    setGuardando(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'evaluaciones', evalId, 'lecturas', lectura.id), {
        tanques,
        operativos: { pCab: parseFloat(pCab) || 0, pSep: parseFloat(pSep) || 0 },
      })
      setEditando(false)
    } catch (err: any) {
      setError(
        err.code === 'permission-denied'
          ? 'No tienes permiso para editar esta lectura.'
          : 'No se pudo guardar la corrección. Intenta de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (!editando) {
    return (
      <tr className="border-b border-slate-900 text-slate-300">
        <td className="py-2 px-1">{lectura.hora}</td>
        <td className="py-2 px-1">{new Date(ts).toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</td>
        <td className="py-2 px-1 font-mono">{netos.toFixed(1)}</td>
        <td className="py-2 px-1 font-mono">{lectura.gas ? lectura.gas.qg.toFixed(2) : '—'}</td>
        <td className="py-2 px-1">
          {lectura.alertas && lectura.alertas.length > 0 ? (
            <span className="text-amber-400">{lectura.alertas.join(', ')}</span>
          ) : (
            '—'
          )}
        </td>
        <td className="py-2 px-1">
          <button onClick={() => setEditando(true)} className="text-amber-400" aria-label="Corregir lectura">
            <FiEdit2 aria-hidden="true" />
          </button>
        </td>
      </tr>
    )
  }

  return (
    <tr className="border-b border-slate-900">
      <td colSpan={6} className="py-3 px-1">
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3">
          <p className="text-xs text-slate-500">Corrigiendo lectura #{lectura.hora}</p>
          {tanques.map((t, idx) => (
            <div key={t.tanqueId} className="grid grid-cols-3 gap-2">
              <label className="text-xs text-slate-400">
                Bph
                <input
                  type="number" step="0.01" value={t.bph}
                  onChange={(e) => actualizarTanque(idx, 'bph', e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </label>
              <label className="text-xs text-slate-400">
                Bpd
                <input
                  type="number" step="0.01" value={t.bpd}
                  onChange={(e) => actualizarTanque(idx, 'bpd', e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </label>
              <label className="text-xs text-slate-400">
                Netos
                <input
                  type="number" step="0.01" value={t.netos}
                  onChange={(e) => actualizarTanque(idx, 'netos', e.target.value)}
                  className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                />
              </label>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs text-slate-400">
              P. Cabezal
              <input
                type="number" step="0.01" value={pCab} onChange={(e) => setPCab(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
              />
            </label>
            <label className="text-xs text-slate-400">
              P. Separador
              <input
                type="number" step="0.01" value={pSep} onChange={(e) => setPSep(e.target.value)}
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
              />
            </label>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex gap-2">
            <Button variant="primary" loading={guardando} onClick={guardar}>Guardar corrección</Button>
            <Button variant="secondary" disabled={guardando} onClick={() => setEditando(false)}>Cancelar</Button>
          </div>
        </div>
      </td>
    </tr>
  )
}

function LecturasDrilldown({ evalId }: { evalId: string }) {
  const { lecturas, loading, error } = useLecturasEvaluacion(evalId)

  if (loading) {
    return <p className="text-xs text-slate-500 py-3">Cargando lecturas...</p>
  }
  if (error) {
    return <p className="text-xs text-red-400 py-3">{error}</p>
  }
  if (lecturas.length === 0) {
    return <p className="text-xs text-slate-500 py-3">Esta evaluación no tiene lecturas registradas.</p>
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 border-b border-slate-800">
            <th className="py-2 px-1">Hora</th>
            <th className="py-2 px-1">Fecha/Hora</th>
            <th className="py-2 px-1">Netos (Bls)</th>
            <th className="py-2 px-1">Qg (MMSCFD)</th>
            <th className="py-2 px-1">Alertas</th>
            <th className="py-2 px-1"></th>
          </tr>
        </thead>
        <tbody>
          {lecturas.map((l) => (
            <FilaLecturaEditable key={l.id} evalId={evalId} lectura={l} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TarjetaEvaluacion({
  evaluacion,
  pozoNombre,
  procesando,
  onAprobar,
  onRechazar,
}: {
  evaluacion: IEvaluacion
  pozoNombre: string
  procesando: boolean
  onAprobar: () => void
  onRechazar: (motivo: string) => void
}) {
  const [mostrarRechazo, setMostrarRechazo] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [mostrarDetalle, setMostrarDetalle] = useState(false)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-white">{pozoNombre}</h3>
          <p className="text-xs text-slate-500">Cerrada el {fecha(evaluacion.fechaCierre)}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full border whitespace-nowrap bg-orange-500/15 text-orange-400 border-orange-500/30">
          Pendiente
        </span>
      </div>

      {evaluacion.resultados && (
        <div className="grid grid-cols-3 gap-2 text-sm border-t border-slate-800 pt-3">
          <div>
            <p className="text-xs text-slate-500">Bpd</p>
            <p className="text-white font-mono">{fmt(evaluacion.resultados.bpdPromedio)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Netos</p>
            <p className="text-white font-mono">{fmt(evaluacion.resultados.netosPromedio)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Horas</p>
            <p className="text-white font-mono">{evaluacion.resultados.horasTotales}H</p>
          </div>
        </div>
      )}

      <button
        onClick={() => setMostrarDetalle((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-amber-400 border-t border-slate-800 pt-3 w-full"
      >
        {mostrarDetalle ? <FiChevronUp aria-hidden="true" /> : <FiChevronDown aria-hidden="true" />}
        {mostrarDetalle ? 'Ocultar lecturas individuales' : 'Ver lecturas individuales'}
      </button>

      {mostrarDetalle && <LecturasDrilldown evalId={evaluacion.id} />}

      {mostrarRechazo ? (
        <div className="space-y-2 border-t border-slate-800 pt-3">
          <label className="block text-xs text-slate-500">Motivo del rechazo</label>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explica por qué se rechaza esta evaluación"
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              disabled={!motivo.trim() || procesando}
              loading={procesando}
              onClick={() => onRechazar(motivo)}
            >
              Confirmar rechazo
            </Button>
            <Button variant="secondary" onClick={() => setMostrarRechazo(false)} disabled={procesando}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 border-t border-slate-800 pt-3">
          <Button variant="primary" disabled={procesando} loading={procesando} onClick={onAprobar} className="flex items-center gap-1.5 justify-center">
            <FiCheck aria-hidden="true" /> Aprobar
          </Button>
          <Button variant="secondary" disabled={procesando} onClick={() => setMostrarRechazo(true)} className="flex items-center gap-1.5 justify-center">
            <FiX aria-hidden="true" /> Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}

export default function ApprovalQueuePage() {
  const { user, rol, zona, pozoAsignado, logout } = useAuth()
  const { pendientes, loading, error, procesando, aprobar, rechazar } = useApprovals(
    rol,
    zona,
    user?.uid ?? null
  )
  const { pozos } = usePozosVisibles(rol, zona, pozoAsignado)
  const [accionando, setAccionando] = useState<string | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  const pozoPorId = useMemo(() => {
    const map: Record<string, string> = {}
    for (const p of pozos) map[p.id] = `${p.nombre} · ${p.campo}`
    return map
  }, [pozos])

  async function handleAprobar(evalId: string) {
    setAccionando(evalId)
    setErrorAccion(null)
    try {
      await aprobar(evalId)
    } catch (err: any) {
      setErrorAccion('No se pudo aprobar. Intenta de nuevo.')
    } finally {
      setAccionando(null)
    }
  }

  async function handleRechazar(evalId: string, motivo: string) {
    setAccionando(evalId)
    setErrorAccion(null)
    try {
      await rechazar(evalId, motivo)
    } catch (err: any) {
      setErrorAccion('No se pudo rechazar. Intenta de nuevo.')
    } finally {
      setAccionando(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar rol={rol} />

      <div className="flex-1 min-w-0">
        <Header nombre={user?.displayName ?? user?.email ?? null} rol={rol} onLogout={logout} />

        <div className="p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Cola de Aprobaciones</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Evaluaciones cerradas por el operador, esperando tu revisión.
            </p>
          </div>

          {errorAccion && (
            <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
              {errorAccion}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Cargando aprobaciones...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <FiAlertTriangle className="text-3xl" aria-hidden="true" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          ) : pendientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <FiInbox className="text-3xl" aria-hidden="true" />
              <p className="text-sm text-slate-500">No hay evaluaciones pendientes de aprobación.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendientes.map((evaluacion) => (
                <TarjetaEvaluacion
                  key={evaluacion.id}
                  evaluacion={evaluacion}
                  pozoNombre={pozoPorId[evaluacion.pozoId] ?? 'Pozo desconocido'}
                  procesando={procesando && accionando === evaluacion.id}
                  onAprobar={() => handleAprobar(evaluacion.id)}
                  onRechazar={(motivo) => handleRechazar(evaluacion.id, motivo)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
