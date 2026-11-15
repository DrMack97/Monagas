// src/pages/__tests__/ReportePrefillTesting.test.tsx
//
// Prefill de los datos del testing: "Fecha de inicio, Fecha de culminación, Estatus actual, Asunto, Plan y API deben
// precargarse automáticamente" desde el reporte anterior.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReportePage from '../ReportePage'
import { updateDoc } from 'firebase/firestore'

jest.mock('firebase/firestore', () => ({ doc: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined), serverTimestamp: jest.fn() }))
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({ pozo: { id: 'p1', nombre: 'SBC-61 L', empresa: 'DSI', equipo: 'WT 1440', horasEval: 5, zona: 'MONAGAS', tanques: [{ id: 't1', nombre: 'T1', mi: 0, ft: 2.4 }] }, loading: false, error: null }),
}))
jest.mock('../../hooks/useLecturasEvaluacion', () => ({
  useLecturasEvaluacion: () => ({ loading: false, lecturas: [{
    id: 'l1', hora: 1, timestamp: new Date(2026, 10, 4, 8, 0),
    tanques: [{ tanqueId: 't1', mi: 0, mf: 1, dif: 1, th: 1, reductor: 0, bph: 2.4, bpd: 57.6, aysBls: 0, netos: 57.6 }],
    operativos: { pCab: 540, pSep: 300 },
  }] }),
}))
const anteriorMock = jest.fn()
jest.mock('../../hooks/useReporteAnterior', () => ({ useReporteAnterior: (...a: unknown[]) => anteriorMock(...a) }))

// Las fechas llegan de Firestore como Timestamp (objeto con toDate), no como Date.
const ts = (d: Date) => ({ toDate: () => d })
const ANTERIOR = {
  fechaAlineacion: ts(new Date(2026, 9, 9, 9, 0)),
  fechaCulminacion: ts(new Date(2026, 10, 6, 18, 30)),
  estadoActual: 'Pozo fluyendo a través del SWT en superficie y quema de gas en sitio.',
  asunto: 'Inicia prueba de producción a las 09:00 am por orden del representante del cliente.',
  plan: 'Evaluar comportamiento operacional de pozo con unidad WT.',
  tipoFluido: { api: 38.6 },
}

async function abrir(anterior: Record<string, unknown> | null) {
  anteriorMock.mockReturnValue({ anterior })
  const user = userEvent.setup()
  render(<ReportePage pozoId="p1" evalId="e1" />)
  await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
  const c = (etiqueta: string) => screen.getByLabelText(etiqueta) as HTMLInputElement
  return { user, inicio: () => c('Fecha Inicio Well Testing'), fin: () => c('Fecha Culminación'), estatus: () => c('Estatus actual'), asunto: () => c('Asunto'), plan: () => c('Plan'), api: () => c('API (°)') }
}
const textoWhatsApp = () => decodeURIComponent((screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href.split('text=')[1])

beforeEach(() => { (updateDoc as jest.Mock).mockClear(); anteriorMock.mockReset() })

describe('Reporte — prefill de los datos del testing', () => {
  it('los seis campos se precargan desde el reporte anterior y se marcan como prefill', async () => {
    const f = await abrir(ANTERIOR)
    expect(f.inicio()).toHaveValue('2026-10-09T09:00') // Timestamp de Firestore convertido al campo de fecha
    expect(f.fin()).toHaveValue('2026-11-06T18:30')
    expect(f.estatus()).toHaveValue(ANTERIOR.estadoActual)
    expect(f.asunto()).toHaveValue(ANTERIOR.asunto)
    expect(f.plan()).toHaveValue(ANTERIOR.plan)
    expect(f.api()).toHaveValue(38.6)
    for (const c of [f.inicio(), f.fin(), f.estatus(), f.asunto(), f.plan(), f.api()]) expect(c).toHaveAttribute('data-prefill', 'true')
    expect(screen.getByText('Datos del testing tomados del reporte anterior; edítalos si cambiaron.')).toBeInTheDocument()
  })

  it('sin reporte anterior (primer registro) todo queda vacío y sin aviso', async () => {
    const f = await abrir(null)
    for (const c of [f.inicio(), f.fin(), f.estatus(), f.asunto(), f.plan(), f.api()]) {
      expect(c).toHaveValue(c.type === 'number' ? null : '')
      expect(c).toHaveAttribute('data-prefill', 'false')
    }
    expect(screen.queryByText(/datos del testing tomados/i)).not.toBeInTheDocument()
  })

  it('solo se precargan los que existían (p. ej. un testing que aún no tiene fecha de culminación ni API)', async () => {
    const f = await abrir({ fechaAlineacion: ANTERIOR.fechaAlineacion, asunto: ANTERIOR.asunto })
    expect(f.inicio()).toHaveValue('2026-10-09T09:00')
    expect(f.fin()).toHaveValue('')
    expect(f.fin()).toHaveAttribute('data-prefill', 'false')
    expect(f.api()).toHaveValue(null)
  })

  it('editar un campo lo marca como del operador; los demás conservan el prefill', async () => {
    const f = await abrir(ANTERIOR)
    await f.user.clear(f.asunto())
    await f.user.type(f.asunto(), 'Cambio de reductor')
    expect(f.asunto()).toHaveValue('Cambio de reductor')
    expect(f.asunto()).toHaveAttribute('data-prefill', 'false')
    expect(f.plan()).toHaveAttribute('data-prefill', 'true')
  })

  it('la fecha de culminación precargada se puede borrar y entonces el reporte vuelve a decir "En progreso"', async () => {
    const f = await abrir(ANTERIOR)
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    expect(textoWhatsApp()).toContain('*Fecha Culminación:* 06/11/2026')

    await f.user.clear(f.fin())
    expect(f.fin()).toHaveValue('')
    expect(f.fin()).toHaveAttribute('data-prefill', 'false') // no se vuelve a rellenar
    expect(textoWhatsApp()).toContain('*Fecha Culminación:* En progreso')
  })

  it('el texto de WhatsApp lleva los datos precargados sin que el operador escriba nada', async () => {
    const f = await abrir(ANTERIOR)
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const t = textoWhatsApp()
    expect(t).toContain('*Fecha Inicio Well Testing:* 09/10/2026')
    expect(t).toContain(`*ESTATUS ACTUAL:* ${ANTERIOR.estadoActual}`)
    expect(t).toContain(`*ASUNTO:* ${ANTERIOR.asunto}`)
    expect(t).toContain(`*PLAN:* ${ANTERIOR.plan}`)
    expect(t).toContain('• Calidad: 38.6 °API')
  })

  it('al guardar el avance se guardan con su tipo correcto (fechas como fecha, API como número)', async () => {
    const f = await abrir(ANTERIOR)
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    const reporte = (updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo
    expect(reporte.fechaAlineacion).toEqual(new Date(2026, 9, 9, 9, 0))
    expect(reporte.fechaCulminacion).toEqual(new Date(2026, 10, 6, 18, 30))
    expect(reporte.tipoFluido).toEqual({ api: 38.6 })
    expect(reporte).toMatchObject({ estadoActual: ANTERIOR.estadoActual, asunto: ANTERIOR.asunto, plan: ANTERIOR.plan })
  })

  it('con la sección plegada igual salen en el reporte', async () => {
    anteriorMock.mockReturnValue({ anterior: ANTERIOR })
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />)
    await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    expect(textoWhatsApp()).toContain(`*PLAN:* ${ANTERIOR.plan}`)
  })
})
