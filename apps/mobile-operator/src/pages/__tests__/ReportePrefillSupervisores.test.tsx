// src/pages/__tests__/ReportePrefillSupervisores.test.tsx
//
// Prefill de los supervisores del reporte: "los nombres del supervisor de PDVSA (diurno y nocturno) y de Well
// Testing no deben ingresarse hora a hora. Tras el primer registro, deben autocompletarse en los reportes posteriores".

import { render, screen, within } from '@testing-library/react'
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

const COMPLETO = { supervisorPDVSA: 'Nelson Fajardo', supervisorPDVSANocturno: 'Carlos Rojas', cuadrillaDiurno: 'Luis Idrogo', cuadrillaNocturno: 'Pedro Vargas' }

async function abrir(anterior: Record<string, unknown> | null) {
  anteriorMock.mockReturnValue({ anterior })
  const user = userEvent.setup()
  render(<ReportePage pozoId="p1" evalId="e1" />)
  await user.click(screen.getByRole('button', { name: /datos del reporte/i }))
  // la cuadrícula con los dos campos (Diurno / Nocturno) viene justo después del subtítulo del grupo
  const grupo = (titulo: RegExp) => (screen.getByText(titulo).nextElementSibling as HTMLElement).querySelectorAll('input')
  return {
    user,
    pdvsaDiurno: () => grupo(/^Supv\. Producción PDVSA$/)[0] as HTMLInputElement,
    pdvsaNocturno: () => grupo(/^Supv\. Producción PDVSA$/)[1] as HTMLInputElement,
    wtDiurno: () => grupo(/^Supv\. Well Testing$/)[0] as HTMLInputElement,
    wtNocturno: () => grupo(/^Supv\. Well Testing$/)[1] as HTMLInputElement,
  }
}

beforeEach(() => { (updateDoc as jest.Mock).mockClear(); anteriorMock.mockReset() })

describe('Reporte — prefill de supervisores', () => {
  it('los cuatro nombres se autocompletan con los del reporte anterior y se marcan como prefill', async () => {
    const f = await abrir(COMPLETO)
    expect(f.pdvsaDiurno()).toHaveValue('Nelson Fajardo')
    expect(f.pdvsaNocturno()).toHaveValue('Carlos Rojas')
    expect(f.wtDiurno()).toHaveValue('Luis Idrogo')
    expect(f.wtNocturno()).toHaveValue('Pedro Vargas')
    for (const c of [f.pdvsaDiurno(), f.pdvsaNocturno(), f.wtDiurno(), f.wtNocturno()]) expect(c).toHaveAttribute('data-prefill', 'true')
    expect(screen.getByText('Nombres tomados del reporte anterior; edítalos si cambiaron.')).toBeInTheDocument()
  })

  it('sin reporte anterior los campos quedan vacíos y sin aviso (primer registro)', async () => {
    const f = await abrir(null)
    expect(f.pdvsaDiurno()).toHaveValue('')
    expect(f.wtNocturno()).toHaveValue('')
    expect(f.pdvsaDiurno()).toHaveAttribute('data-prefill', 'false')
    expect(screen.queryByText(/tomados del reporte anterior/i)).not.toBeInTheDocument()
  })

  it('solo se rellenan los que el reporte anterior tenía (p. ej. falta el nocturno de PDVSA)', async () => {
    const f = await abrir({ supervisorPDVSA: 'Nelson Fajardo', cuadrillaDiurno: 'Luis Idrogo' })
    expect(f.pdvsaDiurno()).toHaveValue('Nelson Fajardo')
    expect(f.pdvsaNocturno()).toHaveValue('')
    expect(f.pdvsaNocturno()).toHaveAttribute('data-prefill', 'false')
  })

  it('el operador puede cambiar un nombre; solo ese deja de ser prefill', async () => {
    const f = await abrir(COMPLETO)
    await f.user.clear(f.wtNocturno())
    await f.user.type(f.wtNocturno(), 'Ana Pérez')
    expect(f.wtNocturno()).toHaveValue('Ana Pérez')
    expect(f.wtNocturno()).toHaveAttribute('data-prefill', 'false')
    expect(f.wtDiurno()).toHaveValue('Luis Idrogo')
    expect(f.wtDiurno()).toHaveAttribute('data-prefill', 'true')
  })

  it('si el operador BORRA un nombre a propósito, no se vuelve a autocompletar', async () => {
    const f = await abrir(COMPLETO)
    await f.user.clear(f.pdvsaNocturno())
    expect(f.pdvsaNocturno()).toHaveValue('')
    expect(f.pdvsaNocturno()).toHaveAttribute('data-prefill', 'false')
  })

  it('el texto de WhatsApp lleva los nombres autocompletados sin que el operador escriba nada', async () => {
    const f = await abrir(COMPLETO)
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const href = (screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href
    const texto = decodeURIComponent(href.split('text=')[1])
    expect(texto).toContain('• Diurno: Nelson Fajardo')
    expect(texto).toContain('• Nocturno: Carlos Rojas')
    expect(texto).toContain('• Diurno: Luis Idrogo')
    expect(texto).toContain('• Nocturno: Pedro Vargas')
  })

  it('al guardar el avance, los nombres autocompletados se guardan en el reporte (así se autocompletan en los siguientes)', async () => {
    const f = await abrir(COMPLETO)
    await f.user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await f.user.click(screen.getByRole('button', { name: /guardar avance/i }))
    expect(updateDoc).toHaveBeenCalledTimes(1)
    expect((updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo).toMatchObject(COMPLETO)
  })

  it('con los nombres autocompletados la sección se puede dejar plegada: igual salen en el reporte', async () => {
    anteriorMock.mockReturnValue({ anterior: COMPLETO })
    const user = userEvent.setup()
    render(<ReportePage pozoId="p1" evalId="e1" />) // sin abrir "Datos del Reporte"
    await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    const texto = decodeURIComponent((screen.getByRole('link', { name: /whatsapp/i }) as HTMLAnchorElement).href.split('text=')[1])
    expect(texto).toContain('• Diurno: Nelson Fajardo')
    expect(within(document.body).queryByText('Nombres tomados del reporte anterior; edítalos si cambiaron.')).not.toBeInTheDocument()
  })
})
