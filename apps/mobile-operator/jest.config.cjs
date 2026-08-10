// jest.config.cjs
//
// No existía ninguna configuración de Jest — sin esto, Jest usa su
// transform por defecto (que no entiende TS/JSX), por lo que TODO
// test suite fallaba con "Cannot use import statement outside a
// module" antes de siquiera correr un test.
//
// services/firebase(-messaging) usan import.meta.env (sintaxis de
// Vite) — TypeScript no permite emitir eso a CommonJS, así que se
// mockean por completo vía moduleNameMapper: ningún test unitario
// debe inicializar el SDK real de Firebase de todos modos.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '.*/services/firebase-messaging$': '<rootDir>/src/test/__mocks__/firebase.ts',
    '.*/services/firebase$': '<rootDir>/src/test/__mocks__/firebase.ts',
    '^@core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@core$': '<rootDir>/../../packages/core/src/index.ts',
    '^@monagas/core/calculos$': '<rootDir>/../../packages/core/src/calculos/index.ts',
    '^@monagas/core/utils$': '<rootDir>/../../packages/core/src/utils/index.ts',
    '^@monagas/core/constants$': '<rootDir>/../../packages/core/src/constants/index.ts',
    '^@monagas/core/types$': '<rootDir>/../../packages/core/src/types/index.ts',
    '^@monagas/core$': '<rootDir>/../../packages/core/src/index.ts',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    // isolatedModules: transpila archivo por archivo sin resolver ni
    // type-checkear imports cruzados — con moduleResolution "node"
    // (el único compatible con module:"commonjs") TS no sabe seguir
    // el campo "exports" de @monagas/core/package.json y falla con
    // TS2307. El type-check real ya lo cubre `tsc --noEmit`; aquí solo
    // necesitamos una transpilación rápida y correcta.
    '^.+\\.tsx?$': [
      'ts-jest',
      { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } },
    ],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/android/'],
}
