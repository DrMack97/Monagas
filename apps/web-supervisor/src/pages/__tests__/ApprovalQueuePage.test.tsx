// Cola de aprobaciones — corrección de lecturas y tabla de lecturas.
//
// 1) Corregir una lectura NO debe borrar el Reductor ni el Casing (antes se reemplazaba el mapa operativos).
// 2) Al corregir se recalculan los promedios de la evaluación (Bpd/Netos/Qg/AyS/proyección) y se guardan
//    JUNTO con la lectura en un solo lote: lo que se aprueba corresponde a las lecturas corregidas.
// 3) La tabla muestra la hora entera más cercana, la fecha una vez por día y Netos solo fuera de Monagas.
//
// Se emula cómo Firestore aplica un update (una clave normal reemplaza el valor; una ruta con puntos entra al
// mapa) para comprobar el documento RESULTANTE, no solo el payload.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ApprovalQueuePage from '../ApprovalQueuePage'

const tanque = (bpd: number, netos: number) => ({ tanqueId: 't1', mi: 0, mf: 2, dif: 2, th: 1, reductor: 0, trasegado: 5, bph: bpd / 24, bpd, aysBls: 0, netos })
const LECTURAS = [
  { id: 'l1', hora: 1, timestamp: new Date(2026, 10, 4, 8, 52), alertas: [], tanques: [tanque(240, 240)], gas: { pf: 1, hw: 1, tGas: 80, gg: 0.7, diam: 3, meterRun: 4, beta: 0.7, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 2 }, operativos: { pCab: 540, pSep: 300, pCsg: 12, reductorPulgadas: '1"' } },
  { id: 'l2', hora: 2, timestamp: new Date(2026, 10, 4, 10, 7), alertas: [], tanques: [tanque(240, 240)], gas: { pf: 1, hw: 1, tGas: 80, gg: 0.7, diam: 3, meterRun: 4, beta: 0.7, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 4 }, operativos: { pCab: 541, pSep: 301 } },
  { id: 'l3', hora: 3, timestamp: new Date(2026, 10, 5, 0, 5), alertas: ['Presión estática excede el resorte'], tanques: [tanque(240, 240)], operativos: { pCab: 542, pSep: 302 } },
]

let zonaEval = 'MONAGAS'
let conResultados = true
let recalculado = false
let anuladas: any[] = []
const lote = { update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) }
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, ...ruta: string[]) => ruta.join('/')),
  writeBatch: () => lote,
}))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'sup1', email: 's@x.com' }, rol: 'GERENTE', zona: 'TODOS', pozoAsignado: null, logout: jest.fn() }) }))
jest.mock('../../hooks/useApprovals', () => ({
  useApprovals: () => ({
    loading: false, error: null, procesando: false, aprobar: jest.fn(), rechazar: jest.fn(),
    pendientes: [{
      id: 'ev1', pozoId: 'p1', estado: 'PENDIENTE_SUPERVISOR', zona: zonaEval, fechaCierre: new Date(2026, 10, 8),
      ...(conResultados && { resultados: { bpdPromedio: 240, netosPromedio: 240, qgPromedio: 3, aysBls: 0, proyeccion24H: 5760, horasTotales: 3, tipoCalculo: 'FINAL_24H', calculadoEn: new Date(), ...(recalculado && { recalculadoEn: new Date(), recalculadoPor: 'sup1' }) } }),
    }],
  }),
}))
jest.mock('../../hooks/usePozosVisibles', () => ({ usePozosVisibles: () => ({ pozos: [{ id: 'p1', nombre: 'SBC-61L', campo: 'Bare' }] }) }))
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => ({ loading: false, error: null, lecturas: LECTURAS, anuladas }) }))
jest.mock('../../components/common/Header', () => ({ __esModule: true, default: () => null }))
jest.mock('../../components/common/Sidebar', () => ({ __esModule: true, default: () => null }))

/** Aplica los update de un lote a un documento, como Firestore. */
function aplicar(original: Record<string, any>, cambios: Record<string, any>): Record<string, any> {
  const r = JSON.parse(JSON.stringify(original))
  for (const [clave, valor] of Object.entries(cambios)) {
    const partes = clave.split('.')
    let cursor = r
    for (const parte of partes.slice(0, -1)) cursor = cursor[parte] ??= {}
    cursor[partes[partes.length - 1]] = valor
  }
  return r
}
const actualizacionDe = (ruta: string) => lote.update.mock.calls.find((c) => c[0] === ruta)?.[1] as Record<string, any> | undefined

async function abrirDetalle(user = userEvent.setup()) {
  render(<MemoryRouter><ApprovalQueuePage /></MemoryRouter>)
  await user.click(screen.getByRole('button', { name: /ver lecturas individuales/i }))
  return user
}
async function corregirPrimera(user: ReturnType<typeof userEvent.setup>, campo: string, valor: string) {
  await user.click(screen.getAllByRole('button', { name: /corregir lectura/i })[0])
  const input = screen.getByLabelText(campo) as HTMLInputElement
  await user.clear(input)
  await user.type(input, valor)
}

beforeEach(() => {
  lote.update.mockClear()
  lote.commit.mockClear().mockResolvedValue(undefined)
  zonaEval = 'MONAGAS'
  conResultados = true
  recalculado = false
  anuladas = []
  delete (LECTURAS[0] as any).correcciones
})

describe('corregir una lectura', () => {
  it('conserva el Reductor y el Casing (antes los borraba) y el resto de la lectura', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'P. Cabezal', '600')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))

    const resultante = aplicar(LECTURAS[0] as any, actualizacionDe('evaluaciones/ev1/lecturas/l1')!)
    expect(resultante.operativos).toEqual({ pCab: 600, pSep: 300, pCsg: 12, reductorPulgadas: '1"' })
    expect(resultante.hora).toBe(1)
    expect(resultante.tanques[0]).toMatchObject({ tanqueId: 't1', mf: 2, trasegado: 5 })
  })

  it('recalcula los promedios con la corrección y los guarda JUNTO con la lectura (un solo lote)', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'Bpd', '120') // la lectura 1 baja de 240 a 120 Bpd
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))

    expect(lote.commit).toHaveBeenCalledTimes(1)
    const evalUpd = actualizacionDe('evaluaciones/ev1')!
    expect(evalUpd['resultados.bpdPromedio']).toBeCloseTo((120 + 240 + 240) / 3, 6) // 200
    expect(evalUpd['resultados.netosPromedio']).toBeCloseTo(240, 6) // el Netos de la lectura no se editó
    expect(evalUpd['resultados.qgPromedio']).toBeCloseTo((2 + 4) / 2, 6) // promedia solo las lecturas con gas
    expect(evalUpd['resultados.proyeccion24H']).toBeCloseTo(240, 6) // la proyección sale de Bph, que no se editó
    expect(evalUpd['resultados.recalculadoPor']).toBe('sup1')
    expect(evalUpd['resultados.recalculadoEn']).toBeInstanceOf(Date)
  })

  it('al corregir el Bph de una lectura, cambia la proyección a 24 h', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'Bph', '5') // de 10 a 5 Bph
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
    expect(actualizacionDe('evaluaciones/ev1')!['resultados.proyeccion24H']).toBeCloseTo(((5 + 10 + 10) / 3) * 24, 6) // 200
  })

  it('al corregir el Netos de una lectura, el promedio de Netos cambia', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'Netos', '150')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
    expect(actualizacionDe('evaluaciones/ev1')!['resultados.netosPromedio']).toBeCloseTo((150 + 240 + 240) / 3, 6)
  })

  it('solo toca los promedios y la marca de recálculo (no horasTotales, tipoCalculo ni calculadoEn)', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'Bpd', '120')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
    const permitidas = ['bpdPromedio', 'netosPromedio', 'qgPromedio', 'aysBls', 'proyeccion24H', 'recalculadoEn', 'recalculadoPor']
    for (const clave of Object.keys(actualizacionDe('evaluaciones/ev1')!)) {
      expect(permitidas).toContain(clave.replace('resultados.', ''))
    }
  })

  it('sin resultados en la evaluación (no la cerró el Operador) solo guarda la lectura', async () => {
    conResultados = false
    const user = await abrirDetalle()
    await corregirPrimera(user, 'P. Cabezal', '600')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
    expect(actualizacionDe('evaluaciones/ev1/lecturas/l1')).toBeDefined()
    expect(actualizacionDe('evaluaciones/ev1')).toBeUndefined()
  })

  it('si el lote falla, avisa y no da por guardada la corrección', async () => {
    lote.commit.mockRejectedValueOnce({ code: 'permission-denied' })
    const user = await abrirDetalle()
    await corregirPrimera(user, 'P. Cabezal', '600')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))
    expect(await screen.findByText(/no tienes permiso para editar esta lectura/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar corrección/i })).toBeInTheDocument() // sigue en edición
  })

  it('la tarjeta avisa cuando los promedios ya fueron recalculados, y no antes', () => {
    const { unmount } = render(<MemoryRouter><ApprovalQueuePage /></MemoryRouter>)
    expect(screen.queryByText(/promedios recalculados/i)).not.toBeInTheDocument()
    unmount()
    recalculado = true
    render(<MemoryRouter><ApprovalQueuePage /></MemoryRouter>)
    expect(screen.getByText(/promedios recalculados con las lecturas corregidas/i)).toBeInTheDocument()
  })
})

describe('tabla de lecturas', () => {
  it('muestra la hora entera más cercana (8:52 → 09:00, 10:07 → 10:00), no el minuto real', async () => {
    await abrirDetalle()
    const tabla = screen.getByRole('table')
    expect(within(tabla).getByText('09:00')).toBeInTheDocument()
    expect(within(tabla).getByText('10:00')).toBeInTheDocument()
    expect(within(tabla).queryByText(/8:52|10:07/)).not.toBeInTheDocument()
  })

  it('la fecha va una vez por día, y una lectura de 00:05 cae en el día siguiente', async () => {
    await abrirDetalle()
    const fechas = screen.getAllByText(/^Fecha:/).map((e) => e.textContent)
    expect(fechas).toHaveLength(2)
    expect(fechas[0]).toMatch(/04\/11\/2026/)
    expect(fechas[1]).toMatch(/05\/11\/2026/)
  })

  it('Norte de Monagas: sin columna Netos (Bls) en la tabla; el promedio de Netos de la tarjeta se conserva', async () => {
    await abrirDetalle()
    expect(within(screen.getByRole('table')).queryByRole('columnheader', { name: /netos/i })).not.toBeInTheDocument()
    expect(screen.getByText('Netos')).toBeInTheDocument() // tarjeta: promedio
  })

  it('la corrección de una lectura sigue ofreciendo el campo Netos aunque la columna esté oculta', async () => {
    const user = await abrirDetalle()
    await user.click(screen.getAllByRole('button', { name: /corregir lectura/i })[0])
    expect(screen.getByLabelText('Netos')).toBeInTheDocument()
  })

  it('Faja: conserva la columna Netos (Bls)', async () => {
    zonaEval = 'FAJA'
    await abrirDetalle()
    expect(within(screen.getByRole('table')).getByRole('columnheader', { name: /netos/i })).toBeInTheDocument()
  })

  it('las alertas siguen visibles para el supervisor (control interno)', async () => {
    await abrirDetalle()
    expect(screen.getByText(/excede el resorte/i)).toBeInTheDocument()
  })
})

describe('conservar el valor original al corregir (historial de correcciones)', () => {
  it('cada corrección añade al historial lo que había ANTES (tanques y presiones), quién la hizo y cuándo', async () => {
    const user = await abrirDetalle()
    await corregirPrimera(user, 'P. Cabezal', '600')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))

    const upd = actualizacionDe('evaluaciones/ev1/lecturas/l1')!
    expect(upd.correcciones).toHaveLength(1)
    expect(upd.correcciones[0].por).toBe('sup1')
    expect(upd.correcciones[0].en).toBeInstanceOf(Date)
    // el original: tal cual estaba guardado (las reglas de Firestore exigen que coincida)
    expect(upd.correcciones[0].antes).toEqual({ tanques: LECTURAS[0].tanques, pCab: 540, pSep: 300 })
    // y el valor nuevo sí se escribe
    expect(upd['operativos.pCab']).toBe(600)
  })

  it('una segunda corrección CONSERVA las anteriores y añade la nueva al final', async () => {
    const previa = { en: new Date(2026, 10, 9), por: 'sup0', antes: { tanques: [tanque(100, 100)], pCab: 500, pSep: 290 } }
    ;(LECTURAS[0] as any).correcciones = [previa]
    const user = await abrirDetalle()
    await corregirPrimera(user, 'P. Separador', '350')
    await user.click(screen.getByRole('button', { name: /guardar corrección/i }))

    const hist = actualizacionDe('evaluaciones/ev1/lecturas/l1')!.correcciones
    expect(hist).toHaveLength(2)
    expect(hist[0]).toEqual(previa)
    expect(hist[1].por).toBe('sup1')
    expect(hist[1].antes.pSep).toBe(300)
  })

  it('una lectura ya corregida lo indica en la tabla', async () => {
    ;(LECTURAS[0] as any).correcciones = [{ en: new Date(), por: 'sup0', antes: { tanques: [], pCab: 1, pSep: 1 } }]
    await abrirDetalle()
    expect(screen.getByText(/Corregida una vez \(el valor original se conserva\)/)).toBeInTheDocument()
  })
})

describe('lecturas anuladas por el Operador', () => {
  it('se listan aparte, con su motivo, como constancia (no están en la tabla de lecturas)', async () => {
    anuladas = [{ id: 'x1', hora: 4, timestamp: new Date(), anulada: true, anuladaMotivo: 'Medí mal el tanque 2', anuladaEn: new Date(2026, 10, 9, 10, 0), tanques: [], operativos: { pCab: 0, pSep: 0 } }]
    await abrirDetalle()
    const bloque = screen.getByLabelText('Lecturas anuladas por el Operador')
    expect(within(bloque).getByText(/El Operador anuló 1 lectura \(no cuentan en los cálculos/)).toBeInTheDocument()
    expect(within(bloque).getByText(/#4 · Medí mal el tanque 2/)).toBeInTheDocument()
    // la tabla sigue mostrando solo las 3 lecturas que cuentan
    expect(screen.getAllByRole('button', { name: /corregir lectura/i })).toHaveLength(3)
  })

  it('sin anuladas no aparece el bloque', async () => {
    await abrirDetalle()
    expect(screen.queryByLabelText('Lecturas anuladas por el Operador')).toBeNull()
  })
})
