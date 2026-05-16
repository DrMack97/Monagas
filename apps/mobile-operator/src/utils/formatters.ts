// TODO: Formateadores específicos de la app - Player 3 (Fullstack)
// Paso 1: fmt() para números con decimales
// Paso 2: dateFormat() para fechas locales
// Paso 3: sanitizeInput() para limpiar strings
// Prompt de implementación rápida:
// "Crear fmt, dateFormat, sanitizeInput, formatProduction"
// Entregable:
// - fmt(num, decimals) → "123.45"
// - dateFormat(date) → "15/05/2026"
// - sanitizeInput(str) → "123"
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
