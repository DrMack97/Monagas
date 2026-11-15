// "Actividad Reciente" de Analytics: cada estado con su color (antes todos salían con el mismo borde gris).

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AnalyticsPage from '../AnalyticsPage'

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { email: 'g@x.com' }, rol: 'GERENTE', zona: 'TODOS', pozoAsignado: null, logout: jest.fn() }) }))
jest.mock('../../hooks/usePozosVisibles', () => ({ usePozosVisibles: () => ({ pozos: [{ id: 'p1', nombre: 'SBC-61L' }, { id: 'p2', nombre: 'MFB-1' }, { id: 'p3', nombre: 'MFB-2' }] }) }))
jest.mock('../../components/common/Header', () => ({ __esModule: true, default: () => null }))
jest.mock('../../components/common/Sidebar', () => ({ __esModule: true, default: () => null }))
jest.mock('../../hooks/useAnalyticsData', () => ({
  useAnalyticsData: () => ({
    loading: false, error: null,
    kpis: { totalEvaluaciones: 3, produccionTotal: 0, aprobacionesHoy: 0, tiempoPromedioAprobacionHoras: null },
    evaluaciones: [
      { id: 'e1', pozoId: 'p1', estado: 'EN_CURSO', creadoEn: new Date(2026, 10, 8) },
      { id: 'e2', pozoId: 'p2', estado: 'OFICIAL', creadoEn: new Date(2026, 10, 7) },
      { id: 'e3', pozoId: 'p3', estado: 'PENDIENTE_SUPERVISOR', creadoEn: new Date(2026, 10, 6) },
    ],
  }),
}))

describe('AnalyticsPage — Actividad Reciente', () => {
  it('"En Curso" sale en ámbar y los demás estados con su propio color', () => {
    render(<MemoryRouter><AnalyticsPage /></MemoryRouter>)
    expect(screen.getByText('En Curso').className).toMatch(/amber/)
    expect(screen.getByText('Oficial').className).toMatch(/emerald/)
    expect(screen.getByText('Pendiente Supervisor').className).toMatch(/orange/)
    for (const t of ['En Curso', 'Oficial', 'Pendiente Supervisor']) {
      expect(screen.getByText(t).className).not.toMatch(/border-slate-700 text-slate-300/)
    }
  })
})
