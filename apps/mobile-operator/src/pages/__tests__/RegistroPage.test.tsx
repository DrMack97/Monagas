// src/pages/__tests__/RegistroPage.test.tsx
//
// Formulario de captura del Operador tras el cambio de la ronda 1.0.4:
//  - Diluyente y Reductor (Bls) ya no se piden (el pozo de Monagas no los usa y el Reductor
//    dejó de ser una corrección de barriles).
//  - Reductor (pulg) es la medida de tubería que fija el supervisor en el pozo: el Operador la
//    ve de solo lectura ("-" si el pozo aún no la tiene) y se copia a la lectura que guarda.
//  - calcTanque no se toca: reductor y dilDia le llegan en 0, así los barriles no cambian.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '../RegistroPage'

const addDocMock = jest.fn().mockResolvedValue({ id: 'lectura-1' })
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args: any[]) => args),
  collection: jest.fn((...args: any[]) => args),
  addDoc: (...args: any[]) => addDocMock(...args),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  increment: jest.fn((n: number) => n),
}))

// Los fuentes del núcleo se importan con ".js" y Jest no los resuelve: se sustituyen los cálculos por un
// doble que registra la entrada (así se comprueba qué le llega a calcTanque).
const calcTanqueMock = jest.fn((input: Record<string, number>) => ({
  dif: input.mf - input.mi, bph: 1, bpd: 24, aysBls: 0, netos: 24, dilDia: input.dilDia,
}))
jest.mock('@monagas/core/calculos', () => ({
  calcTanque: (input: Record<string, number>) => calcTanqueMock(input),
  calcAGA3: () => ({ qg: 0 }),
}))

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ pozoId: 'pozo1' }),
  useNavigate: () => jest.fn(),
}))

jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'op1' } }) }))
jest.mock('../../hooks/useEvaluacionActual', () => ({
  useEvaluacionActual: () => ({ evalId: 'ev1', loading: false, error: null }),
}))
jest.mock('../../hooks/useLecturasEvaluacion', () => ({
  useLecturasEvaluacion: () => ({ lecturas: [], loading: false }),
}))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))

const usePozoInfoMock = jest.fn()
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => usePozoInfoMock() }))

const POZO = {
  id: 'pozo1',
  nombre: 'MFB-1',
  campo: 'Bare',
  zona: 'MONAGAS',
  tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 10, ft: 2.4 }],
}

function renderPage(pozo: Record<string, unknown>) {
  usePozoInfoMock.mockReturnValue({ pozo: { ...POZO, ...pozo }, loading: false, error: null })
  return render(
    <MemoryRouter>
      <RegistroPage />
    </MemoryRouter>
  )
}

describe('RegistroPage — Reductor (pulg) y campos retirados', () => {
  beforeEach(() => {
    addDocMock.mockClear()
    calcTanqueMock.mockClear()
  })

  it('ya no pide Diluyente ni Reductor (Bls)', () => {
    renderPage({ reductorPulgadas: '1/2"' })
    expect(screen.queryByText(/diluyente/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/reductor \(bls\)/i)).not.toBeInTheDocument()
  })

  it('muestra el Reductor (pulg) del pozo de solo lectura (no es un campo editable)', () => {
    renderPage({ reductorPulgadas: '1/2"' })
    const campo = screen.getByLabelText('Reductor (pulg)')
    expect(campo).toHaveTextContent('1/2"')
    expect(campo.tagName).not.toBe('INPUT')
  })

  it('muestra "-" si el pozo todavía no tiene Reductor', () => {
    renderPage({})
    expect(screen.getByLabelText('Reductor (pulg)')).toHaveTextContent('-')
  })

  it('al guardar copia el Reductor del pozo a la lectura y deja reductor/dilDia en 0 (sin efecto en barriles)', async () => {
    renderPage({ reductorPulgadas: '1/2"' })
    await userEvent.setup().click(screen.getByRole('button', { name: /guardar lectura/i }))

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    const lectura = addDocMock.mock.calls[0][1]
    expect(lectura.operativos.reductorPulgadas).toBe('1/2"')
    expect(lectura.tanques[0].reductor).toBe(0)
    expect(calcTanqueMock).toHaveBeenCalledWith(expect.objectContaining({ reductor: 0, dilDia: 0 }))
  })

  it('no escribe reductorPulgadas en la lectura si el pozo no lo tiene', async () => {
    renderPage({})
    await userEvent.setup().click(screen.getByRole('button', { name: /guardar lectura/i }))

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1].operativos).not.toHaveProperty('reductorPulgadas')
  })
})
