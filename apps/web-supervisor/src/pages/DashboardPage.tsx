import React, { useState } from 'react';

// Datos de ejemplo
const POZOS = [
  { id: 'p1', nombre: 'MFB-950', campo: 'Bare', estado: 'EN_CURSO', netos: 133.10 },
  { id: 'p2', nombre: 'MFB-919', campo: 'Bare', estado: 'PENDIENTE', netos: 57.05 },
  { id: 'p3', nombre: 'MFB-882', campo: 'Norte', estado: 'OFICIAL', netos: 89.40 },
];

export default function DashboardPage() {
  const [pozoSeleccionado, setPozoSeleccionado] = useState(POZOS[0]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-white">Well Testing App - Supervisor</h1>
      <p className="text-gray-400">Distrito Monagas</p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Fiscalizado</p>
          <p className="text-2xl font-bold text-yellow-500">279.55 Bpd</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Pozos en prueba</p>
          <p className="text-2xl font-bold text-white">{POZOS.length}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {POZOS.map((p) => (
          <button
            key={p.id}
            className="w-full bg-gray-800 p-4 rounded-lg text-left hover:bg-gray-700"
            onClick={() => setPozoSeleccionado(p)}
          >
            <div className="flex justify-between">
              <span className="font-bold text-white">{p.nombre}</span>
              <span className={`px-2 py-1 text-xs rounded ${
                p.estado === 'EN_CURSO' ? 'bg-green-900 text-green-300' : 'bg-yellow-900 text-yellow-300'
              }`}>
                {p.estado}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Campo: {p.campo} · Neto: <span className="text-green-400">{p.netos} bpd</span>
            </div>
          </button>
        ))}
      </div>

      {pozoSeleccionado && (
        <div className="mt-4 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-bold text-white">Detalle: {pozoSeleccionado.nombre}</h2>
          <p className="text-gray-400">Neto: {pozoSeleccionado.netos} bpd</p>
          <p className="text-gray-400">Estado: {pozoSeleccionado.estado}</p>
        </div>
      )}
    </div>
  );
}