// Pantalla Personal: fondo a todo el ancho (en la web se veían lados blancos) y botón "Volver"
// (era un callejón sin salida: no tiene barra lateral como las demás pantallas).

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import UsersPage from '../UsersPage'

jest.mock('firebase/functions', () => ({ httpsCallable: jest.fn() }))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ rol: 'GERENTE', zona: 'TODOS' }) }))
jest.mock('../../hooks/usePersonal', () => ({ usePersonal: () => ({ personal: [], loading: false, error: null }) }))
jest.mock('../../hooks/usePozosVisibles', () => ({ usePozosVisibles: () => ({ pozos: [], loading: false }) }))

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/usuarios']}>
      <Routes>
        <Route path="/usuarios" element={<UsersPage />} />
        <Route path="/dashboard" element={<p>INICIO</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('UsersPage', () => {
  it('tiene botón "Volver" que lleva al inicio', async () => {
    renderPage()
    await userEvent.setup().click(screen.getByRole('button', { name: /volver/i }))
    expect(screen.getByText('INICIO')).toBeInTheDocument()
  })

  it('el elemento con el fondo oscuro no tiene ancho máximo (cubre toda la pantalla)', () => {
    const { container } = renderPage()
    const raiz = container.firstElementChild as HTMLElement
    expect(raiz.className).toMatch(/bg-slate-950/)
    expect(raiz.className).not.toMatch(/max-w-/)
  })
})
