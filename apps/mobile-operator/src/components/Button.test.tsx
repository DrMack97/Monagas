// TODO: Tests de Button component - Player 3 (Fullstack)
// Paso 1: Test Button primary
// Paso 2: Test Button loading
// Paso 3: Test Button disabled
// Prompt de implementación rápida:
// "Crear tests para Button con variants y states"
import { render, screen } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  it('debe renderizar Button primary', () => {
    render(<Button>Click</Button>)
    
    const button = screen.getByRole('button', { name: /click/i })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-blue-600')
  })

  it('debe mostrar loading spinner', () => {
    render(<Button loading>Click</Button>)
    
    const spinner = screen.getByRole('button').querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('debe estar disabled cuando loading', () => {
    render(<Button loading>Click</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })
})
