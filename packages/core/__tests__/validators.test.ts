// TODO: Tests unitarios validaciones - Player 3 (Fullstack)
// Paso 1: Test validarRango con valores dentro/outside rango
// Paso 2: Test validarLectura con lecturas completas
// Paso 3: Test getRangoNormal retorna min/max
// Prompt de implementación rápida:
// "Crear tests para validarRango, validarLectura, getRangoNormal"
// Entregable:
// - validarRango('bph', 100).valid = true
// - validarRango('bph', 9999).outOfRange = true
// - validarLectura({bph: 100, bpd: 2400}).valid = true
import {
  validarRango,
  validarLectura,
  getRangoNormal
} from '../src/utils/validators.js'
 
describe('getRangoNormal', () => {
  it('debe retornar rango para bph', () => {
    const rango = getRangoNormal('bph')
    expect(rango.min).toBe(0)
    expect(rango.max).toBe(1000)
  })
 
  it('debe retornar rango para presion', () => {
    const rango = getRangoNormal('presion')
    expect(rango.min).toBe(0)
    expect(rango.max).toBe(5000)
  })
 
  it('debe retornar default para tipo desconocido', () => {
    const rango = getRangoNormal('desconocido')
    expect(rango.min).toBe(0)
    expect(rango.max).toBe(Infinity)
  })
})
 
describe('validarRango', () => {
  it('debe retornar valid=true para valor dentro rango', () => {
    const resultado = validarRango('bph', 100)
    expect(resultado.valid).toBe(true)
    expect(resultado.outOfRange).toBe(false)
  })
 
  it('debe retornar outOfRange=true para valor fuera rango', () => {
    const resultado = validarRango('bph', 9999)
    expect(resultado.valid).toBe(false)
    expect(resultado.outOfRange).toBe(true)
  })
 
  it('debe retornar warning para valor fuera normal pero dentro absoluto', () => {
    const resultado = validarRango('bph', 5)
    expect(resultado.valid).toBe(true)
    expect(resultado.warning).toBeDefined()
    expect(resultado.outOfRange).toBe(false)
  })
})
 
describe('validarLectura', () => {
  it('debe retornar valid=true para lectura completa válida', () => {
    const resultado = validarLectura({
      bph: 100,
      bpd: 2400,
      qg: 0.5,
      presion: 1000,
      temperatura: 60
    })
    expect(resultado.valid).toBe(true)
    expect(resultado.errors.length).toBe(0)
  })
 
  it('debe retornar errors para lecturas fuera de rango', () => {
    const resultado = validarLectura({
      bph: 9999,
      presion: -100
    })
    expect(resultado.valid).toBe(false)
    expect(resultado.errors.length).toBeGreaterThan(0)
  })
 
  it('debe retornar warnings para lecturas fuera de normal', () => {
    const resultado = validarLectura({
      bph: 5
    })
    expect(resultado.valid).toBe(true)
    expect(resultado.warnings.length).toBeGreaterThan(0)
  })
})
