// src/pages/__tests__/RegistroControlErrores.test.tsx
//
// Control de errores de captura en Registro (fórmulas REALES, sin mockear calcTanque/calcAGA3):
//   1) Confirmación antes de guardar cuando hay datos críticos en 0, valores fuera de rango o balance en rojo.
//   2) Rangos plausibles por pozo (físicamente imposible / fuera de lo esperado / fuera de lo habitual del pozo).
//   3) Anular o corregir la última lectura mientras el ciclo sigue EN_CURSO: nada se borra, queda como constancia.

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '../RegistroPage'
import { guardarLectura } from '../../testing/guardarLectura'

const addDocMock = jest.fn().mockResolvedValue({ id: 'nueva' })
const batchUpdate = jest.fn()
const batchCommit = jest.fn().mockResolvedValue(undefined)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...a: unknown[]) => ({ ruta: a.slice(1).join('/') })),
  collection: jest.fn(), updateDoc: jest.fn().mockResolvedValue(undefined),
  increment: jest.fn((n: number) => ({ incremento: n })),
  addDoc: (...a: unknown[]) => addDocMock(...a),
  writeBatch: () => ({ update: (...a: unknown[]) => batchUpdate(...a), commit: () => batchCommit() }),
}))
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useParams: () => ({ pozoId: 'p1' }), useNavigate: () => jest.fn() }))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'op1' } }) }))
jest.mock('../../hooks/useEvaluacionActual', () => ({ useEvaluacionActual: () => ({ evalId: 'ev1', loading: false, error: null }) }))
const lecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => lecturasMock() }))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: {
      id: 'p1', nombre: 'SBC-61L', campo: 'Bare', zona: 'MONAGAS', diamOrif: 3.25, meterRun: 3.826, limResorte: 0, limGamma: 0,
      tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.3 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }],
    },
    loading: false, error: null,
  }),
}))

/** Lectura guardada tal como la escribe la app (con su gas y presiones). */
function lectura(hora: number, over: Record<string, unknown> = {}) {
  return {
    id: `l${hora}`, hora, timestamp: new Date(2026, 10, 4, 8 + hora, 0),
    tanques: [
      { tanqueId: 't1', mi: 0, mf: 0, dif: 0, th: 1, reductor: 0, bph: 0, bpd: 0, aysBls: 0, netos: 0 },
      { tanqueId: 't2', mi: hora - 1, mf: hora, dif: 1, th: 1, reductor: 0, bph: 5.2, bpd: 124.8, aysBls: 12.48, netos: 112.32 },
    ],
    gas: { pf: 300, hw: 43.5, tGas: 90, gg: 0.65, diam: 3.25, meterRun: 3.826, beta: 0.85, Fc: 1, Fb: 1, Fg: 1, Ftf: 1, qg: 5 },
    operativos: { pCab: 540, pSep: 120 },
    ...over,
  }
}
const CON_HISTORIA = [lectura(1), lectura(2), lectura(3)]

function renderPage(lecturas: unknown[] = []) {
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
}
const entrada = (etiqueta: string, i = 0) => screen.getAllByText(etiqueta)[i].parentElement!.querySelector('input') as HTMLInputElement
async function escribe(etiqueta: string, valor: string, i = 0) {
  const user = userEvent.setup()
  await user.clear(entrada(etiqueta, i))
  await user.type(entrada(etiqueta, i), valor)
}
/** Captura completa y razonable (con lecturas previas: el tanque 2 sube una pulgada). */
async function capturaCorrecta() {
  await escribe('Medida Final (pulg)', '0', 0)
  await escribe('Medida Final (pulg)', '4', 1)
  await escribe('Presión Estática (psig)', '300')
  await escribe('Diferencial (inH₂O)', '43.5')
  await escribe('P. Cabezal (psig)', '540')
  await escribe('P. Separador (psig)', '120')
}
const dialogo = () => screen.queryByRole('alertdialog', { name: 'Confirmar guardado' })

beforeEach(() => { addDocMock.mockClear(); batchUpdate.mockClear(); batchCommit.mockClear().mockResolvedValue(undefined) })

describe('Confirmación antes de guardar', () => {
  it('con datos críticos en 0 el primer toque NO guarda: pide confirmar y lista los motivos', async () => {
    renderPage()
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(addDocMock).not.toHaveBeenCalled()
    const d = dialogo()!
    expect(d).toHaveTextContent('¿Guardar de todos modos?')
    expect(d).toHaveTextContent(/Datos críticos en 0: .*P\. Cabezal/)
    expect(within(d).getByRole('button', { name: 'Revisar' })).toBeInTheDocument()
  })

  it('"Revisar" vuelve al formulario sin guardar; "Guardar de todos modos" guarda UNA vez', async () => {
    renderPage()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    await user.click(within(dialogo()!).getByRole('button', { name: 'Revisar' }))
    expect(dialogo()).toBeNull()
    expect(addDocMock).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    await user.click(within(dialogo()!).getByRole('button', { name: 'Guardar de todos modos' }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
  })

  it('una captura completa y razonable se guarda directo, sin confirmación', async () => {
    renderPage(CON_HISTORIA)
    await capturaCorrecta()
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(dialogo()).toBeNull()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
  })

  it('si el operador cambia un dato mientras la confirmación está abierta, la confirmación se cierra y se vuelve a evaluar', async () => {
    renderPage()
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(dialogo()).not.toBeNull()
    await escribe('P. Cabezal (psig)', '540')
    expect(dialogo()).toBeNull()
  })

  it('una discrepancia ROJA del balance de masas también pide confirmar (la amarilla no)', async () => {
    // Tanque 2: 3 pulgadas × 5.2 = 15.6 Bls ya medidos; si ahora marca 1 sin declarar trasegado, faltan 10.4 Bls (> 1 pulgada).
    renderPage(CON_HISTORIA)
    await capturaCorrecta()
    await escribe('Medida Final (pulg)', '1', 1)
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(dialogo()).toHaveTextContent(/Tanque 2: Discrepancia crítica en el balance de masas/)
    expect(addDocMock).not.toHaveBeenCalled()
  })
})

describe('Rangos plausibles por pozo', () => {
  it('5400 psig de cabezal cuando lo habitual es 540: lo marca en amarillo, sugiere el decimal y pide confirmar', async () => {
    renderPage(CON_HISTORIA)
    await capturaCorrecta()
    await escribe('P. Cabezal (psig)', '5400')
    expect(entrada('P. Cabezal (psig)')).toHaveAttribute('data-nivel', 'AMARILLA')
    // el motivo se explica en vivo, antes de guardar
    expect(screen.getByText('Valores fuera de lo esperado').closest('[data-nivel]')).toHaveAttribute('data-nivel', 'AMARILLA')
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(dialogo()).toHaveTextContent(/P\. Cabezal \(5400\) es 10 veces mayor.*¿se omitió o sobra un decimal\?/)
    expect(addDocMock).not.toHaveBeenCalled()
  })

  it('diferencial mayor que la presión estática: físicamente imposible, en ROJO', async () => {
    renderPage(CON_HISTORIA)
    await capturaCorrecta()
    await escribe('Presión Estática (psig)', '2')
    await escribe('Diferencial (inH₂O)', '100')
    expect(entrada('Diferencial (inH₂O)')).toHaveAttribute('data-nivel', 'ROJA')
    await userEvent.setup().click(screen.getByRole('button', { name: /^guardar lectura$/i }))
    expect(dialogo()).toHaveTextContent(/mayor que la presión estática.*no es posible/)
  })

  it('temperatura fuera de rango se marca en el propio campo', async () => {
    renderPage(CON_HISTORIA)
    await escribe('Temp. gas (°F)', '900')
    expect(entrada('Temp. gas (°F)')).toHaveAttribute('data-nivel', 'AMARILLA')
  })

  it('sin lecturas previas del pozo (pozo nuevo) no hay "rango habitual": solo cuentan las reglas físicas', async () => {
    renderPage([])
    await escribe('P. Cabezal (psig)', '5400')
    expect(entrada('P. Cabezal (psig)')).toHaveAttribute('data-nivel', 'OK')
  })
})

describe('Última lectura — anular o corregir', () => {
  it('sin lecturas no hay nada que anular: el panel no aparece', () => {
    renderPage([])
    expect(screen.queryByRole('region', { name: 'Última lectura' })).toBeNull()
  })

  it('con lecturas muestra la ÚLTIMA (número, medidas y presiones) con "Corregir" y "Anular"', () => {
    renderPage(CON_HISTORIA)
    const p = screen.getByRole('region', { name: 'Última lectura' })
    expect(p).toHaveTextContent('Última lectura · #3')
    expect(p).toHaveTextContent('Tanque 2: 3')
    expect(p).toHaveTextContent('Pf 300')
    expect(p).toHaveTextContent('P.Cab 540')
    expect(within(p).getByRole('button', { name: 'Corregir' })).toBeInTheDocument()
    expect(within(p).getByRole('button', { name: 'Anular' })).toBeInTheDocument()
  })

  it('anular EXIGE un motivo (mínimo 3 letras) y no escribe nada hasta confirmar', async () => {
    renderPage(CON_HISTORIA)
    const user = userEvent.setup()
    const p = screen.getByRole('region', { name: 'Última lectura' })
    await user.click(within(p).getByRole('button', { name: 'Anular' }))
    const confirmar = within(p).getByRole('button', { name: 'Anular lectura' })
    expect(confirmar).toBeDisabled()
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'ab')
    expect(confirmar).toBeDisabled()
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'c')
    expect(confirmar).toBeEnabled()
    expect(batchCommit).not.toHaveBeenCalled()
  })

  it('anular NO borra la lectura: la marca (quién, cuándo, por qué) y resta su hora a horasEvaluadas, en un solo lote', async () => {
    renderPage(CON_HISTORIA)
    const user = userEvent.setup()
    const p = screen.getByRole('region', { name: 'Última lectura' })
    await user.click(within(p).getByRole('button', { name: 'Anular' }))
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'Medí mal el tanque 2')
    await user.click(within(p).getByRole('button', { name: 'Anular lectura' }))

    await waitFor(() => expect(batchCommit).toHaveBeenCalledTimes(1))
    expect(batchUpdate).toHaveBeenCalledTimes(2)
    const [refLectura, datos] = batchUpdate.mock.calls[0]
    expect(refLectura.ruta).toBe('evaluaciones/ev1/lecturas/l3')
    expect(datos).toMatchObject({ anulada: true, anuladaPor: 'op1', anuladaMotivo: 'Medí mal el tanque 2' })
    expect(datos.anuladaEn).toBeInstanceOf(Date)
    expect(Object.keys(datos).sort()).toEqual(['anulada', 'anuladaEn', 'anuladaMotivo', 'anuladaPor']) // ningún valor medido se toca
    const [refEval, horas] = batchUpdate.mock.calls[1]
    expect(refEval.ruta).toBe('evaluaciones/ev1')
    expect(horas).toEqual({ horasEvaluadas: { incremento: -1 } })
    expect(await screen.findByText(/Lectura #3 anulada\. Ya no cuenta en el promedio/)).toBeInTheDocument()
  })

  it('un permiso denegado se avisa y no deja a medias', async () => {
    batchCommit.mockRejectedValueOnce({ code: 'permission-denied' })
    renderPage(CON_HISTORIA)
    const user = userEvent.setup()
    const p = screen.getByRole('region', { name: 'Última lectura' })
    await user.click(within(p).getByRole('button', { name: 'Anular' }))
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'prueba')
    await user.click(within(p).getByRole('button', { name: 'Anular lectura' }))
    expect(await screen.findByText('No tienes permiso para anular esta lectura.')).toBeInTheDocument()
  })

  it('corregir: anula la lectura y carga sus datos en el formulario (medida, AyS deducido, gas y presiones)', async () => {
    renderPage(CON_HISTORIA)
    const user = userEvent.setup()
    const p = screen.getByRole('region', { name: 'Última lectura' })
    await user.click(within(p).getByRole('button', { name: 'Corregir' }))
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'Medida mal leída')
    await user.click(within(p).getByRole('button', { name: 'Anular y corregir' }))

    await waitFor(() => expect(batchCommit).toHaveBeenCalledTimes(1))
    expect(batchUpdate.mock.calls[0][1]).toMatchObject({ anulada: true, anuladaMotivo: 'Medida mal leída' })
    expect(await screen.findByText(/Lectura #3 anulada\. Sus datos están cargados abajo/)).toBeInTheDocument()
    expect(entrada('Medida Final (pulg)', 1)).toHaveValue(3)
    expect(entrada('AyS (%)', 1)).toHaveValue(10) // 12.48 / 124.8 = 10 %: las lecturas viejas no guardaron aysPct
    expect(entrada('Presión Estática (psig)')).toHaveValue(300)
    expect(entrada('P. Cabezal (psig)')).toHaveValue(540)
    expect(screen.getByText(/Estás corrigiendo la lectura anulada #3/)).toBeInTheDocument()
  })

  it('la lectura corregida se guarda enlazada a la anulada (corrigeA) y ya guarda el AyS % usado', async () => {
    renderPage(CON_HISTORIA)
    const user = userEvent.setup()
    const p = screen.getByRole('region', { name: 'Última lectura' })
    await user.click(within(p).getByRole('button', { name: 'Corregir' }))
    await user.type(within(p).getByLabelText(/qué estaba mal/i), 'Medida mal leída')
    await user.click(within(p).getByRole('button', { name: 'Anular y corregir' }))
    await screen.findByText(/Sus datos están cargados abajo/)
    await escribe('Medida Final (pulg)', '4', 1)
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    const guardada = addDocMock.mock.calls[0][1]
    expect(guardada.corrigeA).toBe('l3')
    expect(guardada.tanques.find((t: any) => t.tanqueId === 't2')).toMatchObject({ mf: 4, aysPct: 10 })
    // tras guardar ya no se está "corrigiendo"
    await waitFor(() => expect(screen.queryByText(/Estás corrigiendo la lectura anulada/)).toBeNull())
  })

  it('una lectura normal se guarda SIN corrigeA', async () => {
    renderPage(CON_HISTORIA)
    await capturaCorrecta()
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('corrigeA')
  })
})
