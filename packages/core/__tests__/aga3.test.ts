// Tests del motor de caudal de gas — placa de orificio (AGA-3 / ISO 5167-2)
//
// Qg sale en MMSCFD (millones de pies cúbicos estándar por DÍA), la unidad del
// reporte oficial de campo (Informe Técnico Willytank, 04/11/2026).
//
// Casos de oro: valores calculados por herramientas de referencia, no por este código.
//  - Halliburton: hoja "Calcs" de Halliburton Main Menu.xls (valores en caché).
//  - Informe: ejemplo del Informe Técnico (SBC-61 L): 9.80 MMSCFD. OJO: β = 0.849, fuera del rango
//    de validez de ISO 5167 (0.1–0.75); además no sabemos con qué herramienta lo calcularon en campo,
//    así que se usa solo como cota indicativa (±2 %), no como verdad absoluta.
import { describe, it, expect } from 'vitest'
import { calcAGA3 } from '../src/calculos/aga3.js'

const HALLIBURTON = { pf: 280, hw: 125, tGas: 68, gg: 0.7, diam: 1.5, meterRun: 5.761 }
const HALLIBURTON_MMSCFD = 2.574719 // 2574.719 mscfd en la hoja
const INFORME = { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826 }
const INFORME_MMSCFD = 9.8

describe('calcAGA3 — casos de oro', () => {
  it('Halliburton: Qg dentro de ±0.5 % de la hoja de referencia', () => {
    const { qg } = calcAGA3(HALLIBURTON)
    expect(Math.abs(qg / HALLIBURTON_MMSCFD - 1)).toBeLessThan(0.005)
  })

  it('Halliburton: los factores intermedios coinciden con los de la hoja', () => {
    const r = calcAGA3(HALLIBURTON)
    expect(r.Z).toBeCloseTo(1 / 1.03248 ** 2, 2) // Fpv de la hoja = 1.03248
    expect(r.Fpv).toBeCloseTo(1.03248, 2)
    expect(r.Fg).toBeCloseTo(1.195229, 5)
    expect(r.Ftf).toBeCloseTo(0.9923953, 3)
    expect(Math.abs(r.Fb / 455.03 - 1)).toBeLessThan(0.01) // Fb de la hoja
  })

  it('Informe Técnico (β=0.849): dentro de ±2 % de 9.80 MMSCFD', () => {
    const { qg } = calcAGA3(INFORME)
    expect(Math.abs(qg / INFORME_MMSCFD - 1)).toBeLessThan(0.02)
  })
})

describe('calcAGA3 — comportamiento físico', () => {
  it('el caudal es por día: ×24 respecto al caudal horario', () => {
    const r = calcAGA3(HALLIBURTON)
    // qg [MMSCFD] = Fb · Fpv · Fg · Ftf · Y · √(hw·Pabs) · 24 / 1e6
    const horario = r.Fb * r.Fpv * r.Fg * r.Ftf * r.Y * Math.sqrt(HALLIBURTON.hw * (HALLIBURTON.pf + 14.73))
    expect(r.qg).toBeCloseTo((horario * 24) / 1e6, 6)
  })

  it('usa presión ABSOLUTA: pf=0 psig (aire libre) todavía da caudal con hw > 0', () => {
    expect(calcAGA3({ ...HALLIBURTON, pf: 0 }).qg).toBeGreaterThan(0)
  })

  it('β = d/D sin recortar (el ejemplo real del informe tiene β > 0.75)', () => {
    expect(calcAGA3(INFORME).beta).toBeCloseTo(3.25 / 3.826, 4)
  })

  it('Ev = 1/√(1−β⁴)', () => {
    const r = calcAGA3(HALLIBURTON)
    expect(r.Fc).toBeCloseTo(1 / Math.sqrt(1 - r.beta ** 4), 6)
  })

  it('Cd (Reader-Harris/Gallagher) y Y están en rangos físicos', () => {
    const r = calcAGA3(HALLIBURTON)
    expect(r.Cd).toBeGreaterThan(0.58)
    expect(r.Cd).toBeLessThan(0.62)
    expect(r.Y).toBeLessThan(1)
    expect(r.Y).toBeGreaterThan(0.98)
  })

  it('más temperatura, menos caudal (a igual hw y pf)', () => {
    expect(calcAGA3({ ...HALLIBURTON, tGas: 140 }).qg).toBeLessThan(calcAGA3({ ...HALLIBURTON, tGas: 60 }).qg)
  })

  it('gas más pesado, menos caudal (a igual hw y pf)', () => {
    expect(calcAGA3({ ...HALLIBURTON, gg: 0.9 }).qg).toBeLessThan(calcAGA3({ ...HALLIBURTON, gg: 0.6 }).qg)
  })

  it('placa más grande, más caudal', () => {
    expect(calcAGA3({ ...HALLIBURTON, diam: 2 }).qg).toBeGreaterThan(calcAGA3({ ...HALLIBURTON, diam: 1.5 }).qg)
  })

  it('hw = 0 → Qg = 0', () => {
    expect(calcAGA3({ ...HALLIBURTON, hw: 0 }).qg).toBe(0)
  })
})

describe('calcAGA3 — entradas inválidas', () => {
  it('lanza error si la presión estática es negativa', () => {
    expect(() => calcAGA3({ ...HALLIBURTON, pf: -10 })).toThrow()
  })

  it('lanza error si hw es negativo', () => {
    expect(() => calcAGA3({ ...HALLIBURTON, hw: -1 })).toThrow()
  })

  it('lanza error si la gravedad específica no es > 0', () => {
    expect(() => calcAGA3({ ...HALLIBURTON, gg: 0 })).toThrow()
  })

  it('lanza error si no hay Meter Run (sin D no existe β, no se inventa un caudal)', () => {
    expect(() => calcAGA3({ ...HALLIBURTON, meterRun: 0 })).toThrow()
  })

  it('lanza error si la placa es mayor o igual al Meter Run', () => {
    expect(() => calcAGA3({ ...HALLIBURTON, diam: 6 })).toThrow()
  })
})
