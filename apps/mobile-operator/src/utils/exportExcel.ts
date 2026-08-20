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

interface ExportarInformeParams {
  pozo: IPozo
  resultados: IResultadosEval
  lecturas: ILectura[]
  supervisorArea: string
  reporteOperativo?: IReporteOperativo
}

export function exportarInformeExcel({ pozo, resultados, lecturas, supervisorArea, reporteOperativo }: ExportarInformeParams) {
  const esPreliminar = resultados.tipoCalculo === 'PRELIMINAR_FORZADO'
  const ultima = lecturas[lecturas.length - 1]
  const bphPromedio = resultados.proyeccion24H / 24
  const aysBswPct = (resultados.aysBls / (resultados.bpdPromedio || 1)) * 100
  const reporte = reporteOperativo ?? {}

  const resumenSheet = XLSX.utils.aoa_to_sheet([
    ['GERENCIA DE PRODUCCION'],
    ['DIVISIÓN PUNTA DE MATA'],
    [],
    ['REPORTE DE OPERACIONES DE WELL TESTING'],
    [],
    ['Empresa', pozo.empresa ?? '—'],
    ['Equipo', pozo.equipo ?? '—'],
    ['Fecha', dateFormat(new Date())],
    ['Hora', new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) + ' Hrs.'],
    [],
    ['Supv. PDVSA', reporte.supervisorPDVSA ?? '—'],
    ['Supervisor de Área', supervisorArea || '—'],
    ['Well Testing Diurno', reporte.cuadrillaDiurno ?? '—'],
    ['Well Testing Nocturno', reporte.cuadrillaNocturno ?? '—'],
    [],
    ['Fecha Inicio de operaciones', lecturas[0] ? dateFormat(lecturas[0].timestamp) : '—'],
    ['Fecha de Alineación Well Testing', reporte.fechaAlineacion ? dateTimeFormat(reporte.fechaAlineacion) : '—'],
    ['Pozo', pozo.nombre],
    ['Actual', reporte.estadoActual ?? '—'],
    ['Nota', reporte.notas ?? '—'],
    [],
    ['Tipo de Cálculo', esPreliminar ? 'Preliminar Forzado' : 'Final (24H)'],
    [],
    ['Parámetros', ''],
    ['P.Cab (Psi)', ultima ? Number(ultima.operativos.pCab.toFixed(1)) : '—'],
    ['P.Csg', ultima?.operativos.pCsg !== undefined ? Number(ultima.operativos.pCsg.toFixed(1)) : '—'],
    ['P.sep (Psi)', ultima ? Number(ultima.operativos.pSep.toFixed(1)) : '—'],
    ['P.Línea Red.', ultima?.operativos.reductorPulgadas ?? '—'],
    ['Bph (Bls)', Number(bphPromedio.toFixed(2))],
    ['Bpd (Bls)', Number(resultados.bpdPromedio.toFixed(2))],
    ['Total Desplazado (Bls)', Number(resultados.netosPromedio.toFixed(2))],
    ['Volumen Total desplazado (Bls)', Number(resultados.netosPromedio.toFixed(2))],
    ['Total Desp 24H (Bls)', Number(resultados.proyeccion24H.toFixed(2))],
    [],
    ['Tipo de fluido retornado', ''],
    ['API (°)', reporte.tipoFluido?.api !== undefined ? Number(reporte.tipoFluido.api.toFixed(1)) : '—'],
    ['BSW (%)', Number(aysBswPct.toFixed(1))],
    ['H2S', reporte.tipoFluido?.h2s ?? '—'],
    [],
    ['Caudal De Gas Parámetros', ''],
    ['Meter Run', pozo.meterRun ?? '—'],
    ['Placa Orificio', pozo.diamOrif ?? '—'],
    ['Estática — Pf (Psi)', ultima?.gas ? Number(ultima.gas.pf.toFixed(1)) : '—'],
    ['Presión Diferencial — Hw (InH2O)', ultima?.gas ? Number(ultima.gas.hw.toFixed(2)) : '—'],
    ['GE Gas', ultima?.gas ? Number(ultima.gas.gg.toFixed(2)) : '—'],
    ['Tgas (°F)', ultima?.gas ? Number(ultima.gas.tGas.toFixed(0)) : '—'],
    ['QG (MMSCFD)', Number(resultados.qgPromedio.toFixed(2))],
    [],
    ['Tanques Parámetro', ''],
    ...(ultima ? ultima.tanques.map((t, i) => [`Tanque#${i + 1} (Bls)`, Number(t.netos.toFixed(2))]) : []),
    ['Existencia/Tanques (Bls)', reporte.resumenTanques ? Number(reporte.resumenTanques.existencia.toFixed(2)) : '—'],
    ['Trasegable (Bls)', reporte.resumenTanques ? Number(reporte.resumenTanques.trasegable.toFixed(2)) : '—'],
    ['Total trasegado', reporte.resumenTanques ? Number(reporte.resumenTanques.totalTrasegado.toFixed(2)) : '—'],
    ['Nivel De Cellar (%)', reporte.nivelCellar ?? '—'],
    ['Total Viajes de Vacuum', reporte.viajesVacuum ?? '—'],
  ])
  resumenSheet['!cols'] = [{ wch: 32 }, { wch: 24 }]

  const lecturasRows = lecturas.map((l) => {
    const bph = l.tanques.reduce((acc, t) => acc + t.bph, 0)
    const bpd = l.tanques.reduce((acc, t) => acc + t.bpd, 0)
    const netos = l.tanques.reduce((acc, t) => acc + t.netos, 0)
    return {
      Hora: l.hora,
      'Fecha/Hora': dateTimeFormat(l.timestamp),
      'Bph (Bls)': Number(bph.toFixed(2)),
      'Bpd (Bls)': Number(bpd.toFixed(2)),
      'Netos (Bls)': Number(netos.toFixed(2)),
      'Qg (MMSCFD)': l.gas ? Number(l.gas.qg.toFixed(2)) : '',
      'P. Cabezal (psi)': l.operativos.pCab,
      'P. Separador (psi)': l.operativos.pSep,
      'P. Casing (psi)': l.operativos.pCsg ?? '',
      'Reductor (pulg)': l.operativos.reductorPulgadas ?? '',
      Alertas: l.alertas && l.alertas.length > 0 ? l.alertas.join(', ') : '',
    }
  })
  const lecturasSheet = XLSX.utils.json_to_sheet(lecturasRows)
  lecturasSheet['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen')
  XLSX.utils.book_append_sheet(wb, lecturasSheet, 'Lecturas')

  const fechaArchivo = dateFormat(new Date()).replace(/\//g, '-')
  XLSX.writeFile(wb, `Informe_${pozo.nombre}_${fechaArchivo}.xlsx`)
}
