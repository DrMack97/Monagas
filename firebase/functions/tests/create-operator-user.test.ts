// tests/create-operator-user.test.ts
//
// Validación de argumentos de scripts/create-operator-user.js (la parte que no toca Firebase). El alta
// real se verificó contra staging al escribir el script: cuenta creada, claims por assignRole, inicio de
// sesión real, lectura de SU pozo permitida y listado de todo el personal denegado por las reglas.

import { describe, it, expect } from '@jest/globals'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validar } = require('../scripts/create-operator-user.js') as {
  validar: (args: Record<string, string | boolean | undefined>, env?: Record<string, string>) => Record<string, any>
}

const base = { project: 'p', pozo: 'pozo1', nombre: 'Op Uno', email: 'a@b.co' }

describe('create-operator-user: validar()', () => {
  it('con --generar-clave produce una contraseña aleatoria de al menos 8 caracteres, distinta cada vez', () => {
    const a = validar({ ...base, 'generar-clave': true }, {})
    const b = validar({ ...base, 'generar-clave': true }, {})
    expect(a.generar).toBe(true)
    expect(a.password.length).toBeGreaterThanOrEqual(8)
    expect(a.password).not.toBe(b.password)
  })

  it('el rol por defecto es OPERADOR; SUP_CAMPO también se acepta', () => {
    expect(validar({ ...base, 'generar-clave': true }, {}).rol).toBe('OPERADOR')
    expect(validar({ ...base, rol: 'SUP_CAMPO', 'generar-clave': true }, {}).rol).toBe('SUP_CAMPO')
  })

  it.each(['GERENTE', 'SUP_AREA', 'ROOT', ''])('rol %p no se acepta (este script no crea gestores)', (rol) => {
    expect(() => validar({ ...base, rol, 'generar-clave': true }, {})).toThrow(/--rol/)
  })

  it('sin --generar-clave exige NEW_USER_PASSWORD, y de 8+ caracteres', () => {
    expect(() => validar(base, {})).toThrow(/contraseña/)
    expect(() => validar(base, { NEW_USER_PASSWORD: '123' })).toThrow(/8 caracteres/)
    expect(validar(base, { NEW_USER_PASSWORD: 'claveLarga1' }).password).toBe('claveLarga1')
  })

  it('rechaza correo inválido y lista los argumentos que faltan', () => {
    expect(() => validar({ ...base, email: 'nada', 'generar-clave': true }, {})).toThrow(/correo/)
    expect(() => validar({ project: 'p' }, {})).toThrow(/pozo, nombre, email/)
  })
})
