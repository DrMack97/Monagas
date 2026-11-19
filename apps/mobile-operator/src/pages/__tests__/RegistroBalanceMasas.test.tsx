// src/pages/__tests__/RegistroBalanceMasas.test.tsx
//
// Alerta de balance de masas en Registro: Desplazamiento total − Total trasegado − Existente total = 0.
// Preventiva y NO bloqueante: resalta los campos de entrada (amarillo = desviación menor, rojo = discrepancia
// crítica) sin impedir guardar. Fórmula REAL de cálculo (sin mockear calcTanque).

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
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: {
      id: 'p1', nombre: 'SBC-61L', campo: 'Bare', zona: 'MONAGAS',
      tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.3 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }],
    },
    loading: false, error: null,
  }),
}))

/** Lectura guardada con TODOS sus campos, como la escribe la app (el tanque 1 no se usa). */
function lectura(hora: number, mi2: number, mf2: number, bph2: number, trasegado2?: number) {
  return {
    id: `l${hora}`, hora, timestamp: new Date(2026, 10, 4, 8 + hora, 0), operativos: {},
    tanques: [
      { tanqueId: 't1', mi: 0, mf: 0, bph: 0, th: 1 },
      { tanqueId: 't2', mi: mi2, mf: mf2, bph: bph2, th: 1, ...(trasegado2 !== undefined && { trasegado: trasegado2 }) },
    ],
  }
}
/** Tanque 2 subiendo 1 pulgada por lectura (5.2 Bls/h) hasta `n` lecturas. */
const subiendo = (n: number) => Array.from({ length: n }, (_, i) => lectura(i + 1, i, i + 1, 5.2))

function renderPage(lecturas: unknown[]) {
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
  const tarjetas = screen.getAllByRole('heading', { level: 3 }).filter((h) => /^tanque/i.test(h.textContent || '')).map((h) => h.closest('section') as HTMLElement)
  return { t1: tarjetas[0], t2: tarjetas[1], panel: screen.getByRole('region', { name: 'Balance de masas' }) }
}
const campo = (sec: HTMLElement, etiqueta: string) => within(sec).getByText(etiqueta).parentElement!.querySelector('input') as HTMLInputElement
async function escribe(sec: HTMLElement, etiqueta: string, valor: string) {
  const user = userEvent.setup()
  await user.clear(campo(sec, etiqueta))
  await user.type(campo(sec, etiqueta), valor)
}

beforeEach(() => addDocMock.mockClear())

describe('Registro — balance de masas', () => {
  it('sin nada escrito el balance cuadra y ningún campo está resaltado', () => {
    const { t2, panel } = renderPage(subiendo(3))
    expect(panel).toHaveAttribute('data-nivel', 'OK')
    expect(within(panel).getByText('Cuadra')).toBeInTheDocument()
    // El balance no resalta nada ni escribe avisos en el tanque. (La Medida Final sí sale en rojo, pero por OTRA regla:
    // el aviso de "datos críticos en 0", que cubre RegistroLecturaVacia.test.tsx.)
    expect(campo(t2, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'OK')
    expect(within(t2).queryByRole('status')).not.toBeInTheDocument()
  })

  it('muestra la ecuación con sus tres términos', () => {
    const { panel } = renderPage(subiendo(3))
    // 3 pulg × 5.2 en el tanque 2 = 15.60 desplazado y existente
    expect(panel).toHaveTextContent('Desplazamiento 15.60 − Trasegado 0.00 − Existente 15.60 = 0.00 Bls')
  })

  it('una captura correcta (siguiente pulgada) no genera alertas', async () => {
    const { t2, panel } = renderPage(subiendo(3))
    await escribe(t2, 'Medida Final (pulg)', '4')
    expect(panel).toHaveAttribute('data-nivel', 'OK')
    expect(campo(t2, 'Medida Final (pulg)')).toHaveAttribute('data-nivel', 'OK')
    expect(within(t2).queryByRole('status')).not.toBeInTheDocument()
  })

  it('ROJA: el nivel baja sin declarar trasegado → resalta Medida Final y Trasegado en rojo, solo en ese tanque', async () => {
    const { t1, t2, panel } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')

    expect(panel).toHaveAttribute('data-nivel', 'ROJA')
    expect(within(panel).getByText('Alerta roja')).toBeInTheDocument()
    expect(campo(t2, 'Medida Final (pulg)')).toHaveAttribute('data-nivel', 'ROJA')
    expect(campo(t2, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'ROJA')
    expect(campo(t2, 'Medida Final (pulg)').className).toMatch(/border-red-500/)
    expect(within(t2).getByRole('status')).toHaveTextContent(/alerta roja: discrepancia crítica en el balance de masas/i)
    // el otro tanque no se ve afectado por el balance (su Medida Final en 0 es el aviso de datos críticos, otra regla)
    expect(campo(t1, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'OK')
    expect(within(t1).queryByRole('status')).not.toBeInTheDocument()
  })

  it('los mensajes de alerta (panel y por tanque) piden revisar, SIN decir que se puede guardar sin problema', async () => {
    const { t2, panel } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')
    expect(panel).toHaveTextContent('Discrepancia crítica: más de una pulgada de nivel en algún tanque. Revisa Medida Final y Trasegado.')
    expect(panel.textContent).not.toMatch(/guardar|seguir/i)
    expect(within(t2).getByRole('status').textContent).not.toMatch(/guardar|seguir/i)
  })

  it('al declarar el trasegado correcto el balance vuelve a cuadrar y el resaltado desaparece', async () => {
    const { t2, panel } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')
    await escribe(t2, 'Trasegado (Bls)', '70')
    expect(panel).toHaveAttribute('data-nivel', 'OK')
    expect(campo(t2, 'Medida Final (pulg)')).toHaveAttribute('data-nivel', 'OK')
    expect(campo(t2, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'OK')
    expect(within(t2).queryByRole('status')).not.toBeInTheDocument()
  })

  it('un trasegado digitado con un cero de menos (7 en vez de 70) sigue en ROJA', async () => {
    const { t2, panel } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')
    await escribe(t2, 'Trasegado (Bls)', '7')
    expect(panel).toHaveAttribute('data-nivel', 'ROJA')
  })

  it('AMARILLA: trasegado que se queda corto menos de una pulgada → borde amarillo y "Alerta amarilla"', async () => {
    const { t2, panel } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')
    await escribe(t2, 'Trasegado (Bls)', '65') // faltan 2.6 Bls (media pulgada)
    expect(panel).toHaveAttribute('data-nivel', 'AMARILLA')
    expect(campo(t2, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'AMARILLA')
    expect(campo(t2, 'Trasegado (Bls)').className).toMatch(/border-amber-500/)
    expect(within(t2).getByRole('status')).toHaveTextContent(/alerta amarilla: desviación menor en el balance de masas/i)
  })

  it('AMARILLA por incongruencia: producción ≈10 veces mayor que las anteriores → sugiere decimal omitido, aunque el balance cuadre', async () => {
    const { t2, panel } = renderPage(subiendo(3))
    // la medida anterior era 3 y se esperaba ~4; el operador escribió 13: el nivel "sube" 10 pulgadas en vez de 1
    await escribe(t2, 'Medida Final (pulg)', '13')
    expect(panel).toHaveAttribute('data-nivel', 'OK') // desplazamiento y existente suben igual: lo ve el salto, no el balance
    expect(campo(t2, 'Medida Final (pulg)')).toHaveAttribute('data-nivel', 'AMARILLA')
    expect(campo(t2, 'Trasegado (Bls)')).toHaveAttribute('data-nivel', 'OK')
    expect(within(t2).getByRole('status')).toHaveTextContent(/alerta amarilla:.*veces mayor.*¿se omitió o sobra un decimal/i)
  })

  it('un salto grande que no parece decimal también se avisa, sin sugerir decimal', async () => {
    const { t2 } = renderPage(subiendo(3))
    await escribe(t2, 'Medida Final (pulg)', '32.5') // ≈30 veces
    expect(campo(t2, 'Medida Final (pulg)')).toHaveAttribute('data-nivel', 'AMARILLA')
    const aviso = within(t2).getByRole('status')
    expect(aviso).toHaveTextContent(/veces mayor.*verifica la medida/i)
    expect(aviso).not.toHaveTextContent(/decimal/i)
  })

  it('NO BLOQUEA: con alerta roja se puede guardar (tras confirmar), y la alerta queda como constancia interna en la lectura', async () => {
    const { t2 } = renderPage([lectura(1, 0, 14, 72.8)])
    await escribe(t2, 'Medida Final (pulg)', '1')
    expect(screen.getByRole('button', { name: /guardar lectura/i })).toBeEnabled()

    await guardarLectura() // la alerta roja del balance pide confirmar; la confirmación NO impide guardar
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    const { alertas } = addDocMock.mock.calls[0][1]
    expect(alertas.some((a: string) => /Alerta roja \(Tanque 2\).*balance de masas/i.test(a))).toBe(true)
  })

  it('una captura correcta se guarda sin alertas de balance', async () => {
    const { t2 } = renderPage(subiendo(3))
    await escribe(t2, 'Medida Final (pulg)', '4')
    await guardarLectura()
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1].alertas.filter((a: string) => /balance|producción por hora/i.test(a))).toEqual([])
  })

  it('lecturas viejas sin medidas completas no producen alertas falsas', () => {
    const vieja = { id: 'v', hora: 1, timestamp: new Date(), operativos: {}, tanques: [{ tanqueId: 't2', mf: 5 }] }
    const { panel } = renderPage([vieja])
    expect(panel).toHaveAttribute('data-nivel', 'OK')
  })
})
