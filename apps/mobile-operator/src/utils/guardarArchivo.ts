// src/utils/guardarArchivo.ts
//
// Entrega un libro de Excel al usuario según dónde corre la app.
//
// POR QUÉ EXISTE: XLSX.writeFile() "descarga" creando un enlace temporal con `download` y haciendo
// clic. Eso funciona en un navegador, pero el WebView del APK (Capacitor) NO tiene ningún manejador
// de descargas: el clic no hace nada y el botón de Excel parece roto, sin ningún error. En el APK el
// archivo se escribe en la caché de la app y se abre el menú de compartir de Android (guardar en
// Drive/Archivos, enviar por WhatsApp o correo…). En el navegador se mantiene la descarga normal.

import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import * as XLSX from 'xlsx'

/** Quita lo que un sistema de archivos no admite en un nombre (un pozo puede llamarse "A/B"). */
export function nombreDeArchivoSeguro(nombre: string): string {
  return nombre.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, '_')
}

export async function entregarLibroExcel(libro: XLSX.WorkBook, nombre: string): Promise<void> {
  const archivo = nombreDeArchivoSeguro(nombre)

  if (!Capacitor.isNativePlatform()) {
    XLSX.writeFile(libro, archivo)
    return
  }

  const base64 = XLSX.write(libro, { bookType: 'xlsx', type: 'base64' })
  const { uri } = await Filesystem.writeFile({ path: archivo, data: base64, directory: Directory.Cache })
  try {
    await Share.share({ title: archivo, dialogTitle: 'Compartir informe', files: [uri] })
  } catch (err) {
    // Cerrar el menú de compartir sin elegir nada no es un error.
    if (/cancel/i.test(err instanceof Error ? err.message : String(err))) return
    throw err
  }
}
