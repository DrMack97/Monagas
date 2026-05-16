// TODO: Hook para GPS en mobile - Player 2 (Frontend)
// Paso 1: Get current location
// Paso 2: Watch location
// Paso 3: Geofencing check
// Prompt de implementación rápida:
// "Crear useGPS hook con location, watch, geofencing"
import { useState, useEffect, useCallback } from 'react'
import { gps, Location } from '../services/gps'

interface UseGPSReturn {
  location: Location | null
  loading: boolean
  error: string | null
  watch: boolean
  startWatch: () => void
  stopWatch: () => void
  isWithinWellRadius: (wellLat: number, wellLng: number, radius?: number) => boolean
}

export function useGPS(): UseGPSReturn {
  const [location, setLocation] = useState<Location | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [watch, setWatch] = useState(false)

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    setLoading(true)
    setError(null)

    const hasPermission = await gps.checkPermissions()
    if (!hasPermission) {
      const granted = await gps.requestPermissions()
      if (!granted) {
        setError('Permiso de ubicación denegado')
        setLoading(false)
        return
      }
    }

    try {
      const pos = await gps.getCurrentPosition()
      setLocation(pos)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener ubicación')
    }

    setLoading(false)
  }, [])

  // Start watching
  const startWatch = useCallback(() => {
    const stop = gps.watchPosition((pos) => {
      setLocation(pos)
    })

    setWatch(true)
    return stop
  }, [])

  // Stop watching
  const stopWatch = useCallback(() => {
    gps.stopWatching()
    setWatch(false)
  }, [])

  // Check geofencing
  const isWithinWellRadius = useCallback((
    wellLat: number,
    wellLng: number,
    radius: number = 100
  ): boolean => {
    if (!location) return false
    return gps.isWithinRadius(
      location.latitude,
      location.longitude,
      wellLat,
      wellLng,
      radius
    )
  }, [location])

  // Auto get location on mount
  useEffect(() => {
    getCurrentLocation()
  }, [getCurrentLocation])

  return {
    location,
    loading,
    error,
    watch,
    startWatch,
    stopWatch,
    isWithinWellRadius
  }
}
