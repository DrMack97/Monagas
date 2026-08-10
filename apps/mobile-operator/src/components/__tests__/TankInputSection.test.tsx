// src/components/__tests__/TankInputSection.test.tsx

import { render, screen } from '@testing-library/react'
import TankInputSection from '../TankInputSection'

const tank = { mi: 12.5, mf: 45, ft: 2.4, th: 5, reductor: 0, aysPct: 1.2 }

describe('TankInputSection', () => {
  it('muestra mi y ft de solo lectura con el candado', () => {
    render(<TankInputSection tank={tank} />)

    expect(screen.getByText('12.5')).toBeInTheDocument()
    expect(screen.getByText('2.4')).toBeInTheDocument()
    expect(screen.getByText(/configurado por el supervisor/i)).toBeInTheDocument()
  })

  it('oculta el aviso de solo lectura cuando readOnly=false', () => {
    render(<TankInputSection tank={tank} readOnly={false} />)

    expect(screen.queryByText(/configurado por el supervisor/i)).not.toBeInTheDocument()
  })
})
