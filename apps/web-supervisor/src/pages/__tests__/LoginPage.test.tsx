// src/pages/__tests__/LoginPage.test.tsx
//
// LoginPage del panel de supervisión: marca (logo recuperado del mockup) y los estados que decide
// el rol. Caso que motivó los tests: una cuenta SIN rol (creada a mano desde la consola de
// Firebase, sin pasar por assignRole) entraba a un panel vacío sin explicación.

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../LoginPage'

const useAuthMock = jest.fn()
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

const logoutMock = jest.fn()
const estado = (parcial: Record<string, unknown>) => ({
  user: null, rol: null, loading: false, error: null, login: jest.fn(), logout: logoutMock, ...parcial,
})
const montar = () => render(<MemoryRouter><LoginPage /></MemoryRouter>)

beforeEach(() => {
  jest.clearAllMocks()
})

describe('LoginPage del panel de supervisión', () => {
  it('muestra la marca: logo recuperado, nombre WillyTank y el formulario', () => {
    useAuthMock.mockReturnValue(estado({}))
    montar()
    expect(screen.getByRole('img', { name: 'WillyTank' })).toHaveAttribute('src', '/logo.jpg')
    expect(screen.getByRole('heading', { name: 'WillyTank' })).toBeInTheDocument()
    expect(screen.getByText(/panel de supervisión/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('cuenta que inició sesión pero SIN rol: explica qué pasa y permite cerrar sesión', async () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: null }))
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent(/no tiene un rol asignado/i)
    expect(screen.queryByLabelText(/correo electrónico/i)).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(logoutMock).toHaveBeenCalled()
  })

  it('mientras carga NO muestra el aviso de "sin rol"', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: null, loading: true }))
    montar()
    expect(screen.queryByText(/no tiene un rol asignado/i)).not.toBeInTheDocument()
  })

  it('OPERADOR: se le indica que use la app móvil', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: 'OPERADOR' }))
    montar()
    expect(screen.getByText(/usa la app móvil/i)).toBeInTheDocument()
  })

  it('muestra el error de Firebase cuando el login falla', () => {
    useAuthMock.mockReturnValue(estado({ error: 'Correo o contraseña incorrectos.' }))
    montar()
    expect(screen.getByRole('alert')).toHaveTextContent(/correo o contraseña incorrectos/i)
  })
})
