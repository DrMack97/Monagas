// TODO: Indicador de ubicación - Player 2 (Frontend)
// Paso 1: Mostrar ubicación actual
// Paso 2: Mostrar precisión
// Paso 3: Mostrar si está dentro de pozo
// Prompt de implementación rápida:
// "Crear LocationIndicator con location, accuracy, geofencing"
import React from 'react'
import { useGPS } from '../hooks/useGPS'

interface LocationIndicatorProps {
  wellLat?: number
  wellLng?: number
  radius?: number
}

export default function LocationIndicator({
  wellLat,
  wellLng,
  radius = 100
}: LocationIndicatorProps) {
  const { location, loading, error, isWithinWellRadius } = useGPS()

  if (loading) {
    return (
      <div className="p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 animate-pulse">
          📍 Obteniendo ubicación...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-3 bg-red-50 rounded-lg">
        <p className="text-sm text-red-700">
          ❌ {error}
        </p>
      </div>
    )
  }

  if (!location) {
    return null
  }

  const withinRadius = wellLat && wellLng 
    ? isWithinWellRadius(wellLat, wellLng, radius)
    : null

  return (
    <div className={`p-3 rounded-lg ${
      withinRadius === true 
        ? 'bg-green-50 border border-green-200' 
        : withinRadius === false
        ? 'bg-yellow-50 border border-yellow-200'
        : 'bg-blue-50'
    }`}>
      <div className="flex items-center gap-2">
        <span className="text-xl">📍</span>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            Ubicación obtenida
          </p>
          <p className="text-xs text-gray-600">
            {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </p>
          <p className="text-xs text-gray-500">
            Precisión: {location.accuracy.toFixed(1)}m
          </p>
          
          {withinRadius !== null && (
            <p className={`text-xs mt-1 font-medium ${
              withinRadius ? 'text-green-700' : 'text-yellow-700'
            }`}>
              {withinRadius 
                ? '✅ Dentro del pozo' 
                : '⚠️ Fuera del radio del pozo'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
