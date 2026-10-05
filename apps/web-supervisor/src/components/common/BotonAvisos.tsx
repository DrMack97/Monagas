// src/components/common/BotonAvisos.tsx
//
// Botón del Header para activar/desactivar las notificaciones push del
// navegador (solo SUP_AREA y GERENTE: son a quienes escribe notifyMgr.ts). El
// permiso del navegador solo se pide aquí, tras un clic — nunca al cargar la
// página (ver services/push.ts).

import { useState } from 'react'
import { FiBell, FiBellOff } from 'react-icons/fi'
import {
  activarPush,
  desactivarPush,
  estadoAvisos,
  type EstadoAvisos,
} from '../../services/push'

export default function BotonAvisos() {
  const [estado, setEstado] = useState<EstadoAvisos>(() => estadoAvisos())
  const [ocupado, setOcupado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (estado === 'no-soportado') return null

  const alternar = async () => {
    setOcupado(true)
    setError(null)
    try {
      if (estado === 'activo') {
        await desactivarPush()
      } else {
        const resultado = await activarPush()
        if (resultado === 'error') setError('No se pudieron activar los avisos. Intenta de nuevo.')
        if (resultado === 'no-soportado') setError('Este navegador no admite avisos.')
      }
    } catch (err) {
      console.error('Error cambiando el estado de los avisos:', err)
      setError('No se pudo completar la acción. Intenta de nuevo.')
    } finally {
      setEstado(estadoAvisos())
      setOcupado(false)
    }
  }

  const base =
    'inline-flex items-center gap-1.5 text-xs border rounded-lg px-3 py-1.5 transition-colors'

  if (estado === 'denegado') {
    return (
      <span
        className={`${base} border-slate-800 text-slate-500 cursor-not-allowed`}
        title="El navegador bloqueó los avisos para este sitio. Actívalos desde el candado de la barra de direcciones."
      >
        <FiBellOff aria-hidden="true" />
        <span className="hidden sm:inline">Avisos bloqueados</span>
      </span>
    )
  }

  const activo = estado === 'activo'
  return (
    <button
      type="button"
      onClick={alternar}
      disabled={ocupado}
      aria-pressed={activo}
      title={error ?? (activo ? 'Desactivar avisos de evaluaciones pendientes' : 'Recibir un aviso cuando haya evaluaciones por aprobar')}
      className={`${base} ${
        error
          ? 'border-red-800 text-red-300'
          : activo
            ? 'border-emerald-800 text-emerald-300 hover:bg-slate-800'
            : 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white'
      } disabled:opacity-60`}
    >
      {activo ? <FiBell aria-hidden="true" /> : <FiBellOff aria-hidden="true" />}
      <span className="hidden sm:inline">
        {ocupado ? 'Un momento…' : error ? 'Reintentar avisos' : activo ? 'Avisos activados' : 'Activar avisos'}
      </span>
    </button>
  )
}
