// TODO: APIs nativas (Geolocation, Camera) - Player 3 (Fullstack)
// Paso 1: Importar Capacitor plugins
// Paso 2: Implementar getCoordinates con Geolocation
// Paso 3: Implementar takePhoto con Camera (si aplica)
// Prompt de implementación rápida:
// "Crear native.ts con getCoordinates, takePhoto usando Capacitor plugins"
// Entregable:
// - getCoordinates() → { lat, lng }
// - takePhoto() → base64 image
// - Error handling si plugin no disponible
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation'
import { Camera, CameraResultType } from '@capacitor/camera'

export async function getCoordinates(): Promise<{ lat: number, lng: number }> {
  try {
    const position: GeolocationPosition = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    })
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
  } catch (err) {
    console.error('Geolocation error:', err)
    throw new Error('No se pudo obtener ubicación GPS')
  }
}

export async function takePhoto(): Promise<string> {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.Base64
    })
    return image.base64String || ''
  } catch (err) {
    console.error('Camera error:', err)
    throw new Error('No se pudo tomar foto')
  }
}

export function checkPermissions() {
  return Geolocation.checkPermissions()
}

export async function requestPermissions() {
  return Geolocation.requestPermissions()
}
