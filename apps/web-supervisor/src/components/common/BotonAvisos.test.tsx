// src/components/common/BotonAvisos.test.tsx
//
// El servicio de push (services/push.ts) se simula entero: su lógica ya la
// cubre services/push.test.ts. Aquí se verifica el pegamento de la interfaz:
// qué muestra el botón según el estado y que cada clic llama a lo correcto.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BotonAvisos from './BotonAvisos'

jest.mock('../../services/push', () => ({
  estadoAvisos: jest.fn(),
  activarPush: jest.fn(),
  desactivarPush: jest.fn(),
}))
import * as svc from '../../services/push'
const mockSvc = svc as unknown as Record<string, jest.Mock>

beforeEach(() => {
  jest.clearAllMocks()
  mockSvc.estadoAvisos.mockReturnValue('inactivo')
  mockSvc.activarPush.mockResolvedValue('activadas')
  mockSvc.desactivarPush.mockResolvedValue(undefined)
})

describe('BotonAvisos', () => {
  it('en un navegador sin soporte no se muestra', () => {
    mockSvc.estadoAvisos.mockReturnValue('no-soportado')
    const { container } = render(<BotonAvisos />)
    expect(container).toBeEmptyDOMElement()
  })

  it('inactivo: ofrece "Activar avisos" y al hacer clic activa', async () => {
    render(<BotonAvisos />)
    mockSvc.estadoAvisos.mockReturnValue('activo') // lo que verá tras activar
    await userEvent.click(screen.getByRole('button', { name: /activar avisos/i }))
    expect(mockSvc.activarPush).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: /avisos activados/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('activo: al hacer clic desactiva', async () => {
    mockSvc.estadoAvisos.mockReturnValue('activo')
    render(<BotonAvisos />)
    mockSvc.estadoAvisos.mockReturnValue('inactivo')
    await userEvent.click(screen.getByRole('button', { name: /avisos activados/i }))
    expect(mockSvc.desactivarPush).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole('button', { name: /activar avisos/i })).toBeInTheDocument()
  })

  it('bloqueado por el navegador: no es un botón y explica cómo desbloquear', () => {
    mockSvc.estadoAvisos.mockReturnValue('denegado')
    render(<BotonAvisos />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByTitle(/candado/i)).toHaveTextContent(/avisos bloqueados/i)
  })

  it('si la activación falla, ofrece reintentar', async () => {
    mockSvc.activarPush.mockResolvedValue('error')
    render(<BotonAvisos />)
    await userEvent.click(screen.getByRole('button', { name: /activar avisos/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: /reintentar avisos/i })).toBeInTheDocument())
  })

  it('si el usuario rechaza el permiso en el diálogo, pasa a "bloqueados"', async () => {
    mockSvc.activarPush.mockResolvedValue('denegadas')
    render(<BotonAvisos />)
    mockSvc.estadoAvisos.mockReturnValue('denegado')
    await userEvent.click(screen.getByRole('button', { name: /activar avisos/i }))
    expect(await screen.findByText(/avisos bloqueados/i)).toBeInTheDocument()
  })
})
