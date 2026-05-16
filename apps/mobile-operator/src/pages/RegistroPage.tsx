// TODO: Página Registro de evaluación - Player 2 (Frontend)
// Paso 1: Seleccionar pozo de lista
// Paso 2: Input lecturas: BPH, BPD, presión, temperatura
// Paso 3: Calcular automáticamente Netos, Qg con @core/calculos
// Prompt de implementación rápida:
// "Crear RegistroPage con selección pozo, inputs lecturas, cálculos automáticos @core"
// Entregable:
// - Select pozo
// - 4 inputs de lectura
// - Cálculos en tiempo real
// - Botón cerrar evaluación
import React, { useState } from 'react'
import { calcularBPH, calcularQg } from '@core/calculos'

export default function RegistroPage() {
  const [pozoId, setPozoId] = useState('')
  const [lectura, setLectura] = useState({
    bph: 0,
    bpd: 0,
    presion: 0,
    temperatura: 0
  })

  const netos = calcularBPH(lectura.bph, lectura.bpd)
  const qg = calcularQg(lectura.presion, lectura.temperatura)

  return (
    <div>
      <h1>Registro de Evaluación</h1>
      <select value={pozoId} onChange={(e) => setPozoId(e.target.value)} required>
        <option value="">Seleccionar pozo</option>
        {/* TODO: Mapear pozos desde useWells */}
      </select>
      
      <input
        type="number"
        value={lectura.bph}
        onChange={(e) => setLectura({ ...lectura, bph: Number(e.target.value) })}
        placeholder="BPH"
      />
      <input
        type="number"
        value={lectura.bpd}
        onChange={(e) => setLectura({ ...lectura, bpd: Number(e.target.value) })}
        placeholder="BPD"
      />
      <input
        type="number"
        value={lectura.presion}
        onChange={(e) => setLectura({ ...lectura, presion: Number(e.target.value) })}
        placeholder="Presión"
      />
      <input
        type="number"
        value={lectura.temperatura}
        onChange={(e) => setLectura({ ...lectura, temperatura: Number(e.target.value) })}
        placeholder="Temperatura"
      />
      
      <div>Netos: {netos} Bls/día</div>
      <div>Qg: {qg} MPCGD</div>
      
      <button>Cerrar evaluación</button>
    </div>
  )
}
