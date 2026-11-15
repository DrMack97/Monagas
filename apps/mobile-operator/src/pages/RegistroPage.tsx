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
import { useLecturaPrevia } from '../hooks/useLecturaPrevia'
import { useConnectivity } from '../hooks/useConnectivity'
import { calcTanque, calcAGA3 } from '@monagas/core/calculos'
import { capacidadesZona } from '@core/constants/zonas'
import { resumenTrasegado } from '@core/utils/trasegado'
import { balanceMasas, detectarSalto, peorNivel, type NivelAlerta } from '@core/utils/balanceMasas'
import BalanceMasasPanel, { ETIQUETA_NIVEL } from '../components/BalanceMasasPanel'
import LoadingSpinner from '../components/LoadingSpinner'
import type { ILecturaTanque, ILecturaGas } from '@core/types'

// reductor y dilDia ya no tienen campo en pantalla: el Reductor es una medida de
// tubería (pulgadas) fijada en el pozo y no afecta los barriles, y el Diluyente no se
// usa en Monagas. Siguen en el estado en 0 para no tocar calcTanque ni los datos
// guardados; si Diluyente vuelve a usarse en otra zona, basta restaurar su campo.
interface TankFormState {
  mf: string
  reductor: string
  aysPct: string
  dilDia: string
  /** Bls que se llevó un viaje de vacuum desde la lectura anterior (tanque vaciado). */
  trasegado: string
}

type CampoGas = 'pf' | 'hw' | 'tGas' | 'gg'
type CampoPresion = 'pCab' | 'pSep' | 'pCsg'
/** Valores de partida cuando NO hay ninguna carga anterior del pozo. */
const GAS_POR_DEFECTO: Record<CampoGas, string> = { pf: '0', hw: '0', tGas: '80', gg: '0.6' }

function tankFormInicial(): TankFormState {
  return { mf: '0', reductor: '0', aysPct: '0', dilDia: '0', trasegado: '0' }
}

/** Borde del campo según el nivel de alerta (amarillo/rojo); sin alerta, el borde normal. */
function claseCampo(nivel: NivelAlerta): string {
  const base = 'w-full bg-slate-950 border rounded-lg px-3 py-2 text-white'
  if (nivel === 'ROJA') return `${base} border-red-500 ring-1 ring-red-500/40`
  if (nivel === 'AMARILLA') return `${base} border-amber-500 ring-1 ring-amber-500/40`
  return `${base} border-slate-800`
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
  const { lecturas, loading: cargandoLecturas } = useLecturasEvaluacion(evalId ?? undefined)
  // Prefill: "carga anterior" = la última lectura de ESTE ciclo; si el ciclo aún no tiene ninguna (primera lectura de un
  // ciclo nuevo), la última del ciclo anterior del pozo.
  const { previas } = useLecturaPrevia(pozoId, evalId, !cargandoLecturas && lecturas.length === 0)
  const cargasAnteriores = lecturas.length > 0 ? [...lecturas].reverse() : previas
  const { isOnline } = useConnectivity()

  // Qué se captura/muestra según la zona del pozo (Casing y Netos solo en la Faja).
  const zonaCaps = capacidadesZona(pozo?.zona)

  const [th, setTh] = useState('1')
  const [tankForms, setTankForms] = useState<Record<string, TankFormState>>({})
  // Ventana AGA-3 (gas): cada campo muestra lo editado por el operador; si no lo ha tocado, el valor de la carga
  // anterior; si no hay carga anterior, el valor por defecto. Así los datos se conservan al reabrir la pantalla y al
  // empezar un ciclo nuevo (requisito del cliente: "todas las ventanas deben mantener la data de la carga anterior").
  const [gasEditado, setGasEditado] = useState<Partial<Record<CampoGas, string>>>({})
  const gasAnterior = cargasAnteriores.find((l) => l.gas)?.gas
  const valorGas = (campo: CampoGas): string =>
    gasEditado[campo] ?? (gasAnterior && Number.isFinite(gasAnterior[campo]) ? String(gasAnterior[campo]) : GAS_POR_DEFECTO[campo])
  const gasPrefill = (campo: CampoGas): boolean => gasEditado[campo] === undefined && !!gasAnterior && Number.isFinite(gasAnterior[campo])
  const editarGas = (campo: CampoGas, valor: string) => {
    setGasEditado((prev) => ({ ...prev, [campo]: valor }))
    setGuardadoOk(false)
  }
  const pf = valorGas('pf')
  const hw = valorGas('hw')
  const tGas = valorGas('tGas')
  const gg = valorGas('gg')
  // Ventana Presiones Operativas: misma regla que AGA-3 — lo editado por el operador, si no, el valor de la carga
  // anterior, si no, 0. P. Casing solo se captura (y se prefilla) en zonas que lo usan.
  const [presionEditada, setPresionEditada] = useState<Partial<Record<CampoPresion, string>>>({})
  const operativosAnterior = cargasAnteriores.find((l) => Number.isFinite(l.operativos?.pCab))?.operativos
  const presionAnterior = (campo: CampoPresion): number | undefined => {
    if (!operativosAnterior) return undefined
    if (campo === 'pCsg' && !zonaCaps.casing) return undefined
    const v = operativosAnterior[campo]
    return Number.isFinite(v) ? (v as number) : undefined
  }
  const valorPresion = (campo: CampoPresion): string =>
    presionEditada[campo] ?? (presionAnterior(campo) !== undefined ? String(presionAnterior(campo)) : '0')
  const presionPrefill = (campo: CampoPresion): boolean => presionEditada[campo] === undefined && presionAnterior(campo) !== undefined
  const editarPresion = (campo: CampoPresion, valor: string) => {
    setPresionEditada((prev) => ({ ...prev, [campo]: valor }))
    setGuardadoOk(false)
  }
  const pCab = valorPresion('pCab')
  const pSep = valorPresion('pSep')
  const pCsg = valorPresion('pCsg')
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

  // Ventanas "Total trasegado" y "Número de viajes" (arriba de la pantalla): salen solas de lo ya guardado en
  // las lecturas del ciclo; lo que se está escribiendo y aún no se guarda se muestra aparte ("por guardar").
  const trasegadoGuardado = useMemo(() => resumenTrasegado(lecturas), [lecturas])
  const trasegadoPorGuardar = useMemo(
    () =>
      resumenTrasegado([
        { tanques: (pozo?.tanques ?? []).map((t) => ({ trasegado: parseFloat(tankForms[t.id]?.trasegado ?? '') || 0 })) },
      ]),
    [pozo, tankForms]
  )

  function formDeTank(tankId: string): TankFormState {
    return tankForms[tankId] ?? tankFormInicial()
  }

  function actualizarTank(tankId: string, campo: keyof TankFormState, valor: string) {
    setTankForms((prev) => ({ ...prev, [tankId]: { ...formDeTank(tankId), [campo]: valor } }))
    setGuardadoOk(false)
  }

  // Medida final por debajo de la inicial sin trasegado: el cálculo da 0 y conviene avisarlo (antes
  // salía "0.00" sin explicación y esa lectura entraba al promedio como producción cero).
  function bajoMedida(tankId: string): boolean {
    const f = tankForms[tankId]
    if (!f || f.mf.trim() === '') return false
    const tank = pozo?.tanques.find((t) => t.id === tankId)
    const mi = miPorTanque[tankId] ?? tank?.mi ?? 0
    return (parseFloat(f.mf) || 0) < mi && (parseFloat(f.trasegado) || 0) === 0
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
        trasegado: parseFloat(form.trasegado) || 0,
      }
      try {
        return { tank, resultado: calcTanque(input) }
      } catch {
        return { tank, resultado: null }
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pozo, tankForms, th, miPorTanque])

  // Alerta de balance de masas (preventiva, NO bloqueante): Desplazamiento − Trasegado − Existente = 0, por tanque.
  // Se calcula con las lecturas guardadas MÁS lo que se está escribiendo (solo los tanques que el operador ya tocó;
  // el valor por defecto 0 de un tanque sin tocar no es una medida y daría una alerta falsa).
  const tocado = (tankId: string) => !!tankForms[tankId]
  const balance = useMemo(() => {
    const tanquesIn = (pozo?.tanques ?? []).map((t) => ({ id: t.id, nombre: t.nombre, ft: t.ft, mi: t.mi }))
    const pendiente = {
      tanques: resultadosPorTank
        .filter(({ tank, resultado }) => resultado && tocado(tank.id))
        .map(({ tank, resultado }) => ({
          tanqueId: tank.id,
          mi: miPorTanque[tank.id] ?? tank.mi,
          mf: parseFloat(formDeTank(tank.id).mf) || 0,
          bph: resultado!.bph,
          th: parseFloat(th) || 1,
          trasegado: parseFloat(formDeTank(tank.id).trasegado) || 0,
        })),
    }
    return balanceMasas(tanquesIn, [...lecturas, pendiente])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pozo, lecturas, resultadosPorTank, tankForms, th, miPorTanque])

  /** Avisos de un tanque (para resaltar sus campos y explicar): balance + salto desproporcionado. */
  function avisosDeTanque(tankId: string): { nivel: NivelAlerta; mensajes: { nivel: NivelAlerta; texto: string }[] } {
    if (!tocado(tankId)) return { nivel: 'OK', mensajes: [] }
    const mensajes: { nivel: NivelAlerta; texto: string }[] = []
    const b = balance.tanques.find((t) => t.tanqueId === tankId)
    if (b && b.nivel !== 'OK') {
      mensajes.push({
        nivel: b.nivel,
        texto:
          b.nivel === 'ROJA'
            ? `Discrepancia crítica en el balance de masas: no cuadran ${Math.abs(b.residuo).toFixed(2)} Bls (más de una pulgada de nivel).`
            : `Desviación menor en el balance de masas: no cuadran ${Math.abs(b.residuo).toFixed(2)} Bls (menos de una pulgada).`,
      })
    }
    const resultado = resultadosPorTank.find((r) => r.tank.id === tankId)?.resultado
    if (resultado) {
      const previas = lecturas.map((l) => l.tanques.find((t) => t.tanqueId === tankId)?.bph ?? 0)
      const salto = detectarSalto(previas, resultado.bph)
      if (salto.salto) {
        mensajes.push({
          nivel: 'AMARILLA',
          texto:
            `La producción por hora es ${salto.factor >= 1 ? `${salto.factor.toFixed(1)} veces mayor` : `${(1 / salto.factor).toFixed(1)} veces menor`} que la de las lecturas anteriores` +
            (salto.posibleDecimal ? ': ¿se omitió o sobra un decimal en la medida?' : '. Verifica la medida.'),
        })
      }
    }
    return { nivel: peorNivel(...mensajes.map((m) => m.nivel)), mensajes }
  }

  // El Qg depende de la placa (d) y del Meter Run (D) REALES del pozo, que fija el supervisor.
  // Si faltan no se inventa un valor por defecto: no hay Qg hasta que se configuren.
  const diamPlaca = pozo?.diamOrif ?? 0
  const meterRun = pozo?.meterRun ?? 0
  const gasConfigurado = diamPlaca > 0 && meterRun > 0

  const gasResult = useMemo(() => {
    if (!gasConfigurado) return null
    try {
      return calcAGA3({
        pf: parseFloat(pf) || 0,
        hw: parseFloat(hw) || 0,
        tGas: parseFloat(tGas) || 0,
        gg: parseFloat(gg) || 0.6,
        diam: diamPlaca,
        meterRun,
      })
    } catch {
      return null
    }
  }, [pf, hw, tGas, gg, diamPlaca, meterRun, gasConfigurado])

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
          ...((parseFloat(formDeTank(tank.id).trasegado) || 0) > 0 && { trasegado: parseFloat(formDeTank(tank.id).trasegado) }),
        }))

      const gas: ILecturaGas | undefined = gasResult
        ? {
            pf: parseFloat(pf) || 0,
            hw: parseFloat(hw) || 0,
            tGas: parseFloat(tGas) || 0,
            gg: parseFloat(gg) || 0.6,
            diam: diamPlaca,
            meterRun,
            beta: gasResult.beta,
            Fc: gasResult.Fc,
            Fb: gasResult.Fb,
            Fg: gasResult.Fg,
            Ftf: gasResult.Ftf,
            Fpv: gasResult.Fpv,
            Y: gasResult.Y,
            Cd: gasResult.Cd,
            Z: gasResult.Z,
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

      // Constancia del balance de masas / incongruencias de captura (alertas internas, no salen en exportables)
      for (const t of pozo.tanques) {
        const av = avisosDeTanque(t.id)
        for (const m of av.mensajes) alertas.push(`${ETIQUETA_NIVEL[m.nivel]} (${t.nombre}): ${m.texto}`)
      }

      const escrituras = Promise.all([
        addDoc(collection(db, 'evaluaciones', evalId, 'lecturas'), {
          hora: lecturas.length + 1,
          timestamp: new Date(),
          tanques,
          ...(gas && { gas }),
          operativos: {
            pCab: parseFloat(pCab) || 0,
            pSep: parseFloat(pSep) || 0,
            // Casing solo en zonas que lo usan (Faja); en Norte de Monagas no se opera con Casing Gas.
            ...(zonaCaps.casing && { pCsg: parseFloat(pCsg) || 0 }),
            ...(pozo.reductorPulgadas?.trim() && { reductorPulgadas: pozo.reductorPulgadas.trim() }),
          },
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

      <div className="p-4 max-w-2xl mx-auto space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <section aria-label="Total trasegado" className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500">Total trasegado</p>
            <p className="text-xl font-bold text-white font-mono">
              {trasegadoGuardado.totalBls.toFixed(2)} <span className="text-xs font-normal text-slate-500">Bls</span>
            </p>
            {trasegadoPorGuardar.totalBls > 0 && (
              <p className="text-xs text-amber-400 mt-1">+ {trasegadoPorGuardar.totalBls.toFixed(2)} Bls por guardar</p>
            )}
          </section>
          <section aria-label="Número de viajes" className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500">Número de viajes</p>
            <p className="text-xl font-bold text-white font-mono">{trasegadoGuardado.viajes}</p>
            {trasegadoPorGuardar.viajes > 0 && (
              <p className="text-xs text-amber-400 mt-1">+ {trasegadoPorGuardar.viajes} por guardar</p>
            )}
          </section>
        </div>

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
          const avisos = avisosDeTanque(tank.id)
          const nivelBalance = balance.tanques.find((t) => t.tanqueId === tank.id)?.nivel ?? 'OK'
          // Resaltado directo de los campos de entrada: rojo/amarillo según el balance; un salto desproporcionado
          // marca la Medida Final en amarillo.
          const nivelMedida = tocado(tank.id) ? peorNivel(nivelBalance, avisos.mensajes.some((m) => m.texto.includes('por hora')) ? 'AMARILLA' : 'OK') : 'OK'
          const nivelTrasegado = tocado(tank.id) ? nivelBalance : 'OK'
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
                    data-nivel={nivelMedida}
                    className={claseCampo(nivelMedida)}
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
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1">Trasegado (Bls)</label>
                <input
                  type="number" step="0.01" min="0" value={form.trasegado}
                  onChange={(e) => actualizarTank(tank.id, 'trasegado', e.target.value)}
                  data-nivel={nivelTrasegado}
                  className={claseCampo(nivelTrasegado)}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Solo si un viaje de vacuum retiró fluido de este tanque desde la lectura anterior.
                </p>
              </div>

              {(bajoMedida(tank.id) || avisos.mensajes.length > 0) && (
                <div
                  role="status"
                  data-nivel={bajoMedida(tank.id) && avisos.nivel === 'OK' ? 'AMARILLA' : avisos.nivel}
                  className={`text-xs space-y-1 ${avisos.nivel === 'ROJA' ? 'text-red-400' : 'text-amber-400'}`}
                >
                  {bajoMedida(tank.id) && (
                    <p>
                      La medida final es menor que la inicial ({miPorTanque[tank.id] ?? tank.mi}): el BPD de este tanque sale 0.
                      Si el tanque se vació por un viaje de vacuum, anota los barriles en "Trasegado (Bls)".
                    </p>
                  )}
                  {avisos.mensajes.map((m) => (
                    <p key={m.texto}>
                      <strong>{ETIQUETA_NIVEL[m.nivel]}:</strong> {m.texto} Puedes seguir y guardar.
                    </p>
                  ))}
                </div>
              )}

              {resultado && (
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                  <span>BPD: <span className="text-white font-mono">{resultado.bpd.toFixed(2)}</span></span>
                  {zonaCaps.netosEnLecturas && (
                    <span>Netos: <span className="text-white font-mono">{resultado.netos.toFixed(2)}</span></span>
                  )}
                </div>
              )}
            </section>
          )
        })}

        <BalanceMasasPanel balance={balance} />

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
          <h3 className="text-sm font-semibold text-white">Gas (AGA-3)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Presión Estática (psig)</label>
              <input type="number" value={pf} onChange={(e) => editarGas('pf', e.target.value)} data-prefill={gasPrefill('pf')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Diferencial (inH₂O)</label>
              <input type="number" value={hw} onChange={(e) => editarGas('hw', e.target.value)} data-prefill={gasPrefill('hw')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Temp. gas (°F)</label>
              <input type="number" value={tGas} onChange={(e) => editarGas('tGas', e.target.value)} data-prefill={gasPrefill('tGas')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Gravedad específica</label>
              <input type="number" step="0.01" value={gg} onChange={(e) => editarGas('gg', e.target.value)} data-prefill={gasPrefill('gg')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
          </div>
          {gasAnterior && (
            <p className="text-xs text-slate-500">Valores de la carga anterior; edítalos si cambiaron.</p>
          )}
          <p className="text-xs text-slate-500 flex items-center gap-1">
            Placa: <span className="text-slate-300 font-mono">{gasConfigurado ? `${diamPlaca}"` : '-'}</span>
            {' · '}Meter Run: <span className="text-slate-300 font-mono">{gasConfigurado ? `${meterRun}"` : '-'}</span>
            <FiLock aria-hidden="true" />
          </p>
          {!gasConfigurado && (
            <p role="alert" className="text-xs text-amber-400 pt-2 border-t border-slate-800">
              Este pozo no tiene Placa y Meter Run configurados: no se calcula Qg. Avise a su Supervisor de Campo.
            </p>
          )}
          {gasResult && (
            <p className="text-xs text-slate-400 pt-2 border-t border-slate-800">
              Qg: <span className="text-white font-mono">{gasResult.qg.toFixed(2)} MMSCFD</span>
            </p>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
          <h3 className="text-sm font-semibold text-white">Presiones Operativas</h3>
          {operativosAnterior && (
            <p className="text-xs text-slate-500">Valores de la carga anterior; edítalos si cambiaron.</p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">P. Cabezal (psig)</label>
              <input type="number" value={pCab} onChange={(e) => editarPresion('pCab', e.target.value)} data-prefill={presionPrefill('pCab')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">P. Separador (psig)</label>
              <input type="number" value={pSep} onChange={(e) => editarPresion('pSep', e.target.value)} data-prefill={presionPrefill('pSep')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
            </div>
            {zonaCaps.casing && (
              <div>
                <label className="block text-xs text-slate-500 mb-1">P. Casing (psig)</label>
                <input type="number" value={pCsg} onChange={(e) => editarPresion('pCsg', e.target.value)} data-prefill={presionPrefill('pCsg')} className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white" />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-500 mb-1">Reductor (pulg)</label>
              <div
                aria-label="Reductor (pulg)"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300"
              >
                {pozo?.reductorPulgadas?.trim() || '-'}
              </div>
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
