import { describe, it, expect } from 'vitest'
import { evaluarRangos, peorNivelRango, mediana, type EntradaRangos } from '../src/utils/rangos.js'
import { motivosDeConfirmacion } from '../src/utils/confirmacionGuardado.js'

const ok: EntradaRangos = {
  gasConfigurado: true, pf: '300', hw: '43.5', tGas: '90', gg: '0.65', pCab: '540', pSep: '120',
  tanques: [{ id: 't1', nombre: 'Tanque 1', mf: '12.5' }, { id: 't2', nombre: 'Tanque 2', mf: '3' }],
  limResorte: 500, limGamma: 100,
  historial: { pf: [290, 300, 310], hw: [40, 43, 45], pCab: [530, 540, 545], pSep: [118, 120, 122] },
}
const textos = (e: EntradaRangos) => evaluarRangos(e).map((a) => `${a.nivel}:${a.campo}`)

describe('evaluarRangos — una captura normal no genera avisos', () => {
  it('valores razonables y dentro de lo habitual del pozo', () => expect(evaluarRangos(ok)).toEqual([]))
  it('los 0 NO se evalúan aquí (los cubre "lectura vacía")', () => {
    expect(evaluarRangos({ ...ok, pf: '0', hw: '0', pCab: '0', pSep: '0', tanques: [{ id: 't1', nombre: 'T1', mf: '0' }] })).toEqual([])
  })
})

describe('evaluarRangos — físicamente imposible (ROJA)', () => {
  it('valores negativos', () => {
    const a = evaluarRangos({ ...ok, pf: '-5', hw: '-1', pCab: '-2', pSep: '-3', tanques: [{ id: 't1', nombre: 'Tanque 1', mf: '-1' }] })
    expect(a.filter((x) => x.nivel === 'ROJA').map((x) => x.campo).sort()).toEqual(['hw', 'medidaFinal', 'pCab', 'pSep', 'pf'])
  })
  it('diferencial mayor que la presión estática: 100 inH₂O ≈ 3.6 psi no cabe en 2 psig', () => {
    const a = evaluarRangos({ ...ok, pf: '2', hw: '100', limResorte: 0, limGamma: 0, historial: {} })
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ campo: 'hw', nivel: 'ROJA' })
    expect(a[0].texto).toMatch(/no es posible/)
  })
  it('el límite exacto: hw/27.707 == pf no se marca (es mayor estricto)', () => {
    expect(evaluarRangos({ ...ok, pf: '10', hw: String(10 * 27.707), limResorte: 0, limGamma: 0, historial: {} })).toEqual([])
  })
})

describe('evaluarRangos — fuera de lo esperado (AMARILLA)', () => {
  it('presión estática sobre el resorte y diferencial sobre el gamma del pozo', () => {
    expect(textos({ ...ok, pf: '600', hw: '150', historial: {} }).sort()).toEqual(['AMARILLA:hw', 'AMARILLA:pf'])
  })
  it('sin límites configurados (0) no se evalúa el resorte/gamma', () => {
    expect(evaluarRangos({ ...ok, pf: '600', hw: '150', limResorte: 0, limGamma: 0, historial: {} })).toEqual([])
  })
  it('temperatura y gravedad específica fuera de rango', () => {
    expect(textos({ ...ok, tGas: '900', gg: '6' })).toEqual(['AMARILLA:tGas', 'AMARILLA:gg'])
    expect(textos({ ...ok, tGas: '-50', gg: '0.1' })).toEqual(['AMARILLA:tGas', 'AMARILLA:gg'])
  })
  it('medida de tanque absurda (> 500 pulg): decimal omitido', () => {
    const a = evaluarRangos({ ...ok, tanques: [{ id: 't1', nombre: 'Tanque 1', mf: '1250' }] })
    expect(a[0]).toMatchObject({ campo: 'medidaFinal', tanqueId: 't1', nivel: 'AMARILLA' })
  })
  it('P. Cabezal menor que P. Separador', () => {
    expect(textos({ ...ok, pCab: '100', pSep: '120', historial: {} })).toEqual(['AMARILLA:pCab'])
  })
  it('sin Placa/Meter Run no se evalúa el gas (no se guarda)', () => {
    expect(evaluarRangos({ ...ok, gasConfigurado: false, pf: '-5', hw: '9999', tGas: '900', historial: {} })).toEqual([])
  })
})

describe('evaluarRangos — rango habitual del propio pozo', () => {
  it('5400 en vez de 540 (decimal de más) se marca con la pista del decimal', () => {
    const a = evaluarRangos({ ...ok, pCab: '5400' })
    expect(a).toHaveLength(1)
    expect(a[0]).toMatchObject({ campo: 'pCab', nivel: 'AMARILLA' })
    expect(a[0].texto).toMatch(/10 veces mayor.*mediana 540.*decimal/)
  })
  it('54 en vez de 540 (decimal omitido) también', () => {
    const a = evaluarRangos({ ...ok, pCab: '54' })
    // además de salirse de lo habitual, 54 queda por debajo del separador (120): dos avisos, uno con la pista del decimal
    expect(a.map((x) => x.texto).some((t) => /10 veces menor.*decimal/.test(t))).toBe(true)
  })
  it('un cambio grande pero que no parece decimal (4×) avisa sin la pista', () => {
    const a = evaluarRangos({ ...ok, pSep: '480' })
    expect(a[0].texto).toMatch(/4 veces mayor/)
    expect(a[0].texto).not.toMatch(/decimal/)
  })
  it('hasta 3× la mediana (por arriba o por abajo) todavía es normal', () => {
    expect(evaluarRangos({ ...ok, pCab: String(540 * 3) })).toEqual([])
    expect(evaluarRangos({ ...ok, pCab: String(540 / 3 + 1) })).toEqual([])
  })
  it('con menos de 2 lecturas de referencia no hay rango habitual (el pozo es nuevo)', () => {
    expect(evaluarRangos({ ...ok, pCab: '5400', historial: { pCab: [540] } })).toEqual([])
    expect(evaluarRangos({ ...ok, pCab: '5400', historial: {} })).toEqual([])
  })
  it('los ceros del historial no cuentan (lecturas vacías no definen lo habitual)', () => {
    expect(evaluarRangos({ ...ok, pCab: '5400', historial: { pCab: [0, 0, 540] } })).toEqual([])
  })
})

describe('mediana / peorNivelRango', () => {
  it('mediana par e impar', () => {
    expect(mediana([3, 1, 2])).toBe(2)
    expect(mediana([4, 1, 3, 2])).toBe(2.5)
  })
  it('ROJA gana sobre AMARILLA; sin avisos, undefined', () => {
    expect(peorNivelRango([])).toBeUndefined()
    expect(peorNivelRango([{ campo: 'pf', nivel: 'AMARILLA', texto: '' }])).toBe('AMARILLA')
    expect(peorNivelRango([{ campo: 'pf', nivel: 'AMARILLA', texto: '' }, { campo: 'hw', nivel: 'ROJA', texto: '' }])).toBe('ROJA')
  })
})

describe('motivosDeConfirmacion', () => {
  it('sin nada que avisar no se pide confirmar', () => {
    expect(motivosDeConfirmacion({ camposEnCero: [], rangos: [], balanceRojo: [] })).toEqual([])
  })
  it('junta ceros, rangos y balance rojo', () => {
    const m = motivosDeConfirmacion({ camposEnCero: ['P. Cabezal', 'P. Separador'], rangos: ['Presión Estática (5) fuera de rango'], balanceRojo: ['Balance rojo en Tanque 2'] })
    expect(m).toEqual(['Datos críticos en 0: P. Cabezal, P. Separador.', 'Presión Estática (5) fuera de rango', 'Balance rojo en Tanque 2'])
  })
})
