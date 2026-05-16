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
import { 
  calcularQg, 
  getFactoresPorPozo, 
  validarMFB919 
} from '../src/calculos/aga3'

describe('calcularQg', () => {
  it('debe calcular Qg positivo con valores válidos', () => {
    const factores = { Fb: 1, Fg: 1, Ftf: 1, Fpv: 1 }
    const resultado = calcularQg(100, 60, factores)
    expect(resultado).toBeGreaterThan(0)
  })

  it('debe lanzar error si presión <= 0', () => {
    const factores = { Fb: 1, Fg: 1, Ftf: 1, Fpv: 1 }
    expect(() => calcularQg(0, 60, factores)).toThrow()
    expect(() => calcularQg(-1, 60, factores)).toThrow()
  })

  it('debe lanzar error si temperatura <= 0', () => {
    const factores = { Fb: 1, Fg: 1, Ftf: 1, Fpv: 1 }
    expect(() => calcularQg(100, 0, factores)).toThrow()
  })

  it('debe retornar valor pequeño para MFB-919', () => {
    const factores = { Fb: 1, Fg: 1, Ftf: 1, Fpv: 1 }
    const resultado = calcularQg(14.7, 60, factores)
    expect(resultado).toBeLessThan(1)
  })
})

describe('getFactoresPorPozo', () => {
  it('debe retornar default para pozo desconocido', () => {
    const factores = getFactoresPorPozo('POZO-DESCONOCIDO')
    expect(factores.Fb).toBe(1)
    expect(factores.Fg).toBe(1)
    expect(factores.Ftf).toBe(1)
    expect(factores.Fpv).toBe(1)
  })

  it('debe retornar default para MFB-950', () => {
    const factores = getFactoresPorPozo('MFB-950')
    expect(factores.Fb).toBe(1)
  })
})

describe('validarMFB919', () => {
  it('debe retornar expected = 0.01 MPCGD', () => {
    const resultado = validarMFB919()
    expect(resultado.valid).toBe(true)
    expect(resultado.expected).toBe(0.01)
  })
})
