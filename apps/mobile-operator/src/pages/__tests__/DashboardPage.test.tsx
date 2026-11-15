// Encabezado del Operador: logo en lugar del título "WillyTank", con el correo debajo.

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DashboardPage from '../DashboardPage'

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { email: 'willymotorsca+operador@gmail.com' }, pozoAsignado: null, logout: jest.fn() }) }))
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => ({ pozo: null, loading: false, error: null }) }))
jest.mock('../../hooks/useNotifications', () => ({ useNotifications: () => ({ sincronizar: () => Promise.resolve() }) }))

describe('Dashboard del Operador — encabezado', () => {
  it('muestra el logo y el correo debajo; ya no el texto "WillyTank" como título', () => {
    render(<MemoryRouter><DashboardPage /></MemoryRouter>)
    const logo = screen.getByAltText('WillyTank') as HTMLImageElement
    expect(logo.getAttribute('src')).toBe('/logo.jpg')
    expect(screen.queryByRole('heading', { name: 'WillyTank' })).not.toBeInTheDocument()

    const correo = screen.getByText('willymotorsca+operador@gmail.com')
    // el correo va después del logo en el mismo bloque (debajo)
    expect(logo.compareDocumentPosition(correo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(logo.parentElement).toBe(correo.parentElement)
  })
})
