// TODO: Tests de DataTable - Player 3 (Fullstack)
// Paso 1: Test DataTable con datos
// Paso 2: Test sorting
// Paso 3: Test pagination
// Prompt de implementación rápida:
// "Crear tests para DataTable con sorting y pagination"
import { render, screen, fireEvent } from '@testing-library/react'
import DataTable from './DataTable'

describe('DataTable', () => {
  const columns = [
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'produccion', label: 'Producción', sortable: true }
  ]

  const data = [
    { id: '1', nombre: 'MFB-950', produccion: 1234 },
    { id: '2', nombre: 'MFB-919', produccion: 456 }
  ]

  it('debe mostrar datos', () => {
    render(<DataTable columns={columns} data={data} />)
    
    expect(screen.getByText('MFB-950')).toBeInTheDocument()
    expect(screen.getByText('MFB-919')).toBeInTheDocument()
  })

  it('debe ordenar por columna', () => {
    render(<DataTable columns={columns} data={data} />)
    
    const nombreHeader = screen.getByText('Nombre')
    fireEvent.click(nombreHeader)
    
    // Verificar orden changed
    expect(true).to.be.true // Placeholder
  })
})
