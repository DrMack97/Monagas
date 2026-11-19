// useLecturaPrevia: lecturas del ciclo anterior del pozo para el prefill (mejor esfuerzo, nunca bloquea).

import { renderHook, waitFor } from '@testing-library/react'
import { useLecturaPrevia } from '../useLecturaPrevia'

const getDocsMock = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...ruta: string[]) => ({ ruta: ruta.join('/') })),
  query: jest.fn((ref: unknown, ...restricciones: unknown[]) => ({ ref, restricciones })),
  where: jest.fn((campo: string, op: string, valor: unknown) => ({ tipo: 'where', campo, op, valor })),
  orderBy: jest.fn((campo: string, dir: string) => ({ tipo: 'orderBy', campo, dir })),
  limit: jest.fn((n: number) => ({ tipo: 'limit', n })),
  getDocs: (...a: unknown[]) => getDocsMock(...a),
}))

const ts = (ms: number) => ({ toMillis: () => ms })
const evalDoc = (id: string, creadoMs: number) => ({ id, data: () => ({ creadoEn: ts(creadoMs) }) })
const lecturaDoc = (id: string, hora: number, anulada = false) => ({ id, data: () => ({ hora, gas: { pf: hora }, ...(anulada && { anulada: true }) }) })

/** getDocs de la consulta de evaluaciones y de las lecturas de cada ciclo. */
function configurar(evaluaciones: ReturnType<typeof evalDoc>[], lecturasPorCiclo: Record<string, ReturnType<typeof lecturaDoc>[]>) {
  getDocsMock.mockImplementation(async (q: any) => {
    const ruta = q.ref.ruta as string
    if (ruta === 'evaluaciones') return { docs: evaluaciones, empty: evaluaciones.length === 0 }
    const evalId = ruta.split('/')[1]
    const docs = lecturasPorCiclo[evalId] ?? []
    return { docs, empty: docs.length === 0 }
  })
}

beforeEach(() => { getDocsMock.mockReset(); jest.spyOn(console, 'debug').mockImplementation(() => undefined) })

describe('useLecturaPrevia', () => {
  it('toma las lecturas del ciclo anterior MÁS RECIENTE (ordenado por fecha de creación) y excluye el actual', async () => {
    configurar(
      [evalDoc('actual', 3000), evalDoc('viejo', 1000), evalDoc('anterior', 2000)],
      { anterior: [lecturaDoc('a9', 9), lecturaDoc('a8', 8)], viejo: [lecturaDoc('v1', 1)], actual: [lecturaDoc('x', 99)] }
    )
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(result.current.previas).toHaveLength(2))
    expect(result.current.previas.map((l) => l.id)).toEqual(['a9', 'a8']) // la más reciente primero
  })

  it('filtra por el pozo y pide las lecturas más recientes primero, con un límite', async () => {
    configurar([evalDoc('actual', 2), evalDoc('anterior', 1)], { anterior: [lecturaDoc('a1', 1)] })
    renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(getDocsMock).toHaveBeenCalledTimes(2))
    const consultaEvaluaciones = getDocsMock.mock.calls[0][0]
    expect(consultaEvaluaciones.restricciones).toContainEqual({ tipo: 'where', campo: 'pozoId', op: '==', valor: 'p1' })
    const consultaLecturas = getDocsMock.mock.calls[1][0]
    expect(consultaLecturas.ref.ruta).toBe('evaluaciones/anterior/lecturas')
    expect(consultaLecturas.restricciones).toContainEqual({ tipo: 'orderBy', campo: 'hora', dir: 'desc' })
    expect(consultaLecturas.restricciones.some((r: any) => r.tipo === 'limit')).toBe(true)
  })

  it('IGNORA las lecturas anuladas por el Operador (no deben alimentar el prefill)', async () => {
    configurar([evalDoc('actual', 2), evalDoc('anterior', 1)], { anterior: [lecturaDoc('a9', 9, true), lecturaDoc('a8', 8)] })
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(result.current.previas).toHaveLength(1))
    expect(result.current.previas[0].id).toBe('a8')
  })

  it('si TODAS las lecturas de un ciclo están anuladas, sigue buscando en un ciclo anterior', async () => {
    configurar([evalDoc('actual', 3), evalDoc('todoAnulado', 2), evalDoc('viejo', 1)], { todoAnulado: [lecturaDoc('x1', 1, true)], viejo: [lecturaDoc('v1', 1)] })
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(result.current.previas).toHaveLength(1))
    expect(result.current.previas[0].id).toBe('v1')
  })

  it('salta ciclos anteriores sin lecturas hasta encontrar uno con datos', async () => {
    configurar([evalDoc('actual', 3), evalDoc('vacio', 2), evalDoc('conDatos', 1)], { conDatos: [lecturaDoc('c1', 1)] })
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(result.current.previas).toHaveLength(1))
    expect(result.current.previas[0].id).toBe('c1')
  })

  it('no consulta nada si no está habilitado (el ciclo actual ya tiene lecturas)', async () => {
    configurar([evalDoc('anterior', 1)], { anterior: [lecturaDoc('a1', 1)] })
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', false))
    await new Promise((r) => setTimeout(r, 20))
    expect(getDocsMock).not.toHaveBeenCalled()
    expect(result.current.previas).toEqual([])
  })

  it('sin ciclos anteriores devuelve vacío', async () => {
    configurar([evalDoc('actual', 1)], {})
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(getDocsMock).toHaveBeenCalled())
    expect(result.current.previas).toEqual([])
  })

  it('si la consulta falla (sin señal ni caché, permisos…) devuelve vacío sin lanzar error', async () => {
    getDocsMock.mockRejectedValue({ code: 'unavailable' })
    const { result } = renderHook(() => useLecturaPrevia('p1', 'actual', true))
    await waitFor(() => expect(getDocsMock).toHaveBeenCalled())
    expect(result.current.previas).toEqual([])
  })

  it('sin pozo o sin ciclo actual no consulta', async () => {
    renderHook(() => useLecturaPrevia(undefined, 'actual', true))
    renderHook(() => useLecturaPrevia('p1', null, true))
    await new Promise((r) => setTimeout(r, 20))
    expect(getDocsMock).not.toHaveBeenCalled()
  })
})
