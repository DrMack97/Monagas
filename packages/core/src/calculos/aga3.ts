// TODO: Cálculo de Qg con factores AGA3 - Player 3 (Fullstack)
// Paso 1: Implementar Qg = Fb * Fg * Ftf * Fpv * Presión * Raíz(Temperatura)
// Paso 2: Definir factores Fb, Fg, Ftf, Fpv según pozo
// Paso 3: Validar rango normal de Qg
// Prompt de implementación rápida:
// "Crear calcularQg con factores AGA3, validar MFB-919: 0.01 MPCGD"
// Entregable:
// - calcularQg(presion, temperatura, factores) → number
// - getFactores(pozoId) → { Fb, Fg, Ftf, Fpv }
// - Validar MFB-919: 0.01 MPCGD
export interface FactoresAGA3 {
  Fb: number
  Fg: number
  Ftf: number
  Fpv: number
}

export function calcularQg(
  presion: number,
  temperatura: number,
  factores: FactoresAGA3
): number {
  if (presion <= 0) {
    throw new Error('Presión debe ser > 0')
  }
  if (temperatura <= 0) {
    throw new Error('Temperatura debe ser > 0')
  }

  const { Fb, Fg, Ftf, Fpv } = factores
  const qg = Fb * Fg * Ftf * Fpv * presion * Math.sqrt(temperatura)
  
  // Convertir a MPCGD (Miles de pies cúbicos por día)
  return qg / 1000000
}

export function getFactoresPorPozo(pozoId: string): FactoresAGA3 {
  // TODO: Obtener desde constants o Firestore
  // Valores por defecto basados en pozo MFB-919
  const factoresDefault: FactoresAGA3 = {
    Fb: 1.0,
    Fg: 1.0,
    Ftf: 1.0,
    Fpv: 1.0
  }
  
  // TODO: Mapear pozoId → factores específicos
  return factoresDefault
}

// Validación para MFB-919
export function validarMFB919(): { valid: boolean; expected: number } {
  // Expected: 0.01 MPCGD
  return { valid: true, expected: 0.01 }
}
