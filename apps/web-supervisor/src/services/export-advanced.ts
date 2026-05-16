// TODO: Export avanzado con gráficos y resúmenes - Player 3 (Fullstack)
// Paso 1: Export PDF con gráfico de producción (Chart.js)
// Paso 2: Export Excel con múltiples hojas
// Paso 3: Incluye resumen estadístico
// Prompt de implementación rápida:
// "Crear exportPDFAdvanced, exportExcelAdvanced con gráficos y estadísticas"
// Entregable:
// - PDF con gráfico de línea
// - Excel con hoja datos + hoja resumen
// - Estadísticas: media, mediana, desviación
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

export interface ExportOptions {
  title: string
  data: any[]
  columns: any[]
  includeChart?: boolean
  includeStatistics?: boolean
  filters?: any
}

export function exportPDFAdvanced(options: ExportOptions) {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(18)
  doc.text(options.title, 14, 20)
  
  // Fecha y filtros
  doc.setFontSize(10)
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 28)
  
  if (options.filters) {
    const filtrosText = Object.entries(options.filters)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')
    doc.text(`Filtros: ${filtrosText}`, 14, 34)
  }

  // Estadísticas
  if (options.includeStatistics && options.data.length > 0) {
    const productionValues = options.data.map(d => d.produccion || 0)
    const total = productionValues.reduce((a, b) => a + b, 0)
    const average = total / productionValues.length
    const max = Math.max(...productionValues)
    const min = Math.min(...productionValues)

    doc.setFontSize(12)
    doc.text('Resumen Estadístico:', 14, 42)
    doc.setFontSize(10)
    doc.text(`Total: ${total.toFixed(2)} Bls`, 14, 48)
    doc.text(`Promedio: ${average.toFixed(2)} Bls/día`, 14, 54)
    doc.text(`Máximo: ${max.toFixed(2)} Bls/día`, 14, 60)
    doc.text(`Mínimo: ${min.toFixed(2)} Bls/día`, 14, 66)
  }

  // Tabla
  const tableData = options.data.map(row => 
    options.columns.map(col => 
      col.formater ? col.formater(row[col.key], row) : row[col.key]
    )
  )

  autoTable(doc, {
    head: [options.columns.map(col => col.label)],
    body: tableData,
    startY: options.includeStatistics ? 74 : 40
  })

  doc.save(`${options.title.replace(/\s+/g, '-').toLowerCase()}.pdf`)
}

export function exportExcelAdvanced(options: ExportOptions) {
  const wb = XLSX.utils.book_new()

  // Hoja de datos
  const wsData = options.data.map(row => {
    const rowData: any = {}
    options.columns.forEach(col => {
      rowData[col.label] = col.formater ? col.formater(row[col.key], row) : row[col.key]
    })
    return rowData
  })

  const wsDataSheet = XLSX.utils.json_to_sheet(wsData)
  XLSX.utils.book_append_sheet(wb, wsDataSheet, 'Datos')

  // Hoja de resumen
  if (options.includeStatistics && options.data.length > 0) {
    const productionValues = options.data.map(d => d.produccion || 0)
    const total = productionValues.reduce((a, b) => a + b, 0)
    const average = total / productionValues.length
    const max = Math.max(...productionValues)
    const min = Math.min(...productionValues)

    const wsResumen = XLSX.utils.aoa_to_sheet([
      ['Resumen Estadístico'],
      [''],
      ['Métrica', 'Valor'],
      ['Total', `${total.toFixed(2)} Bls`],
      ['Promedio', `${average.toFixed(2)} Bls/día`],
      ['Máximo', `${max.toFixed(2)} Bls/día`],
      ['Mínimo', `${min.toFixed(2)} Bls/día`],
      ['Total Pozos', options.data.length],
      ['Fecha Exportación', new Date().toLocaleDateString()]
    ])

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')
  }

  XLSX.writeFile(wb, `${options.title.replace(/\s+/g, '-').toLowerCase()}.xlsx`)
}
