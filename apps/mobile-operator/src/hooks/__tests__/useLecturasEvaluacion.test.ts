// useLecturasEvaluacion: devuelve SOLO las lecturas que cuentan; las anuladas por el Operador, aparte (constancia).

import { renderHook, waitFor } from '@testing-library/react'
import { useLecturasEvaluacion } from '../useLecturasEvaluacion'

let emitir: (docs: { id: string; data: () => Record<string, unknown> }[]) => void = () => undefined
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  orderBy: jest.fn(),
  query: jest.fn(),
  onSnapshot: (_q: unknown, ok: (snap: { docs: unknown[] }) => void) => {
    emitir = (docs) => ok({ docs })
    return () => undefined
  },
}))

const doc = (id: string, hora: number, extra: Record<string, unknown> = {}) => ({ id, data: () => ({ hora, timestamp: new Date(2026, 10, 4, hora), ...extra }) })

describe('useLecturasEvaluacion', () => {
  it('separa las lecturas que cuentan de las anuladas, en el mismo orden', async () => {
    const { result } = renderHook(() => useLecturasEvaluacion('ev1'))
    emitir([doc('l1', 1), doc('l2', 2, { anulada: true, anuladaMotivo: 'prueba' }), doc('l3', 3)])
    await waitFor(() => expect(result.current.lecturas).toHaveLength(2))
    expect(result.current.lecturas.map((l) => l.id)).toEqual(['l1', 'l3'])
    expect(result.current.anuladas.map((l) => l.id)).toEqual(['l2'])
    expect(result.current.anuladas[0].anuladaMotivo).toBe('prueba')
  })

  it('las listas son estables entre renders mientras no llegue un snapshot nuevo (se usan como dependencia de hooks)', async () => {
    const { result, rerender } = renderHook(() => useLecturasEvaluacion('ev1'))
    emitir([doc('l1', 1)])
    await waitFor(() => expect(result.current.lecturas).toHaveLength(1))
    const antes = result.current.lecturas
    rerender()
    expect(result.current.lecturas).toBe(antes)
  })

  it('sin lecturas anuladas, `anuladas` queda vacía', async () => {
    const { result } = renderHook(() => useLecturasEvaluacion('ev1'))
    emitir([doc('l1', 1)])
    await waitFor(() => expect(result.current.lecturas).toHaveLength(1))
    expect(result.current.anuladas).toEqual([])
  })
})
