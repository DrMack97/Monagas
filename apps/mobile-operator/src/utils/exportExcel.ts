// src/utils/exportExcel.ts
//
// Genera y descarga un .xlsx con el informe de producción — 100%
// client-side (SheetJS/xlsx), sin backend. Se llama desde la vista
// previa de ReportePage.tsx, antes o después de enviar a supervisión
// — no depende de que la evaluación ya se haya guardado.
//
// Dos hojas:
//   "Resumen"  — igual info que el mensaje de WhatsApp, en formato
//                clave/valor.
//   "Lecturas" — detalle de cada lectura individual, agregado por
//                tanque igual que TablaPage.tsx (suma de netos/bpd/bph
//                entre tanques por lectura, no un renglón por tanque).

import * as XLSX from 'xlsx'
import type { IPozo, ILectura, IResultadosEval } from '@core/types'
import { dateFormat, dateTimeFormat } from './formatters'

interface ExportarInformeParams {
  pozo: IPozo
  resultados: IResultadosEval
  lecturas: ILectura[]
  supervisorArea: string
}

export function exportarInformeExcel({ pozo, resultados, lecturas, supervisorArea }: ExportarInformeParams) {
  const esPreliminar = resultados.tipoCalculo === 'PRELIMINAR_FORZADO'

  const resumenSheet = XLSX.utils.aoa_to_sheet([
    ['Empresa', pozo.empresa ?? '—'],
    ['Pozo', pozo.nombre],
    ['Campo', pozo.campo],
    ['Zona', pozo.zona],
    ['Fecha', dateFormat(new Date())],
    ['Supervisor de Área', supervisorArea || '—'],
    ['Tipo de Cálculo', esPreliminar ? 'Preliminar Forzado' : 'Final (24H)'],
    [],
    ['Parámetro', 'Valor'],
    ['Bpd (Bls)', Number(resultados.bpdPromedio.toFixed(2))],
    ['Netos (Bls)', Number(resultados.netosPromedio.toFixed(2))],
    ['Q.G (MMSCFD)', Number(resultados.qgPromedio.toFixed(2))],
    ['AyS/BSW (%)', Number(((resultados.aysBls / (resultados.bpdPromedio || 1)) * 100).toFixed(1))],
    ['Proyección 24H (Bls)', Number(resultados.proyeccion24H.toFixed(2))],
    ['Horas evaluadas', resultados.horasTotales],
  ])
  resumenSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]

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
      Alertas: l.alertas && l.alertas.length > 0 ? l.alertas.join(', ') : '',
    }
  })
  const lecturasSheet = XLSX.utils.json_to_sheet(lecturasRows)
  lecturasSheet['!cols'] = [
    { wch: 6 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 16 }, { wch: 30 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, resumenSheet, 'Resumen')
  XLSX.utils.book_append_sheet(wb, lecturasSheet, 'Lecturas')

  const fechaArchivo = dateFormat(new Date()).replace(/\//g, '-')
  XLSX.writeFile(wb, `Informe_${pozo.nombre}_${fechaArchivo}.xlsx`)
}
