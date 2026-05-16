// TODO: Componente Card de pozo - Player 2 (Frontend)
// Paso 1: Mostrar nombre del pozo, producción actual, estado
// Paso 2: Usar colores según estado (verde=aprobada, amarillo=pendiente, rojo=rechazada)
// Paso 3: Añadir botón para ver detalle
// Prompt de implementación rápida:
// "Crear componente React PozoCard con props: nombre, produccion, estado, onPress"
// Entregable:
// - Card con nombre, producción, estado visual
// - Click abre WellDetailPage
// - Badge de estado con color
import React from 'react'

interface PozoCardProps {
  nombre: string
  produccion: number
  estado: 'EN_CURSO' | 'PENDIENTE_SUPERVISOR' | 'APROBADA_SUPERVISOR' | 'RECHAZADA'
  onPress: () => void
}

export default function PozoCard({ nombre, produccion, estado, onPress }: PozoCardProps) {
  const estadoColor = {
    'EN_CURSO': 'bg-yellow-500',
    'PENDIENTE_SUPERVISOR': 'bg-orange-500',
    'APROBADA_SUPERVISOR': 'bg-green-500',
    'RECHAZADA': 'bg-red-500'
  }[estado]

  return (
    <div onClick={onPress} className="p-4 border rounded shadow">
      <h3>{nombre}</h3>
      <p>Producción: {produccion} Bls/día</p>
      <span className={`px-2 py-1 rounded ${estadoColor}`}>{estado}</span>
    </div>
  )
}
