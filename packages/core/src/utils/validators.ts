// packages/core/src/utils/validators.ts

export interface RangoResult {
  valid: boolean
  outOfRange: boolean
  warning?: string
}

export interface LecturaResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

const RANGOS: Record<string, { min: number; max: number; normalMin?: number; normalMax?: number }> = {
  bph:         { min: 0, max: 1000,  normalMin: 10,   normalMax: 500  },
  presion:     { min: 0, max: 5000,  normalMin: 50,   normalMax: 3000 },
  temperatura: { min: 0, max: 300,   normalMin: 40,   normalMax: 200  },
  qg:          { min: 0, max: 10000, normalMin: 0.01, normalMax: 1000 },
}

export function getRangoNormal(tipo: string): { min: number; max: number } {
  return RANGOS[tipo] ?? { min: 0, max: Infinity }
}

export function validarRango(tipo: string, valor: number): RangoResult {
  const rango = RANGOS[tipo]
  if (!rango) return { valid: true, outOfRange: false }

  if (valor < rango.min || valor > rango.max)
    return { valid: false, outOfRange: true }

  const fueraDeNormal =
    valor < (rango.normalMin ?? rango.min) ||
    valor > (rango.normalMax ?? rango.max)

  return {
    valid: true,
    outOfRange: false,
    ...(fueraDeNormal && { warning: `${tipo} fuera del rango normal` })
  }
}

export function validarLectura(
  lectura: Partial<Record<string, number>>
): LecturaResult {
  const errors: string[] = []
  const warnings: string[] = []

  for (const [campo, valor] of Object.entries(lectura)) {
    if (valor === undefined) continue
    const result = validarRango(campo, valor)
    if (!result.valid)  errors.push(`${campo}: valor fuera de rango`)
    if (result.warning) warnings.push(result.warning)
  }

  return { valid: errors.length === 0, errors, warnings }
}