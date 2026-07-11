// packages/core/src/calculos/tanque.ts
//
// Motor de cálculo de volumen de tanque.

export interface TankInput {
  mi: number        // Medida Inicial (pulg)
  mf: number        // Medida Final (pulg)
  ft: number        // Factor Tanque — kk individual por tanque (BBL/pulg)
  th: number        // Tiempo de medición (horas)
  reductor: number  // Corrección manual (Bls)
  aysPct: number    // Agua y Sedimentos (%)
}

export interface TankResult {
  dif: number      // Diferencia de nivel (pulg)
  bph: number      // Barriles por Hora
  bpd: number      // Bruto por Día
  aysBls: number   // Agua y Sedimentos (Bls)
  netos: number    // Netos por Día
}

export function calcTanque(input: TankInput): TankResult {
  const { mi, mf, ft, th, reductor, aysPct } = input

  if (th <= 0) {
    throw new Error('Tiempo debe ser > 0')
  }
  if (aysPct < 0 || aysPct > 100) {
    throw new Error('AyS% debe estar entre 0 y 100')
  }

  const dif    = Math.max(0, mf - mi)
  const bph    = Math.max(0, (dif * ft - reductor) / th)
  const bpd    = bph * 24
  const aysBls = bpd * (aysPct / 100)
  const netos  = Math.max(0, bpd - aysBls)

  return { dif, bph, bpd, aysBls, netos }
}