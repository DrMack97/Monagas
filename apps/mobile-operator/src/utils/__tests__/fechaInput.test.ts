import { aInputDatetimeLocal } from '../fechaInput'

describe('aInputDatetimeLocal', () => {
  it('Date → "YYYY-MM-DDTHH:mm" en hora local', () => {
    expect(aInputDatetimeLocal(new Date(2026, 9, 9, 9, 0))).toBe('2026-10-09T09:00')
    expect(aInputDatetimeLocal(new Date(2026, 0, 5, 7, 5))).toBe('2026-01-05T07:05') // ceros a la izquierda
  })

  it('Timestamp de Firestore (objeto con toDate) → igual', () => {
    expect(aInputDatetimeLocal({ toDate: () => new Date(2026, 10, 4, 23, 59) })).toBe('2026-11-04T23:59')
  })

  it('texto ISO sin zona (hora local) y milisegundos', () => {
    expect(aInputDatetimeLocal('2026-10-09T09:00:00')).toBe('2026-10-09T09:00')
    expect(aInputDatetimeLocal(new Date(2026, 9, 9, 9, 0).getTime())).toBe('2026-10-09T09:00')
  })

  it('valores vacíos o que no son fecha → undefined (no se prefilla nada)', () => {
    for (const v of [undefined, null, '', 'no es fecha', {}, NaN]) expect(aInputDatetimeLocal(v)).toBeUndefined()
  })
})
