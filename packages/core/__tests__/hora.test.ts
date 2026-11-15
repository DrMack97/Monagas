import { describe, it, expect } from 'vitest'
import { redondearAHoraEntera, horaEnteraTexto } from '../src/utils/hora.js'
import { capacidadesZona } from '../src/constants/zonas.js'

const a = (h: number, m: number, d = 4) => new Date(2026, 10, d, h, m, 30)

describe('redondearAHoraEntera — hora entera más cercana', () => {
  it('lectura unos minutos DESPUÉS de la hora → esa hora (9:05, 9:07, 9:10 → 9:00)', () => {
    for (const m of [0, 5, 7, 10]) expect(redondearAHoraEntera(a(9, m)).getHours()).toBe(9)
  })
  it('lectura unos minutos ANTES de la hora → la siguiente (9:50, 9:55 → 10:00)', () => {
    for (const m of [50, 55, 59]) expect(redondearAHoraEntera(a(9, m)).getHours()).toBe(10)
  })
  it('el corte es el minuto 30: 9:29 → 9:00, 9:30 → 10:00', () => {
    expect(redondearAHoraEntera(a(9, 29)).getHours()).toBe(9)
    expect(redondearAHoraEntera(a(9, 30)).getHours()).toBe(10)
  })
  it('devuelve minutos, segundos y milisegundos en cero', () => {
    const r = redondearAHoraEntera(a(9, 52))
    expect([r.getMinutes(), r.getSeconds(), r.getMilliseconds()]).toEqual([0, 0, 0])
  })
  it('cruza la medianoche: 23:52 del 4 → 00:00 del 5', () => {
    const r = redondearAHoraEntera(a(23, 52, 4))
    expect([r.getDate(), r.getHours()]).toEqual([5, 0])
  })
  it('no modifica la fecha original', () => {
    const original = a(9, 52)
    redondearAHoraEntera(original)
    expect(original.getHours()).toBe(9)
    expect(original.getMinutes()).toBe(52)
  })
  it('horaEnteraTexto → "HH:00" con cero a la izquierda', () => {
    expect(horaEnteraTexto(a(8, 52))).toBe('09:00')
    expect(horaEnteraTexto(a(0, 4))).toBe('00:00')
  })
})

describe('capacidadesZona', () => {
  it('MONAGAS no usa Casing ni la columna Netos', () => {
    expect(capacidadesZona('MONAGAS')).toEqual({ netosEnLecturas: false, casing: false })
  })
  it('FAJA conserva Casing y Netos', () => {
    expect(capacidadesZona('FAJA')).toEqual({ netosEnLecturas: true, casing: true })
  })
  it('zona desconocida o ausente → configuración de MONAGAS (la zona en operación)', () => {
    expect(capacidadesZona(undefined)).toEqual(capacidadesZona('MONAGAS'))
    expect(capacidadesZona('TODOS')).toEqual(capacidadesZona('MONAGAS'))
  })
})
