// src/components/dashboard/PozoSupervisorCard.tsx
import { FiDroplet, FiUsers, FiAlertTriangle } from 'react-icons/fi'
import type { IPozo } from '@core/types'
import EstadoBadge from '../common/EstadoBadge'

interface PozoSupervisorCardProps {
  pozo: IPozo
  onPress: () => void
}

export default function PozoSupervisorCard({ pozo, onPress }: PozoSupervisorCardProps) {
  const operadoresAsignados = pozo.asignados?.length ?? 0

  return (
    <button
      onClick={onPress}
      className="w-full text-left p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 hover:bg-slate-900/70 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="font-semibold text-white">{pozo.nombre}</h3>
          <p className="text-xs text-slate-500">{pozo.campo} · {pozo.zona}</p>
        </div>
        <EstadoBadge estado={pozo.estado} />
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1"><FiDroplet aria-hidden="true" /> {pozo.tanques?.length ?? 0} tanque{pozo.tanques?.length === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><FiUsers aria-hidden="true" /> {operadoresAsignados} operador{operadoresAsignados === 1 ? '' : 'es'}</span>
        <span className="flex items-center gap-1"><FiAlertTriangle aria-hidden="true" /> {pozo.limResorte} psi / {pozo.limGamma} inH₂O</span>
      </div>
    </button>
  )
}
