// src/pages/NewWellPage.tsx
//
// Creación de pozos — exclusiva de SUP_AREA/GERENTE (coincide con
// canManagePozoEnZona() en firestore.rules). SUP_AREA queda restringido a
// crear pozos en SU propia zona: el campo Zona se bloquea en modo
// solo-lectura mostrando la suya, en vez de dejarlo elegir.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiX } from 'react-icons/fi'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import type { ITank } from '@core/types'

interface TankDraft {
  id: string
  nombre: string
  mi: string
  ft: string
}

function nuevoTankDraft(n: number): TankDraft {
  return { id: `t${n}`, nombre: `Tanque ${n}`, mi: '0', ft: '2.40' }
}

export default function NewWellPage() {
  const navigate = useNavigate()
  const { rol, zona, user } = useAuth()

  const [nombre, setNombre] = useState('')
  const [campo, setCampo] = useState('')
  const [zonaSeleccionada, setZonaSeleccionada] = useState(zona ?? 'FAJA')
  const [horasEval, setHorasEval] = useState('5')
  const [limResorte, setLimResorte] = useState('300')
  const [limGamma, setLimGamma] = useState('60')
  const [tanques, setTanques] = useState<TankDraft[]>([nuevoTankDraft(1)])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zonaFinal = rol === 'SUP_AREA' ? zona : zonaSeleccionada

  function actualizarTank(idx: number, campo: keyof TankDraft, valor: string) {
    setTanques((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, [campo]: valor } : t))
    )
  }

  function agregarTank() {
    if (tanques.length >= 5) return
    setTanques((prev) => [...prev, nuevoTankDraft(prev.length + 1)])
  }

  function quitarTank(idx: number) {
    if (tanques.length <= 1) return
    setTanques((prev) => prev.filter((_, i) => i !== idx))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!zonaFinal || !user) return
    setGuardando(true)
    setError(null)
    try {
      const tanquesFinales: ITank[] = tanques.map((t) => ({
        id: t.id,
        nombre: t.nombre,
        mi: parseFloat(t.mi) || 0,
        ft: parseFloat(t.ft) || 2.4,
      }))

      await addDoc(collection(db, 'pozos'), {
        nombre,
        campo,
        zona: zonaFinal,
        ft: tanquesFinales[0]?.ft.toString() ?? '2.40',
        limResorte: parseFloat(limResorte) || 0,
        limGamma: parseFloat(limGamma) || 0,
        horasEval: parseFloat(horasEval) || 5,
        estado: 'EN_CURSO',
        evalEnCursoId: null,
        asignados: [],
        creadoPor: user.uid,
        tanques: tanquesFinales,
        creadoEn: serverTimestamp(),
      })

      navigate('/dashboard')
    } catch (err: any) {
      setError(
        err.code === 'permission-denied'
          ? 'No tienes permiso para crear pozos.'
          : 'No se pudo crear el pozo. Intenta de nuevo.'
      )
      setGuardando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 border-b border-slate-800 flex items-center gap-3 max-w-2xl mx-auto">
        <button onClick={() => navigate('/dashboard')} className="text-slate-400"><FiArrowLeft aria-label="Volver" /></button>
        <h1 className="text-lg font-bold text-white">Nuevo Pozo</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Identificación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Nombre del Pozo" value={nombre} onChange={(e) => setNombre(e.target.value)} required placeholder="ej: MFB-1025" />
            <Input label="Campo" value={campo} onChange={(e) => setCampo(e.target.value)} required placeholder="ej: Bare" />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Zona</label>
            {rol === 'SUP_AREA' ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-slate-400">
                {zona} <span className="text-xs">(tu zona asignada)</span>
              </div>
            ) : (
              <select
                value={zonaSeleccionada}
                onChange={(e) => setZonaSeleccionada(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white"
              >
                <option value="FAJA">FAJA</option>
                <option value="MONAGAS">MONAGAS</option>
              </select>
            )}
          </div>

          <Input label="Horas de Evaluación (H)" type="number" value={horasEval} onChange={(e) => setHorasEval(e.target.value)} />
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-300">Tanques</h2>
            <button type="button" onClick={agregarTank} className="text-xs text-amber-400" disabled={tanques.length >= 5}>
              + Agregar Tanque
            </button>
          </div>

          {tanques.map((tank, idx) => (
            <div key={tank.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Input label="Nombre" value={tank.nombre} onChange={(e) => actualizarTank(idx, 'nombre', e.target.value)} className="flex-1" />
                {tanques.length > 1 && (
                  <button type="button" onClick={() => quitarTank(idx)} className="text-red-400 text-xs ml-2 mt-6"><FiX aria-label="Quitar tanque" /></button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Medida Inicial (pulg)" type="number" step="0.01" value={tank.mi} onChange={(e) => actualizarTank(idx, 'mi', e.target.value)} />
                <Input label="Factor Tanque — kk (BBL/pulg)" type="number" step="0.01" value={tank.ft} onChange={(e) => actualizarTank(idx, 'ft', e.target.value)} />
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-slate-300">Límites de Alerta</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Resorte (psi)" type="number" value={limResorte} onChange={(e) => setLimResorte(e.target.value)} />
            <Input label="Gamma (inH₂O)" type="number" value={limGamma} onChange={(e) => setLimGamma(e.target.value)} />
          </div>
        </section>

        {error && (
          <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <Button type="submit" fullWidth loading={guardando}>
          Crear Pozo
        </Button>
      </form>
    </div>
  )
}
