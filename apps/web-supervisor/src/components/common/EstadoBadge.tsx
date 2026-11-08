// src/components/common/EstadoBadge.tsx
//
// Etiqueta de estado de una evaluación/pozo, con su color (ver utils/estadoEvaluacion.ts).

import { estadoColor, estadoLabel } from '../../utils/estadoEvaluacion'

export default function EstadoBadge({ estado }: { estado: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${estadoColor(estado)}`}>
      {estadoLabel(estado)}
    </span>
  )
}
