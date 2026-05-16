// TODO: Chart de tendencias con barras - Player 2 (Frontend)
// Paso 1: BarChart por supervisor/well
// Paso 2:Colors por categoría
// Paso 3: Responsive
// Prompt de implementación rápida:
// "Crear TrendChart con BarChart Recharts"
import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'

interface BarData {
  name: string
  value: number
  color?: string
}

interface TrendChartProps {
  data: BarData[]
  title?: string
  type?: 'bar' | 'pie'
  height?: number
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function TrendChart({
  data,
  title = 'Tendencias',
  type = 'bar',
  height = 400
}: TrendChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{payload[0].name}</p>
          <p className="text-gray-700">
            {payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  if (type === 'pie') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar 
            dataKey="value" 
            name="Valor"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
