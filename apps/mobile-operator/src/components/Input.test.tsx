// TODO: Tests de Input component - Player 3 (Fullstack)
// Paso 1: Test Input con label
// Paso 2: Test Input con error
// Prompt de implementación rápida:
// "Crear tests para Input con label y error"
import { render, screen } from '@testing-library/react'
import Input from './Input'

describe('Input', () => {
  it('debe mostrar label', () => {
    render(<Input label="Email" />)
    
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('debe mostrar error', () => {
    render(<Input label="Email" error="Email requerido" />)
    
    expect(screen.getByText('Email requerido')).toBeInTheDocument()
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500')
  })
})
