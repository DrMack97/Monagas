// src/pages/WellDetailPage.tsx
//
// Detalle y edición de un pozo. El alcance de edición depende del rol:
//   SUP_CAMPO (solo en SU propio pozo) — únicamente tanques y límites.
//   SUP_AREA/GERENTE — todo, incluyendo nombre/campo/zona.
//
// El update de SUP_CAMPO envía EXCLUSIVAMENTE {tanques, limResorte,
// limGamma} — nada más — para coincidir exacto con hasOnly([...]) de
// canEditOwnTanquesYLimites() en firestore.rules. Enviar cualquier
// otro campo, aunque no cambie de valor, arriesga que Firestore
// rechace el write completo.

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { usePozo } from '../hooks/usePozo'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { LoadingState, ErrorState } from '../components/dashboard/DashboardStates'
import type { ITank } from '@core/types'

export default function WellDetailPage() {
  const { pozoId } = useParams<{ pozoId: string }>()
  const navigate = useNavigate()
  const { rol } = useAuth()
  const { pozo, loading, error } = usePozo(pozoId)

  const puedeEditarTodo = rol === 'SUP_AREA' || rol === 'GERENTE'
  const puedeEditarTanquesYLimites = puedeEditarTodo || rol === 'SUP_CAMPO'

  const [tanques, setTanques] = useState<ITank[]>([])
  const [limResorte, setLimResorte] = useState('')
  const [limGamma, setLimGamma] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [guardadoOk, setGuardadoOk] = useState(false)
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null)

  useEffect(() => {
    if (pozo) {
      setTanques(pozo.tanques)
      setLimResorte(String(pozo.limResorte))
      setLimGamma(String(pozo.limGamma))
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
      // Payload EXACTO — solo estos 3 campos, sin importar el rol,
      // para que también funcione bajo la regla restringida de SUP_CAMPO.
      await updateDoc(doc(db, 'pozos', pozoId), {
        tanques,
        limResorte: parseFloat(limResorte) || 0,
        limGamma: parseFloat(limGamma) || 0,
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
