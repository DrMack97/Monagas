// src/pages/__tests__/LoginPage.test.tsx
//
// LoginPage del Operador: marca (logo recuperado del mockup) y los tres estados que decide el
// rol. El caso que motivó estos tests: una cuenta que inicia sesión pero NO tiene rol (creada a
// mano desde la consola de Firebase, sin pasar por assignRole) rebotaba al login SIN mensaje y
// parecía que "las credenciales no funcionan".

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'

const useAuthMock = jest.fn()
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

const navigateMock = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => navigateMock,
}))

// URL del panel que ve esta prueba; el mock real (jest.config.cjs) la deja vacía.
let mockUrlPanel = ''
jest.mock('../../config/enlaces', () => ({
  get URL_PANEL() {
    return mockUrlPanel
  },
}))

const logoutMock = jest.fn()
const estado = (parcial: Record<string, unknown>) => ({
  user: null, rol: null, loading: false, error: null, login: jest.fn(), logout: logoutMock, ...parcial,
})
const montar = () => render(<MemoryRouter><LoginPage /></MemoryRouter>)

beforeEach(() => {
  jest.clearAllMocks()
  mockUrlPanel = ''
})

describe('LoginPage del Operador', () => {
  it('muestra la marca: logo recuperado, nombre WillyTank y el formulario', () => {
    useAuthMock.mockReturnValue(estado({}))
    montar()
    expect(screen.getByRole('img', { name: 'WillyTank' })).toHaveAttribute('src', '/logo.jpg')
    expect(screen.getByRole('heading', { name: 'WillyTank' })).toBeInTheDocument()
    expect(screen.getByText(/app del operador/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('cuenta que inició sesión pero SIN rol: explica qué pasa en vez de rebotar en silencio', async () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: null }))
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent(/no tiene un rol asignado/i)
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(logoutMock).toHaveBeenCalled()
  })

  it('mientras carga NO muestra el aviso de "sin rol" (la sesión aún se está resolviendo)', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: null, loading: true }))
    montar()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('rol que no es OPERADOR (p. ej. GERENTE): mensaje de que el panel es otro', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: 'GERENTE' }))
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent(/exclusiva del operador/i)
  })

  it('con URL del panel configurada: muestra el acceso al Panel de Supervisión (como el mockup)', () => {
    mockUrlPanel = 'https://panel.ejemplo.test/'
    useAuthMock.mockReturnValue(estado({}))
    montar()
    expect(screen.getByRole('link', { name: /panel de supervisión/i })).toHaveAttribute('href', 'https://panel.ejemplo.test/')
  })

  it('sin URL del panel (ambiente que no la define): no muestra enlace', () => {
    useAuthMock.mockReturnValue(estado({}))
    montar()
    expect(screen.queryByRole('link', { name: /panel de supervisión/i })).not.toBeInTheDocument()
  })

  it('OPERADOR autenticado: pasa directo al dashboard', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: 'OPERADOR' }))
    montar()
    expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true })
  })
})
