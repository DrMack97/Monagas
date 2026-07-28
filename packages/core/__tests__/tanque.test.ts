import { describe, it, expect } from 'vitest';
import { calcTanque } from '../src/calculos/tanque';

describe('calcTanque', () => {
  it('MFB-950 Eval 1 — 5H → 187.74 Bls Netos/Día', () => {
    const result = calcTanque({
      mi: 0,
      mf: 33.67 / 2.40,
      ft: 2.40,
      th: 5,
      reductor: 0,
      aysPct: 2.4,
    });
     expect(result.netos).toBe(157.737216);
  });

  it('MFB-950 Eval 2 — 10H → 84.94 Bls Netos/Día', () => {
    const result = calcTanque({
      mi: 0,
      mf: 36.26 / 2.40,
      ft: 2.40,
      th: 10,
      reductor: 0,
      aysPct: 2.4,
    });
    expect(result.netos).toBe(84.935424);
  });

  it('MFB-919 — 12H → 90.65 Bls Netos/Día', () => {
    const result = calcTanque({
      mi: 0,
      mf: 64.75 / 2.40,
      ft: 2.40,
      th: 12,
      reductor: 0,
      aysPct: 30,
    });
    expect(result.netos).toBe(90.65);
  });

  it('Netos nunca puede ser negativo (MF < MI)', () => {
    const result = calcTanque({
      mi: 10,
      mf: 5,
      ft: 2.40,
      th: 1,
      reductor: 0,
      aysPct: 2.4,
    });
    expect(result.netos).toBeGreaterThanOrEqual(0);
    expect(result.bph).toBe(0);
  });

  it('lanza error si el tiempo es <= 0', () => {
    expect(() =>
      calcTanque({ mi: 0, mf: 10, ft: 2.4, th: 0, reductor: 0, aysPct: 0 })
    ).toThrow('Tiempo debe ser > 0');
  });

  it('lanza error si AyS% está fuera de [0,100]', () => {
    expect(() =>
      calcTanque({ mi: 0, mf: 10, ft: 2.4, th: 1, reductor: 0, aysPct: 150 })
    ).toThrow('AyS% debe estar entre 0 y 100');
  });

  it('dilDia opcional — por defecto 0', () => {
    const result = calcTanque({
      mi: 0,
      mf: 10,
      ft: 2.4,
      th: 1,
      reductor: 0,
      aysPct: 0,
    });
    expect(result.dilDia).toBe(0);
  });

  it('dilDia — resta correctamente', () => {
  const result = calcTanque({
    mi: 0,
    mf: 10,
    ft: 2.4,
    th: 1,
    reductor: 0,
    aysPct: 0,
    dilDia: 5,
  });
  expect(result.dilDia).toBe(5);
  expect(result.bpd).toBe(576); // 10 * 2.4 * 24 = 576
  expect(result.netos).toBe(571); // 576 - 5
});
});