import { describe, it, expect } from 'vitest'
import { calcularPromedioEvaluacion } from '../src/calculos/promedio.js'
import type { ILectura } from '../src/types/database.js'

function lecturaMock(hora: number, bpd: number, netos: number, qg: number): ILectura {
  return {
    id: `l${hora}`,
    hora,
    timestamp: new Date(),
    tanques: [{ tanqueId: 't1', mi: 0, mf: 10, dif: 10, th: 1, reductor: 0, bph: bpd / 24, bpd, netos, aysBls: bpd - netos }],
    gas: { pf: 0, hw: 0, tGas: 0, gg: 0, diam: 0, meterRun: 0, beta: 0, Fc: 1, Fb: 0, Fg: 0, Ftf: 0, qg },
    operativos: { pCab: 0, pSep: 0 },
  }
}

describe('calcularPromedioEvaluacion', () => {

  it('promedia 3 lecturas correctamente (verificado a mano)', () => {
    const lecturas = [
      lecturaMock(1, 90, 80, 6.0),
      lecturaMock(2, 100, 90, 6.5),
      lecturaMock(3, 98, 91, 6.6),
    ]
    const r = calcularPromedioEvaluacion(lecturas)
    // (90+100+98)/3 = 96.0
    expect(r.bpdPromedio).toBeCloseTo(96.0, 1)
    // (80+90+91)/3 = 87.0
    expect(r.netosPromedio).toBeCloseTo(87.0, 1)
    // (6.0+6.5+6.6)/3 = 6.3666...
    expect(r.qgPromedio).toBeCloseTo(6.37, 2)
    expect(r.horasTotales).toBe(3)
  })

  it('array vacío no revienta — retorna ceros', () => {
    const r = calcularPromedioEvaluacion([])
    expect(r.bpdPromedio).toBe(0)
    expect(r.horasTotales).toBe(0)
  })

  it('funciona igual con 1 sola lectura (caso preliminar forzado a la primera hora)', () => {
    const r = calcularPromedioEvaluacion([lecturaMock(1, 96.2, 88.0, 6.37)])
    expect(r.bpdPromedio).toBeCloseTo(96.2, 1)
    expect(r.horasTotales).toBe(1)
  })

  it('proyeccion24H = bphPromedio × 24', () => {
    const r = calcularPromedioEvaluacion([lecturaMock(1, 96, 88, 6)])
    // bph = 96/24 = 4.0 → proyeccion24H = 4.0 * 24 = 96
    expect(r.proyeccion24H).toBeCloseTo(96, 1)
  })

})
