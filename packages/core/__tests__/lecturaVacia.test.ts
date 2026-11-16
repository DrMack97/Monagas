import { describe, it, expect } from 'vitest'
import { datosCriticosEnCero, esCeroOVacio, textoConstanciaLecturaVacia } from '../src/utils/lecturaVacia.js'

const tanques = [{ id: 't1', nombre: 'Tanque 1', mf: '0' }, { id: 't2', nombre: 'Tanque 2', mf: '0' }]
const lleno = { tanques: [{ id: 't1', nombre: 'Tanque 1', mf: '12.5' }, { id: 't2', nombre: 'Tanque 2', mf: '3' }], pf: '300', hw: '43.5', pCab: '540', pSep: '120', gasConfigurado: true }

describe('esCeroOVacio', () => {
  it('0, vacío y no numérico cuentan; cualquier otro número no', () => {
    expect(['0', '0.00', '', '  ', 'abc', '-0'].map(esCeroOVacio)).toEqual([true, true, true, true, true, true])
    expect(['0.01', '1', '-5', '540'].map(esCeroOVacio)).toEqual([false, false, false, false])
  })
})

describe('datosCriticosEnCero', () => {
  it('la lectura de la pantalla reportada (todo en 0) está VACÍA y lista todos los campos críticos', () => {
    const r = datosCriticosEnCero({ tanques, pf: '0', hw: '0', pCab: '0', pSep: '0', gasConfigurado: true })
    expect(r.vacia).toBe(true)
    expect(r.campos.map((c) => c.etiqueta)).toEqual([
      'Medida Final (Tanque 1)', 'Medida Final (Tanque 2)', 'Presión Estática', 'Diferencial', 'P. Cabezal', 'P. Separador',
    ])
  })

  it('una lectura completa no genera aviso', () => {
    expect(datosCriticosEnCero(lleno)).toEqual({ campos: [], vacia: false })
  })

  it('un solo campo en 0 avisa ese campo, y la lectura NO está "vacía"', () => {
    const r = datosCriticosEnCero({ ...lleno, pCab: '0' })
    expect(r.campos.map((c) => c.tipo)).toEqual(['pCab'])
    expect(r.vacia).toBe(false)
  })

  it('identifica el tanque cuya Medida Final está en 0', () => {
    const r = datosCriticosEnCero({ ...lleno, tanques: [{ id: 't1', nombre: 'Tanque 1', mf: '12.5' }, { id: 't2', nombre: 'Tanque 2', mf: '0' }] })
    expect(r.campos).toEqual([{ tipo: 'medidaFinal', tanqueId: 't2', etiqueta: 'Medida Final (Tanque 2)' }])
  })

  it('un campo vacío (el operador borró el 0) se trata igual que 0', () => {
    expect(datosCriticosEnCero({ ...lleno, pSep: '' }).campos.map((c) => c.tipo)).toEqual(['pSep'])
  })

  it('sin Placa/Meter Run configurados, Presión Estática y Diferencial no cuentan (el gas no se guarda)', () => {
    const r = datosCriticosEnCero({ tanques, pf: '0', hw: '0', pCab: '540', pSep: '120', gasConfigurado: false })
    expect(r.campos.map((c) => c.tipo)).toEqual(['medidaFinal', 'medidaFinal'])
    expect(r.vacia).toBe(false)
  })

  it('Temp. gas, Gravedad, AyS, Trasegado y Casing no son críticos: no hay forma de que generen aviso', () => {
    // La entrada ni siquiera los recibe: con lo crítico lleno no hay aviso aunque esos valen 0.
    expect(datosCriticosEnCero(lleno).campos).toHaveLength(0)
  })
})

describe('textoConstanciaLecturaVacia', () => {
  it('distingue lectura vacía de lectura con algún dato en 0', () => {
    const vacia = datosCriticosEnCero({ tanques, pf: '0', hw: '0', pCab: '0', pSep: '0', gasConfigurado: true })
    expect(textoConstanciaLecturaVacia(vacia)).toMatch(/^Lectura guardada VACÍA/)
    const parcial = datosCriticosEnCero({ ...lleno, pf: '0' })
    expect(textoConstanciaLecturaVacia(parcial)).toBe('Lectura guardada con datos críticos en 0: Presión Estática.')
  })
})
