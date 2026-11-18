// src/testing/guardarLectura.ts
//
// Ayudante de pruebas: pulsa "Guardar Lectura" y, si la app pide confirmación (datos críticos en 0, valores fuera de
// rango o balance en rojo), confirma con "Guardar de todos modos". Las pruebas que no verifican la confirmación en sí lo
// usan para no depender de si el formulario de prueba quedó con ceros.
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

export async function guardarLectura(user = userEvent.setup()): Promise<void> {
  await user.click(screen.getByRole('button', { name: /^guardar lectura$/i }))
  const dialogo = screen.queryByRole('alertdialog', { name: 'Confirmar guardado' })
  if (dialogo) await user.click(within(dialogo).getByRole('button', { name: 'Guardar de todos modos' }))
}
