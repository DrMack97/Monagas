// src/components/dashboard/MetricCard.tsx
//
// Tarjeta de métrica agregada (Netos totales, Pozos en curso, etc).
// Tema oscuro consistente con apps/mobile-operator y el resto de
// web-supervisor — no reutiliza KPICard.tsx porque ese usa fondo
// claro (bg-white), rompiendo la consistencia visual del sistema.

import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: string
  unit?: string
  accent?: 'amber' | 'emerald' | 'blue' | 'slate'
  icon?: ReactNode
}

const ACCENT_STYLES: Record<string, string> = {
  amber: 'text-amber-400',
  emerald: 'text-emerald-400',
  blue: 'text-blue-400',
  slate: 'text-slate-200',
}

export default function MetricCard({ label, value, unit, accent = 'slate', icon }: MetricCardProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">{label}</p>
        {icon && <span className="text-base opacity-70" aria-hidden="true">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${ACCENT_STYLES[accent]}`}>{value}</span>
        {unit && <span className="text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  )
}
