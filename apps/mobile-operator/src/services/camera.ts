// TODO: Camera service con Capacitor - Player 2 (Frontend)
// Paso 1: Tomar foto
// Paso 2: Comprimir foto
// Paso 3: Subir a Firebase Storage
// Prompt de implementación rápida:
// "Crear Camera service con takePhoto, compress, upload"
// Entregable:
// - takePhoto(options) → base64
// - compressImage(base64, quality) → base64
// - uploadPhoto(base64, path) → URL
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera'
import { ref, uploadString, getDownloadURL } from 'firebase/storage'
import { storage } from '../services/firebase'

export interface PhotoOptions {
  quality?: number
  correctOrientation?: boolean
  saveToGallery?: boolean
  allowEditing?: boolean
}

export interface UploadedPhoto {
  url: string
  path: string
  size: number
  timestamp: number
}

export class CameraService {
  // Take photo
  async takePhoto(options: PhotoOptions = {}): Promise<Photo> {
    const config = {
      quality: options.quality || 80,
      correctOrientation: options.correctOrientation || true,
      saveToGallery: options.saveToGallery || false,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera
    }

    try {
      const photo = await Camera.getPhoto(config)
      return photo
    } catch (error) {
      console.error('Failed to take photo:', error)
      throw new Error('No se pudo tomar la foto')
    }
  }

  // Take photo from gallery
  async pickPhoto(options: PhotoOptions = {}): Promise<Photo> {
    const config = {
      quality: options.quality || 80,
      correctOrientation: options.correctOrientation || true,
      saveToGallery: options.saveToGallery || false,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt
    }

    try {
      const photo = await Camera.getPhoto(config)
      return photo
    } catch (error) {
      console.error('Failed to pick photo:', error)
      throw new Error('No se pudo seleccionar la foto')
    }
  }

  // Compress image
  async compressImage(base64: string, quality: number = 0.7): Promise<string> {
    // Create image element
    const img = new Image()
    img.src = `data:image/jpeg;base64,${base64}`

    await new Promise((resolve) => {
      img.onload = resolve
    })

    // Create canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    // Resize if too large
    const maxSize = 800
    let width = img.width
    let height = img.height

    if (width > maxSize) {
      height = (height * maxSize) / width
      width = maxSize
    }

    canvas.width = width
    canvas.height = height

    ctx?.drawImage(img, 0, 0, width, height)

    // Compress
    const compressed = canvas.toDataURL('image/jpeg', quality)
    return compressed.split(',')[1] // Return base64 without prefix
  }

  // Upload photo
  async uploadPhoto(
    base64: string,
    collection: string,
    documentId: string,
    filename?: string
  ): Promise<UploadedPhoto> {
    const timestamp = Date.now()
    const path = `${collection}/${documentId}/photos/${filename || `${timestamp}.jpg`}`
    
    const-storage ref(path)
    const snapshot = await uploadString(storageRef, base64, 'base64')
    const url = await getDownloadURL(snapshot.ref)

    return {
      url,
      path,
      size: base64.length,
      timestamp
    }
  }

  // Upload multiple photos
  async uploadPhotos(
    photos: Array<{ base64: string; filename?: string }>,
    collection: string,
    documentId: string
  ): Promise<UploadedPhoto[]> {
    const uploadPromises = photos.map(photo => 
      this.uploadPhoto(photo.base64, collection, documentId, photo.filename)
    )

    return Promise.all(uploadPromises)
  }

  // Delete photo
  async deletePhoto(path: string): Promise<void> {
    // Note: Firebase Storage delete not enabled by default
    // You need to add security rules
    const storageRef = ref(storage, path)
    // await deleteObject(storageRef) // Uncomment when enabled
  }
}

export const camera = new CameraService()
