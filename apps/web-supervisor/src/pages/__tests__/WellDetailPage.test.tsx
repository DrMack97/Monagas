// src/pages/__tests__/WellDetailPage.test.tsx
//
// Protege el payload EXACTO que guardarTanquesYLimites() envía a
// Firestore — debe ser siempre {tanques, limResorte, limGamma} y
// nada más, sin importar el rol, para que coincida con hasOnly([...])
// de canEditOwnTanquesYLimites() en firestore.rules. Agregar un
// campo aquí sin actualizar la regla (o viceversa) rompe el guardado
// de SUP_CAMPO en producción sin que tsc lo detecte.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import WellDetailPage from '../WellDetailPage'

const updateDocMock = jest.fn().mockResolvedValue(undefined)
const getDocsMock = jest.fn().mockResolvedValue({ docs: [] })

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((...args: any[]) => args),
  updateDoc: (...args: any[]) => updateDocMock(...args),
  collection: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  getDocs: (...args: any[]) => getDocsMock(...args),
}))

const useAuthMock = jest.fn()
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

const usePozoMock = jest.fn()
jest.mock('../../hooks/usePozo', () => ({
  usePozo: () => usePozoMock(),
}))

// Evaluaciones Oficiales: sin datos por defecto — no es lo que este
// archivo protege (ver exportExcel.test.ts si se agrega más adelante).
// Mockeado para que WellDetailPage no dispare el onSnapshot real de
// useEvaluacionesOficiales, que 'firebase/firestore' arriba no cubre.
jest.mock('../../hooks/useEvaluacionesOficiales', () => ({
  useEvaluacionesOficiales: () => ({ evaluaciones: [], loading: false, error: null }),
}))

const POZO_BASE = {
  id: 'mfb-1025',
  nombre: 'MFB-1025',
  campo: 'Bare',
  zona: 'MONAGAS',
  limResorte: 300,
  limGamma: 60,
  asignados: ['uid-operador'],
  tanques: [{ id: 't1', nombre: 'Tanque 1', mi: 12.5, ft: 2.4 }],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/pozo/mfb-1025']}>
      <Routes>
        <Route path="/pozo/:pozoId" element={<WellDetailPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('WellDetailPage', () => {
  beforeEach(() => {
    updateDocMock.mockClear()
    usePozoMock.mockReturnValue({ pozo: POZO_BASE, loading: false, error: null })
  })

  it('SUP_CAMPO guarda con el payload restringido exacto (tanques, limResorte, limGamma)', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_CAMPO' })
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateDocMock).toHaveBeenCalled())
    const payload = updateDocMock.mock.calls[0][1]
    expect(Object.keys(payload).sort()).toEqual(['limGamma', 'limResorte', 'tanques'])
  })

  it('SUP_AREA/GERENTE guardan con el mismo payload restringido — no agregan campos extra', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA' })
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    await waitFor(() => expect(updateDocMock).toHaveBeenCalled())
    const payload = updateDocMock.mock.calls[0][1]
    expect(Object.keys(payload).sort()).toEqual(['limGamma', 'limResorte', 'tanques'])
  })

  it('muestra "solo lectura" y oculta Guardar cuando el rol no tiene permiso de edición', () => {
    useAuthMock.mockReturnValue({ rol: null })
    renderPage()

    expect(screen.getByText(/solo lectura/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /guardar cambios/i })).not.toBeInTheDocument()
  })

  it('muestra un mensaje amigable si Firestore rechaza el guardado', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_CAMPO' })
    updateDocMock.mockRejectedValueOnce({ code: 'permission-denied' })
    renderPage()
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /guardar cambios/i }))

    expect(await screen.findByText(/no tienes permiso para editar este pozo/i)).toBeInTheDocument()
  })
})
