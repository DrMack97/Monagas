// packages/core/src/calculos/tanque.ts
//
// Motor de cálculo de volumen de tanque.
// Fórmula validada contra datos reales de campo:
//   MFB-950 Eval 1 (5H)  → 133.10 Bls Netos/Día
//   MFB-950 Eval 2 (10H) → 59.68  Bls Netos/Día
//   MFB-919 (12H)        → 57.05  Bls Netos/Día
//
// Hallazgo de validación: el % de Agua y Sedimentos (AyS) se aplica
// SOBRE el bruto ya sin diluyente, no sobre el bruto total.
// Confirmado exactamente contra MFB-919 (diff = 0.00 Bls).

export interface TankInput {
  mi: number         // Medida Inicial (pulg)
  mf: number         // Medida Final (pulg)
  ft: number         // Factor Tanque — kk individual por tanque (BBL/pulg)
  th: number         // Tiempo de medición (horas)
  reductor: number   // Corrección manual (Bls)
  aysPct: number      // Agua y Sedimentos (%)
  dilDia?: number     // Diluyente inyectado por día (Bls/D) — 0 en Norte de Monagas, real en Faja del Orinoco
}

export interface TankResult {
  dif: number      // Diferencia de nivel (pulg)
  bph: number      // Barriles por Hora
  bpd: number      // Bruto por Día
  dilDia: number   // Diluyente restado (Bls/D)
  aysBls: number   // Agua y Sedimentos (Bls) — calculado sobre bruto SIN diluyente
  netos: number    // Netos por Día
}

export function calcTanque(input: TankInput): TankResult {
  const { mi, mf, ft, th, reductor, aysPct } = input
  const dilDia = input.dilDia ?? 0

  if (th <= 0) {
    throw new Error('Tiempo debe ser > 0')
  }
  if (aysPct < 0 || aysPct > 100) {
    throw new Error('AyS% debe estar entre 0 y 100')
  }

  const dif       = Math.max(0, mf - mi)
  const bph       = Math.max(0, (dif * ft - reductor) / th)
  const bpd       = bph * 24
  const brutoSinDil = Math.max(0, bpd - dilDia)
  const aysBls    = brutoSinDil * (aysPct / 100)
  const netos     = Math.max(0, brutoSinDil - aysBls)

  return { dif, bph, bpd, dilDia, aysBls, netos }
}