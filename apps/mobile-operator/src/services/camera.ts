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
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

export interface PhotoOptions {
  quality?: number;
  correctOrientation?: boolean;
  saveToGallery?: boolean;
  allowEditing?: boolean;
}

export interface UploadedPhoto {
  url: string;
  path: string;
  size: number;
  timestamp: number;
}

export class CameraService {
  async takePhoto(options: PhotoOptions = {}): Promise<Photo> {
    const config = {
      quality: options.quality || 80,
      correctOrientation: options.correctOrientation || true,
      saveToGallery: options.saveToGallery || false,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
    };

    try {
      return await Camera.getPhoto(config);
    } catch (error) {
      console.error('Failed to take photo:', error);
      throw new Error('No se pudo tomar la foto');
    }
  }

  async pickPhoto(options: PhotoOptions = {}): Promise<Photo> {
    const config = {
      quality: options.quality || 80,
      correctOrientation: options.correctOrientation || true,
      saveToGallery: options.saveToGallery || false,
      allowEditing: options.allowEditing || false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Prompt,
    };

    try {
      return await Camera.getPhoto(config);
    } catch (error) {
      console.error('Failed to pick photo:', error);
      throw new Error('No se pudo seleccionar la foto');
    }
  }

  async compressImage(base64: string, quality: number = 0.7): Promise<string> {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${base64}`;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const maxSize = 800;
    let width = img.width;
    let height = img.height;

    if (width > maxSize) {
      height = (height * maxSize) / width;
      width = maxSize;
    }

    canvas.width = width;
    canvas.height = height;
    ctx?.drawImage(img, 0, 0, width, height);

    const compressed = canvas.toDataURL('image/jpeg', quality);
    return compressed.split(',')[1];
  }

  async uploadPhoto(
    base64: string,
    collection: string,
    documentId: string,
    filename?: string
  ): Promise<UploadedPhoto> {
    const timestamp = Date.now();
    const path = `${collection}/${documentId}/photos/${filename || `${timestamp}.jpg`}`;
    const storageRef = ref(storage, path);
    const snapshot = await uploadString(storageRef, base64, 'base64');
    const url = await getDownloadURL(snapshot.ref);

    return { url, path, size: base64.length, timestamp };
  }

  async uploadPhotos(
    photos: Array<{ base64: string; filename?: string }>,
    collection: string,
    documentId: string
  ): Promise<UploadedPhoto[]> {
    const uploadPromises = photos.map((photo) =>
      this.uploadPhoto(photo.base64, collection, documentId, photo.filename)
    );
    return Promise.all(uploadPromises);
  }

  async deletePhoto(path: string): Promise<void> {
    const storageRef = ref(storage, path);
    // await deleteObject(storageRef);
    console.warn('Delete not enabled by default, uncomment deleteObject');
  }
}

export const camera = new CameraService();
