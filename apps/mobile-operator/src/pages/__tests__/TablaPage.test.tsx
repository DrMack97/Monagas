// src/pages/__tests__/TablaPage.test.tsx
//
// Tabla de lecturas del Operador tras los ajustes del Informe Técnico Willytank (04/11/2026):
//  - la fecha no se repite en cada fila: va una vez por día en una fila separadora;
//  - la hora se muestra redondeada a la hora entera más cercana (8:52 → 09:00, 9:07 → 09:00);
//  - la columna Netos (Bls) solo existe en la Faja, no en Norte de Monagas.
// Las alertas SIGUEN en esta pantalla (es control operativo interno); solo se sacan de los exportables.

import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import TablaPage from '../TablaPage'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'op1' }, pozoAsignado: 'pozo1' }) }))
jest.mock('../../hooks/useEvaluacionActual', () => ({
  useEvaluacionActual: () => ({ evalId: 'ev1', loading: false, error: null }),
}))

const usePozoInfoMock = jest.fn()
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => usePozoInfoMock() }))
const useLecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => useLecturasMock() }))

function lectura(id: string, fecha: Date, extra: Record<string, unknown> = {}) {
  return {
    id,
    hora: 1,
    timestamp: fecha,
    tanques: [{ tanqueId: 't1', mi: 0, mf: 0, dif: 0, th: 1, reductor: 0, bph: 1, bpd: 24, aysBls: 0, netos: 12.5 }],
    operativos: { pCab: 0, pSep: 0 },
    ...extra,
  }
}

function renderPage(zona: string, lecturas: ReturnType<typeof lectura>[]) {
  usePozoInfoMock.mockReturnValue({ pozo: { id: 'pozo1', nombre: 'SBC-61', zona }, loading: false })
  useLecturasMock.mockReturnValue({ lecturas, loading: false })
  return render(
    <MemoryRouter>
      <TablaPage />
    </MemoryRouter>
  )
}

describe('TablaPage', () => {
  it('muestra la hora entera más cercana, no el minuto real', () => {
    renderPage('MONAGAS', [
      lectura('a', new Date(2026, 10, 4, 8, 52)),
      lectura('b', new Date(2026, 10, 4, 10, 7)),
    ])
    expect(screen.getByText('09:00')).toBeInTheDocument()
    expect(screen.getByText('10:00')).toBeInTheDocument()
    expect(screen.queryByText(/8:52|10:07/)).not.toBeInTheDocument()
  })

  it('no repite la fecha en cada fila: una fila "Fecha:" por día', () => {
    renderPage('MONAGAS', [
      lectura('a', new Date(2026, 10, 4, 22, 5)),
      lectura('b', new Date(2026, 10, 4, 23, 5)),
      lectura('c', new Date(2026, 10, 5, 0, 5)), // cruza la medianoche
      lectura('d', new Date(2026, 10, 5, 1, 5)),
    ])
    expect(screen.getAllByText(/^Fecha:/)).toHaveLength(2)
    expect(screen.getByText('Fecha: 04/11/2026')).toBeInTheDocument()
    expect(screen.getByText('Fecha: 05/11/2026')).toBeInTheDocument()
  })

  it('una lectura 23:52 cuenta como 00:00 del día siguiente (la fecha sigue a la hora redondeada)', () => {
    renderPage('MONAGAS', [lectura('a', new Date(2026, 10, 4, 23, 52))])
    expect(screen.getByText('Fecha: 05/11/2026')).toBeInTheDocument()
    expect(screen.getByText('00:00')).toBeInTheDocument()
  })

  it('Norte de Monagas: sin columna Netos (Bls)', () => {
    renderPage('MONAGAS', [lectura('a', new Date(2026, 10, 4, 9, 0))])
    expect(screen.queryByRole('columnheader', { name: /netos/i })).not.toBeInTheDocument()
    expect(screen.queryByText('12.50')).not.toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /qg \(mmscfd\)/i })).toBeInTheDocument()
  })

  it('Faja: conserva la columna Netos (Bls) con su valor', () => {
    renderPage('FAJA', [lectura('a', new Date(2026, 10, 4, 9, 0))])
    expect(screen.getByRole('columnheader', { name: /netos/i })).toBeInTheDocument()
    expect(screen.getByText('12.50')).toBeInTheDocument()
  })

  it('las alertas siguen visibles para el Operador (control interno)', () => {
    renderPage('MONAGAS', [lectura('a', new Date(2026, 10, 4, 9, 0), { alertas: ['Presión estática excede el resorte'] })])
    const fila = screen.getByText('09:00').closest('tr') as HTMLElement
    expect(within(fila).getByText(/excede el resorte/i)).toBeInTheDocument()
  })
})
