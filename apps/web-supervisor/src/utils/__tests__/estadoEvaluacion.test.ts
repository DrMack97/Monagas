import { ESTADO_COLOR, ESTADO_LABEL, estadoColor, estadoLabel } from '../estadoEvaluacion'

const ESTADOS = ['EN_CURSO', 'CERRADA', 'PENDIENTE_SUPERVISOR', 'APROBADA_SUPERVISOR', 'OFICIAL']

describe('estadoEvaluacion', () => {
  it('todos los estados tienen etiqueta y color', () => {
    for (const e of ESTADOS) {
      expect(ESTADO_LABEL[e as keyof typeof ESTADO_LABEL]).toBeTruthy()
      expect(ESTADO_COLOR[e as keyof typeof ESTADO_COLOR]).toMatch(/bg-.*text-.*border-/)
    }
  })

  it('"En Curso" es ámbar (era el estado que salía sin color en Actividad Reciente)', () => {
    expect(estadoLabel('EN_CURSO')).toBe('En Curso')
    expect(estadoColor('EN_CURSO')).toMatch(/amber/)
  })

  it('cada estado activo tiene un color distinto', () => {
    const colores = ['EN_CURSO', 'PENDIENTE_SUPERVISOR', 'APROBADA_SUPERVISOR', 'OFICIAL'].map(estadoColor)
    expect(new Set(colores).size).toBe(colores.length)
  })

  it('un estado desconocido no rompe: gris y con su texto crudo', () => {
    expect(estadoLabel('NUEVO_ESTADO')).toBe('NUEVO_ESTADO')
    expect(estadoColor('NUEVO_ESTADO')).toBe(ESTADO_COLOR.CERRADA)
  })
})
