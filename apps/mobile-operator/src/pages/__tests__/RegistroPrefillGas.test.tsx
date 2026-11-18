// src/pages/__tests__/RegistroPrefillGas.test.tsx
//
// Prefill de la ventana AGA-3 (gas): "todas las ventanas deben mantener la data de la carga anterior".
// Presión estática, diferencial, temperatura y gravedad específica salen de la última carga (la última lectura del
// ciclo o, en la primera lectura de un ciclo nuevo, la del ciclo anterior); el operador puede editarlos.

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '../RegistroPage'
import { guardarLectura } from '../../testing/guardarLectura'

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
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: { id: 'p1', nombre: 'SBC-61L', campo: 'Bare', zona: 'MONAGAS', diamOrif: 3.25, meterRun: 3.826, tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 2.4 }] },
    loading: false, error: null,
  }),
}))

const GAS_300 = { pf: 300, hw: 43.56, tGas: 130, gg: 0.72, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 9.64 }
const lectura = (hora: number, gas?: unknown) => ({
  id: `l${hora}`, hora, timestamp: new Date(), operativos: {}, tanques: [{ tanqueId: 't1', mi: 0, mf: 1, bph: 2.4, th: 1 }], ...(gas ? { gas } : {}),
})

function renderPage({ lecturas = [] as unknown[], previas = [] as unknown[], cargando = false } = {}) {
  lecturasMock.mockReturnValue({ lecturas, loading: cargando })
  previaMock.mockReturnValue({ previas })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
  const seccion = screen.getByRole('heading', { name: /gas \(aga-3\)/i }).closest('section') as HTMLElement
  const campo = (etiqueta: string) => within(seccion).getByText(etiqueta).parentElement!.querySelector('input') as HTMLInputElement
  return {
    seccion,
    pf: () => campo('Presión Estática (psig)'),
    hw: () => campo('Diferencial (inH₂O)'),
    t: () => campo('Temp. gas (°F)'),
    gg: () => campo('Gravedad específica'),
  }
}

beforeEach(() => { addDocMock.mockClear(); previaMock.mockReset() })

describe('Registro — prefill de la ventana AGA-3', () => {
  it('muestra los datos de la última lectura del ciclo en los cuatro campos', () => {
    const v = renderPage({ lecturas: [lectura(1, { ...GAS_300, pf: 250 }), lectura(2, GAS_300)] })
    expect(v.pf()).toHaveValue(300)
    expect(v.hw()).toHaveValue(43.56)
    expect(v.t()).toHaveValue(130)
    expect(v.gg()).toHaveValue(0.72)
  })

  it('marca los campos como prefill y avisa que vienen de la carga anterior', () => {
    const v = renderPage({ lecturas: [lectura(1, GAS_300)] })
    for (const c of [v.pf(), v.hw(), v.t(), v.gg()]) expect(c).toHaveAttribute('data-prefill', 'true')
    expect(within(v.seccion).getByText('Valores de la carga anterior; edítalos si cambiaron.')).toBeInTheDocument()
  })

  it('el operador puede editar un campo; solo ese deja de ser prefill y el resto se conserva', async () => {
    const v = renderPage({ lecturas: [lectura(1, GAS_300)] })
    const user = userEvent.setup()
    await user.clear(v.pf())
    await user.type(v.pf(), '310')
    expect(v.pf()).toHaveValue(310)
    expect(v.pf()).toHaveAttribute('data-prefill', 'false')
    expect(v.hw()).toHaveValue(43.56)
    expect(v.hw()).toHaveAttribute('data-prefill', 'true')
  })

  it('usa la última lectura QUE TIENE gas, aunque la más reciente no lo traiga', () => {
    const v = renderPage({ lecturas: [lectura(1, GAS_300), lectura(2)] })
    expect(v.pf()).toHaveValue(300)
  })

  it('primera lectura de un ciclo nuevo: toma la última carga del ciclo ANTERIOR', () => {
    const v = renderPage({ lecturas: [], previas: [lectura(9, { ...GAS_300, pf: 288, gg: 0.7 }), lectura(8, GAS_300)] })
    expect(v.pf()).toHaveValue(288)
    expect(v.gg()).toHaveValue(0.7)
    expect(v.pf()).toHaveAttribute('data-prefill', 'true')
  })

  it('con lecturas en el ciclo actual la prioridad es la del ciclo actual, no la del anterior', () => {
    const v = renderPage({ lecturas: [lectura(1, { ...GAS_300, pf: 305 })], previas: [lectura(9, { ...GAS_300, pf: 100 })] })
    expect(v.pf()).toHaveValue(305)
  })

  it('sin ninguna carga anterior quedan los valores por defecto y sin aviso de prefill', () => {
    const v = renderPage({ lecturas: [], previas: [] })
    expect([v.pf().value, v.hw().value, v.t().value, v.gg().value]).toEqual(['0', '0', '80', '0.6'])
    expect(v.pf()).toHaveAttribute('data-prefill', 'false')
    expect(within(v.seccion).queryByText(/carga anterior/i)).not.toBeInTheDocument()
  })

  it('consulta el ciclo anterior SOLO cuando el ciclo actual ya cargó y no tiene lecturas', () => {
    renderPage({ lecturas: [], cargando: true })
    expect(previaMock).toHaveBeenLastCalledWith('p1', 'ev2', false) // aún cargando: no se consulta
    cleanup(); previaMock.mockClear()
    renderPage({ lecturas: [], cargando: false })
    expect(previaMock).toHaveBeenLastCalledWith('p1', 'ev2', true)
    cleanup(); previaMock.mockClear()
    renderPage({ lecturas: [lectura(1, GAS_300)] })
    expect(previaMock).toHaveBeenLastCalledWith('p1', 'ev2', false) // ya hay lecturas: no hace falta
  })

  it('el Qg se calcula con los datos prefillados, sin tener que escribir nada', () => {
    renderPage({ lecturas: [lectura(1, GAS_300)] })
    const qg = screen.getByText(/MMSCFD/).textContent!
    expect(parseFloat(qg.replace('Qg:', ''))).toBeGreaterThan(9) // Pf 300, hw 43.56, 130 °F, GE 0.72 → ≈ 9.6
  })

  it('al guardar sin tocar nada se escribe el gas prefillado', async () => {
    renderPage({ lecturas: [lectura(1, GAS_300)] })
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1].gas).toMatchObject({ pf: 300, hw: 43.56, tGas: 130, gg: 0.72 })
  })
})
