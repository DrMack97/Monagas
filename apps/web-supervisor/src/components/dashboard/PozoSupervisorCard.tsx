// src/components/dashboard/PozoSupervisorCard.tsx
import { FiDroplet, FiUsers, FiAlertTriangle } from 'react-icons/fi'
import type { IPozo } from '@core/types'

interface PozoSupervisorCardProps {
  pozo: IPozo
  onPress: () => void
}

const ESTADO_LABEL: Record<string, string> = {
  EN_CURSO: 'En Curso',
  CERRADA: 'Cerrada',
  PENDIENTE_SUPERVISOR: 'Pendiente Supervisor',
  APROBADA_SUPERVISOR: 'Aprobada',
  OFICIAL: 'Oficial',
}

const ESTADO_COLOR: Record<string, string> = {
  EN_CURSO: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  CERRADA: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
  PENDIENTE_SUPERVISOR: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  APROBADA_SUPERVISOR: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  OFICIAL: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
}

export default function PozoSupervisorCard({ pozo, onPress }: PozoSupervisorCardProps) {
  const badgeClass = ESTADO_COLOR[pozo.estado] ?? ESTADO_COLOR.CERRADA
  const badgeLabel = ESTADO_LABEL[pozo.estado] ?? pozo.estado
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
        <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-800">
        <span className="flex items-center gap-1"><FiDroplet aria-hidden="true" /> {pozo.tanques?.length ?? 0} tanque{pozo.tanques?.length === 1 ? '' : 's'}</span>
        <span className="flex items-center gap-1"><FiUsers aria-hidden="true" /> {operadoresAsignados} operador{operadoresAsignados === 1 ? '' : 'es'}</span>
        <span className="flex items-center gap-1"><FiAlertTriangle aria-hidden="true" /> {pozo.limResorte} psi / {pozo.limGamma} inH₂O</span>
      </div>
    </button>
  )
}
