// src/pages/__tests__/RegistroVentanas.test.tsx
//
// Corrección del cliente (2026-11-15): dos ventanas siempre visibles en Registro, "Total trasegado" y
// "Número de viajes", con valores automáticos tomados de lo ya capturado en las lecturas del ciclo.

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import RegistroPage from '../RegistroPage'

jest.mock('firebase/firestore', () => ({ doc: jest.fn(), collection: jest.fn(), addDoc: jest.fn(), updateDoc: jest.fn(), increment: jest.fn() }))
jest.mock('react-router-dom', () => ({ ...jest.requireActual('react-router-dom'), useParams: () => ({ pozoId: 'p1' }), useNavigate: () => jest.fn() }))
jest.mock('../../hooks/useAuth', () => ({ useAuth: () => ({ user: { uid: 'op1' } }) }))
jest.mock('../../hooks/useEvaluacionActual', () => ({ useEvaluacionActual: () => ({ evalId: 'ev1', loading: false, error: null }) }))
const lecturasMock = jest.fn()
jest.mock('../../hooks/useLecturasEvaluacion', () => ({ useLecturasEvaluacion: () => lecturasMock() }))
jest.mock('../../hooks/useConnectivity', () => ({ useConnectivity: () => ({ isOnline: true }) }))
jest.mock('../../hooks/usePozoInfo', () => ({
  usePozoInfo: () => ({
    pozo: { id: 'p1', nombre: 'P', campo: 'C', zona: 'MONAGAS', tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 0, ft: 5.3 }, { id: 't2', nombre: 'Tanque 2', mi: 0, ft: 5.2 }] },
    loading: false, error: null,
  }),
}))

const lectura = (id: string, ...trasegados: (number | undefined)[]) => ({
  id, hora: 1, timestamp: new Date(), operativos: {},
  tanques: trasegados.map((t, i) => ({ tanqueId: `t${i + 1}`, mf: 1, ...(t !== undefined && { trasegado: t }) })),
})

function renderConLecturas(lecturas: unknown[]) {
  lecturasMock.mockReturnValue({ lecturas, loading: false })
  render(<MemoryRouter><RegistroPage /></MemoryRouter>)
  return {
    total: screen.getByRole('region', { name: 'Total trasegado' }),
    viajes: screen.getByRole('region', { name: 'Número de viajes' }),
  }
}

describe('Registro — ventanas Total trasegado y Número de viajes', () => {
  it('siempre se ven, también sin lecturas ni trasegado: 0.00 Bls y 0 viajes', () => {
    const { total, viajes } = renderConLecturas([])
    expect(within(total).getByText('0.00')).toBeInTheDocument()
    expect(within(total).getByText('Bls')).toBeInTheDocument()
    expect(within(viajes).getByText('0')).toBeInTheDocument()
  })

  it('suman automáticamente lo trasegado en las lecturas del ciclo (barriles y cantidad de viajes)', () => {
    const { total, viajes } = renderConLecturas([lectura('l1', undefined, 70), lectura('l2', 30.5, undefined), lectura('l3', undefined, undefined)])
    expect(within(total).getByText('100.50')).toBeInTheDocument()
    expect(within(viajes).getByText('2')).toBeInTheDocument()
  })

  it('lo que se escribe y aún no se guarda aparece aparte ("por guardar") sin tocar lo guardado', async () => {
    const { total, viajes } = renderConLecturas([lectura('l1', undefined, 70)])
    const sec2 = screen.getAllByRole('heading', { level: 3 }).find((h) => /tanque 2/i.test(h.textContent || ''))!.closest('section') as HTMLElement
    const campo = within(sec2).getByText('Trasegado (Bls)').parentElement!.querySelector('input') as HTMLInputElement
    await userEvent.setup().clear(campo)
    await userEvent.setup().type(campo, '25')

    expect(within(total).getByText('70.00')).toBeInTheDocument() // guardado: igual
    expect(within(total).getByText(/\+ 25\.00 Bls por guardar/)).toBeInTheDocument()
    expect(within(viajes).getByText('1')).toBeInTheDocument()
    expect(within(viajes).getByText(/\+ 1 por guardar/)).toBeInTheDocument()
  })

  it('sin nada escrito no aparece ningún "por guardar"', () => {
    const { total, viajes } = renderConLecturas([lectura('l1', undefined, 70)])
    expect(within(total).queryByText(/por guardar/)).not.toBeInTheDocument()
    expect(within(viajes).queryByText(/por guardar/)).not.toBeInTheDocument()
  })
})
