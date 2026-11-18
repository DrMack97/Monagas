// src/pages/__tests__/RegistroLecturaVacia.test.tsx
//
// Aviso en ROJO de "lectura vacía" en Registro: Medida Final, Presión Estática, Diferencial, P. Cabezal y P. Separador
// en 0. Preventivo y NO bloqueante (un 0 puede ser real): resalta los campos, avisa antes de guardar y deja constancia
// en la lectura (alertas). Fórmulas REALES de cálculo (sin mockear calcTanque ni calcAGA3).

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
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => ({ lecturas: [], loading: false }) }))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))
const pozoMock = jest.fn()
jest.mock('../../hooks/usePozoInfo', () => ({ usePozoInfo: () => ({ pozo: pozoMock(), loading: false, error: null }) }))

const POZO = {
  id: 'p1', nombre: 'SBC-61L', campo: 'Bare', zona: 'MONAGAS', diamOrif: 3.25, meterRun: 3.826, limResorte: 0, limGamma: 0,
  tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.3 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }],
}

function renderPage(pozo: Record<string, unknown> = POZO) {
  pozoMock.mockReturnValue(pozo)
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
}
const aviso = () => screen.queryByText(/datos críticos/i)?.closest('[data-nivel]') as HTMLElement | null
const entrada = (etiqueta: string) => screen.getAllByText(etiqueta)[0].parentElement!.querySelector('input') as HTMLInputElement
async function escribe(etiqueta: string, valor: string, indice = 0) {
  const user = userEvent.setup()
  const el = screen.getAllByText(etiqueta)[indice].parentElement!.querySelector('input') as HTMLInputElement
  await user.clear(el)
  await user.type(el, valor)
}

beforeEach(() => addDocMock.mockClear())

describe('Registro — aviso rojo de lectura vacía', () => {
  it('con todo en 0 (la pantalla reportada) avisa en ROJO, nombra los campos y los resalta', () => {
    renderPage()
    const a = aviso()!
    expect(a).toHaveAttribute('data-nivel', 'ROJA')
    expect(a).toHaveTextContent(/lectura vacía/i)
    for (const campo of ['Medida Final (Tanque 1)', 'Medida Final (Tanque 2)', 'Presión Estática', 'Diferencial', 'P. Cabezal', 'P. Separador']) {
      expect(a).toHaveTextContent(campo)
    }
    for (const etiqueta of ['Presión Estática (psig)', 'Diferencial (inH₂O)', 'P. Cabezal (psig)', 'P. Separador (psig)']) {
      expect(entrada(etiqueta)).toHaveAttribute('data-nivel', 'ROJA')
      expect(entrada(etiqueta).className).toMatch(/border-red-500/)
    }
    expect(screen.getAllByText('Medida Final (pulg)').every((l) => (l.parentElement!.querySelector('input') as HTMLInputElement).className.includes('border-red-500'))).toBe(true)
  })

  it('mantiene la estética: mismo cuadro rojo que los errores (bg-red-950/40, border-red-900, text-red-400)', () => {
    renderPage()
    expect(aviso()!.className).toMatch(/text-red-400.*bg-red-950\/40.*border-red-900/)
  })

  it('al llenar un campo deja de marcarlo; el aviso sigue mientras queden otros en 0 y ya no dice "vacía"', async () => {
    renderPage()
    await escribe('P. Cabezal (psig)', '540')
    expect(entrada('P. Cabezal (psig)')).toHaveAttribute('data-nivel', 'OK')
    expect(aviso()).toHaveTextContent(/datos críticos en 0/i)
    expect(aviso()).not.toHaveTextContent(/lectura vacía/i)
    expect(aviso()).not.toHaveTextContent('P. Cabezal')
    expect(entrada('P. Separador (psig)')).toHaveAttribute('data-nivel', 'ROJA')
  })

  it('con todo lo crítico lleno el aviso desaparece', async () => {
    renderPage()
    await escribe('Medida Final (pulg)', '1', 0)
    await escribe('Medida Final (pulg)', '2', 1)
    await escribe('Presión Estática (psig)', '300')
    await escribe('Diferencial (inH₂O)', '40')
    await escribe('P. Cabezal (psig)', '540')
    await escribe('P. Separador (psig)', '120')
    expect(aviso()).toBeFalsy()
  })

  it('NO bloquea: se puede guardar (tras confirmar) y la lectura lleva la constancia de que se guardó vacía', async () => {
    renderPage()
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    const lectura = addDocMock.mock.calls[0][1]
    expect(lectura.alertas.some((t: string) => /^Lectura guardada VACÍA/.test(t))).toBe(true)
  })

  it('AL GUARDAR con datos críticos en 0 sale un aviso en ROJO (no la confirmación verde normal)', async () => {
    renderPage()
    await guardarLectura()
    const rojo = await screen.findByRole('alert')
    expect(rojo).toHaveAttribute('data-nivel', 'ROJA')
    expect(rojo).toHaveTextContent(/Lectura #0 guardada, pero con datos críticos en 0/)
    expect(rojo).toHaveTextContent(/Lectura guardada VACÍA/)
    expect(rojo.className).toMatch(/text-red-400.*bg-red-950\/40.*border-red-900/)
    expect(screen.queryByText(/^Lectura #\d+ guardada\.$/)).not.toBeInTheDocument()
  })

  it('una lectura completa se guarda con la confirmación verde normal y sin aviso rojo', async () => {
    renderPage()
    await escribe('Medida Final (pulg)', '1', 0)
    await escribe('Medida Final (pulg)', '2', 1)
    await escribe('Presión Estática (psig)', '300')
    await escribe('Diferencial (inH₂O)', '40')
    await escribe('P. Cabezal (psig)', '540')
    await escribe('P. Separador (psig)', '120')
    await guardarLectura()
    expect(await screen.findByText(/^Lectura #\d+ guardada\.$/)).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('una lectura completa se guarda SIN esa constancia', async () => {
    renderPage()
    await escribe('Medida Final (pulg)', '1', 0)
    await escribe('Medida Final (pulg)', '2', 1)
    await escribe('Presión Estática (psig)', '300')
    await escribe('Diferencial (inH₂O)', '40')
    await escribe('P. Cabezal (psig)', '540')
    await escribe('P. Separador (psig)', '120')
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1].alertas.some((t: string) => /en 0|VACÍA/.test(t))).toBe(false)
  })

  it('sin Placa/Meter Run el gas no se guarda: Presión Estática y Diferencial no cuentan como críticos', () => {
    renderPage({ ...POZO, diamOrif: undefined, meterRun: undefined })
    const a = aviso()!
    expect(a).not.toHaveTextContent('Presión Estática')
    expect(a).not.toHaveTextContent('Diferencial')
    expect(a).toHaveTextContent('P. Cabezal')
  })

  it('el aviso explica por qué importa y NO invita a guardar sin problema', () => {
    renderPage()
    expect(within(aviso()!).getByText(/medida inicial de la próxima lectura/i)).toBeInTheDocument()
    expect(aviso()!.textContent).not.toMatch(/puedes guardar|puedes seguir/i)
  })
})
