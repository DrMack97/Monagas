// src/pages/__tests__/ReportePrefillSupervisorArea.test.tsx
//
// Prefill del "Supervisor de Área" (tarjeta de arriba del Reporte): antes era un estado local que empezaba vacío cada
// vez y no se guardaba. Ahora se autocompleta con el del reporte anterior, es editable y se guarda con el avance.

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
const exportarMock = jest.fn().mockResolvedValue(undefined)
jest.mock('../../utils/exportExcel', () => ({
  exportarEvaluacionDiaria: (...a: unknown[]) => exportarMock(...a),
  exportarHistoricoEquipo: jest.fn().mockResolvedValue(undefined),
}))

const campo = () => screen.getByLabelText('Supervisor de Área') as HTMLInputElement

function abrir(anterior: Record<string, unknown> | null) {
  anteriorMock.mockReturnValue({ anterior })
  const user = userEvent.setup()
  render(<ReportePage pozoId="p1" evalId="e1" />)
  return user
}

beforeEach(() => { (updateDoc as jest.Mock).mockClear(); exportarMock.mockClear(); anteriorMock.mockReset() })

describe('Reporte — prefill del Supervisor de Área', () => {
  it('se autocompleta con el del reporte anterior, se marca como prefill y avisa', () => {
    abrir({ supervisorArea: 'María Gómez' })
    expect(campo()).toHaveValue('María Gómez')
    expect(campo()).toHaveAttribute('data-prefill', 'true')
    expect(screen.getByText('Nombre tomado del reporte anterior; edítalo si cambió.')).toBeInTheDocument()
  })

  it('sin reporte anterior queda vacío y sin aviso (primer registro)', () => {
    abrir(null)
    expect(campo()).toHaveValue('')
    expect(campo()).toHaveAttribute('data-prefill', 'false')
    expect(screen.queryByText(/tomado del reporte anterior/i)).not.toBeInTheDocument()
  })

  it('es editable: al cambiarlo deja de ser prefill y desaparece el aviso', async () => {
    const user = abrir({ supervisorArea: 'María Gómez' })
    await user.clear(campo())
    await user.type(campo(), 'José Pérez')
    expect(campo()).toHaveValue('José Pérez')
    expect(campo()).toHaveAttribute('data-prefill', 'false')
    expect(screen.queryByText(/tomado del reporte anterior/i)).not.toBeInTheDocument()
  })

  it('si el operador lo BORRA a propósito, no se vuelve a autocompletar', async () => {
    const user = abrir({ supervisorArea: 'María Gómez' })
    await user.clear(campo())
    expect(campo()).toHaveValue('')
    expect(campo()).toHaveAttribute('data-prefill', 'false')
  })

  it('al guardar el avance se guarda en el reporte (así se autocompleta en los siguientes)', async () => {
    const user = abrir({ supervisorArea: 'María Gómez' })
    await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await user.click(screen.getByRole('button', { name: /guardar avance/i }))
    expect((updateDoc as jest.Mock).mock.calls[0][1].reporteOperativo).toMatchObject({ supervisorArea: 'María Gómez' })
  })

  it('el Excel de Evaluación diaria recibe el nombre autocompletado sin que el operador escriba nada', async () => {
    const user = abrir({ supervisorArea: 'María Gómez' })
    await user.click(screen.getByRole('button', { name: /^calcular promedio$/i }))
    await user.click(screen.getByRole('button', { name: /Excel · Evaluación diaria/i }))
    expect(exportarMock.mock.calls[0][0].supervisorArea).toBe('María Gómez')
  })
})
