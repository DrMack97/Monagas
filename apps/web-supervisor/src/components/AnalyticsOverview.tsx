// TODO: Componente overview analytics - Player 2 (Frontend)
// Paso 1: KPIs principales
// Paso 2: Gráfico tendencias
// Paso 3: Top usuarios
// Prompt de implementación rápida:
// "Crear AnalyticsOverview con KPIs, chart, top users"
import React, { useState, useEffect } from 'react'
import KPICard from '../components/KPICard'

export default function AnalyticsOverview() {
  const [metrics, setMetrics] = useState({
    totalEvaluaciones: 1234,
    aprobacionesHoy: 45,
    tiempoPromedio: 2.5,
    errorRate: 0.8,
    offlineUsage: 15
  })

  useEffect(() => {
    // Fetch metrics
    setMetrics({
      totalEvaluaciones: 1234,
      aprobacionesHoy: 45,
      tiempoPromedio: 2.5,
      errorRate: 0.8,
      offlineUsage: 15
    })
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics Overview</h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <KPICard
          label="Total Evaluaciones"
          value={metrics.totalEvaluaciones}
          trend="up"
          trendPercentage={12}
          color="blue"
        />
        <KPICard
          label="Aprobaciones Hoy"
          value={metrics.aprobacionesHoy}
          trend="up"
          trendPercentage={8}
          color="green"
        />
        <KPICard
          label="Tiempo Prom."
          value={metrics.tiempoPromedio}
          unit="horas"
          trend="down"
          trendPercentage={15}
          color="purple"
        />
        <KPICard
          label="Error Rate"
          value={metrics.errorRate}
          unit="%"
          trend="down"
          color="red"
        />
        <KPICard
          label="Offline Usage"
          value={metrics.offlineUsage}
          unit="%"
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Evaluaciones por Día</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            📊 Gráfico de línea
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Aprobaciones por Supervisor</h2>
          <div className="h-64 flex items-center justify-center text-gray-500">
            📊 Gráfico de barras
          </div>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Top 5 Supervisores</h2>
        <div className="space-y-3">
          {[
            { name: 'Juan Pérez', approvals: 145, rating: 4.8 },
            { name: 'María García', approvals: 132, rating: 4.9 },
            { name: 'Carlos López', approvals: 118, rating: 4.7 },
            { name: 'Ana Rodríguez', approvals: 105, rating: 4.8 },
            { name: 'Luis Martínez', approvals: 98, rating: 4.6 }
          ].map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="text-right">
                <p className="font-medium">{user.approvals} aprobaciones</p>
                <p className="text-sm text-yellow-600">⭐ {user.rating}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
