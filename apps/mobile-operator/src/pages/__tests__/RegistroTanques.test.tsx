// src/pages/__tests__/RegistroTanques.test.tsx
//
// Calculadora de BPD por tanque con la fórmula REAL (sin mockear calcTanque).
// Caso real de staging (pozo SBC-61L): el tanque 2 subió de 1" a 14" y en la lectura 14 el nivel cayó a 1"
// porque se vació por un viaje de vacuum; la pantalla mostraba "BPD: 0.00" sin explicación y esa lectura
// entraba al promedio como producción cero. Ahora hay un campo "Trasegado (Bls)" y un aviso.

import { render, screen, waitFor, within } from '@testing-library/react'
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
jest.mock('../../hooks/useEvaluacionActual', () => ({ useEvaluacionActual: () => ({ evalId: 'ev1', loading: false, error: null }) }))
const lecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => lecturasMock() }))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))
const pozoMock = jest.fn()
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => pozoMock() }))

const T1 = { id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.3 }
const T2 = { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }

function lectura(mf1: number, mf2: number) {
  return { id: 'l1', hora: 1, timestamp: new Date(), operativos: {}, tanques: [{ tanqueId: 't1', mf: mf1 }, { tanqueId: 't2', mf: mf2 }] }
}

function renderConLecturas(lecturas: unknown[], tanques = [T1, T2]) {
  pozoMock.mockReturnValue({ pozo: { id: 'p1', nombre: 'P', campo: 'C', zona: 'MONAGAS', tanques }, loading: false, error: null })
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
  return screen.getAllByRole('heading', { level: 3 })
    .filter((h) => /^tanque/i.test(h.textContent || ''))
    .map((h) => h.closest('section') as HTMLElement)
}

async function escribe(sec: HTMLElement, etiqueta: string, valor: string) {
  const user = userEvent.setup()
  const input = within(sec).getByText(etiqueta).parentElement!.querySelector('input') as HTMLInputElement
  await user.clear(input)
  await user.type(input, valor)
}
const bpd = (sec: HTMLElement) => within(sec).getByText(/^BPD/).textContent

beforeEach(() => addDocMock.mockClear())

describe('Registro — calculadora por tanque', () => {
  it('el tanque 2 calcula igual que el 1 (cada uno con su kk y su medida inicial)', async () => {
    const [s1, s2] = renderConLecturas([lectura(2, 3)])
    await escribe(s1, 'Medida Final (pulg)', '3')
    await escribe(s2, 'Medida Final (pulg)', '4')
    expect(bpd(s1)).toContain('127.20') // (3−2) × 5.3 × 24
    expect(bpd(s2)).toContain('124.80') // (4−3) × 5.2 × 24
  })

  it('medida por debajo de la inicial SIN trasegado: BPD 0.00 y un aviso que explica por qué', async () => {
    const [, s2] = renderConLecturas([lectura(0, 14)])
    await escribe(s2, 'Medida Final (pulg)', '1')
    expect(bpd(s2)).toContain('0.00')
    expect(within(s2).getByRole('status')).toHaveTextContent(/medida final es menor que la inicial \(14\)/i)
    expect(within(s2).getByRole('status')).toHaveTextContent(/trasegado/i)
  })

  it('el aviso aparece solo en el tanque afectado y no en un formulario sin tocar', async () => {
    const [s1, s2] = renderConLecturas([lectura(0, 14)])
    expect(within(s2).queryByRole('status')).not.toBeInTheDocument() // mf=0 por defecto no es una medida del operador
    await escribe(s2, 'Medida Final (pulg)', '1')
    expect(within(s1).queryByRole('status')).not.toBeInTheDocument()
  })

  it('CON trasegado el BPD se calcula con el volumen retirado y el aviso desaparece', async () => {
    const [, s2] = renderConLecturas([lectura(0, 14)])
    await escribe(s2, 'Medida Final (pulg)', '1')
    await escribe(s2, 'Trasegado (Bls)', '70')
    // (1 − 14) × 5.2 + 70 = 2.4 Bls en la hora → 57.60 BPD
    expect(bpd(s2)).toContain('57.60')
    expect(within(s2).queryByRole('status')).not.toBeInTheDocument()
  })

  it('al guardar, el trasegado queda en la lectura solo si fue mayor que 0', async () => {
    const [, s2] = renderConLecturas([lectura(0, 14)])
    await escribe(s2, 'Medida Final (pulg)', '1')
    await escribe(s2, 'Trasegado (Bls)', '70')
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    const [t1, t2] = addDocMock.mock.calls[0][1].tanques
    expect(t2).toMatchObject({ tanqueId: 't2', mi: 14, mf: 1, trasegado: 70 })
    expect(t2.bpd).toBeCloseTo(57.6, 6)
    expect(t1).not.toHaveProperty('trasegado')
  })
})
