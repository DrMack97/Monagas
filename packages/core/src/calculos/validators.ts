// TODO: Validación de rangos normales - Player 3 (Fullstack)
// Paso 1: Definir rangos normales para BPH, BPD, Qg, Presión, Temperatura
// Paso 2: Validar que lectura esté dentro de rango
// Paso 3: Retornar warning si está fuera de rango normal
// Prompt de implementación rápida:
// "Crear validarRango, validarLectura, getRangoNormal"
// Entregable:
// - validarRango(type, value) → { valid: bool, warning?: string }
// - validarLectura(lectura) → { valid: bool, warnings: string[] }
// - getRangoNormal(type) → { min, max }
export interface RangoNormal {
  min: number
  max: number
  normalMin?: number
  normalMax?: number
}

export const RANGOS_NORMALES: Record<string, RangoNormal> = {
  bph: { min: 0, max: 1000, normalMin: 10, normalMax: 500 },
  bpd: { min: 0, max: 24000, normalMin: 240, normalMax: 12000 },
  qg: { min: 0, max: 100, normalMin: 0.001, normalMax: 50 },
  presion: { min: 0, max: 5000, normalMin: 100, normalMax: 3000 },
  temperatura: { min: -50, max: 200, normalMin: 10, normalMax: 80 }
}

export function getRangoNormal(type: string): RangoNormal {
  return RANGOS_NORMALES[type] || { min: 0, max: Infinity }
}

export function validarRango(type: string, value: number): { 
  valid: boolean 
  warning?: string 
  outOfRange?: boolean 
} {
  const rango = getRangoNormal(type)

  // Validar fuera de rango absoluto
  if (value < rango.min || value > rango.max) {
    return {
      valid: false,
      warning: `${type} fuera de rango absoluto (${rango.min} - ${rango.max})`,
      outOfRange: true
    }
  }

  // Validar fuera de rango normal (warning)
  if (rango.normalMin && value < rango.normalMin) {
    return {
      valid: true,
      warning: `${type} por debajo del rango normal (${rango.normalMin} - ${rango.normalMax})`,
      outOfRange: false
    }
  }

  if (rango.normalMax && value > rango.normalMax) {
    return {
      valid: true,
      warning: `${type} por encima del rango normal (${rango.normalMin} - ${rango.normalMax})`,
      outOfRange: false
    }
  }

  return { valid: true }
}

export function validarLectura(lectura: { 
  bph?: number 
  bpd?: number 
  qg?: number 
  presion?: number 
  temperatura?: number 
}): { 
  valid: boolean 
  warnings: string[] 
  errors: string[] 
} {
  const warnings: string[] = []
  const errors: string[] = []

  const fields = ['bph', 'bpd', 'qg', 'presion', 'temperatura'] as const
  
  for (const field of fields) {
    if (lectura[field] !== undefined) {
      const resultado = validarRango(field, lectura[field]!)
      if (resultado.outOfRange) {
        errors.push(resultado.warning!)
      } else if (resultado.warning) {
        warnings.push(resultado.warning)
      }
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors
  }
}
