// src/utils/__tests__/guardarArchivo.test.ts
//
// Contra la rotura del botón de Excel en el APK 1.0.5: el WebView de Capacitor no tiene manejador de
// descargas, así que XLSX.writeFile() (enlace con `download`) no hace nada dentro de la app. En el APK
// el libro debe escribirse en caché y entregarse por el menú de compartir; en el navegador, descargarse.

// La app no incluye los tipos de Node; esta prueba solo corre bajo Jest (Node), donde estos módulos existen.
declare const require: (modulo: string) => any
declare const __dirname: string
const fs = require('fs')
const path = require('path')

import { entregarLibroExcel, nombreDeArchivoSeguro } from '../guardarArchivo'

const isNative = jest.fn()
jest.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => isNative() } }))
const writeFileFs = jest.fn()
jest.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: (...a: unknown[]) => writeFileFs(...a) },
}))
const share = jest.fn()
jest.mock('@capacitor/share', () => ({ Share: { share: (...a: unknown[]) => share(...a) } }))
const xlsxWriteFile = jest.fn()
const xlsxWrite = jest.fn(() => 'QUJD')
jest.mock('xlsx', () => ({ writeFile: (...a: unknown[]) => xlsxWriteFile(...a), write: (...a: unknown[]) => (xlsxWrite as any)(...a) }))

const LIBRO = { SheetNames: [], Sheets: {} } as any

beforeEach(() => {
  jest.clearAllMocks()
  writeFileFs.mockResolvedValue({ uri: 'file:///cache/Informe.xlsx' })
  share.mockResolvedValue({ activityType: 'x' })
})

describe('entregarLibroExcel', () => {
  it('APK: escribe el archivo en caché (base64) y abre el menú de compartir con ese archivo', async () => {
    isNative.mockReturnValue(true)
    await entregarLibroExcel(LIBRO, 'Informe_SBC-61_08-11-2026.xlsx')

    expect(xlsxWrite).toHaveBeenCalledWith(LIBRO, { bookType: 'xlsx', type: 'base64' })
    expect(writeFileFs).toHaveBeenCalledWith({ path: 'Informe_SBC-61_08-11-2026.xlsx', data: 'QUJD', directory: 'CACHE' })
    expect(share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///cache/Informe.xlsx'] }))
  })

  it('APK: NO usa la descarga por enlace (no funciona en el WebView)', async () => {
    isNative.mockReturnValue(true)
    await entregarLibroExcel(LIBRO, 'a.xlsx')
    expect(xlsxWriteFile).not.toHaveBeenCalled()
  })

  it('navegador: descarga normal con XLSX.writeFile, sin plugins nativos', async () => {
    isNative.mockReturnValue(false)
    await entregarLibroExcel(LIBRO, 'a.xlsx')
    expect(xlsxWriteFile).toHaveBeenCalledWith(LIBRO, 'a.xlsx')
    expect(writeFileFs).not.toHaveBeenCalled()
    expect(share).not.toHaveBeenCalled()
  })

  it('APK: cerrar el menú de compartir sin elegir nada no es un error', async () => {
    isNative.mockReturnValue(true)
    share.mockRejectedValue(new Error('Share canceled'))
    await expect(entregarLibroExcel(LIBRO, 'a.xlsx')).resolves.toBeUndefined()
  })

  it('APK: un fallo real (no cancelación) se propaga para poder avisarlo en pantalla', async () => {
    isNative.mockReturnValue(true)
    writeFileFs.mockRejectedValue(new Error('disco lleno'))
    await expect(entregarLibroExcel(LIBRO, 'a.xlsx')).rejects.toThrow('disco lleno')
  })

  it('el nombre del archivo no puede traer caracteres inválidos (un pozo puede llamarse "A/B")', () => {
    expect(nombreDeArchivoSeguro('Informe_A/B: 61?_08-11-2026.xlsx')).toBe('Informe_A-B-_61-_08-11-2026.xlsx')
    expect(nombreDeArchivoSeguro('Informe pozo prueba.xlsx')).toBe('Informe_pozo_prueba.xlsx')
  })
})

describe('guardia: nadie descarga con XLSX.writeFile fuera de guardarArchivo.ts', () => {
  function archivos(dir: string): string[] {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e: { name: string; isDirectory(): boolean }) => {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) return e.name === '__tests__' || e.name === 'test' ? [] : archivos(p)
      return /\.(ts|tsx)$/.test(e.name) ? [p] : []
    })
  }

  it('ningún archivo de la app llama XLSX.writeFile directamente (rompe en el APK sin avisar)', () => {
    const raiz = path.resolve(__dirname, '../..')
    const infractores = archivos(raiz)
      .filter((f) => path.basename(f) !== 'guardarArchivo.ts')
      .filter((f) => /XLSX\.writeFile\s*\(|\bwriteFile\s*\(\s*wb/.test(fs.readFileSync(f, 'utf8')))
    expect(infractores).toEqual([])
  })
})
