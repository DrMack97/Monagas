// packages/core/src/calculos/aga3.ts
//
// Motor de cálculo de caudal de gas — placa de orificio con Meter Run (AGA-3 / ISO 5167-2).
//
// Qg sale en MMSCFD: millones de pies cúbicos ESTÁNDAR por DÍA (condiciones base 60 °F y
// 14.73 psia), la unidad del reporte oficial de campo. Antes este motor devolvía un caudal
// horario en Mscf/h con la etiqueta "MPCGD" (24 veces menor que el valor por día en Mscf).
//
// Modelo (el mismo que la herramienta de referencia de campo, Halliburton "Calcs"):
//   Qg = Fb · Fpv · Fg · Ftf · Y · √(hw · Pf_abs)           [scf/h]   (× 24 → scf/d)
//   Fb  = Fn · Cd · Ev · d²      Cd: Reader-Harris/Gallagher (tomas en brida) — se itera con Re
//   Ev  = 1/√(1 − β⁴)            β = d/D
//   Fg  = √(1/Gg)                gravedad específica
//   Ftf = √(Tb/Tf)               temperatura de flujo (Tb = 519.67 °R)
//   Fpv = 1/√Z                   supercompresibilidad: Z de Hall-Yarborough con pseudocríticas de Standing
//   Y   = expansión (ISO 5167-2, κ = 1.3)
//
// Supuestos (documentados porque afectan el resultado):
//   - pf se captura en psig (lo que marca el manómetro/Barton); aquí se convierte a absoluta sumando
//     14.73 psi. Se asume que la toma de presión estática es la AGUAS ARRIBA.
//   - Tomas en brida (flange taps). Gas sin corrección por CO₂/H₂S/N₂ (no se capturan composiciones).
//   - Viscosidad por Lee-Gonzalez-Eakin; solo entra en Re y por tanto en Cd (efecto < 0.2 %).
//   - β se calcula sin recortar: el ISO 5167-2 solo garantiza Cd para 0.1 ≤ β ≤ 0.75, pero en campo se
//     usan placas con β mayor (el ejemplo del Informe Técnico tiene β = 0.849). Fuera de rango el valor
//     es una estimación de la misma fórmula, no un valor certificado.

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
  Fb: number     // Factor de flujo básico (Fn · Cd · Ev · d²)
  Fg: number     // Factor de gravedad específica
  Ftf: number    // Factor de temperatura de flujo
  Fpv: number    // Factor de supercompresibilidad (1/√Z)
  Y: number      // Factor de expansión
  Cd: number     // Coeficiente de descarga (Reader-Harris/Gallagher)
  Z: number      // Factor de compresibilidad del gas a condiciones de flujo
  qg: number     // Caudal de gas (MMSCFD)
}

// --- Constantes ---------------------------------------------------------------
const PULG = 0.0254                  // m por pulgada
const PSI = 6894.757                 // Pa por psi
const INH2O = 248.84                 // Pa por inH₂O a 60 °F
const R_GAS = 8.314462618            // J/(mol·K)
const M_AIRE = 28.9625               // kg/kmol
const P_ATM = 14.73                  // psi — se suma a pf (psig) para obtener absoluta
const P_BASE = 14.73                 // psia, presión base
const T_BASE_R = 519.67              // °R (60 °F), temperatura base
const T_BASE_K = T_BASE_R / 1.8      // K
const KAPPA = 1.3                    // exponente isentrópico del gas natural
const SCF_POR_M3 = 35.3146667        // pies cúbicos por m³

// Z de Hall-Yarborough. F(y) NO es monótona cerca del punto crítico (gas pesado, frío y a presión
// alta): puede tener varias raíces y la de y grande es la "líquida" (Z ≈ 0.2). Se toma siempre la
// PRIMERA raíz (la de gas): se barre y desde 0 hasta el primer cambio de signo y ahí se biseca.
function zHallYarborough(tpr: number, ppr: number): number {
  const t = 1 / tpr
  const A = 0.06125 * t * Math.exp(-1.2 * (1 - t) ** 2)
  const B = 14.76 * t - 9.76 * t * t + 4.58 * t ** 3
  const C = 90.7 * t - 242.2 * t * t + 42.4 * t ** 3
  const E = 2.18 + 2.82 * t
  const F = (y: number) =>
    -A * ppr + (y + y * y + y ** 3 - y ** 4) / (1 - y) ** 3 - B * y * y + C * y ** E
  let lo = 1e-9
  let hi = 0.99
  const PASO = 0.0005
  for (let y = PASO; y < 0.99; y += PASO) {
    if (F(y) > 0) {
      hi = y
      lo = Math.max(1e-9, y - PASO)
      break
    }
    lo = y
  }
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (F(mid) > 0) hi = mid
    else lo = mid
  }
  return (A * ppr) / ((lo + hi) / 2)
}

// Viscosidad del gas (Pa·s) — Lee, Gonzalez y Eakin. T en °R, densidad en g/cm³.
function viscosidadLee(mw: number, tRankine: number, rhoGcc: number): number {
  const K = ((9.4 + 0.02 * mw) * tRankine ** 1.5) / (209 + 19 * mw + tRankine)
  const X = 3.5 + 986 / tRankine + 0.01 * mw
  const Y = 2.4 - 0.2 * X
  return 1e-7 * K * Math.exp(X * Math.pow(rhoGcc, Y)) // cP·1e-3 → Pa·s
}

// Coeficiente de descarga Reader-Harris/Gallagher (ISO 5167-2:2003), tomas en brida.
function cdReaderHarris(beta: number, re: number, dMm: number): number {
  const L1 = 25.4 / dMm
  const M2 = (2 * L1) / (1 - beta)
  const A = Math.pow((19000 * beta) / re, 0.8)
  let cd =
    0.5961 +
    0.0261 * beta ** 2 -
    0.216 * beta ** 8 +
    0.000521 * Math.pow((1e6 * beta) / re, 0.7) +
    (0.0188 + 0.0063 * A) * Math.pow(beta, 3.5) * Math.pow(1e6 / re, 0.3) +
    (0.043 + 0.08 * Math.exp(-10 * L1) - 0.123 * Math.exp(-7 * L1)) *
      (1 - 0.11 * A) * (beta ** 4 / (1 - beta ** 4)) -
    0.031 * (M2 - 0.8 * Math.pow(M2, 1.1)) * Math.pow(beta, 1.3)
  if (dMm < 71.12) cd += 0.011 * (0.75 - beta) * (2.8 - dMm / 25.4) // corrección por D < 71.12 mm
  return cd
}

export function calcAGA3(input: GasInput): AGA3Result {
  const { pf, hw, tGas: T, gg: Gg, diam: dIn, meterRun: DIn } = input

  if (pf < 0) throw new Error('Presión Estática no puede ser negativa')
  if (hw < 0) throw new Error('Diferencial hw no puede ser negativo')
  if (Gg <= 0) throw new Error('Gravedad específica debe ser > 0')
  if (!(DIn > 0)) throw new Error('Meter Run (D) debe ser > 0')
  if (!(dIn > 0)) throw new Error('Diámetro de placa (d) debe ser > 0')
  if (dIn >= DIn) throw new Error('El diámetro de la placa debe ser menor que el Meter Run')

  const d = dIn * PULG
  const D = DIn * PULG
  const beta = d / D
  const Ev = 1 / Math.sqrt(1 - beta ** 4)

  // Estado del gas aguas arriba
  const dP = hw * INH2O
  const P1 = (pf + P_ATM) * PSI
  const P2 = P1 - dP
  const tK = (T - 32) / 1.8 + 273.15
  const tR = T + 459.67
  const mw = M_AIRE * Gg

  // Z — pseudocríticas de Standing (gas natural dulce)
  const tpc = 168 + 325 * Gg - 12.5 * Gg * Gg
  const ppc = 677 + 15 * Gg - 37.5 * Gg * Gg
  const Z = zHallYarborough(tR / tpc, (P1 / PSI) / ppc)

  const Fg = Math.sqrt(1 / Gg)
  const Ftf = Math.sqrt(T_BASE_R / tR)
  const Fpv = 1 / Math.sqrt(Z)

  // Y — expansión (ISO 5167-2)
  const Y = 1 - (0.351 + 0.256 * beta ** 4 + 0.93 * beta ** 8) * (1 - Math.pow(P2 / P1, 1 / KAPPA))

  // Caudal másico: se itera Cd con Re hasta converger (en la práctica 3-6 pasadas)
  const rho = (P1 * mw) / (Z * R_GAS * tK) / 1000        // kg/m³ a condiciones de flujo
  const mu = viscosidadLee(mw, tR, rho / 1000)
  let re = 5e5
  let cd = cdReaderHarris(beta, re, D * 1000)
  let qm = 0
  if (dP > 0) {
    for (let i = 0; i < 100; i++) {
      cd = cdReaderHarris(beta, re, D * 1000)
      qm = cd * Ev * Y * ((Math.PI * d * d) / 4) * Math.sqrt(2 * dP * rho)
      // Re mínimo 1000: con un hw casi nulo Re → 0 y la fórmula de Cd diverge
      const re1 = Math.max(1000, (4 * qm) / (Math.PI * mu * D))
      const convergio = Math.abs(re1 - re) < 1e-9 * re
      re = re1
      if (convergio) break
    }
  }

  // A condiciones estándar (base 60 °F / 14.73 psia, gas ideal en la base)
  const rhoBase = (P_BASE * PSI * mw) / (R_GAS * T_BASE_K) / 1000   // kg/m³
  const scfPorHora = (qm / rhoBase) * SCF_POR_M3 * 3600
  const qg = (scfPorHora * 24) / 1e6

  // Fb se reporta como el factor que cierra la identidad horaria de la hoja de referencia:
  // scf/h = Fb · Fpv · Fg · Ftf · Y · √(hw · Pf_abs). Equivale a Fn · Cd · Ev · d².
  const raiz = Math.sqrt(hw * (pf + P_ATM))
  const Fb = raiz > 0 ? scfPorHora / (Fpv * Fg * Ftf * Y * raiz) : 0

  return { beta, Fc: Ev, Fb, Fg, Ftf, Fpv, Y, Cd: cd, Z, qg }
}
