// TODO: Componente selector de rango de fechas - Player 2 (Frontend)
// Paso 1: Dos inputs de fecha (inicio y fin)
// Paso 2: Presets (hoy, esta semana, este mes, último mes)
// Paso 3: Validar que inicio <= fin
// Prompt de implementación rápida:
// "Crear DateRangePicker con startDate, endDate, presets"
// Entregable:
// - DateInput inicio y fin
// - 4 presets quick select
// - Validación rango
import React, { useState } from 'react'

interface DateRangePickerProps {
  onDateChange: (start: string, end: string) => void
  startDate?: string
  endDate?: string
}

export default function DateRangePicker({
  onDateChange,
  startDate = '',
  endDate = ''
}: DateRangePickerProps) {
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd, setLocalEnd] = useState(endDate)

  const applyPreset = (preset: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date()
    let start = new Date()
    let end = new Date()

    switch (preset) {
      case 'today':
        start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        break
      case 'week':
        start = new Date(today)
        start.setDate(today.getDate() - 7)
        break
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1)
        break
      case 'lastMonth':
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        end = new Date(today.getFullYear(), today.getMonth(), 0)
        break
    }

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0]
    }

    const startStr = formatDate(start)
    const endStr = formatDate(end)

    setLocalStart(startStr)
    setLocalEnd(endStr)
    onDateChange(startStr, endStr)
  }

  const handleApply = () => {
    if (localStart && localEnd && new Date(localStart) <= new Date(localEnd)) {
      onDateChange(localStart, localEnd)
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow border">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => applyPreset('today')}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Hoy
        </button>
        <button
          onClick={() => applyPreset('week')}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Última semana
        </button>
        <button
          onClick={() => applyPreset('month')}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Este mes
        </button>
        <button
          onClick={() => applyPreset('lastMonth')}
          className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Mes pasado
        </button>
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha inicio
          </label>
          <input
            type="date"
            value={localStart}
            onChange={(e) => setLocalStart(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fecha fin
          </label>
          <input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleApply}
          disabled={!localStart || !localEnd || new Date(localStart) > new Date(localEnd)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Aplicar
        </button>
      </div>

      {localStart && localEnd && new Date(localStart) > new Date(localEnd) && (
        <p className="mt-2 text-sm text-red-600">
          La fecha inicio debe ser anterior a la fecha fin
        </p>
      )}
    </div>
  )
}
