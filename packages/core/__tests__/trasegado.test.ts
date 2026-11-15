import { describe, it, expect } from 'vitest'
import { resumenTrasegado } from '../src/utils/trasegado.js'

const l = (...trasegados: (number | undefined)[]) => ({ tanques: trasegados.map((t) => (t === undefined ? {} : { trasegado: t })) })

describe('resumenTrasegado', () => {
  it('sin lecturas: 0 Bls y 0 viajes', () => {
    expect(resumenTrasegado([])).toEqual({ totalBls: 0, viajes: 0 })
  })

  it('lecturas sin trasegado (campo ausente): 0 y 0', () => {
    expect(resumenTrasegado([l(undefined), l(undefined, undefined)])).toEqual({ totalBls: 0, viajes: 0 })
  })

  it('suma los barriles y cuenta cada registro de trasegado como un viaje', () => {
    const r = resumenTrasegado([l(70), l(undefined), l(50.5, 20), l(undefined, 10)])
    expect(r.totalBls).toBeCloseTo(150.5, 6)
    expect(r.viajes).toBe(4)
  })

  it('un trasegado de 0, negativo o no numérico no cuenta', () => {
    const r = resumenTrasegado([l(0), l(-5), { tanques: [{ trasegado: NaN }, { trasegado: Infinity }, { trasegado: 12 }] }])
    expect(r).toEqual({ totalBls: 12, viajes: 1 })
  })

  it('el caso real de SBC-61L: una lectura con 70 Bls trasegados del tanque 2', () => {
    expect(resumenTrasegado([l(undefined, undefined), l(undefined, 70)])).toEqual({ totalBls: 70, viajes: 1 })
  })
})
