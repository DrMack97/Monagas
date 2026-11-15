// "Volver" de la pantalla Reporte: si se llegó desde otra pantalla de la app (Registro o Tabla) vuelve
// a ella; si se abrió el enlace directo no hay historial de la app y navigate(-1) la cerraría: va al inicio.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import { ReporteRoute } from '../../App'

jest.mock('../ReportePage', () => ({
  __esModule: true,
  default: ({ onVolver }: { onVolver: () => void }) => <button onClick={onVolver}>Volver (stub)</button>,
}))
jest.mock('../../hooks/useAuthRole', () => ({ RequireOperador: ({ children }: any) => children }))
jest.mock('../LoginPage', () => ({ __esModule: true, default: () => null }))
jest.mock('../DashboardPage', () => ({ __esModule: true, default: () => <p>INICIO</p> }))
jest.mock('../RegistroPage', () => ({ __esModule: true, default: () => null }))
jest.mock('../TablaPage', () => ({ __esModule: true, default: () => null }))
jest.mock('../SettingsPage', () => ({ __esModule: true, default: () => null }))

function app(inicial: string) {
  return render(
    <MemoryRouter initialEntries={[inicial]}>
      <Routes>
        <Route path="/dashboard" element={<p>INICIO</p>} />
        <Route path="/registro/p1" element={<><p>REGISTRO</p><Link to="/reporte/p1/e1">ir</Link></>} />
        <Route path="/reporte/:pozoId/:evalId" element={<ReporteRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ReporteRoute — Volver', () => {
  it('llegando desde Registro, vuelve a Registro', async () => {
    const user = userEvent.setup()
    app('/registro/p1')
    await user.click(screen.getByText('ir'))
    await user.click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByText('REGISTRO')).toBeInTheDocument()
  })

  it('con el enlace directo (sin historial en la app) va al inicio, no sale de la app', async () => {
    const user = userEvent.setup()
    app('/reporte/p1/e1')
    await user.click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByText('INICIO')).toBeInTheDocument()
  })
})
