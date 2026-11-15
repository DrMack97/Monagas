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

  it('guarda el Reductor (pulg) en el pozo nuevo', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'MFB-1')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.type(screen.getByLabelText('Reductor (pulg)'), '1/2"')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1].reductorPulgadas).toBe('1/2"')

  })

  it('no manda reductorPulgadas si se deja vacío (pozo sin reductor: el Operador verá "-")', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'MFB-2')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('reductorPulgadas')
  })

  it('guarda Placa y Meter Run como números; si se dejan vacíos no se mandan', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'SBC-61')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.type(screen.getByLabelText('Placa de orificio (pulg)'), '3.25')
    await user.type(screen.getByLabelText('Meter Run (pulg)'), '3.826')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1]).toMatchObject({ diamOrif: 3.25, meterRun: 3.826 })
  })

  it('no manda diamOrif ni meterRun si no se llenan', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/nombre del pozo/i), 'SBC-62')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('diamOrif')
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('meterRun')
  })

  describe('identificadores de tanque únicos', () => {
    async function crearConTanques(acciones: (user: ReturnType<typeof userEvent.setup>) => Promise<void>) {
      useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
      renderPage()
      const user = userEvent.setup()
      await user.type(screen.getByLabelText(/nombre del pozo/i), 'MFB-7')
      await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
      await acciones(user)
      await user.click(screen.getByRole('button', { name: /crear pozo/i }))
      await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
      return addDocMock.mock.calls[0][1].tanques as { id: string; nombre: string }[]
    }
    const agregar = (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getByRole('button', { name: /agregar tanque/i }))
    const quitarPrimero = (u: ReturnType<typeof userEvent.setup>) => u.click(screen.getAllByLabelText('Quitar tanque')[0])

    it('quitar el primer tanque y agregar otro NO repite el id (antes quedaban dos "t2" que compartían datos en Registro)', async () => {
      const tanques = await crearConTanques(async (u) => { await agregar(u); await quitarPrimero(u); await agregar(u) })
      const ids = tanques.map((t) => t.id)
      expect(ids).toHaveLength(2)
      expect(new Set(ids).size).toBe(2)
      expect(new Set(tanques.map((t) => t.nombre)).size).toBe(2)
    })

    it('quitar y agregar varias veces sigue sin repetir ids', async () => {
      const tanques = await crearConTanques(async (u) => {
        await agregar(u); await agregar(u); await quitarPrimero(u); await agregar(u); await quitarPrimero(u); await agregar(u)
      })
      expect(new Set(tanques.map((t) => t.id)).size).toBe(tanques.length)
    })

    it('sin quitar nada, los ids siguen siendo t1, t2, t3 (formato que ya usan los pozos existentes)', async () => {
      const tanques = await crearConTanques(async (u) => { await agregar(u); await agregar(u) })
      expect(tanques.map((t) => t.id)).toEqual(['t1', 't2', 't3'])
    })
  })

  it('guarda el Desplazado inicial con la fecha de hoy; si se deja vacío no se manda', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/nombre del pozo/i), 'SBC-63')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.type(screen.getByLabelText('Desplazado inicial (Bls)'), '2542.92')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    const payload = addDocMock.mock.calls[0][1]
    expect(payload.desplazadoInicial).toBe(2542.92)
    expect(payload.desplazadoInicialDesde).toBeInstanceOf(Date)
  })

  it('sin Desplazado inicial no manda ni el valor ni la fecha', async () => {
    useAuthMock.mockReturnValue({ rol: 'SUP_AREA', zona: 'MONAGAS', user: { uid: 'uid-area' } })
    renderPage()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(/nombre del pozo/i), 'SBC-64')
    await user.type(screen.getByLabelText(/^campo$/i), 'Bare')
    await user.click(screen.getByRole('button', { name: /crear pozo/i }))
    await waitFor(() => expect(addDocMock).toHaveBeenCalledTimes(1))
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('desplazadoInicial')
    expect(addDocMock.mock.calls[0][1]).not.toHaveProperty('desplazadoInicialDesde')
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
