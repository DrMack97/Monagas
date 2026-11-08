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

// Tanque que se vacía por un viaje de vacuum (caso real: pozo SBC-61L, tanque 2, lectura 14: nivel 14" → 1")
describe('calcTanque — trasegado (vacuum)', () => {
  const base = { mi: 14, mf: 1, ft: 5.2, th: 1, reductor: 0, aysPct: 0 }

  it('SIN trasegado, si la medida baja el resultado sigue siendo 0 (comportamiento anterior)', () => {
    const r = calcTanque(base)
    expect(r.bph).toBe(0)
    expect(r.bpd).toBe(0)
    expect(r.dif).toBe(0)
  })

  it('CON trasegado: producción = cambio de nivel × kk + trasegado', () => {
    // (1 − 14) × 5.2 = −67.6 Bls de cambio; el vacuum se llevó 70 Bls → 2.4 Bls en la hora
    const r = calcTanque({ ...base, trasegado: 70 })
    expect(r.bph).toBeCloseTo(2.4, 6)
    expect(r.bpd).toBeCloseTo(57.6, 6)
    expect(r.netos).toBeCloseTo(57.6, 6)
  })

  it('el trasegado también suma cuando el nivel sigue subiendo', () => {
    const r = calcTanque({ mi: 2, mf: 3, ft: 5.2, th: 1, reductor: 0, aysPct: 0, trasegado: 10 })
    expect(r.bph).toBeCloseTo(15.2, 6) // 5.2 + 10
  })

  it('divide entre las horas del intervalo', () => {
    expect(calcTanque({ ...base, trasegado: 70, th: 2 }).bph).toBeCloseTo(1.2, 6)
  })

  it('un trasegado menor que lo que bajó el nivel no da producción negativa: se corta en 0', () => {
    expect(calcTanque({ ...base, trasegado: 20 }).bph).toBe(0)
  })

  it('trasegado 0 explícito = sin trasegado', () => {
    expect(calcTanque({ ...base, trasegado: 0 })).toEqual(calcTanque(base))
  })

  it('trasegado negativo es un error', () => {
    expect(() => calcTanque({ ...base, trasegado: -5 })).toThrow()
  })

  it('el AyS se aplica sobre la producción con trasegado', () => {
    const r = calcTanque({ ...base, trasegado: 70, aysPct: 10 })
    expect(r.aysBls).toBeCloseTo(5.76, 6) // 10 % de 57.6 Bls/día
    expect(r.netos).toBeCloseTo(51.84, 6)
  })
})
