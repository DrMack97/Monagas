import { describe, it, expect } from 'vitest'
import { existenciaMedida, aTextoBls } from '../src/utils/existencia.js'

const tanques = [{ id: 't1', ft: 2.4 }, { id: 't2', ft: 2.4 }]

describe('existenciaMedida', () => {
  it('suma medida final × factor de cada tanque de la última lectura (ejemplo del informe: 0 + 117 Bls)', () => {
    expect(existenciaMedida(tanques, { tanques: [{ tanqueId: 't1', mf: 0 }, { tanqueId: 't2', mf: 48.75 }] })).toBeCloseTo(117, 9)
  })

  it('usa el factor propio de cada tanque', () => {
    expect(existenciaMedida([{ id: 't1', ft: 5.3 }, { id: 't2', ft: 5.2 }], { tanques: [{ tanqueId: 't1', mf: 2 }, { tanqueId: 't2', mf: 3 }] })).toBeCloseTo(10.6 + 15.6, 9)
  })

  it('sin lectura o sin tanques no se puede calcular', () => {
    expect(existenciaMedida(tanques, undefined)).toBeUndefined()
    expect(existenciaMedida([], { tanques: [] })).toBeUndefined()
  })

  it('si a algún tanque le falta la medida NO devuelve un total parcial', () => {
    expect(existenciaMedida(tanques, { tanques: [{ tanqueId: 't2', mf: 48.75 }] })).toBeUndefined()
    expect(existenciaMedida(tanques, { tanques: [{ tanqueId: 't1', mf: NaN }, { tanqueId: 't2', mf: 1 }] })).toBeUndefined()
  })

  it('un tanque en 0 es una medida válida', () => {
    expect(existenciaMedida(tanques, { tanques: [{ tanqueId: 't1', mf: 0 }, { tanqueId: 't2', mf: 0 }] })).toBe(0)
  })
})

describe('aTextoBls', () => {
  it('quita los errores de coma flotante y los ceros sobrantes', () => {
    expect(aTextoBls(48.75 * 2.4)).toBe('117')
    expect(aTextoBls(117.00000000000001)).toBe('117')
    expect(aTextoBls(1.1 + 2.2)).toBe('3.3')
    expect(aTextoBls(0)).toBe('0')
    expect(aTextoBls(12.346)).toBe('12.35')
  })
})
