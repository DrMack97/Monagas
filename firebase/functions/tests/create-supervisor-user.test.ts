// tests/create-supervisor-user.test.ts
//
// Validación de argumentos de scripts/create-supervisor-user.js (la parte que no
// toca Firebase). El alta real se verificó contra staging al escribir el script
// (checklist Fase 6, #52). Lo que más importa aquí: que NO se pueda crear por
// error un ROOT/OPERADOR con este script, ni un SUP_AREA sin zona o con TODOS
// (vería todo el sistema o nada, según cómo lo lean las reglas).

import { describe, it, expect } from '@jest/globals'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { validar } = require('../scripts/create-supervisor-user.js') as {
  validar: (args: Record<string, string | undefined>, env?: Record<string, string>) => Record<string, string>
}

const base = { project: 'p', rol: 'GERENTE', nombre: 'N A', email: 'a@b.co', password: 'claveSegura1' }

describe('create-supervisor-user: validar()', () => {
  it('GERENTE sin zona queda con zona TODOS', () => {
    expect(validar(base, {}).zona).toBe('TODOS')
  })

  it('SUP_AREA con zona válida', () => {
    expect(validar({ ...base, rol: 'SUP_AREA', zona: 'MONAGAS' }, {}).zona).toBe('MONAGAS')
  })

  it('SUP_AREA sin zona, o con TODOS, se rechaza', () => {
    expect(() => validar({ ...base, rol: 'SUP_AREA' }, {})).toThrow(/zona/)
    expect(() => validar({ ...base, rol: 'SUP_AREA', zona: 'TODOS' }, {})).toThrow(/SU zona/)
  })

  it.each(['ROOT', 'OPERADOR', 'SUP_CAMPO', 'gerente', ''])('rol %p no se acepta', (rol) => {
    expect(() => validar({ ...base, rol }, {})).toThrow()
  })

  it('zona inexistente, correo inválido y clave corta se rechazan', () => {
    expect(() => validar({ ...base, zona: 'MARTE' }, {})).toThrow(/--zona/)
    expect(() => validar({ ...base, email: 'nada' }, {})).toThrow(/correo/)
    expect(() => validar({ ...base, password: '123' }, {})).toThrow(/8 caracteres/)
  })

  it('lista todos los argumentos que faltan', () => {
    expect(() => validar({ project: 'p' }, {})).toThrow(/rol, nombre, email, password/)
  })

  it('la clave puede venir de NEW_USER_PASSWORD (no queda en el historial del shell)', () => {
    const { password: _omitida, ...sinClave } = base
    expect(validar(sinClave, { NEW_USER_PASSWORD: 'desdeEntorno1' }).password).toBe('desdeEntorno1')
  })
})
