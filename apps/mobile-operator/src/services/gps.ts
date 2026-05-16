// TODO: GPS service con Capacitor - Player 2 (Frontend)
// Paso 1: Obtener ubicación actual
// Paso 2: Tracking continuo
// Paso 3: Geofencing
// Prompt de implementación rápida:
// "Crear GPS service con getCurrentPosition, watchPosition"
// Entregable:
// - getCurrentPosition() → {lat, lng, accuracy}
// - watchPosition(callback) → stop
// - requestPermissions()
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation'

export interface Location {
  latitude: number
  longitude: number
  accuracy: number
  altitude?: number
  heading?: number
  speed?: number
  timestamp: number
}

export interface LocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export class GPSService {
  private watchId: number | null = null

  // Request permissions
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Geolocation.requestPermissions()
      return status === 'granted'
    } catch (error) {
      console.error('Failed to request GPS permissions:', error)
      return false
    }
  }

  // Check permissions
  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Geolocation.checkPermissions()
      return status === 'granted'
    } catch {
      return false
    }
  }

  // Get current position
  async getCurrentPosition(options?: LocationOptions): Promise<Location> {
    const config = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    }

    try {
      const position = await Geolocation.getCurrentPosition(config)
      
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      }
    } catch (error) {
      console.error('Failed to get GPS position:', error)
      throw new Error('No se pudo obtener la ubicación')
    }
  }

  // Watch position
  watchPosition(callback: (location: Location) => void, options?: LocationOptions): () => void {
    const config = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
      ...options
    }

    const watcher = Geolocation.watchPosition(config, (position, err) => {
      if (position) {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        })
      }
    })

    this.watchId = watcher.id

    return () => {
      if (watcher.id) {
        Geolocation.clearWatch({ id: watcher.id })
      }
    }
  }

  // Stop watching
  stopWatching() {
    if (this.watchId) {
      Geolocation.clearWatch({ id: this.watchId })
      this.watchId = null
    }
  }

  // Calculate distance between two points (Haversine formula)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  // Check if point is within radius of another point
  isWithinRadius(
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): boolean {
    const distance = this.calculateDistance(lat, lng, centerLat, centerLng)
    return distance <= radiusMeters
  }
}

export const gps = new GPSService()
