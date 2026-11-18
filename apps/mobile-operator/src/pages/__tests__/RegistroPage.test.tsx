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
import { guardarLectura } from '../../testing/guardarLectura'

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
const calcAGAMock = jest.fn((_input: Record<string, number>) => ({
  beta: 0.5, Fc: 1.03, Fb: 800, Fg: 1.2, Ftf: 0.99, Fpv: 1.03, Y: 0.995, Cd: 0.6, Z: 0.94, qg: 1.234,
}))
jest.mock('@monagas/core/calculos', () => ({
  calcTanque: (input: Record<string, number>) => calcTanqueMock(input),
  calcAGA3: (input: Record<string, number>) => calcAGAMock(input),
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
  diamOrif: 3.25,
  meterRun: 3.826,
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
    calcAGAMock.mockClear()
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
    await guardarLectura()

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    const lectura = addDocMock.mock.calls[0][1]
    expect(lectura.operativos.reductorPulgadas).toBe('1/2"')
    expect(lectura.tanques[0].reductor).toBe(0)
    expect(calcTanqueMock).toHaveBeenCalledWith(expect.objectContaining({ reductor: 0, dilDia: 0 }))
  })

  it('muestra el caudal de gas en MMSCFD (no MPCGD) y guarda los factores del motor completo', async () => {
    renderPage({})
    expect(screen.getByText(/1\.23 MMSCFD/)).toBeInTheDocument()
    expect(screen.queryByText(/MPCGD/)).not.toBeInTheDocument()

    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1].gas).toMatchObject({ qg: 1.234, Fpv: 1.03, Y: 0.995, Cd: 0.6, Z: 0.94 })
  })

  it('usa la Placa y el Meter Run del pozo (solo lectura) para el cálculo de Qg', () => {
    renderPage({ diamOrif: 2.5, meterRun: 4.026 })
    expect(screen.getByText('2.5"')).toBeInTheDocument()
    expect(screen.getByText('4.026"')).toBeInTheDocument()
    expect(calcAGAMock).toHaveBeenCalledWith(expect.objectContaining({ diam: 2.5, meterRun: 4.026 }))
  })

  it('sin Placa/Meter Run en el pozo NO inventa 2"/4": avisa y no guarda gas', async () => {
    renderPage({ diamOrif: undefined, meterRun: undefined })
    expect(screen.getByRole('alert')).toHaveTextContent(/no tiene placa y meter run/i)
    expect(screen.queryByText(/MMSCFD/)).not.toBeInTheDocument()
    expect(calcAGAMock).not.toHaveBeenCalled()

    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('gas')
  })

  it('Norte de Monagas: sin P. Casing ni Netos en pantalla, y no guarda pCsg', async () => {
    renderPage({ zona: 'MONAGAS' })
    expect(screen.queryByText(/p\. casing/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/netos/i)).not.toBeInTheDocument()
    expect(screen.getByText(/bpd/i)).toBeInTheDocument() // lo demás sigue

    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1].operativos).not.toHaveProperty('pCsg')
    // el cálculo de barriles no cambia: los netos se siguen calculando y guardando
    expect(addDocMock.mock.calls[0][1].tanques[0].netos).toBe(24)
  })

  it('Faja: conserva P. Casing y Netos y guarda pCsg', async () => {
    renderPage({ zona: 'FAJA' })
    expect(screen.getByText(/p\. casing/i)).toBeInTheDocument()
    expect(screen.getByText(/netos/i)).toBeInTheDocument()

    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1].operativos).toHaveProperty('pCsg', 0)
  })

  it('no escribe reductorPulgadas en la lectura si el pozo no lo tiene', async () => {
    renderPage({})
    await guardarLectura()

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    expect(addDocMock.mock.calls[0][1].operativos).not.toHaveProperty('reductorPulgadas')
  })
})
