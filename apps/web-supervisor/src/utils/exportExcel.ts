// src/utils/exportExcel.ts
//
// Genera y descarga un .xlsx con un informe YA APROBADO — 100%
// client-side (SheetJS/xlsx), sin backend. Se llama desde
// WellDetailPage.tsx (sección "Evaluaciones Oficiales"), a diferencia
// de exportarInformeExcel de mobile-operator que exporta la VISTA
// PREVIA de un informe todavía sin cerrar. Mismo formato de hojas
// ("Resumen"/"Lecturas") para que ambos informes se vean iguales sin
// importar desde qué app se generaron.
import * as XLSX from 'xlsx'
import type { IPozo, IEvaluacion, ILectura } from '@core/types'

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

export function exportarInformeOficialExcel({ pozo, evaluacion, lecturas }: ExportarInformeOficialParams) {
  const resultados = evaluacion.resultados
  const ultimaAprobacion = evaluacion.aprobaciones?.[evaluacion.aprobaciones.length - 1]

  const resumenSheet = XLSX.utils.aoa_to_sheet([
    ['Empresa', pozo.empresa ?? '—'],
    ['Pozo', pozo.nombre],
    ['Campo', pozo.campo],
    ['Zona', pozo.zona],
    ['Estado', evaluacion.estado],
    ['Fecha de Cierre', dateFormat(evaluacion.fechaCierre)],
    ['Aprobado por', ultimaAprobacion?.uid ?? '—'],
    [],
    ['Parámetro', 'Valor'],
    ['Bpd (Bls)', Number((resultados?.bpdPromedio ?? 0).toFixed(2))],
    ['Netos (Bls)', Number((resultados?.netosPromedio ?? 0).toFixed(2))],
    ['Q.G (MMSCFD)', Number((resultados?.qgPromedio ?? 0).toFixed(2))],
    ['AyS/BSW (%)', Number((((resultados?.aysBls ?? 0) / (resultados?.bpdPromedio || 1)) * 100).toFixed(1))],
    ['Proyección 24H (Bls)', Number((resultados?.proyeccion24H ?? 0).toFixed(2))],
    ['Horas evaluadas', resultados?.horasTotales ?? 0],
  ])
  resumenSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]

  const lecturasRows = lecturas.map((l) => {
    const bph = l.tanques.reduce((acc, t) => acc + t.bph, 0)
    const bpd = l.tanques.reduce((acc, t) => acc + t.bpd, 0)
    const netos = l.tanques.reduce((acc, t) => acc + t.netos, 0)
    return {
      Hora: l.hora,
      'Fecha/Hora': dateTimeFormat(l.timestamp instanceof Date ? l.timestamp : undefined),
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

  const fechaArchivo = dateFormat(evaluacion.fechaCierre).replace(/\//g, '-')
  XLSX.writeFile(wb, `Informe_${pozo.nombre}_${fechaArchivo}.xlsx`)
}
