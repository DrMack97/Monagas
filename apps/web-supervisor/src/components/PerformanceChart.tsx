// TODO: Chart de performance con Recharts - Player 2 (Frontend)
// Paso 1: Line chart producción por día
// Paso 2: Configure tooltips y legends
// Paso 3: Responsive container
// Prompt de implementación rápida:
// "Crear PerformanceChart con Recharts line chart"
// Entregable:
// - LineChart con data
// - XAxis fecha, YAxis producción
// - Tooltip personalizado
import React from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts'

interface DataPoint {
  date: string
  produccion: number
  meta?: number
}

interface PerformanceChartProps {
  data: DataPoint[]
  title?: string
  height?: number
}

export default function PerformanceChart({
  data,
  title = 'Producción por Día',
  height = 400
}: PerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{label}</p>
          <p className="text-blue-600">
            {payload[0].value.toLocaleString()} Bls/día
          </p>
          {payload[1] && (
            <p className="text-green-600">
              Meta: {payload[1].value.toLocaleString()} Bls/día
            </p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorProduccion" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMeta" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => {
              const date = new Date(value)
              return `${date.getDate()}/${date.getMonth() + 1}`
            }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => `${value}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          <Area
            type="monotone"
            dataKey="produccion"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorProduccion)"
            name="Producción"
          />
          {data[0]?.meta !== undefined && (
            <Area
              type="monotone"
              dataKey="meta"
              stroke="#10b981"
              fillOpacity={1}
              fill="url(#colorMeta)"
              name="Meta"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
