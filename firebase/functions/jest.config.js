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
//
// jose: firebase-admin 14 → jwks-rsa → jose 6, que se publica SOLO como
// ESM. Jest 29 corre en CommonJS y no puede cargarlo ("Cannot use import
// statement outside a module"), así que ts-jest lo transpila (allowJs). Es un
// problema solo de Jest: en Cloud Functions Node 22 `require()` de un módulo
// ESM funciona de forma nativa (y se verifica con un deploy real a staging).
export default {
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: { allowJs: true, esModuleInterop: true, module: 'commonjs' } }],
  },
  // pnpm anida: .../node_modules/.pnpm/jose@x/node_modules/jose/... — ambos
  // tramos deben quedar fuera de la lista de ignorados.
  transformIgnorePatterns: ['/node_modules/(?!\\.pnpm/jose@|jose/)'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
};
