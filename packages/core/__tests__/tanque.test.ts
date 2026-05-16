// TODO: Tests unitarios cálculos tanque - Player 3 (Fullstack)
// Paso 1: Test calcularBPH con valores conocidos
// Paso 2: Test calcularBPD = BPH * 24
// Paso 3: Test validar MFB-950: 133.10 Bls Netos/Día
// Prompt de implementación rápida:
// "Crear tests para calcularBPH, calcularBPD, calcularNetos, validarMFB950"
// Entregable:
// - calcularBPH(100, 0, 1) = 100
// - calcularBPD(100) = 2400
// - calcularNetos(2400, 0) = 2400
// - calcularNetos(2400, 50) = 1200
// - validarMFB950.expected = 133.10
import { 
  calcularBPH, 
  calcularBPD, 
  calcularNetos, 
  validarMFB950 
} from '../src/calculos/tanque'

describe('calcularBPH', () => {
  it('debe calcular BPH correctamente', () => {
    const resultado = calcularBPH(100, 0, 1)
    expect(resultado).toBe(100)
  })

  it('debe lanzar error si horas <= 0', () => {
    expect(() => calcularBPH(100, 0, 0)).toThrow()
    expect(() => calcularBPH(100, 0, -1)).toThrow()
  })

  it('debe calcular BPH con diferencia parcial', () => {
    const resultado = calcularBPH(150, 50, 2)
    expect(resultado).toBe(50)
  })
})

describe('calcularBPD', () => {
  it('debe convertir BPH a BPD correctamente', () => {
    const resultado = calcularBPD(100)
    expect(resultado).toBe(2400)
  })

  it('debe convertir BPH pequeño a BPD', () => {
    const resultado = calcularBPD(5.541666)
    expect(resultado).toBeCloseTo(133, 2)
  })
})

describe('calcularNetos', () => {
  it('debe calcular netos sin agua', () => {
    const resultado = calcularNetos(2400, 0)
    expect(resultado).toBe(2400)
  })

  it('debe calcular netos con 50% agua', () => {
    const resultado = calcularNetos(2400, 50)
    expect(resultado).toBe(1200)
  })

  it('debe lanzar error si porcentaje > 100', () => {
    expect(() => calcularNetos(2400, 101)).toThrow()
  })
})

describe('validarMFB950', () => {
  it('debe retornar expected = 133.10 Bls Netos/Día', () => {
    const resultado = validarMFB950()
    expect(resultado.valid).toBe(true)
    expect(resultado.expected).toBe(133.10)
  })
})

describe('calcularTotalTanque', () => {
  it('debe calcular volumen al 50%', () => {
    const { calcularTotalTanque } = require('../src/calculos/tanque')
    const resultado = calcularTotalTanque(1000, 50)
    expect(resultado).toBe(500)
  })

  it('debe calcular volumen al 100%', () => {
    const { calcularTotalTanque } = require('../src/calculos/tanque')
    const resultado = calcularTotalTanque(1000, 100)
    expect(resultado).toBe(1000)
  })
})
