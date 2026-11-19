// src/utils/exportExcel.ts
//
// Genera y descarga un .xlsx con un informe YA APROBADO — 100%
// client-side (SheetJS/xlsx), sin backend. Se llama desde
// WellDetailPage.tsx (sección "Evaluaciones Oficiales"), a diferencia
// de exportarInformeExcel de mobile-operator que exporta la VISTA
// PREVIA de un informe todavía sin cerrar. Mismo formato de hojas
// ("Resumen"/"Lecturas") y mismo layout "REPORTE DE OPERACIONES DE
// WELL TESTING" (Gerencia de Producción, División Punta de Mata) que
// mobile-operator, para que ambos informes se vean iguales sin
// importar desde qué app se generaron — ver checklist Fase 4 #38.
import * as XLSX from 'xlsx'
import type { IPozo, IEvaluacion, ILectura } from '@core/types'
import { redondearAHoraEntera, horaEnteraTexto } from '@core/utils/hora'
import { construirReporteEstandar, reporteAFilasExcel } from '@core/utils/reporteEstandar'
import { capacidadesZona } from '@core/constants/zonas'
import { lecturasActivas } from '@core/utils/lecturasActivas'

function dateFormat(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function dateTimeFormat(d: Date | undefined): string {
  if (!d) return '—'
  return d.toLocaleString('es-VE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

interface ExportarInformeOficialParams {
  pozo: IPozo
  evaluacion: IEvaluacion
  lecturas: ILectura[]
}

export function exportarInformeOficialExcel({ pozo, evaluacion, lecturas: todasLasLecturas }: ExportarInformeOficialParams) {
  // Las lecturas anuladas por el Operador no cuentan en ningún informe (ver @core/utils/lecturasActivas).
  const lecturas = lecturasActivas(todasLasLecturas)
  const resultados = evaluacion.resultados
  const reporte = evaluacion.reporteOperativo ?? {}
  const ultimaAprobacion = evaluacion.aprobaciones?.[evaluacion.aprobaciones.length - 1]
  const ultima = lecturas[lecturas.length - 1]
  const bphPromedio = (resultados?.proyeccion24H ?? 0) / 24
  const aysBswPct = ((resultados?.aysBls ?? 0) / (resultados?.bpdPromedio || 1)) * 100
  const zonaCaps = capacidadesZona(pozo.zona)

  // La hoja Resumen es el mismo reporte estándar que el texto de WhatsApp del Operador
  // (construirReporteEstandar). El momento de emisión es el cierre de la evaluación.
  const estandar = construirReporteEstandar({
    pozo,
    reporte,
    resultados: resultados ?? { proyeccion24H: 0, bpdPromedio: 0, aysBls: 0, qgPromedio: 0 },
    lecturas,
    ahora: evaluacion.fechaCierre ?? new Date(),
    fechaInicioFallback: evaluacion.fechaInicio,
  })
  const resumenSheet = XLSX.utils.aoa_to_sheet([
    ...reporteAFilasExcel(estandar),
    [],
    ['Campo', pozo.campo],
    ['Zona', pozo.zona],
    ['Estado', evaluacion.estado],
    ['Aprobado por', ultimaAprobacion?.uid ?? '—'],
  ])
  resumenSheet['!cols'] = [{ wch: 32 }, { wch: 24 }]

  // Este archivo sale hacia el cliente: las alertas operativas (l.alertas) son solo de control
  // interno y NO se exportan. La hora va a la hora entera más cercana (el timestamp real no se
  // exporta) y la fecha solo en la primera fila de cada día. Casing y Netos solo en zonas que los usan.
  let diaAnterior = ''
  const lecturasRows = lecturas.map((l) => {
    const bph = l.tanques.reduce((acc, t) => acc + t.bph, 0)
    const bpd = l.tanques.reduce((acc, t) => acc + t.bpd, 0)
    const netos = l.tanques.reduce((acc, t) => acc + t.netos, 0)
    const ts = l.timestamp instanceof Date ? l.timestamp : undefined
    const dia = ts ? dateFormat(redondearAHoraEntera(ts)) : ''
    const fecha = dia !== diaAnterior ? dia : ''
    diaAnterior = dia
    return {
      Fecha: fecha,
      Hora: ts ? horaEnteraTexto(ts) : '',
      'Bph (Bls)': Number(bph.toFixed(2)),
      'Bpd (Bls)': Number(bpd.toFixed(2)),
      ...(zonaCaps.netosEnLecturas && { 'Netos (Bls)': Number(netos.toFixed(2)) }),
      'Qg (MMSCFD)': l.gas ? Number(l.gas.qg.toFixed(2)) : '',
      'P. Cabezal (psi)': l.operativos.pCab,
      'P. Separador (psi)': l.operativos.pSep,
      ...(zonaCaps.casing && { 'P. Casing (psi)': l.operativos.pCsg ?? '' }),
      'Reductor (pulg)': l.operativos.reductorPulgadas ?? '',
    }
  })
  const lecturasSheet = XLSX.utils.json_to_sheet(lecturasRows)
  lecturasSheet['!cols'] = Object.keys(lecturasRows[0] ?? {}).map((k) => ({ wch: Math.max(10, k.length + 2) }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen')
  XLSX.utils.book_append_sheet(wb, lecturasSheet, 'Lecturas')

  const fechaArchivo = dateFormat(evaluacion.fechaCierre).replace(/\//g, '-')
  XLSX.writeFile(wb, `Informe_${pozo.nombre}_${fechaArchivo}.xlsx`)
}
