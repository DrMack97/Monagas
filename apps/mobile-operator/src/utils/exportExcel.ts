// src/utils/exportExcel.ts
//
// Los DOS formatos de exportación a Excel (pedido del cliente, 2026-11-15) — independientes: cada uno es su propio archivo.
//   1) exportarHistoricoEquipo   → "Data Histórica del Equipo": todo lo acumulado del equipo en el pozo.
//   2) exportarEvaluacionDiaria  → "Datos de Evaluación Diaria": la prueba de hoy, con desplazado exclusivo de su lapso.
// La estructura de las hojas vive en el núcleo (packages/core/src/utils/exportesExcel.ts, funciones puras y probadas);
// aquí solo se arma el libro y se entrega (descarga en el navegador; en el APK, menú de compartir — ver guardarArchivo.ts).
//
// 100% client-side (SheetJS/xlsx), sin backend. Las alertas operativas NO se exportan (control interno).

import * as XLSX from 'xlsx'
import type { IPozo, ILectura, IResultadosEval, IReporteOperativo } from '@core/types'
import { entregarLibroExcel } from './guardarArchivo'
import { construirReporteEstandar, reporteAFilasExcel } from '@core/utils/reporteEstandar'
import { construirEvaluacionDiaria, construirHistoricoEquipo } from '@core/utils/exportesExcel'
import type { Celda, EvaluacionParaExcel, HojaExcel } from '@core/utils/exportesExcel'

const dos = (n: number) => String(n).padStart(2, '0')
const fechaArchivo = (d: Date) => `${dos(d.getDate())}-${dos(d.getMonth() + 1)}-${d.getFullYear()}`

/** Libro con una hoja por cada HojaExcel; si no se indican anchos, se ajustan al título de cada columna. */
function libroDesdeHojas(hojas: HojaExcel[]): XLSX.WorkBook {
  const libro = XLSX.utils.book_new()
  for (const h of hojas) {
    const hoja = XLSX.utils.aoa_to_sheet(h.filas)
    hoja['!cols'] = (h.anchos ?? tituloAnchos(h.filas)).map((wch) => ({ wch }))
    XLSX.utils.book_append_sheet(libro, hoja, h.nombre)
  }
  return libro
}

function tituloAnchos(filas: Celda[][]): number[] {
  // La fila de títulos de la tabla es la que empieza con "Fecha" y "Hora"; si no hay, 18 por columna.
  const titulos = filas.find((f) => f[0] === 'Fecha' && f[1] === 'Hora')
  return titulos ? titulos.map((t) => Math.max(11, String(t).length + 2)) : [34, 20, 4, 18, 22]
}

// --- 2) Datos de Evaluación Diaria ---------------------------------------------------------------------------------

interface ExportarDiariaParams {
  pozo: IPozo
  evalId: string
  resultados: IResultadosEval
  lecturas: ILectura[]
  supervisorArea: string
  reporteOperativo?: IReporteOperativo
}

export async function exportarEvaluacionDiaria({ pozo, evalId, resultados, lecturas, supervisorArea, reporteOperativo }: ExportarDiariaParams): Promise<void> {
  const esPreliminar = resultados.tipoCalculo === 'PRELIMINAR_FORZADO'
  const primera = lecturas[0]?.timestamp ? new Date(lecturas[0].timestamp) : new Date()

  // Segunda hoja: el reporte estándar del día (el mismo del texto de WhatsApp), más datos propios del informe.
  const estandar = construirReporteEstandar({
    pozo,
    reporte: reporteOperativo ?? {},
    resultados,
    lecturas,
    ahora: new Date(),
    fechaInicioFallback: lecturas[0] ? new Date(lecturas[0].timestamp) : undefined,
  })
  const hojaReporte: Celda[][] = [
    ...reporteAFilasExcel(estandar),
    [],
    ['Supervisor de Área', supervisorArea || '—'],
    ['Tipo de Cálculo', esPreliminar ? 'Preliminar' : 'Final (24H)'],
  ]

  const hojas = construirEvaluacionDiaria(
    pozo,
    { id: evalId, creadoEn: primera, estado: esPreliminar ? 'Preliminar' : 'Final (24H)', lecturas },
    hojaReporte
  )
  await entregarLibroExcel(libroDesdeHojas(hojas), `Evaluacion_Diaria_${pozo.nombre}_${fechaArchivo(primera)}.xlsx`)
}

// --- 1) Data Histórica del Equipo ----------------------------------------------------------------------------------

interface ExportarHistoricoParams {
  pozo: IPozo
  /** Todas las evaluaciones del pozo con sus lecturas (ver cargarEvaluacionesDelPozo). */
  evaluaciones: EvaluacionParaExcel[]
}

export async function exportarHistoricoEquipo({ pozo, evaluaciones }: ExportarHistoricoParams): Promise<void> {
  const hojas = construirHistoricoEquipo(pozo, evaluaciones)
  await entregarLibroExcel(libroDesdeHojas(hojas), `Data_Historica_Equipo_${pozo.nombre}_${fechaArchivo(new Date())}.xlsx`)
}
