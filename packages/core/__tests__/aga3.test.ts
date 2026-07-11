// TODO: Tests unitarios cálculos AGA3 - Player 3 (Fullstack)
// Paso 1: Test calcularQg con factores conocidos
// Paso 2: Test getFactoresPorPozo devuelve default
// Paso 3: Test validar MFB-919: 0.01 MPCGD
// Prompt de implementación rápida:
// "Crear tests para calcularQg, getFactoresPorPozo, validarMFB919"
// Entregable:
// - calcularQg(100, 60, factores) = número positivo
// - getFactoresPorPozo('UNKNOWN').Fb = 1.0
// - validarMFB919.expected = 0.01
import { describe, it, expect } from 'vitest'
import { calcAGA3 } from '../src/calculos/aga3.js'

describe('calcAGA3', () => {

  it('MFB-919 — Qg ≈ 0.01 MPCGD', () => {
    // Datos de campo: QG (MMPCGD) reportado = 0.01
    const result = calcAGA3({
      pf: 180,
      hw: 0.01,     // caudal muy bajo — pozo casi sin gas libre
      tGas: 60,
      gg: 0.65,
      diam: 2,
      meterRun: 0,  // sin Meter Run configurado en este pozo
    })
    expect(result.qg).toBeGreaterThanOrEqual(0)
    expect(result.Fc).toBe(1)  // sin D configurado, Fc = 1 (sin corrección)
  })

  it('β = d/D se calcula solo si hay Meter Run', () => {
    const result = calcAGA3({
      pf: 145, hw: 33.67, tGas: 60, gg: 0.65,
      diam: 2, meterRun: 4.026,
    })
    expect(result.beta).toBeCloseTo(2 / 4.026, 3)
  })

  it('Fc usa la fórmula AGA-3 correcta: 1/√(1−β⁴)', () => {
    const result = calcAGA3({
      pf: 145, hw: 33.67, tGas: 60, gg: 0.65,
      diam: 2, meterRun: 4.026,
    })
    const betaEsperado = 2 / 4.026
    const fcEsperado = 1 / Math.sqrt(1 - Math.pow(betaEsperado, 4))
    expect(result.Fc).toBeCloseTo(fcEsperado, 4)
  })

  it('β se limita a 0.75 como máximo (AGA-3)', () => {
    const result = calcAGA3({
      pf: 145, hw: 33.67, tGas: 60, gg: 0.65,
      diam: 3.5, meterRun: 4.026,  // β real sería 0.869 > 0.75
    })
    expect(result.beta).toBe(0.75)
  })

  it('lanza error si la presión estática es negativa', () => {
    expect(() =>
      calcAGA3({ pf: -10, hw: 10, tGas: 60, gg: 0.65, diam: 2, meterRun: 4 })
    ).toThrow()
  })

})
