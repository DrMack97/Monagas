// jest.config.js
//
// Esto es un backend de Node (Cloud Functions), no una app de React —
// la config anterior estaba copiada tal cual de apps/web-supervisor
// (testEnvironment: 'jsdom', un setupFilesAfterEnv que nunca se creó
// para este paquete) y nunca llegó a correr ni un solo test.
//
// Los tests reales de este paquete son de integración contra el
// emulador (ver tests/assignRole.test.ts) — no necesitan jsdom ni
// ningún setup file, solo el entorno 'node' normal.
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
};
