import { describe, it, expect } from 'vitest'
import { calcTanque } from '../src/calculos/tanque.js'

describe('calcTanque', () => {

  it('MFB-950 Eval 1 — 5H → 133.10 Bls Netos/Día', () => {
    // T.desp = 33.67 Bls en 5H, ft = 2.40, AyS = 2.4%
    const result = calcTanque({
      mi: 0,
      mf: 33.67 / 2.40,
      ft: 2.40,
      th: 5,
      reductor: 0,
      aysPct: 2.4,
    })
    expect(result.netos).toBeCloseTo(133.10, 0)
  })

  it('MFB-950 Eval 2 — 10H → 59.68 Bls Netos/Día', () => {
    // T.desp = 36.26 Bls en 10H, ft = 2.40, AyS = 2.4%
    const result = calcTanque({
      mi: 0,
      mf: 36.26 / 2.40,
      ft: 2.40,
      th: 10,
      reductor: 0,
      aysPct: 2.4,
    })
    expect(result.netos).toBeCloseTo(59.68, 0)
  })

  it('MFB-919 — 12H → 57.05 Bls Netos/Día', () => {
    // T.desp = 64.75 Bls en 12H, ft = 2.40, AyS = 30%
    const result = calcTanque({
      mi: 0,
      mf: 64.75 / 2.40,
      ft: 2.40,
      th: 12,
      reductor: 0,
      aysPct: 30,
    })
    expect(result.netos).toBeCloseTo(57.05, 0)
  })

  it('Netos nunca puede ser negativo (MF < MI)', () => {
    const result = calcTanque({
      mi: 10, mf: 5, ft: 2.40, th: 1, reductor: 0, aysPct: 2.4,
    })
    expect(result.netos).toBeGreaterThanOrEqual(0)
    expect(result.bph).toBe(0)
  })

  it('lanza error si el tiempo es <= 0', () => {
    expect(() =>
      calcTanque({ mi: 0, mf: 10, ft: 2.4, th: 0, reductor: 0, aysPct: 0 })
    ).toThrow()
  })

  it('lanza error si AyS% está fuera de [0,100]', () => {
    expect(() =>
      calcTanque({ mi: 0, mf: 10, ft: 2.4, th: 1, reductor: 0, aysPct: 150 })
    ).toThrow()
  })

})