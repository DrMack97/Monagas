// TODO: Factores de tanques por pozo - Player 4 (Product Manager)
// Paso 1: Definir factores por defecto para tanques
// Paso 2: Mapear pozoId → factores específicos
// Paso 3: Incluir corrección por temperatura, presión
// Prompt de implementación rápida:
// "Crear TANQUE_FACTORES_DEFAULT, getTankFactors(pozoId)"
// Entregable:
// - TANQUE_FACTORES_DEFAULT: { factorVolumen, factorCorreccion }
// - getTankFactors('MFB-950') → factores específicos
// - Fallback a default si pozo no existe
export interface ITankFactors {
  factorVolumen: number
  factorCorreccion: number
  temperaturaBase: number
  presionBase: number
}

export const TANQUE_FACTORES_DEFAULT: ITankFactors = {
  factorVolumen: 1.0,
  factorCorreccion: 1.0,
  temperaturaBase: 60, // °F
  presionBase: 14.7 // psi (atmosférica)
}

export const TANQUE_FACTORES_POR_POZO: Record<string, ITankFactors> = {
  'MFB-950': {
    factorVolumen: 1.0,
    factorCorreccion: 1.02,
    temperaturaBase: 60,
    presionBase: 14.7
  },
  'MFB-919': {
    factorVolumen: 1.0,
    factorCorreccion: 1.01,
    temperaturaBase: 60,
    presionBase: 14.7
  }
}

export function getTankFactors(pozoId: string): ITankFactors {
  return TANQUE_FACTORES_POR_POZO[pozoId] || TANQUE_FACTORES_DEFAULT
}

export function calcularVolumenCorregido(
  volumenBruto: number,
  factors: ITankFactors,
  temperatura: number,
  presion: number
): number {
  const correccionTemp = (temperatura - factors.temperaturaBase) * 0.001
  const correccionPresion = (presion - factors.presionBase) * 0.0001
  
  return volumenBruto * 
    factors.factorVolumen * 
    factors.factorCorreccion * 
    (1 + correccionTemp) * 
    (1 + correccionPresion)
}
