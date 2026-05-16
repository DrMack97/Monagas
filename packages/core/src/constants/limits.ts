// TODO: Límites y valores máximos del negocio - Player 4 (Product Manager)
// Paso 1: Definir límites de Presión (Resorte), Diferencial (Gamma)
// Paso 2: Definir límites de BPH, BPD, Qg
// Paso 3: Definir límites de tanques (capacidad máx, nivel máx)
// Prompt de implementación rápida:
// "Crear LIMITES_PRESION, LIMITES_BPH, LIMITES_TANQUE"
// Entregable:
// - PRESION_RECORTE: 5000 psi
// - BPH_MAX: 1000
// - TANQUE_CAPACIDAD_MAX: 10000 Bls
export const LIMITES_PRESION = {
  MIN: 0,
  MAX: 5000,
  NORMAL_MIN: 100,
  NORMAL_MAX: 3000,
  ALERTA: 4500,
  RECORTE: 5000
} as const

export const LIMITES_TEMPERATURA = {
  MIN: -50,
  MAX: 200,
  NORMAL_MIN: 10,
  NORMAL_MAX: 80,
  ALERTA: 150
} as const

export const LIMITES_BPH = {
  MIN: 0,
  MAX: 1000,
  NORMAL_MIN: 10,
  NORMAL_MAX: 500
} as const

export const LIMITES_BPD = {
  MIN: 0,
  MAX: 24000,
  NORMAL_MIN: 240,
  NORMAL_MAX: 12000
} as const

export const LIMITES_QG = {
  MIN: 0,
  MAX: 100,
  NORMAL_MIN: 0.001,
  NORMAL_MAX: 50
} as const

export const LIMITES_TANQUE = {
  CAPACIDAD_MIN: 100,
  CAPACIDAD_MAX: 10000,
  NIVEL_MIN: 0,
  NIVEL_MAX: 100
} as const

export const LIMITES_EVALUACION = {
  MAX_TANQUES: 10,
  MIN_LEECTURAS_REQUERIDAS: 4 // bph, bpd, presion, temperatura
} as const
