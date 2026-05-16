// TODO: Componente captura de fotos - Player 2 (Frontend)
// Paso 1: Botón tomar foto
// Paso 2: Preview foto
// Paso 3: Upload progress
// Prompt de implementación rápida:
// "Crear PhotoCapture con takePhoto, preview, upload"
import React, { useState } from 'react'
import { camera } from '../services/camera'

interface PhotoCaptureProps {
  collection: string
  documentId: string
  onPhotoUploaded?: (url: string) => void
  maxPhotos?: number
}

export default function PhotoCapture({
  collection,
  documentId,
  onPhotoUploaded,
  maxPhotos = 5
}: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleTakePhoto = async () => {
    if (photos.length >= maxPhotos) {
      setError(`Máximo ${maxPhotos} fotos permitidas`)
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Take photo
      const photo = await camera.takePhoto({
        quality: 80,
        correctOrientation: true
      })

      // Compress
      let base64 = photo.base64String
      base64 = await camera.compressImage(base64, 0.7)

      // Upload
      const uploaded = await camera.uploadPhoto(base64, collection, documentId)

      setPhotos([...photos, uploaded.url])
      onPhotoUploaded?.(uploaded.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al tomar foto')
    } finally {
      setUploading(false)
    }
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          Fotos ({photos.length}/{maxPhotos})
        </h3>
        
        <button
          onClick={handleTakePhoto}
          disabled={uploading || photos.length >= maxPhotos}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <span>{uploading ? '⏳' : '📷'}</span>
          <span>{uploading ? 'Subiendo...' : 'Tomar foto'}</span>
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
