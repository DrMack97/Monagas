import { describe, it, expect } from 'vitest'
import {
  balanceMasas, nivelDeResiduo, detectarSalto, validarExistencia, validarTrasegadoAcumulado, peorNivel,
  TOLERANCIA_BLS,
} from '../src/utils/balanceMasas.js'
import { calcTanque } from '../src/calculos/tanque.js'

const T1 = { id: 't1', nombre: 'Tanque 1', ft: 5.3, mi: 0 }
const T2 = { id: 't2', nombre: 'Tanque 2', ft: 5.2, mi: 0 }

/** Construye una lectura de un tanque con la MISMA fórmula que usa la app (calcTanque). */
function lec(tanque: { id: string; ft: number }, mi: number, mf: number, trasegado = 0, th = 1) {
  const r = calcTanque({ mi, mf, ft: tanque.ft, th, reductor: 0, aysPct: 0, trasegado })
  return { tanqueId: tanque.id, mi, mf, bph: r.bph, th, ...(trasegado > 0 && { trasegado }) }
}

describe('nivelDeResiduo — verde / amarilla / roja', () => {
  it('hasta 0.5 Bls es redondeo: sin alerta', () => {
    expect(nivelDeResiduo(0)).toBe('OK')
    expect(nivelDeResiduo(TOLERANCIA_BLS)).toBe('OK')
    expect(nivelDeResiduo(-0.4)).toBe('OK')
  })
  it('entre 0.5 Bls y una pulgada del tanque: amarilla (desviación menor)', () => {
    expect(nivelDeResiduo(0.6, 5.2)).toBe('AMARILLA')
    expect(nivelDeResiduo(-5.2, 5.2)).toBe('AMARILLA') // justo una pulgada
  })
  it('más de una pulgada del tanque: roja (discrepancia crítica)', () => {
    expect(nivelDeResiduo(5.21, 5.2)).toBe('ROJA')
    expect(nivelDeResiduo(-67.6, 5.2)).toBe('ROJA')
  })
  it('el umbral rojo se adapta al factor del tanque (una pulgada de un tanque grande vale más barriles)', () => {
    expect(nivelDeResiduo(8, 2.4)).toBe('ROJA')
    expect(nivelDeResiduo(8, 12)).toBe('AMARILLA')
  })
  it('un residuo no numérico es crítico', () => {
    expect(nivelDeResiduo(NaN)).toBe('ROJA')
  })
  it('peorNivel elige el más grave', () => {
    expect(peorNivel('OK', 'AMARILLA')).toBe('AMARILLA')
    expect(peorNivel('AMARILLA', 'ROJA', 'OK')).toBe('ROJA')
    expect(peorNivel()).toBe('OK')
  })
})

describe('balanceMasas — Desplazamiento − Trasegado − Existente = 0', () => {
  it('sin lecturas cuadra (el tanque está como se configuró)', () => {
    const b = balanceMasas([T1, { ...T2, mi: 3 }], [])
    expect(b.nivel).toBe('OK')
    expect(b.residuoTotal).toBeCloseTo(0, 9)
  })

  it('captura correcta, nivel subiendo: cuadra', () => {
    const b = balanceMasas([T1, T2], [
      { tanques: [lec(T1, 0, 0), lec(T2, 0, 1)] },
      { tanques: [lec(T1, 0, 0), lec(T2, 1, 2)] },
      { tanques: [lec(T1, 0, 0), lec(T2, 2, 3.25)] },
    ])
    expect(b.nivel).toBe('OK')
    expect(b.desplazamientoTotal).toBeCloseTo(3.25 * 5.2, 6)
    expect(b.existenteTotal).toBeCloseTo(3.25 * 5.2, 6)
    expect(b.totalTrasegado).toBe(0)
  })

  it('tanque que se vacía CON trasegado declarado: cuadra', () => {
    const b = balanceMasas([T2], [{ tanques: [lec(T2, 0, 14)] }, { tanques: [lec(T2, 14, 1, 70)] }])
    expect(b.nivel).toBe('OK')
    expect(b.totalTrasegado).toBe(70)
  })

  it('tanque que se vacía SIN declarar el trasegado (caso real SBC-61L, lectura 14): ROJA y el residuo es lo que "desapareció"', () => {
    const b = balanceMasas([T2], [{ tanques: [lec(T2, 0, 14)] }, { tanques: [lec(T2, 14, 1)] }])
    expect(b.nivel).toBe('ROJA')
    // la app registró 0 de producción en el descenso, pero el nivel bajó 13 pulg × 5.2 = 67.6 Bls
    expect(b.residuoTotal).toBeCloseTo(13 * 5.2, 6)
    expect(b.tanques[0].nivel).toBe('ROJA')
  })

  it('trasegado digitado con un cero de menos (7 en vez de 70): ROJA', () => {
    const b = balanceMasas([T2], [{ tanques: [lec(T2, 0, 14)] }, { tanques: [lec(T2, 14, 1, 7)] }])
    expect(b.nivel).toBe('ROJA')
    expect(b.residuoTotal).toBeCloseTo(13 * 5.2 - 7, 6)
  })

  it('trasegado que se queda corto por menos de una pulgada: AMARILLA', () => {
    // el nivel bajó 13" (67.6 Bls) y se declararon 65 Bls: faltan 2.6 Bls, media pulgada
    const b = balanceMasas([T2], [{ tanques: [lec(T2, 0, 14)] }, { tanques: [lec(T2, 14, 1, 65)] }])
    expect(b.nivel).toBe('AMARILLA')
    expect(b.residuoTotal).toBeCloseTo(2.6, 6)
  })

  it('un error en un tanque no se compensa con el otro (se balancea cada tanque)', () => {
    // T1 "sobra" 5.3 × 3 y T2 "falta" lo mismo: el total da ~0 pero cada tanque está en alerta
    const lecturas = [
      { tanques: [{ ...lec(T1, 0, 3), bph: 0 }, { ...lec(T2, 0, 3), bph: lec(T2, 0, 3).bph + 3 * 5.3 - 3 * 5.2 + 0 }] },
    ]
    const b = balanceMasas([T1, T2], lecturas)
    expect(b.tanques.some((t) => t.nivel !== 'OK')).toBe(true)
    expect(b.nivel).not.toBe('OK')
  })

  it('una medida con el decimal corrido en el último dato (1.5 → 15) SÍ cuadra en el balance: lo atrapa el salto', () => {
    const b = balanceMasas([T2], [{ tanques: [lec(T2, 0, 1)] }, { tanques: [lec(T2, 1, 15)] }])
    expect(b.nivel).toBe('OK') // desplazamiento y existente suben igual: por eso hace falta detectarSalto
  })

  it('ignora trasegados no válidos (0, negativos, NaN)', () => {
    const e = { ...lec(T2, 0, 1), trasegado: NaN as number }
    expect(balanceMasas([T2], [{ tanques: [e] }]).totalTrasegado).toBe(0)
  })

  it('un tanque sin lectura en algún intervalo no rompe el balance', () => {
    const b = balanceMasas([T1, T2], [{ tanques: [lec(T2, 0, 1)] }, { tanques: [lec(T1, 0, 2), lec(T2, 1, 2)] }])
    expect(b.tanques).toHaveLength(2)
    expect(b.nivel).toBe('OK')
  })
})

describe('detectarSalto — incongruencia de datos (posible decimal omitido)', () => {
  const normal = [5.2, 5.2, 6.5, 5.2]

  it('producción en línea con las anteriores: sin aviso', () => {
    expect(detectarSalto(normal, 6.5).salto).toBe(false)
    expect(detectarSalto(normal, 3.9).salto).toBe(false)
  })

  it('producción ≈10 veces mayor (decimal omitido: 1.25 → 12.5): aviso con "posible decimal"', () => {
    const s = detectarSalto(normal, 52)
    expect(s.salto).toBe(true)
    expect(s.posibleDecimal).toBe(true)
    expect(s.factor).toBeGreaterThan(8)
  })

  it('producción ≈10 veces menor (decimal de más): aviso con "posible decimal"', () => {
    const s = detectarSalto(normal, 0.52)
    expect(s.salto).toBe(true)
    expect(s.posibleDecimal).toBe(true)
  })

  it('un salto grande que no es múltiplo de 10 se avisa sin sugerir decimal', () => {
    const s = detectarSalto(normal, 31) // ≈6×
    expect(s.salto).toBe(true)
    expect(s.posibleDecimal).toBe(false)
  })

  it('con menos de 2 lecturas previas no compara (no hay referencia)', () => {
    expect(detectarSalto([5.2], 520).salto).toBe(false)
    expect(detectarSalto([], 520).salto).toBe(false)
  })

  it('producción nueva 0 no se marca aquí (lo cubre el balance si el nivel bajó)', () => {
    expect(detectarSalto(normal, 0).salto).toBe(false)
  })

  it('ignora lecturas previas sin producción al calcular la referencia', () => {
    expect(detectarSalto([0, 0, 5.2, 5.2], 5.2).salto).toBe(false)
  })
})

describe('cierre del reporte — campos digitados', () => {
  it('existencia digitada igual a la medida: sin alerta', () => {
    expect(validarExistencia(117, 117, 5.2).nivel).toBe('OK')
    expect(validarExistencia(117.3, 117, 5.2).nivel).toBe('OK')
  })
  it('existencia que difiere menos de una pulgada: amarilla; más: roja', () => {
    expect(validarExistencia(120, 117, 5.2).nivel).toBe('AMARILLA')
    expect(validarExistencia(150, 117, 5.2).nivel).toBe('ROJA')
  })
  it('existencia con el decimal corrido (11.7 o 1170 en vez de 117): roja y con "posible decimal"', () => {
    const v = validarExistencia(11.7, 117, 5.2)
    expect(v.nivel).toBe('ROJA')
    expect(v.posibleDecimal).toBe(true)
    expect(validarExistencia(1170, 117, 5.2).posibleDecimal).toBe(true)
  })
  it('total trasegado acumulado MENOR que lo trasegado en este ciclo es imposible: roja', () => {
    expect(validarTrasegadoAcumulado(254.29, 2542.92).nivel).toBe('ROJA')
    expect(validarTrasegadoAcumulado(254.29, 2542.92).posibleDecimal).toBe(true)
  })
  it('acumulado igual o mayor que lo del ciclo (incluye lo anterior): sin alerta', () => {
    expect(validarTrasegadoAcumulado(2542.92, 120).nivel).toBe('OK')
    expect(validarTrasegadoAcumulado(120, 120).nivel).toBe('OK')
  })
})
