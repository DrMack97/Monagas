// useReporteAnterior: reporte ya capturado del pozo para el prefill de la pantalla Reporte.

import { renderHook, waitFor } from '@testing-library/react'
import { fusionarReportes, useReporteAnterior } from '../useReporteAnterior'

const getDocsMock = jest.fn()
jest.mock('firebase/firestore', () => ({
  collection: jest.fn((_db: unknown, ...ruta: string[]) => ({ ruta: ruta.join('/') })),
  query: jest.fn((ref: unknown, ...restricciones: unknown[]) => ({ ref, restricciones })),
  where: jest.fn((campo: string, op: string, valor: unknown) => ({ tipo: 'where', campo, op, valor })),
  getDocs: (...a: unknown[]) => getDocsMock(...a),
}))

const ciclo = (id: string, creadoMs: number, reporte?: Record<string, unknown>) => ({ id, creadoMs, reporte: reporte as any })

describe('fusionarReportes', () => {
  it('el ciclo ACTUAL manda sobre los anteriores', () => {
    const r = fusionarReportes([ciclo('viejo', 1, { supervisorPDVSA: 'Viejo' }), ciclo('actual', 9, { supervisorPDVSA: 'Actual' })], 'actual')
    expect(r.supervisorPDVSA).toBe('Actual')
  })

  it('sin dato en el ciclo actual, toma el ciclo anterior MÁS RECIENTE que lo tenga', () => {
    const r = fusionarReportes(
      [ciclo('actual', 9, {}), ciclo('a1', 1, { supervisorPDVSA: 'Primero' }), ciclo('a3', 3, { supervisorPDVSA: 'Tercero' }), ciclo('a2', 2, { supervisorPDVSA: 'Segundo' })],
      'actual'
    )
    expect(r.supervisorPDVSA).toBe('Tercero')
  })

  it('se resuelve campo por campo: si el último no trae un campo, se toma del anterior que sí', () => {
    const r = fusionarReportes(
      [ciclo('actual', 9, { supervisorPDVSA: 'Nelson' }), ciclo('a2', 2, { supervisorPDVSANocturno: 'Pedro' }), ciclo('a1', 1, { supervisorPDVSA: 'Otro', cuadrillaDiurno: 'Luis' })],
      'actual'
    )
    expect(r).toEqual({ supervisorPDVSA: 'Nelson', supervisorPDVSANocturno: 'Pedro', cuadrillaDiurno: 'Luis' })
  })

  it('un valor vacío o en blanco no cuenta: se sigue buscando en ciclos anteriores', () => {
    const r = fusionarReportes([ciclo('actual', 9, { cuadrillaDiurno: '   ' }), ciclo('a1', 1, { cuadrillaDiurno: 'Luis Idrogo' })], 'actual')
    expect(r.cuadrillaDiurno).toBe('Luis Idrogo')
  })

  it('ciclos sin reporte se ignoran; sin nada, devuelve {}', () => {
    expect(fusionarReportes([ciclo('actual', 9), ciclo('a1', 1, undefined)], 'actual')).toEqual({})
    expect(fusionarReportes([], 'actual')).toEqual({})
  })

  it('conserva valores que no son texto (números, fechas, listas)', () => {
    const fecha = new Date(2026, 9, 9)
    const r = fusionarReportes([ciclo('a1', 1, { viajesVacuum: 22, fechaAlineacion: fecha, viajesVacuum24h: [{ chofer: 'R' }] })], 'actual')
    expect(r.viajesVacuum).toBe(22)
    expect(r.fechaAlineacion).toBe(fecha)
    expect(r.viajesVacuum24h).toHaveLength(1)
  })

  it('un 0 numérico es un dato válido', () => {
    expect(fusionarReportes([ciclo('a1', 1, { viajesVacuum: 0 })], 'actual').viajesVacuum).toBe(0)
  })
})

describe('fusionarReportes — objetos anidados (resumenTanques, tipoFluido…)', () => {
  it('fusiona subcampo por subcampo: un ciclo que solo trae la existencia no tapa el acumulado de uno anterior', () => {
    const r = fusionarReportes(
      [ciclo('actual', 9, { resumenTanques: { existencia: 117, trasegable: 117 } }), ciclo('a1', 1, { resumenTanques: { existencia: 5, totalTrasegado: 2542.92 } })],
      'actual'
    )
    expect(r.resumenTanques).toEqual({ existencia: 117, trasegable: 117, totalTrasegado: 2542.92 })
  })

  it('tipoFluido: el API de un ciclo anterior y el H2S de otro', () => {
    const r = fusionarReportes([ciclo('a2', 2, { tipoFluido: { h2s: 'Negativo' } }), ciclo('a1', 1, { tipoFluido: { api: 38.6, h2s: 'Viejo' } })], 'actual')
    expect(r.tipoFluido).toEqual({ h2s: 'Negativo', api: 38.6 })
  })

  it('las fechas (Date / Timestamp) y las listas NO se parten: se toman completas', () => {
    const fecha = new Date(2026, 9, 9)
    const timestamp = { toDate: () => fecha, seconds: 1 }
    const r = fusionarReportes([ciclo('a1', 1, { fechaAlineacion: timestamp, viajesVacuum24h: [{ chofer: 'R' }] } as any)], 'actual')
    expect(r.fechaAlineacion).toBe(timestamp)
    expect(r.viajesVacuum24h).toHaveLength(1)
  })

  it('un objeto sin ningún subcampo con valor no aparece en el resultado', () => {
    expect(fusionarReportes([ciclo('a1', 1, { resumenTanques: {} })], 'actual')).toEqual({})
  })
})

describe('useReporteAnterior', () => {
  const doc = (id: string, creadoMs: number, reporteOperativo?: Record<string, unknown>) => ({
    id, data: () => ({ creadoEn: { toMillis: () => creadoMs }, ...(reporteOperativo && { reporteOperativo }) }),
  })

  beforeEach(() => { getDocsMock.mockReset(); jest.spyOn(console, 'debug').mockImplementation(() => undefined) })

  it('une los reportes de los ciclos del pozo (consulta solo por pozoId)', async () => {
    getDocsMock.mockResolvedValue({ docs: [doc('actual', 9), doc('a2', 2, { supervisorPDVSA: 'Nelson Fajardo' }), doc('a1', 1, { cuadrillaDiurno: 'Luis Idrogo' })] })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(result.current.anterior).not.toBeNull())
    expect(result.current.anterior).toEqual({ supervisorPDVSA: 'Nelson Fajardo', cuadrillaDiurno: 'Luis Idrogo' })
    const consulta = getDocsMock.mock.calls[0][0]
    expect(consulta.ref.ruta).toBe('evaluaciones')
    expect(consulta.restricciones).toEqual([{ tipo: 'where', campo: 'pozoId', op: '==', valor: 'p1' }])
  })

  it('el reporte del ciclo actual (avance ya guardado) tiene prioridad', async () => {
    getDocsMock.mockResolvedValue({ docs: [doc('actual', 9, { supervisorPDVSA: 'Nuevo' }), doc('a1', 1, { supervisorPDVSA: 'Viejo' })] })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(result.current.anterior).not.toBeNull())
    expect(result.current.anterior!.supervisorPDVSA).toBe('Nuevo')
  })

  it('devuelve también "actual" (solo el ciclo actual) y "previo" (sin el ciclo actual)', async () => {
    getDocsMock.mockResolvedValue({
      docs: [
        doc('actual', 9, { acumuladosBase: { totalTrasegado: 2400 }, supervisorPDVSA: 'Nuevo' }),
        doc('a2', 2, { resumenTanques: { totalTrasegado: 2542.92 }, supervisorPDVSA: 'Viejo' }),
      ],
    })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(result.current.anterior).not.toBeNull())
    expect(result.current.actual).toEqual({ acumuladosBase: { totalTrasegado: 2400 }, supervisorPDVSA: 'Nuevo' })
    expect(result.current.previo).toEqual({ resumenTanques: { totalTrasegado: 2542.92 }, supervisorPDVSA: 'Viejo' })
    expect(result.current.anterior!.supervisorPDVSA).toBe('Nuevo') // el actual manda en "anterior"
  })

  it('el ciclo actual sin reporte guardado: actual = null', async () => {
    getDocsMock.mockResolvedValue({ docs: [doc('actual', 9), doc('a1', 1, { supervisorPDVSA: 'Viejo' })] })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(result.current.previo).not.toBeNull())
    expect(result.current.actual).toBeNull()
  })

  it('sin ningún reporte guardado devuelve null', async () => {
    getDocsMock.mockResolvedValue({ docs: [doc('actual', 9), doc('a1', 1)] })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(getDocsMock).toHaveBeenCalled())
    expect(result.current.anterior).toBeNull()
  })

  it('si la consulta falla (sin señal ni caché, permisos…) devuelve null sin lanzar error', async () => {
    getDocsMock.mockRejectedValue({ code: 'unavailable' })
    const { result } = renderHook(() => useReporteAnterior('p1', 'actual'))
    await waitFor(() => expect(getDocsMock).toHaveBeenCalled())
    expect(result.current.anterior).toBeNull()
  })

  it('sin pozo o sin ciclo no consulta', async () => {
    renderHook(() => useReporteAnterior(undefined, 'actual'))
    renderHook(() => useReporteAnterior('p1', undefined))
    await new Promise((r) => setTimeout(r, 20))
    expect(getDocsMock).not.toHaveBeenCalled()
  })
})
