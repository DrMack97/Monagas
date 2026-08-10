// src/components/__tests__/LoginForm.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm'

const loginMock = jest.fn()

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ login: loginMock, loading: false, error: null }),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    loginMock.mockReset()
  })

  it('valida el correo antes de llamar a login', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'no-es-un-correo')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(screen.getByText(/correo válido/i)).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('valida el largo mínimo de la contraseña', async () => {
    render(<LoginForm />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'operador@willytank.com')
    await user.type(screen.getByLabelText(/contraseña/i), '123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    expect(screen.getByText(/al menos 6 caracteres/i)).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('llama a login y a onSuccess con datos válidos', async () => {
    loginMock.mockResolvedValue(undefined)
    const onSuccess = jest.fn()
    render(<LoginForm onSuccess={onSuccess} />)
    const user = userEvent.setup()

    await user.type(screen.getByLabelText(/correo electrónico/i), 'operador@willytank.com')
    await user.type(screen.getByLabelText(/contraseña/i), 'secreto123')
    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('operador@willytank.com', 'secreto123'))
    await waitFor(() => expect(onSuccess).toHaveBeenCalled())
  })
})
