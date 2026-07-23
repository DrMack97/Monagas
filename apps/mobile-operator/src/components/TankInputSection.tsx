// src/components/TankInputSection.tsx
//
// Muestra la configuración de un tanque. En NuevaLecturaPage se usa
// siempre en modo solo-lectura — el operador no puede modificar
// Medida Inicial ni Factor Tanque (kk); esos valores los define
// el supervisor (ver Firestore Rules: /pozos solo escribible por
// SUP_CAMPO/SUP_AREA/GERENTE/ROOT).

import type { ITank } from '@core/types'

interface TankInputSectionProps {
  tank: ITank
  readOnly?: boolean
}

export default function TankInputSection({ tank, readOnly = true }: TankInputSectionProps) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
      <h4 className="font-medium text-white mb-3">{tank.nombre}</h4>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-slate-500 mb-1">Medida Inicial</p>
          <div className="flex items-center gap-1">
            <span className="text-white font-mono">{tank.mi}</span>
            <span className="text-xs text-slate-500">pulg</span>
            {readOnly && <span className="text-xs">🔒</span>}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-500 mb-1">Factor Tanque (kk)</p>
          <div className="flex items-center gap-1">
            <span className="text-white font-mono">{tank.ft}</span>
            <span className="text-xs text-slate-500">BBL/pulg</span>
            {readOnly && <span className="text-xs">🔒</span>}
          </div>
        </div>
      </div>

      {readOnly && (
        <p className="text-xs text-slate-500 mt-3">
          Configurado por el supervisor. Contáctalo si necesitas una corrección.
        </p>
      )}
    </div>
  )
}
