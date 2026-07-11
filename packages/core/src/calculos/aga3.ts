// packages/core/src/calculos/aga3.ts
//
// Motor de cálculo de caudal de gas — AGA-3 / API MPMS Capítulo 14.3
// Placa de orificio con Meter Run.
// Validado contra: MFB-919 → Qg = 0.01 MPCGD

export interface GasInput {
  pf: number        // Presión Estática (psig)
  hw: number        // Diferencial Barton (inH₂O)
  tGas: number       // Temperatura del gas (°F)
  gg: number         // Gravedad específica del gas
  diam: number       // Diámetro de la placa de orificio (pulg) — "d"
  meterRun: number   // Diámetro interno del tubo de medición (pulg) — "D"
}

export interface AGA3Result {
  beta: number   // β = d/D
  Fc: number     // Factor de velocidad de aproximación (Ev)
  Fb: number     // Factor de flujo básico
  Fg: number     // Factor de gravedad específica
  Ftf: number    // Factor de temperatura de flujo
  Fpv: number    // Factor de expansibilidad (constante en este alcance)
  qg: number     // Caudal de gas (MPCGD)
}

export function calcAGA3(input: GasInput): AGA3Result {
  const { pf, hw, tGas: T, gg: Gg, diam: d, meterRun: D } = input

  if (pf < 0) throw new Error('Presión Estática no puede ser negativa')
  if (hw < 0) throw new Error('Diferencial hw no puede ser negativo')
  if (Gg <= 0) throw new Error('Gravedad específica debe ser > 0')

  // β = d/D — AGA-3 exige β ≤ 0.75 para medición válida
  const beta = D > 0 ? Math.min(d / D, 0.75) : 0

  // Ev — factor de velocidad de aproximación (AGA-3 / API 14.3)
  // Ev = 1 / √(1 − β⁴)
  const Fc = D > 0 ? 1 / Math.sqrt(1 - Math.pow(beta, 4)) : 1

  // Fb — 218.527 = Fn, factor de conversión numérica
  // Fuente: AGA Report No.3 Parte 4 (1992) / API MPMS Capítulo 14.3
  // Absorbe: π/4, conversión SCFH→MPCGD, condiciones base Tb=519.67°R, Pb=14.73 psia
  const Fb = 218.527 * d * d * Fc

  const Fg  = Math.sqrt(1 / Gg)
  const Ftf = Math.sqrt(520 / (T + 460))
  const Fpv = 1.0

  const qg = Math.max(0, (Fb * Fpv * Fg * Ftf * Math.sqrt(hw * pf)) / 1000)

  return { beta, Fc, Fb, Fg, Ftf, Fpv, qg }
}