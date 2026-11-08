// src/utils/exportExcel.ts
//
// Genera y descarga un .xlsx con el informe de producción — 100%
// client-side (SheetJS/xlsx), sin backend. Se llama desde la vista
// previa de ReportePage.tsx, antes o después de enviar a supervisión
// — no depende de que la evaluación ya se haya guardado.
//
// Dos hojas:
//   "Resumen"  — igual info que el mensaje de WhatsApp (mismo formato
//                "REPORTE DE OPERACIONES DE WELL TESTING" de la
//                Gerencia de Producción, División Punta de Mata — ver
//                checklist Fase 4 #38), en formato clave/valor.
//   "Lecturas" — detalle de cada lectura individual, agregado por
//                tanque igual que TablaPage.tsx (suma de netos/bpd/bph
//                entre tanques por lectura, no un renglón por tanque).

import * as XLSX from 'xlsx'
import type { IPozo, ILectura, IResultadosEval, IReporteOperativo } from '@core/types'
import { dateFormat, dateTimeFormat } from './formatters'
import { entregarLibroExcel } from './guardarArchivo'
import { redondearAHoraEntera, horaEnteraTexto } from '@core/utils/hora'
import { construirReporteEstandar, reporteAFilasExcel } from '@core/utils/reporteEstandar'
import { capacidadesZona } from '@core/constants/zonas'

interface ExportarInformeParams {
  pozo: IPozo
  resultados: IResultadosEval
  lecturas: ILectura[]
  supervisorArea: string
  reporteOperativo?: IReporteOperativo
}

export async function exportarInformeExcel({ pozo, resultados, lecturas, supervisorArea, reporteOperativo }: ExportarInformeParams): Promise<void> {
  const esPreliminar = resultados.tipoCalculo === 'PRELIMINAR_FORZADO'
  const ultima = lecturas[lecturas.length - 1]
  const bphPromedio = resultados.proyeccion24H / 24
  const aysBswPct = (resultados.aysBls / (resultados.bpdPromedio || 1)) * 100
  const reporte = reporteOperativo ?? {}
  const zonaCaps = capacidadesZona(pozo.zona)

  // La hoja Resumen es el mismo reporte estándar que el texto de WhatsApp (construirReporteEstandar),
  // así los dos canales nunca difieren. Debajo, datos propios del informe.
  const estandar = construirReporteEstandar({
    pozo,
    reporte,
    resultados,
    lecturas,
    ahora: new Date(),
    fechaInicioFallback: lecturas[0] ? new Date(lecturas[0].timestamp) : undefined,
  })
  const resumenSheet = XLSX.utils.aoa_to_sheet([
    ...reporteAFilasExcel(estandar),
    [],
    ['Supervisor de Área', supervisorArea || '—'],
    ['Tipo de Cálculo', esPreliminar ? 'Preliminar' : 'Final (24H)'],
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
    const dia = dateFormat(redondearAHoraEntera(new Date(l.timestamp)))
    const fecha = dia !== diaAnterior ? dia : ''
    diaAnterior = dia
    return {
      Fecha: fecha,
      Hora: horaEnteraTexto(new Date(l.timestamp)),
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

  const fechaArchivo = dateFormat(new Date()).replace(/\//g, '-')
  // En el APK no hay descargas por enlace: se guarda en caché y se abre el menú de compartir (ver guardarArchivo.ts).
  await entregarLibroExcel(wb, `Informe_${pozo.nombre}_${fechaArchivo}.xlsx`)
}
