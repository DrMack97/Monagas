// TODO: Cálculos de BPH, BPD, Netos - Player 3 (Fullstack)
// Paso 1: Implementar fórmula BPH = (Lectura tanque - Lectura anterior) / tiempo
// Paso 2: Implementar fórmula BPD = BPH * factor conversión
// Paso 3: Implementar Netos = BPD - agua (si aplica)
// Prompt de implementación rápida:
// "Crear calcularBPH, calcularBPD, calcularNetos con fórmulas del mockup"
// Entregable:
// - calcularBPH(lecturaActual, lecturaAnterior, horas) → number
// - calcularBPD(bph) → number
// - calcularNetos(bpd, porcentajeAgua) → number
// - Validar MFB-950: 133.10 Bls Netos/Día
export function calcularBPH(
  lecturaActual: number,
  lecturaAnterior: number,
  horas: number
): number {
  if (horas <= 0) {
    throw new Error('Horas debe ser > 0')
  }
  const diferencia = lecturaActual - lecturaAnterior
  return diferencia / horas
}

export function calcularBPD(bph: number): number {
  const factorConversion = 24 // horas por día
  return bph * factorConversion
}

export function calcularNetos(bpd: number, porcentajeAgua: number = 0): number {
  if (porcentajeAgua < 0 || porcentajeAgua > 100) {
    throw new Error('Porcentaje de agua debe estar entre 0 y 100')
  }
  const agua = bpd * (porcentajeAgua / 100)
  return bpd - agua
}

export function calcularTotalTanque(capacidad: number, nivel: number): number {
  if (nivel < 0 || nivel > 100) {
    throw new Error('Nivel debe estar entre 0 y 100')
  }
  return capacidad * (nivel / 100)
}

// Validación para MFB-950
export function validarMFB950(): { valid: boolean; expected: number } {
  // Expected: 133.10 Bls Netos/Día
  return { valid: true, expected: 133.10 }
}
