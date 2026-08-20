// src/pages/UsersPage.tsx
//
// Gestión de personal — exclusiva SUP_AREA/GERENTE (App.tsx ya
// bloquea esta ruta para SUP_CAMPO vía RutaProtegida soloGestion).
// Ambas acciones (crear, reasignar) pasan por Cloud Functions — este
// componente nunca escribe directo a /usuarios ni a /pozos.

import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../services/firebase'
import { useAuth } from '../hooks/useAuth'
import { usePersonal } from '../hooks/usePersonal'
import { usePozosVisibles } from '../hooks/usePozosVisibles'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import { LoadingState, ErrorState, EmptyState } from '../components/dashboard/DashboardStates'
import type { IUsuario } from '@core/types'

// Desactivar no es lo mismo que reasignar/liberar (eso ya lo resuelve
// ModalReasignar) — no toca pozoAsignado, solo revoca el acceso.
// Ver setPersonalActivo.ts: además de usuarios/{uid}.activo, bloquea
// el login real (Firebase Auth `disabled`), no solo el dato en
// Firestore. Sin confirmación de por medio (a diferencia de un delete
// destructivo, es 100% reversible con el mismo botón).
function BotonActivo({ usuario, onCambiado }: { usuario: IUsuario; onCambiado: () => void }) {
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setProcesando(true)
    setError(null)
    try {
      const setPersonalActivo = httpsCallable(functions, 'setPersonalActivo')
      await setPersonalActivo({ targetUid: usuario.uid, activo: !usuario.activo })
      onCambiado()
    } catch (err: any) {
      setError(err.message ?? 'No se pudo actualizar.')
    } finally {
      setProcesando(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={toggle}
        disabled={procesando}
        className={`text-xs border rounded-lg px-3 py-1.5 disabled:opacity-50 ${
          usuario.activo
            ? 'text-red-400 border-red-900'
            : 'text-emerald-400 border-emerald-900'
        }`}
      >
        {procesando ? 'Procesando...' : usuario.activo ? 'Desactivar' : 'Reactivar'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

const ROL_LABEL: Record<string, string> = {
  OPERADOR: 'Operador',
  SUP_CAMPO: 'Supervisor de Campo',
}

function ModalCrearPersonal({
  rolCreador, zona, onClose, onCreado,
}: { rolCreador: string | null; zona: string | null; onClose: () => void; onCreado: () => void }) {
  const { pozos } = usePozosVisibles(rolCreador as any, zona as any, null)

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState<'OPERADOR' | 'SUP_CAMPO'>('OPERADOR')
  const [pozoId, setPozoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      const crearPersonal = httpsCallable(functions, 'crearPersonal')
      await crearPersonal({ nombre, email, password, rol, pozoId })
      onCreado()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'No se pudo crear el usuario.')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-20">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Nuevo Personal</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input label="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          <Input label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Contraseña temporal" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white">
              <option value="OPERADOR">Operador</option>
              <option value="SUP_CAMPO">Supervisor de Campo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Pozo destino</label>
            <select value={pozoId} onChange={(e) => setPozoId(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white">
              <option value="">Selecciona un pozo</option>
              {pozos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>

          {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</div>}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
            <Button type="submit" fullWidth loading={guardando}>Crear</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalReasignar({
  usuario, rolCreador, zona, onClose, onReasignado,
}: { usuario: IUsuario; rolCreador: string | null; zona: string | null; onClose: () => void; onReasignado: () => void }) {
  const { pozos } = usePozosVisibles(rolCreador as any, zona as any, null)
  const [pozoId, setPozoId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function reasignar(nuevoPozoId: string | null) {
    setGuardando(true)
    setError(null)
    try {
      const reassignPozo = httpsCallable(functions, 'reassignPozo')
      await reassignPozo({ targetUid: usuario.uid, nuevoPozoId })
      onReasignado()
      onClose()
    } catch (err: any) {
      setError(err.message ?? 'No se pudo reasignar.')
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-20">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 w-full max-w-sm space-y-4">
        <h2 className="text-lg font-bold text-white">Reasignar a {usuario.nombre}</h2>
        <p className="text-sm text-slate-400">Pozo actual: {usuario.pozoAsignado ?? 'Sin asignar'}</p>

        <select value={pozoId} onChange={(e) => setPozoId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-white">
          <option value="">Selecciona un pozo</option>
          {pozos.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>

        {error && <div className="text-sm text-red-400 bg-red-950/40 border border-red-900 rounded-lg px-3 py-2">{error}</div>}

        <div className="flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>Cancelar</Button>
          <Button variant="danger" loading={guardando} onClick={() => reasignar(null)}>Liberar</Button>
          <Button loading={guardando} disabled={!pozoId} onClick={() => reasignar(pozoId)}>Mover</Button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const { rol, zona } = useAuth()
  const { personal, loading, error } = usePersonal(rol, zona)
  const [modalCrear, setModalCrear] = useState(false)
  const [usuarioReasignar, setUsuarioReasignar] = useState<IUsuario | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Personal</h1>
        <Button onClick={() => setModalCrear(true)}>+ Nuevo Personal</Button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} />
      ) : personal.length === 0 ? (
        <EmptyState rol={rol} />
      ) : (
        <div className="space-y-2">
          {personal.map((u) => (
            <div key={u.uid} className={`flex items-center justify-between bg-slate-900 border rounded-xl p-4 ${u.activo ? 'border-slate-800' : 'border-slate-800 opacity-60'}`}>
              <div>
                <p className="text-white font-medium flex items-center gap-2">
                  {u.nombre}
                  {!u.activo && (
                    <span className="text-[10px] uppercase tracking-wide text-red-400 border border-red-900 rounded px-1.5 py-0.5">Inactivo</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  {ROL_LABEL[u.rol] ?? u.rol} · Pozo: {u.pozoAsignado ?? 'Sin asignar'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setUsuarioReasignar(u)}
                  className="text-xs text-amber-400 border border-amber-900 rounded-lg px-3 py-1.5"
                >
                  Reasignar
                </button>
                <BotonActivo usuario={u} onCambiado={() => setRefreshKey((k) => k + 1)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {modalCrear && (
        <ModalCrearPersonal
          rolCreador={rol}
          zona={zona}
          onClose={() => setModalCrear(false)}
          onCreado={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {usuarioReasignar && (
        <ModalReasignar
          usuario={usuarioReasignar}
          rolCreador={rol}
          zona={zona}
          onClose={() => setUsuarioReasignar(null)}
          onReasignado={() => setRefreshKey((k) => k + 1)}
        />
      )}
    </div>
  )
}
