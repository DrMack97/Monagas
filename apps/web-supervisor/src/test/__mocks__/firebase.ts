// src/test/__mocks__/firebase.ts
//
// Reemplaza services/firebase.ts en tests (ver moduleNameMapper en
// jest.config.cjs). Ningún test unitario debe inicializar el SDK
// real de Firebase ni depender de import.meta.env — cada test que
// necesite comportamiento específico de auth/db debe mockear el hook
// que los usa (p.ej. useAuth), no este módulo.

export const app = {}
export const auth = {}
export const db = {}
export const functions = {}
