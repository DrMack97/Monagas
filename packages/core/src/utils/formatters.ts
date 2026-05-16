// TODO: Actualizar formatters con nuevos formatters Fase 2 - Player 3 (Fullstack)
// Entregable: Formatters actualizados
export function fmt(num: number, decimals = 2): string {
  return num.toFixed(decimals)
}

export function san(num: number): string {
  return num.toString().replace(/[^0-9.-]/g, '')
}

export function dateFormat(date: Date | string): string {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

export function dateTimeFormat(date: Date | string): string {
  const d = new Date(date)
  return `${dateFormat(d)} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export function formatProduction(production: number): string {
  if (production >= 1000) {
    return `${(production / 1000).toFixed(2)} kBls/día`
  }
  return `${production.toFixed(2)} Bls/día`
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>\"'&]/g, '')
}

// Fase 2: Formatters adicionales
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD'
  }).format(value)
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diff < 60) return 'ahora mismo'
  if (diff < 3600) return `${Math.floor(diff / 60)} min hace`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h hace`
  if (diff < 604800) return `${Math.floor(diff / 86400)} d hace`
  
  return dateFormat(date)
}
