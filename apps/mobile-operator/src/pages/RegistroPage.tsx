// src/pages/RegistroPage.tsx
//
// Formulario principal de captura. Medida Inicial (mi) y Factor
// Tanque (ft) de cada tanque son de solo lectura — los define el
// supervisor en WellDetailPage (ver ITank en firestore.rules: el
// Operador nunca puede escribir /pozos). El mi de cada lectura nueva
// es el mf de la lectura anterior (o el mi de configuración del pozo
// si es la primera lectura del ciclo).
//
// Al guardar, la lectura se escribe en evaluaciones/{evalId}/lecturas
// (evalId resuelto por useEvaluacionActual) y horasEvaluadas del
// pozo se acumula — el operador puede seguir registrando lecturas
// hasta cerrar el ciclo desde ReportePage.

import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiLock, FiAlertTriangle } from 'react-icons/fi'
import { doc, updateDoc, increment, collection, addDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { usePozoInfo } from '../hooks/usePozoInfo'
import { useEvaluacionActual } from '../hooks/useEvaluacionActual'
import { useLecturasEvaluacion } from '../hooks/useLecturasEvaluacion'
import { useConnectivity } from '../hooks/useConnectivity'
import { calcTanque, calcAGA3 } from '@monagas/core/calculos'
import LoadingSpinner from '../components/LoadingSpinner'
import type { ILecturaTanque, ILecturaGas } from '@core/types'

interface TankFormState {
  mf: string
  reductor: string
  aysPct: string
  dilDia: string
}

function tankFormInicial(): TankFormState {
  return { mf: '0', reductor: '0', aysPct: '0', dilDia: '0' }
}

export default function RegistroPage() {
  const { pozoId } = useParams<{ pozoId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { pozo, loading: loadingPozo, error: errorPozo } = usePozoInfo(pozoId)
  const { evalId, loading: loadingEval, error: errorEval } = useEvaluacionActual(
    pozoId,
    user?.uid,
    pozo?.zona
  )
  const { lecturas } = useLecturasEvaluacion(evalId ?? undefined)
  const { isOnline } = useConnectivity()

  const [th, setTh] = useState('1')
  const [tankForms, setTankForms] = useState<Record<string, TankFormState>>({})
  const [pf, setPf] = useState('0')
  const [hw, setHw] = useState('0')
  const [tGas, setTGas] = useState('80')
  const [gg, setGg] = useState('0.6')
  const [pCab, setPCab] = useState('0')
  const [pSep, setPSep] = useState('0')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [guardadoOffline, setGuardadoOffline] = useState(false)
  const [ultimasAlertas, setUltimasAlertas] = useState<string[]>([])

  // mi de cada tanque = mf de la última lectura guardada, o el mi de
  // configuración del pozo si todavía no hay lecturas en este ciclo.
  const miPorTanque = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const tank of pozo?.tanques ?? []) {
      mapa[tank.id] = tank.mi
    }
    const ultima = lecturas[lecturas.length - 1]
    if (ultima) {
      for (const lt of ultima.tanques) {
        mapa[lt.tanqueId] = lt.mf
      }
    }
    return mapa
  }, [pozo, lecturas])

  function formDeTank(tankId: string): TankFormState {
    return tankForms[tankId] ?? tankFormInicial()
  }

  function actualizarTank(tankId: string, campo: keyof TankFormState, valor: string) {
    setTankForms((prev) => ({ ...prev, [tankId]: { ...formDeTank(tankId), [campo]: valor } }))
    setGuardadoOk(false)
  }

  const resultadosPorTank = useMemo(() => {
    if (!pozo) return []
    return pozo.tanques.map((tank) => {
      const form = formDeTank(tank.id)
      const mi = miPorTanque[tank.id] ?? tank.mi
      const input = {
        mi,
        mf: parseFloat(form.mf) || 0,
        ft: tank.ft,
        th: parseFloat(th) || 1,
        reductor: parseFloat(form.reductor) || 0,
        aysPct: parseFloat(form.aysPct) || 0,
        dilDia: parseFloat(form.dilDia) || 0,
      }
      try {
        return { tank, resultado: calcTanque(input) }
      } catch {
        return { tank, resultado: null }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pozo, tankForms, th, miPorTanque])

  const gasResult = useMemo(() => {
    try {
      return calcAGA3({
        pf: parseFloat(pf) || 0,
        hw: parseFloat(hw) || 0,
        tGas: parseFloat(tGas) || 0,
        gg: parseFloat(gg) || 0.6,
        diam: pozo?.diamOrif ?? 2,
        meterRun: pozo?.meterRun ?? 4,
      })
    } catch {
      return null
    }
  }, [pf, hw, tGas, gg, pozo])

  async function handleGuardar() {
    if (!evalId || !pozo) return
    setGuardando(true)
    setError(null)
    try {
      const tanques: ILecturaTanque[] = resultadosPorTank
        .filter((r) => r.resultado)
        .map(({ tank, resultado }) => ({
          tanqueId: tank.id,
          mi: miPorTanque[tank.id] ?? tank.mi,
          mf: parseFloat(formDeTank(tank.id).mf) || 0,
          dif: resultado!.dif,
          th: parseFloat(th) || 1,
          reductor: parseFloat(formDeTank(tank.id).reductor) || 0,
          bph: resultado!.bph,
          bpd: resultado!.bpd,
          aysBls: resultado!.aysBls,
          netos: resultado!.netos,
        }))

      const gas: ILecturaGas | undefined = gasResult
        ? {
            pf: parseFloat(pf) || 0,
            hw: parseFloat(hw) || 0,
            tGas: parseFloat(tGas) || 0,
            gg: parseFloat(gg) || 0.6,
            diam: pozo.diamOrif ?? 2,
            meterRun: pozo.meterRun ?? 4,
            beta: gasResult.beta,
            Fc: gasResult.Fc,
            Fb: gasResult.Fb,
            Fg: gasResult.Fg,
            Ftf: gasResult.Ftf,
            qg: gasResult.qg,
          }
        : undefined

      // limResorte/limGamma están en las mismas unidades que pf/hw
      // (psi↔psig, inH₂O↔inH₂O): son los rangos del resorte y del
      // gamma (pluma diferencial) del registrador Barton configurado
      // en el pozo — una lectura que los excede está fuera del rango
      // calibrado del instrumento, no solo "alta".
      const alertas: string[] = []
      if (gas && pozo.limResorte > 0 && gas.pf > pozo.limResorte) {
        alertas.push(
          `Presión estática (${gas.pf} psig) excede el resorte configurado (${pozo.limResorte} psi)`
        )
      }
      if (gas && pozo.limGamma > 0 && gas.hw > pozo.limGamma) {
        alertas.push(
          `Diferencial (${gas.hw} inH₂O) excede el gamma configurado (${pozo.limGamma} inH₂O)`
        )
      }

      const escrituras = Promise.all([
        addDoc(collection(db, 'evaluaciones', evalId, 'lecturas'), {
          hora: lecturas.length + 1,
          timestamp: new Date(),
          tanques,
          ...(gas && { gas }),
          operativos: { pCab: parseFloat(pCab) || 0, pSep: parseFloat(pSep) || 0 },
          alertas,
        }),
        updateDoc(doc(db, 'evaluaciones', evalId), {
          horasEvaluadas: increment(parseFloat(th) || 1),
        }),
      ])

      if (isOnline) {
        await escrituras
      } else {
        // Sin conexión: Firestore ya guardó ambas escrituras en su
        // caché local persistente (enableIndexedDbPersistence, ver
        // services/firebase.ts) y las reenviará solo cuando vuelva la
        // señal — el Promise de arriba no rechaza si esto pasa, se
        // queda pendiente hasta el reintento exitoso. Esperarlo aquí
        // dejaría al Operador con el botón trabado indefinidamente, así
        // que seguimos de una vez y solo dejamos un log si algo falla
        // de verdad al reconectar (permission-denied, etc. — un error
        // que offline no se puede saber todavía).
        escrituras.catch((err) => {
          console.error('Error sincronizando lectura pendiente:', err)
        })
      }

      setTankForms({})
      setUltimasAlertas(alertas)
      setGuardadoOk(true)
      setGuardadoOffline(!isOnline)
    } catch (err: any) {
      setError(
        err.code === 'permission-denied'
          ? 'No tienes permiso para registrar lecturas en este pozo.'
          : 'No se pudo guardar la lectura. Intenta de nuevo.'
      )
    } finally {
      setGuardando(false)
    }
  }

  if (loadingPozo || loadingEval) {
    return <div className="min-h-screen bg-slate-950"><LoadingSpinner message="Cargando pozo..." fullScreen /></div>
  }
  if (errorPozo) return <div className="p-6 text-red-400">{errorPozo}</div>
  if (!pozo) return <div className="p-6 text-slate-400">Pozo no encontrado.</div>

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-slate-400"><FiArrowLeft aria-label="Volver" /></button>
          <div>
            <h1 className="text-lg font-bold text-white">Registro de Evaluación</h1>
            <p className="text-xs text-slate-500">{pozo.nombre} · {pozo.campo}</p>
          </div>
        </div>
        <button onClick={() => navigate('/tabla')} className="text-sm text-amber-400">
          Ver Tabla
        </button>
      </div>

      <div className="p-4 max-w-md mx-auto space-y-5">
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Horas desde última lectura</label>
          <input
            type="number"
            step="0.1"
            value={th}
            onChange={(e) => setTh(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white"
          />
        </div>

        {resultadosPorTank.map(({ tank, resultado }) => {
          const form = formDeTank(tank.id)
          return (
            <section key={tank.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">{tank.nombre}</h3>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  mi: {miPorTanque[tank.id] ?? tank.mi} · kk: {tank.ft} <FiLock aria-hidden="true" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Medida Final (pulg)</label>
                  <input
                    type="number" step="0.01" value={form.mf}
                    onChange={(e) => actualizarTank(tank.id, 'mf', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">AyS (%)</label>
                  <input
                    type="number" step="0.1" value={form.aysPct}
                    onChange={(e) => actualizarTank(tank.id, 'aysPct', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Reductor (Bls)</label>
                  <input
                    type="number" step="0.01" value={form.reductor}
                    onChange={(e) => actualizarTank(tank.id, 'reductor', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Diluyente (Bls/D)</label>
                  <input
                    type="number" step="0.01" value={form.dilDia}
                    onChange={(e) => actualizarTank(tank.id, 'dilDia', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
              </div>

              {resultado && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>BPD: <span className="text-white font-mono">{resultado.bpd.toFixed(2)}</span></span>
                  <span>Netos: <span className="text-white font-mono">{resultado.netos.toFixed(2)}</span></span>
                </div>
              )}
            </section>
          )
        })}

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
          <h3 className="text-sm font-semibold text-white">Gas (AGA-3)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Presión Estática (psig)</label>
              <input type="number" value={pf} onChange={(e) => setPf(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Diferencial (inH₂O)</label>
              <input type="number" value={hw} onChange={(e) => setHw(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Temp. gas (°F)</label>
              <input type="number" value={tGas} onChange={(e) => setTGas(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gravedad específica</label>
              <input type="number" step="0.01" value={gg} onChange={(e) => setGg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          {gasResult && (
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Qg: <span className="text-white font-mono">{gasResult.qg.toFixed(2)} MPCGD</span>
            </p>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
          <h3 className="text-sm font-semibold text-white">Presiones Operativas</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">P. Cabezal (psig)</label>
              <input type="number" value={pCab} onChange={(e) => setPCab(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">P. Separador (psig)</label>
              <input type="number" value={pSep} onChange={(e) => setPSep(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
        </section>

        {(error || errorEval) && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error || errorEval}
          </div>
        )}
        {guardadoOk && guardadoOffline && (
          <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2">
            Lectura #{lecturas.length} guardada localmente — se enviará cuando vuelva la conexión.
          </div>
        )}
        {guardadoOk && !guardadoOffline && (
          <div className="text-sm text-emerald-400 bg-emerald-950/40 border border-emerald-900 rounded-lg px-3 py-2">
            Lectura #{lecturas.length} guardada.
          </div>
        )}
        {guardadoOk && ultimasAlertas.length > 0 && (
          <div className="text-sm text-amber-400 bg-amber-950/40 border border-amber-900 rounded-lg px-3 py-2 space-y-1">
            {ultimasAlertas.map((a) => (
              <p key={a} className="flex items-center gap-1"><FiAlertTriangle aria-hidden="true" /> {a}</p>
            ))}
          </div>
        )}

        <button
          onClick={handleGuardar}
          disabled={guardando || !evalId}
          className="w-full bg-amber-500 text-slate-950 font-medium rounded-lg py-3 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar Lectura'}
        </button>

        {evalId && (
          <button
            onClick={() => navigate(`/reporte/${pozo.id}/${evalId}`)}
            className="w-full bg-slate-900 border border-slate-800 text-white font-medium rounded-lg py-3"
          >
            Ir a Reporte / Cerrar Evaluación
          </button>
        )}
      </div>
    </div>
  )
}
