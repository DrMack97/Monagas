// TODO: Componente Input sección tanques - Player 2 (Frontend)
// Paso 1: Input para número de tanque, capacidad, nivel actual
// Paso 2: Validar que capacidad > 0, nivel <= capacidad
// Paso 3: Mostrar cálculo de volumen actual
// Prompt de implementación rápida:
// "Crear componente React TankInputSection con validación de tanque y cálculo de volumen"
// Entregable:
// - 3 inputs: número, capacidad, nivel
// - Validación frontend
// - Volumen calculado automáticamente
import React, { useState, useEffect } from 'react'

interface TankInputSectionProps {
  onTankChange: (tank: { numero: number; capacidad: number; nivel: number }) => void
}

export default function TankInputSection({ onTankChange }: TankInputSectionProps) {
  const [numero, setNumero] = useState(1)
  const [capacidad, setCapacidad] = useState(0)
  const [nivel, setNivel] = useState(0)
  const [volumen, setVolumen] = useState(0)

  useEffect(() => {
    setVolumen(capacidad * (nivel / 100))
    onTankChange({ numero, capacidad, nivel })
  }, [capacidad, nivel])

  return (
    <div className="p-4 border rounded">
      <h4>Tanque {numero}</h4>
      <input
        type="number"
        value={capacidad}
        onChange={(e) => setCapacidad(Number(e.target.value))}
        placeholder="Capacidad (Bls)"
        min="0"
        required
      />
      <input
        type="number"
        value={nivel}
        onChange={(e) => setNivel(Number(e.target.value))}
        placeholder="Nivel (%)"
        min="0"
        max="100"
        required
      />
      <p>Volumen actual: {volumen.toFixed(2)} Bls</p>
    </div>
  )
}
