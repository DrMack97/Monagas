// src/components/BalanceMasasPanel.tsx
//
// Resumen visible de la ecuación de balance de masas (Desplazamiento total − Total trasegado − Existente total = 0)
// con su nivel de alerta. NO bloquea nada: solo informa; el botón de guardar sigue disponible.

import type { BalanceMasas, NivelAlerta } from '@core/utils/balanceMasas'

export const ETIQUETA_NIVEL: Record<NivelAlerta, string> = {
  OK: 'Cuadra',
  AMARILLA: 'Alerta amarilla',
  ROJA: 'Alerta roja',
}

const ESTILO: Record<NivelAlerta, string> = {
  OK: 'border-slate-800 text-slate-300',
  AMARILLA: 'border-amber-500/60 bg-amber-950/30 text-amber-300',
  ROJA: 'border-red-500/60 bg-red-950/30 text-red-300',
}

const bls = (n: number) => n.toFixed(2)

export default function BalanceMasasPanel({ balance }: { balance: BalanceMasas }) {
  return (
    <section
      aria-label="Balance de masas"
      data-nivel={balance.nivel}
      className={`rounded-xl border p-3 space-y-1 bg-slate-900 ${ESTILO[balance.nivel]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-white">Balance de masas</h3>
        <span className="text-xs font-medium">{ETIQUETA_NIVEL[balance.nivel]}</span>
      </div>
      <p className="text-xs font-mono">
        Desplazamiento {bls(balance.desplazamientoTotal)} − Trasegado {bls(balance.totalTrasegado)} − Existente{' '}
        {bls(balance.existenteTotal)} = {bls(balance.residuoTotal)} Bls
      </p>
      {balance.nivel === 'AMARILLA' && (
        <p className="text-xs">Desviación menor: menos de una pulgada de nivel. Revisa las medidas; puedes seguir y guardar.</p>
      )}
      {balance.nivel === 'ROJA' && (
        <p className="text-xs">
          Discrepancia crítica: más de una pulgada de nivel en algún tanque. Revisa Medida Final y Trasegado; puedes seguir y
          guardar, queda registrada como alerta.
        </p>
      )}
    </section>
  )
}
