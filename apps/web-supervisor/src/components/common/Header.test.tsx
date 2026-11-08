import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Header from './Header'

jest.mock('./BotonAvisos', () => ({ __esModule: true, default: () => null }))

describe('Header del panel', () => {
  it('muestra el logo (no el ícono ni el texto "WillyTank")', () => {
    const { container } = render(<MemoryRouter><Header nombre="Wily" rol="GERENTE" onLogout={() => {}} /></MemoryRouter>)
    const logo = screen.getByAltText('WillyTank') as HTMLImageElement
    expect(logo.getAttribute('src')).toBe('/logo.jpg')
    expect(container.querySelector('header svg')).toBeNull() // sin el ícono de gota
    expect(container.querySelector('header')!.textContent).not.toMatch(/WillyTank/)
  })

  it('conserva el nombre, el rol y "Salir"', () => {
    render(<MemoryRouter><Header nombre="Wily" rol="GERENTE" onLogout={() => {}} /></MemoryRouter>)
    expect(screen.getByText('Wily')).toBeInTheDocument()
    expect(screen.getByText('Gerente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salir' })).toBeInTheDocument()
  })
})
