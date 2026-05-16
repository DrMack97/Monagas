// TODO: Página Dashboard operator - Player 2 (Frontend)
// Paso 1: Mostrar lista de pozos asignados con PozoCard
// Paso 2: Botón "Nuevo pozo" para abrir NuevoPozoPage
// Paso 3: Mostrar KPIs: total pozos, pendientes, aprobados
// Prompt de implementación rápida:
// "Crear DashboardPage con PozoCard, KPICard, navegación a NuevoPozoPage"
// Entregable:
// - Lista scrollable de pozos
// - KPIs en header
// - Botón flotante para nuevo pozo
import React, { useState, useEffect } from 'react'
import PozoCard from '../components/PozoCard'
import { useWells } from '../hooks/useWells'

export default function DashboardPage() {
  const { wells, loading, error } = useWells()

  if (loading) return <div>Cargando...</div>
  if (error) return <div>Error: {error}</div>

  const pendientes = wells.filter(w => w.estado === 'PENDIENTE_SUPERVISOR').length
  const aprobados = wells.filter(w => w.estado === 'APROBADA_SUPERVISOR').length

  return (
    <div>
      <div className="p-4">
        <h1>Dashboard</h1>
        <div className="flex gap-4">
          <div>Total: {wells.length}</div>
          <div>Pendientes: {pendientes}</div>
          <div>Aprobados: {aprobados}</div>
        </div>
      </div>
      
      <div className="p-4">
        {wells.map(well => (
          <PozoCard
            key={well.id}
            nombre={well.nombre}
            produccion={well.produccion}
            estado={well.estado}
            onPress={() => {}}
          />
        ))}
      </div>
      
      <button className="fixed bottom-4 right-4 bg-blue-500 p-4 rounded-full">
        + Nuevo pozo
      </button>
    </div>
  )
}
