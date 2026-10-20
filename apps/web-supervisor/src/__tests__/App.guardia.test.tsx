// src/__tests__/App.guardia.test.tsx
//
// Guardián de rutas (RutaProtegida) de App.tsx: una cuenta que inició sesión pero NO tiene rol
// (p. ej. creada a mano desde la consola de Firebase) ya no entra a un panel vacío: vuelve a
// /login, donde se le explica. Las páginas pesadas se sustituyen por marcadores: aquí solo se
// prueba la decisión de enrutado.

import { render, screen } from '@testing-library/react'
import App from '../App'

const useAuthMock = jest.fn()
jest.mock('../hooks/useAuth', () => ({ useAuth: () => useAuthMock() }))

jest.mock('../components/AvisosGlobales', () => () => null)
jest.mock('../pages/DashboardPage', () => () => <div>PANEL-DASHBOARD</div>)
jest.mock('../pages/NewWellPage', () => () => <div>PANEL-NUEVO-POZO</div>)
jest.mock('../pages/WellDetailPage', () => () => <div>PANEL-DETALLE</div>)
jest.mock('../pages/UsersPage', () => () => <div>PANEL-USUARIOS</div>)
jest.mock('../pages/ApprovalQueuePage', () => () => <div>PANEL-APROBACIONES</div>)
jest.mock('../pages/AnalyticsPage', () => () => <div>PANEL-ANALYTICS</div>)

const estado = (parcial: Record<string, unknown>) => ({
  user: null, rol: null, zona: null, loading: false, error: null, login: jest.fn(), logout: jest.fn(), ...parcial,
})
const irA = (ruta: string) => {
  window.history.pushState({}, '', ruta)
  return render(<App />)
}

describe('RutaProtegida', () => {
  it('sin sesión: va al login', () => {
    useAuthMock.mockReturnValue(estado({}))
    irA('/dashboard')
    expect(screen.queryByText('PANEL-DASHBOARD')).not.toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('con sesión pero SIN rol: NO entra al panel; ve el aviso en el login', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: null }))
    irA('/dashboard')
    expect(screen.queryByText('PANEL-DASHBOARD')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(/no tiene un rol asignado/i)
  })

  it('OPERADOR: tampoco entra (su app es la móvil)', () => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol: 'OPERADOR' }))
    irA('/dashboard')
    expect(screen.queryByText('PANEL-DASHBOARD')).not.toBeInTheDocument()
  })

  it.each(['SUP_CAMPO', 'SUP_AREA', 'GERENTE'])('%s: entra al dashboard', (rol) => {
    useAuthMock.mockReturnValue(estado({ user: { uid: 'u1' }, rol, zona: 'MONAGAS' }))
    irA('/dashboard')
    expect(screen.getByText('PANEL-DASHBOARD')).toBeInTheDocument()
  })
})
