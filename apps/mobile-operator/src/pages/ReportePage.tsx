// TODO: Página Reportes - Player 2 (Frontend)
// Paso 1: Select rango fechas (inicio, fin)
// Paso 2: Mostrar producción total, promedio, pico
// Paso 3: Botón exportar PDF/Excel
// Prompt de implementación rápida:
// "Crear ReportePage con select fechas, KPIs producción, export PDF/Excel"
// Entregable:
// - DateInput inicio y fin
// - 3 KPIs: total, promedio, pico
// - Botón exportar funciona
import React, { useState } from 'react'

export default function ReportePage() {
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  const exportarPDF = () => {
    // TODO: Implementar con jspdf
    console.log('Exportar PDF')
  }

  const exportarExcel = () => {
    // TODO: Implementar con xlsx
    console.log('Exportar Excel')
  }

  return (
    <div>
      <h1>Reportes</h1>
      <input
        type="date"
        value={fechaInicio}
        onChange={(e) => setFechaInicio(e.target.value)}
        placeholder="Fecha inicio"
      />
      <input
        type="date"
        value={fechaFin}
        onChange={(e) => setFechaFin(e.target.value)}
        placeholder="Fecha fin"
      />
      
      <div>Total: 1,234 Bls</div>
      <div>Promedio: 123 Bls/día</div>
      <div>Pico: 456 Bls/día</div>
      
      <button onClick={exportarPDF}>📄 Exportar PDF</button>
      <button onClick={exportarExcel}>📊 Exportar Excel</button>
    </div>
  )
}
