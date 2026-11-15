// cargarEvaluacionesDelPozo: todas las evaluaciones del pozo con sus lecturas, para el Excel histórico.

import { cargarEvaluacionesDelPozo } from '../historicoPozo'

const getDocsMock = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...ruta: string[]) => ({ ruta: ruta.join('/') })),
  query: jest.fn((ref: unknown, ...restricciones: unknown[]) => ({ ref, restricciones })),
  where: jest.fn((campo: string, op: string, valor: unknown) => ({ tipo: 'where', campo, op, valor })),
  orderBy: jest.fn((campo: string, dir: string) => ({ tipo: 'orderBy', campo, dir })),
  getDocs: (...a: unknown[]) => getDocsMock(...a),
}))

const evalDoc = (id: string, data: Record<string, unknown>) => ({ id, data: () => data })
const lecDoc = (id: string, hora: number) => ({ id, data: () => ({ hora, tanques: [] }) })

beforeEach(() => getDocsMock.mockReset())

describe('cargarEvaluacionesDelPozo', () => {
  it('trae todas las evaluaciones del pozo (filtro por pozoId) y las lecturas de cada una ordenadas por hora', async () => {
    getDocsMock.mockImplementation(async (q: any) => {
      const ruta = q.ref.ruta as string
      if (ruta === 'evaluaciones') return { docs: [evalDoc('A', { creadoEn: 1, estado: 'OFICIAL' }), evalDoc('B', { creadoEn: 2, estado: 'EN_CURSO' })] }
      return { docs: ruta.includes('/A/') ? [lecDoc('a1', 1), lecDoc('a2', 2)] : [lecDoc('b1', 1)] }
    })
    const r = await cargarEvaluacionesDelPozo('p1')

    expect(r.map((e) => [e.id, e.estado, e.lecturas.map((l) => l.id)])).toEqual([['A', 'OFICIAL', ['a1', 'a2']], ['B', 'EN_CURSO', ['b1']]])
    const consultaEvaluaciones = getDocsMock.mock.calls[0][0]
    expect(consultaEvaluaciones.restricciones).toEqual([{ tipo: 'where', campo: 'pozoId', op: '==', valor: 'p1' }])
    const consultaLecturas = getDocsMock.mock.calls[1][0]
    expect(consultaLecturas.restricciones).toEqual([{ tipo: 'orderBy', campo: 'hora', dir: 'asc' }])
  })

  it('un pozo sin evaluaciones devuelve una lista vacía', async () => {
    getDocsMock.mockResolvedValue({ docs: [] })
    expect(await cargarEvaluacionesDelPozo('p1')).toEqual([])
  })

  it('si la lectura falla (sin señal ni caché, permisos) el error SE PROPAGA para que la pantalla lo avise', async () => {
    getDocsMock.mockRejectedValue({ code: 'unavailable' })
    await expect(cargarEvaluacionesDelPozo('p1')).rejects.toEqual({ code: 'unavailable' })
  })
})
