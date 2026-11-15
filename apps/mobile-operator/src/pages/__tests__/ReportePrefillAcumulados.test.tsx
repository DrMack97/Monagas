// src/pages/__tests__/ReportePrefillAcumulados.test.tsx
//
// Prefill de Acumulados: "el Total Trasegado Acumulado y el Total de Viajes deben precargarse o, idealmente, ser
// calculados de forma automática por la aplicación basándose en la ventana anterior".
//   acumulado = (lo acumulado antes de este ciclo) + (lo trasegado en este ciclo)

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportePage from '../ReportePage'
import { updateDoc } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({ doc: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined), serverTimestamp: jest.fn() }))
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: { id: 'p1', nombre: 'SBC-61 L', empresa: 'DSI', equipo: 'WT 1440', horasEval: 5, zona: 'MONAGAS', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 2.4 }] },
    loading: false, error: null,
  }),
}))
// Ciclo actual: dos trasegados del tanque 1 (70 y 50.5 Bls = 120.5 Bls, 2 viajes); la existencia medida es 117 Bls.
const tanque = (id: string, mf: number, trasegado?: number) => ({ tanqueId: id, mi: 0, mf, dif: mf, th: 1, reductor: 0, bph: 2.4, bpd: 57.6, aysBls: 0, netos: 57.6, ...(trasegado !== undefined && { trasegado }) })
const LECTURAS = [
  { id: 'l1', hora: 1, timestamp: new Date(2026, 10, 4, 8, 0), operativos: { pCab: 540, pSep: 300 }, tanques: [tanque('t1', 0), tanque('t2', 10)] },
  { id: 'l2', hora: 2, timestamp: new Date(2026, 10, 4, 9, 0), operativos: { pCab: 540, pSep: 300 }, tanques: [tanque('t1', 0, 70), tanque('t2', 20)] },
  { id: 'l3', hora: 3, timestamp: new Date(2026, 10, 4, 10, 0), operativos: { pCab: 540, pSep: 300 }, tanques: [tanque('t1', 0, 50.5), tanque('t2', 48.75)] },
]
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => ({ lecturas: LECTURAS, loading: false }) }))
const anteriorMock = jest.fn()
jest.mock('../../hooks/useReporteAnterior', () => ({ useReporteAnterior: () => anteriorMock() }))

const CICLO_BLS = 120.5
const CICLO_VIAJES = 2

async function abrir(vistas: { previo?: unknown; actual?: unknown }) {
  anteriorMock.mockReturnValue({ anterior: null, actual: null, previo: null, ...vistas })
  const user = userEvent.setup()
  render(<ReportePage pozoId="p1" evalId="e1" />)
  await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
  const c = (e: string) => screen.getByLabelText(e) as HTMLInputElement
  return { user, total: () => c('Total Trasegado Acumulado (Bls)'), viajes: () => c('Total Viajes Vacuum Acumulados') }
}
const textoWhatsApp = () => decodeURIComponent((screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href.split('text=')[1])

beforeEach(() => (updateDoc as jest.Mock).mockClear())

describe('Reporte — prefill de Acumulados', () => {
  it('Total trasegado acumulado = el del ciclo anterior + lo trasegado en este ciclo', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 }, viajesVacuum: 20 } })
    expect(f.total()).toHaveValue(2542.92 + CICLO_BLS) // 2663.42
    expect(f.total()).toHaveAttribute('data-prefill', 'true')
  })

  it('Total de viajes acumulados = el del ciclo anterior + los viajes de este ciclo', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 }, viajesVacuum: 20 } })
    expect(f.viajes()).toHaveValue(20 + CICLO_VIAJES) // 22
    expect(f.viajes()).toHaveAttribute('data-prefill', 'true')
    expect(screen.getByText(/acumulados calculados: lo acumulado en el reporte anterior más lo trasegado en este ciclo/i)).toBeInTheDocument()
  })

  it('primer reporte del pozo (sin base): NO inventa un acumulado, quedan vacíos para digitarlo una vez', async () => {
    const f = await abrir({})
    expect(f.total()).toHaveValue(null)
    expect(f.viajes()).toHaveValue(null)
    expect(f.total()).toHaveAttribute('data-prefill', 'false')
    expect(screen.queryByText(/acumulados calculados/i)).not.toBeInTheDocument()
  })

  it('la base que ESTE ciclo ya guardó manda sobre el ciclo anterior (así no se cuenta dos veces lo del ciclo)', async () => {
    const f = await abrir({
      actual: { acumuladosBase: { totalTrasegado: 2400, viajes: 18 } },
      previo: { resumenTanques: { totalTrasegado: 9999 }, viajesVacuum: 99 },
    })
    expect(f.total()).toHaveValue(2400 + CICLO_BLS) // 2520.5, no 9999 + …
    expect(f.viajes()).toHaveValue(18 + CICLO_VIAJES) // 20
  })

  it('solo una de las dos bases disponible: solo ese acumulado se calcula', async () => {
    const f = await abrir({ previo: { viajesVacuum: 20 } })
    expect(f.viajes()).toHaveValue(22)
    expect(f.total()).toHaveValue(null)
  })

  it('el operador puede editarlos; el valor editado manda y deja de ser prefill', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 }, viajesVacuum: 20 } })
    await f.user.clear(f.total())
    await f.user.type(f.total(), '3000')
    expect(f.total()).toHaveValue(3000)
    expect(f.total()).toHaveAttribute('data-prefill', 'false')
    expect(f.viajes()).toHaveAttribute('data-prefill', 'true') // el otro conserva el cálculo
  })

  it('si borra un acumulado a propósito, no se vuelve a calcular', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 } } })
    await f.user.clear(f.total())
    expect(f.total()).toHaveValue(null)
    expect(f.total()).toHaveAttribute('data-prefill', 'false')
  })

  it('con el acumulado calculado no salta la alerta de "acumulado menor que lo del ciclo"', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 } } })
    expect(f.total()).toHaveAttribute('data-nivel', 'OK')
  })

  it('el texto de WhatsApp lleva los acumulados y el total despachado (acumulado + existencia) sin teclear nada', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 }, viajesVacuum: 20 } })
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const t = textoWhatsApp()
    expect(t).toContain('• Total Trasegado Acumulado: 2,663.42 Bls')
    expect(t).toContain('• Total Viajes Vacuum Acumulados: 22')
    expect(t).toContain('• Total Despachado General: 2,780.42 Bls') // 2,663.42 + existencia 117
  })

  it('al guardar el avance se guarda el acumulado y la BASE de la que parte (acumulado − lo de este ciclo)', async () => {
    const f = await abrir({ previo: { resumenTanques: { totalTrasegado: 2542.92 }, viajesVacuum: 20 } })
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    const reporte = (updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo
    expect(reporte.resumenTanques.totalTrasegado).toBeCloseTo(2663.42, 6)
    expect(reporte.viajesVacuum).toBe(22)
    expect(reporte.acumuladosBase).toEqual({ totalTrasegado: 2542.92, viajes: 20 })
  })

  it('si el operador digita su propio acumulado, la base guardada es ese valor menos lo del ciclo', async () => {
    const f = await abrir({})
    await f.user.type(f.total(), '3000')
    await f.user.type(f.viajes(), '25')
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    const reporte = (updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo
    expect(reporte.acumuladosBase).toEqual({ totalTrasegado: 3000 - CICLO_BLS, viajes: 25 - CICLO_VIAJES })
    expect(reporte.resumenTanques.totalTrasegado).toBe(3000)
  })

  it('sin acumulados no se guarda ninguna base', async () => {
    const f = await abrir({})
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    expect((updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo).not.toHaveProperty('acumuladosBase')
  })

  it('reabrir el reporte con la base ya guardada da el mismo acumulado (sin contar dos veces el ciclo)', async () => {
    // lo que se guardó arriba: base 2542.92 / 20 viajes. Al reabrir, base + ciclo = el mismo valor
    const f = await abrir({ actual: { acumuladosBase: { totalTrasegado: 2542.92, viajes: 20 }, resumenTanques: { totalTrasegado: 2663.42 }, viajesVacuum: 22 } })
    expect(f.total()).toHaveValue(2663.42)
    expect(f.viajes()).toHaveValue(22)
  })
})
