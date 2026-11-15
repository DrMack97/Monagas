// src/pages/__tests__/RegistroPrefillPresiones.test.tsx
//
// Prefill de la ventana Presiones Operativas: "todas las ventanas deben mantener la data de la carga anterior".
// P. Cabezal, P. Separador y (solo en zonas que lo usan) P. Casing salen de la última carga; el Reductor sigue
// siendo el del pozo, de solo lectura.

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '../RegistroPage'

const addDocMock = jest.fn().mockResolvedValue({ id: 'l' })
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(), collection: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined), increment: jest.fn(),
  addDoc: (...a: unknown[]) => addDocMock(...a),
}))
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useParams: () => ({ pozoId: 'p1' }), useNavigate: () => jest.fn() }))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'op1' } }) }))
jest.mock('../../hooks/useEvaluacionActual', () => ({ useEvaluacionActual: () => ({ evalId: 'ev2', loading: false, error: null }) }))
const lecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => lecturasMock() }))
const previaMock = jest.fn()
jest.mock('../../hooks/useLecturaPrevia', () => ({ useLecturaPrevia: (...a: unknown[]) => previaMock(...a) }))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))
let zonaPozo = 'MONAGAS'
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: { id: 'p1', nombre: 'SBC-61L', campo: 'Bare', zona: zonaPozo, reductorPulgadas: '1"', diamOrif: 3.25, meterRun: 3.826, tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }] },
    loading: false, error: null,
  }),
}))

const lectura = (hora: number, operativos?: Record<string, unknown>, gas?: unknown) => ({
  id: `l${hora}`, hora, timestamp: new Date(), tanques: [{ tanqueId: 't1', mi: 0, mf: 1, bph: 2.4, th: 1 }],
  ...(operativos ? { operativos } : {}), ...(gas ? { gas } : {}),
})

function renderPage({ lecturas = [] as unknown[], previas = [] as unknown[] } = {}) {
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  previaMock.mockReturnValue({ previas })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
  const seccion = screen.getByRole('heading', { name: /presiones operativas/i }).closest('section') as HTMLElement
  const campo = (etiqueta: string) => within(seccion).getByText(etiqueta).parentElement!.querySelector('input') as HTMLInputElement
  return { seccion, pCab: () => campo('P. Cabezal (psig)'), pSep: () => campo('P. Separador (psig)'), pCsg: () => campo('P. Casing (psig)') }
}

beforeEach(() => { addDocMock.mockClear(); previaMock.mockReset(); zonaPozo = 'MONAGAS' })

describe('Registro — prefill de Presiones Operativas', () => {
  it('P. Cabezal y P. Separador toman los valores de la última lectura del ciclo', () => {
    const v = renderPage({ lecturas: [lectura(1, { pCab: 500, pSep: 280 }), lectura(2, { pCab: 540, pSep: 300 })] })
    expect(v.pCab()).toHaveValue(540)
    expect(v.pSep()).toHaveValue(300)
    expect(v.pCab()).toHaveAttribute('data-prefill', 'true')
    expect(within(v.seccion).getByText('Valores de la carga anterior; edítalos si cambiaron.')).toBeInTheDocument()
  })

  it('se pueden editar: solo el campo tocado deja de ser prefill', async () => {
    const v = renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300 })] })
    const user = userEvent.setup()
    await user.clear(v.pCab())
    await user.type(v.pCab(), '560')
    expect(v.pCab()).toHaveValue(560)
    expect(v.pCab()).toHaveAttribute('data-prefill', 'false')
    expect(v.pSep()).toHaveValue(300)
    expect(v.pSep()).toHaveAttribute('data-prefill', 'true')
  })

  it('Norte de Monagas: no hay campo P. Casing aunque la lectura anterior lo traiga, y el Reductor sigue siendo el del pozo', () => {
    const v = renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300, pCsg: 12 })] })
    expect(within(v.seccion).queryByText('P. Casing (psig)')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Reductor (pulg)')).toHaveTextContent('1"')
    expect(screen.getByLabelText('Reductor (pulg)').tagName).not.toBe('INPUT')
  })

  it('Faja: P. Casing también se prefilla desde la carga anterior', () => {
    zonaPozo = 'FAJA'
    const v = renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300, pCsg: 12 })] })
    expect(v.pCsg()).toHaveValue(12)
    expect(v.pCsg()).toHaveAttribute('data-prefill', 'true')
  })

  it('Faja: si la carga anterior no traía Casing, ese campo queda en 0 sin marca de prefill', () => {
    zonaPozo = 'FAJA'
    const v = renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300 })] })
    expect(v.pCsg()).toHaveValue(0)
    expect(v.pCsg()).toHaveAttribute('data-prefill', 'false')
  })

  it('primera lectura de un ciclo nuevo: toma las presiones del ciclo anterior', () => {
    const v = renderPage({ lecturas: [], previas: [lectura(9, { pCab: 520, pSep: 290 })] })
    expect(v.pCab()).toHaveValue(520)
    expect(v.pSep()).toHaveValue(290)
  })

  it('un valor anterior de 0 también es una carga anterior válida (se marca como prefill)', () => {
    const v = renderPage({ lecturas: [lectura(1, { pCab: 0, pSep: 300 })] })
    expect(v.pCab()).toHaveValue(0)
    expect(v.pCab()).toHaveAttribute('data-prefill', 'true')
  })

  it('sin carga anterior quedan en 0 y sin aviso', () => {
    const v = renderPage({ lecturas: [], previas: [] })
    expect(v.pCab()).toHaveValue(0)
    expect(v.pCab()).toHaveAttribute('data-prefill', 'false')
    expect(within(v.seccion).queryByText(/carga anterior/i)).not.toBeInTheDocument()
  })

  it('es independiente del gas: una lectura sin datos de gas igual prefilla las presiones', () => {
    renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300 })] })
    cleanup()
    const v = renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300 })] })
    expect(v.pCab()).toHaveValue(540)
    const gas = screen.getByRole('heading', { name: /gas \(aga-3\)/i }).closest('section') as HTMLElement
    expect(within(gas).queryByText(/carga anterior/i)).not.toBeInTheDocument() // el gas no tiene carga anterior aquí
  })

  it('al guardar sin tocar nada se escriben las presiones prefilladas junto con el Reductor del pozo', async () => {
    renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300 })] })
    await userEvent.setup().click(screen.getByRole('button', { name: /guardar lectura/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    const { operativos } = addDocMock.mock.calls[0][1]
    expect(operativos).toMatchObject({ pCab: 540, pSep: 300, reductorPulgadas: '1"' })
    expect(operativos).not.toHaveProperty('pCsg') // Monagas: no se captura Casing
  })

  it('Faja: al guardar sin tocar nada se escribe también el Casing prefillado', async () => {
    zonaPozo = 'FAJA'
    renderPage({ lecturas: [lectura(1, { pCab: 540, pSep: 300, pCsg: 12 })] })
    await userEvent.setup().click(screen.getByRole('button', { name: /guardar lectura/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1].operativos).toMatchObject({ pCab: 540, pSep: 300, pCsg: 12 })
  })
})
