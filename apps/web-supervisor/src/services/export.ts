// TODO: Generador PDF (jsPDF) y XLSX (SheetJS) - Player 3 (Fullstack)
// Paso 1: Importar jspdf y xlsx
// Paso 2: createPDF(wells) → descargar PDF con tabla
// Paso 3: createExcel(wells) → descargar Excel con datos
// Prompt de implementación rápida:
// "Crear exportWellReport PDF y Excel con jspdf, xlsx"
// Entregable:
// - exportWellReportPDF(wells) → descarga archivo
// - exportWellReportExcel(wells) → descarga archivo
// - Incluye header, fecha, total rows
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export function exportWellReportPDF(wells: any[]) {
  const doc = new jsPDF()
  
  doc.text('Reporte de Pozos', 14, 15)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 22)
  doc.text(`Total pozos: ${wells.length}`, 14, 29)

  const tableData = wells.map(w => [
    w.nombre,
    w.produccion.toFixed(2),
    w.estado,
    new Date(w.ultimaLectura).toLocaleDateString()
  ])

  autoTable(doc, {
    head: [['Nombre', 'Producción', 'Estado', 'Última lectura']],
    body: tableData,
    startY: 35
  })

  doc.save('reporte-pozos.pdf')
}

export function exportWellReportExcel(wells: any[]) {
  const ws = XLSX.utils.json_to_sheet(
    wells.map(w => ({
      Nombre: w.nombre,
      Produccion: w.produccion,
      Estado: w.estado,
      'Ultima Lectura': new Date(w.ultimaLectura).toLocaleDateString()
    }))
  )

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Pozos')
  
  XLSX.writeFile(wb, 'reporte-pozos.xlsx')
}

export function exportEvaluationPDF(evaluation: any) {
  const doc = new jsPDF()
  
  doc.text('Reporte de Evaluación', 14, 15)
  doc.text(`Pozo: ${evaluation.pozo.nombre}`, 14, 25)
  doc.text(`Fecha: ${new Date(evaluation.fecha).toLocaleDateString()}`, 14, 32)
  
  const data = [
    ['BPH', evaluation.bph],
    ['BPD', evaluation.bpd],
    ['Netos', evaluation.netos],
    ['Qg', evaluation.qg],
    ['Presión', evaluation.presion],
    ['Temperatura', evaluation.temperatura]
  ]

  autoTable(doc, {
    head: [['Medida', 'Valor']],
    body: data,
    startY: 40
  })

  doc.save(`evaluacion-${evaluation.pozo.nombre}.pdf`)
}
