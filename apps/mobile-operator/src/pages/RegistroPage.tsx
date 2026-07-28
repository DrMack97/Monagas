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
import React, { useState } from 'react';
import { calcTanque, calcAGA3 } from '@monagas/core/calculos';

export default function RegistroPage() {
  const [pozoId, setPozoId] = useState('');
  const [lectura, setLectura] = useState({
    mi: 0,        // Medida Inicial
    mf: 0,        // Medida Final
    ft: 2.4,      // Factor Tanque (ejemplo)
    th: 1,        // Tiempo en horas
    reductor: 0,  // Corrección manual
    aysPct: 0,    // Agua y Sedimentos (%)
    dilDia: 0,    // Diluyente (opcional)
    pf: 0,        // Presión Estática (para AGA3)
    hw: 0,        // Diferencial Barton
    tGas: 0,      // Temperatura del gas
    gg: 0.6,      // Gravedad específica
    diam: 2,      // Diámetro de la placa
    meterRun: 4,  // Diámetro del tubo
  });

  // Calcular resultados (pasando objetos completos)
  const tankResult = calcTanque({
    mi: lectura.mi,
    mf: lectura.mf,
    ft: lectura.ft,
    th: lectura.th,
    reductor: lectura.reductor,
    aysPct: lectura.aysPct,
    dilDia: lectura.dilDia,
  });

  const gasResult = calcAGA3({
    pf: lectura.pf,
    hw: lectura.hw,
    tGas: lectura.tGas,
    gg: lectura.gg,
    diam: lectura.diam,
    meterRun: lectura.meterRun,
  });

  return (
    <div>
      <h1>Registro de Evaluación</h1>
      
      <select value={pozoId} onChange={(e) => setPozoId(e.target.value)} required>
        <option value="">Seleccionar pozo</option>
        {/* TODO: Mapear pozos desde useWells */}
      </select>

      {/* Entradas para calcTanque */}
      <input
        type="number"
        value={lectura.mi}
        onChange={(e) => setLectura({ ...lectura, mi: Number(e.target.value) })}
        placeholder="Medida Inicial (pulg)"
      />
      <input
        type="number"
        value={lectura.mf}
        onChange={(e) => setLectura({ ...lectura, mf: Number(e.target.value) })}
        placeholder="Medida Final (pulg)"
      />
      <input
        type="number"
        value={lectura.ft}
        onChange={(e) => setLectura({ ...lectura, ft: Number(e.target.value) })}
        placeholder="Factor Tanque (BBL/pulg)"
      />
      <input
        type="number"
        value={lectura.th}
        onChange={(e) => setLectura({ ...lectura, th: Number(e.target.value) })}
        placeholder="Tiempo (horas)"
      />
      <input
        type="number"
        value={lectura.aysPct}
        onChange={(e) => setLectura({ ...lectura, aysPct: Number(e.target.value) })}
        placeholder="AyS (%)"
      />

      {/* Entradas para calcAGA3 */}
      <input
        type="number"
        value={lectura.pf}
        onChange={(e) => setLectura({ ...lectura, pf: Number(e.target.value) })}
        placeholder="Presión Estática (psig)"
      />
      <input
        type="number"
        value={lectura.hw}
        onChange={(e) => setLectura({ ...lectura, hw: Number(e.target.value) })}
        placeholder="Diferencial Barton (inH₂O)"
      />
      <input
        type="number"
        value={lectura.tGas}
        onChange={(e) => setLectura({ ...lectura, tGas: Number(e.target.value) })}
        placeholder="Temperatura del gas (°F)"
      />

      <div>
        <h3>Resultados Tanque</h3>
        <p>Netos: {tankResult.netos.toFixed(2)} Bls/día</p>
        <p>BPH: {tankResult.bph.toFixed(2)}</p>
        <p>BPD: {tankResult.bpd.toFixed(2)}</p>
        <p>AyS: {tankResult.aysBls.toFixed(2)} Bls</p>
      </div>

      <div>
        <h3>Resultados Gas</h3>
        <p>Qg: {gasResult.qg.toFixed(2)} MPCGD</p>
        <p>β: {gasResult.beta.toFixed(4)}</p>
        <p>Fc: {gasResult.Fc.toFixed(4)}</p>
      </div>

      <button>Cerrar evaluación</button>
    </div>
  );
}
