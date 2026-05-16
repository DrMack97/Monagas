// TODO: Página de analytics y métricas - Player 2 (Frontend)
// Paso 1: Mostrar KPIs generales
// Paso 2: Gráfico de producción por día
// Paso 3: Gráfico de aprobaciones por supervisor
// Prompt de implementación rápida:
// "Crear AnalyticsPage con KPIs, production chart, approvals chart"
// Entregable:
// - 4 KPIs en header
// - Gráfico línea producción
// - Gráfico barras aprobaciones
import React, { useState, useEffect } from 'react'
import KPICard from '../components/KPICard'

export default function AnalyticsPage() {
  const [kpi, setKpi] = useState({
    totalPozos: 0,
    produccionTotal: 0,
    aprobacionesHoy: 0,
    tiempoPromedioAprobacion: 0
  })

  useEffect(() => {
    // TODO: Fetch KPIs desde Firestore
    setKpi({
      totalPozos: 25,
      produccionTotal: 12345,
      aprobacionesHoy: 15,
      tiempoPromedioAprobacion: 2.5
    })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Pozos Totales"
          value={kpi.totalPozos}
          icon="🏭"
          color="blue"
        />
        <KPICard
          label="Producción Total"
          value={kpi.produccionTotal.toLocaleString()}
          unit="Bls"
          trend="up"
          trendPercentage={12.5}
          icon="📈"
          color="green"
        />
        <KPICard
          label="Aprobaciones Hoy"
          value={kpi.aprobacionesHoy}
          icon="✅"
          color="purple"
        />
        <KPICard
          label="Tiempo Prom. Aprobación"
          value={kpi.tiempoPromedioAprobacion}
          unit="horas"
          trend="down"
          trendPercentage={15}
          icon="⏱️"
          color="yellow"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Producción por Día */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Producción por Día</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            {/* TODO: Implementar con Recharts */}
            📊 Gráfico de línea de producción
          </div>
        </div>

        {/* Aprobaciones por Supervisor */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Aprobaciones por Supervisor</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            {/* TODO: Implementar con Recharts */}
            📊 Gráfico de barras por supervisor
          </div>
        </div>
      </div>

      {/* Tabla de actividad reciente */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                ✅
              </div>
              <div className="flex-1">
                <p className="font-medium">Evaluación aprobada</p>
                <p className="text-sm text-gray-600">Pozo MFB-{950 + i} - 1,234 Bls/día</p>
              </div>
              <p className="text-sm text-gray-500">{i}h hace</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
