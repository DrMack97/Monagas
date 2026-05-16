// TODO: DTOs para UI (diferente de database) - Player 1 (Backend)
// Paso 1: Crear UIWell (simplificado para-lista)
// Paso 2: Crear UIEvaluation (con datos formateados)
// Paso 3: Crear UIKPI (para dashboard)
// Prompt de implementación rápida:
// "Crear UIWell, UIEvaluation, UIKPI, UICard para componentes React"
// Entregable:
// - UIWell: nombre, produccion, estado Badge
// - UIEvaluation: fecha, netos, qg, estado
// - UIKPI: label, value, unit, trend
export interface UIWell {
  id: string
  nombre: string
  produccion: number
  produccionFormateada: string
  estado: string
  estadoBadge: 'green' | 'yellow' | 'orange' | 'red'
  ultimaLectura: string // Formateada
  supervisor: string
}

export interface UIEvaluation {
  id: string
  pozoNombre: string
  fecha: string // Formateada
  netos: number
  netosFormateado: string
  qg: number
  qgFormateado: string
  estado: string
  estadoBadge: 'green' | 'yellow' | 'orange' | 'red'
  operador: string
  accion: 'aprobar' | 'rechazar' | 'ver-detalle'
}

export interface UIKPI {
  label: string
  value: number | string
  unit: string
  formateado: string
  trend?: 'up' | 'down' | 'stable'
  trendPercentage?: number
}

export interface UICard {
  title: string
  subtitle?: string
  icon?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface UITableColumn {
  key: string
  label: string
  sortable?: boolean
  formater?: (value: any, row: any) => string
}
