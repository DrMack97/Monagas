// src/pages/__tests__/NewWellPage.test.tsx
//
// Protege que SUP_AREA nunca puede crear un pozo fuera de SU PROPIA
// zona — zonaFinal se calcula desde useAuth().zona, no desde el
// estado interno del <select> (que ni siquiera se renderiza para
// este rol). Coincide con canManagePozoEnZona(request.resource.data.zona)
// en firestore.rules: si esto regresa, el create pasa a fallar con
// permission-denied en producción para cualquier SUP_AREA.

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import NewWellPage from '../NewWellPage'

const addDocMock = jest.fn().mockResolvedValue({ id: 'nuevo-pozo' })

jest.mock('firebase/firestore', () => ({
  collection: jest.fn((...args: any[]) => args),
  addDoc: (...args: any[]) => addDocMock(...args),
  serverTimestamp: jest.fn(() => 'SERVER_TIMESTAMP'),
}))

const useAuthMock = jest.fn()
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <NewWellPage />
    </MemoryRouter>
  )
}

describe('NewWellPage', () => {
  beforeEach(() => {
    addDocMock.mockClear()
  })

  it('SUP_AREA crea el pozo en SU PROPIA zona (el <select> ni se renderiza)', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'MFB-9999')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    const payload = addDocMock.mock.calls[0][1]
    expect(payload.zona).toBe('MONAGAS')
  })

  it('GERENTE puede elegir explícitamente la zona del nuevo pozo', async () => {
    useAuthMock.mockReturnValue({ rol: 'GERENTE', zona: 'TODOS', user: { uid: 'uid-gerente' } })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'FAJA-01')
    await user.type(screen.getByLabelText(/^campo$/i), 'Junin')
    await user.selectOptions(screen.getByRole('combobox'), 'FAJA')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))

    await waitFor(() => expect(addDocMock).toHaveBeenCalled())
    const payload = addDocMock.mock.calls[0][1]
    expect(payload.zona).toBe('FAJA')
  })

  it('muestra un mensaje amigable si Firestore rechaza la creación', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    addDocMock.mockRejectedValueOnce({ code: 'permission-denied' })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'X')
    await user.type(screen.getByLabelText(/^campo$/i), 'Y')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))

    expect(await screen.findByText(/no tienes permiso para crear pozos/i)).toBeInTheDocument()
  })
})
