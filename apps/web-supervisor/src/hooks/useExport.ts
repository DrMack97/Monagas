// TODO: Custom hook generación reportes - Player 3 (Fullstack)
// Paso 1: exportPDF(wells, options)
// Paso 2: exportExcel(wells, options)
// Paso 3: Filtrar por fecha, estado antes de exportar
// Prompt de implementación rápida:
// "Crear useExport con exportPDF, exportExcel, filtros fecha/estado"
// Entregable:
// - exportPDF(wells, { fechaInicio, fechaFin, estado }) → descarga
// - exportExcel(wells, { fechaInicio, fechaFin, estado }) → descarga
// - loading: boolean durante export
import { useState } from 'react'
import { exportWellReportPDF, exportWellReportExcel } from '../services/export'

export function useExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const exportPDF = (wells: any[], filters: { fechaInicio?: string; fechaFin?: string; estado?: string } = {}) => {
    setLoading(true)
    try {
      let filtered = wells
      
      if (filters.fechaInicio) {
        filtered = filtered.filter(w => new Date(w.fecha) >= new Date(filters.fechaInicio))
      }
      if (filters.fechaFin) {
        filtered = filtered.filter(w => new Date(w.fecha) <= new Date(filters.fechaFin))
      }
      if (filters.estado) {
        filtered = filtered.filter(w => w.estado === filters.estado)
      }

      exportWellReportPDF(filtered)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const exportExcel = (wells: any[], filters: { fechaInicio?: string; fechaFin?: string; estado?: string } = {}) => {
    setLoading(true)
    try {
      let filtered = wells
      
      if (filters.fechaInicio) {
        filtered = filtered.filter(w => new Date(w.fecha) >= new Date(filters.fechaInicio))
      }
      if (filters.fechaFin) {
        filtered = filtered.filter(w => new Date(w.fecha) <= new Date(filters.fechaFin))
      }
      if (filters.estado) {
        filtered = filtered.filter(w => w.estado === filters.estado)
      }

      exportWellReportExcel(filtered)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return {
    exportPDF,
    exportExcel,
    loading,
    error
  }
}
