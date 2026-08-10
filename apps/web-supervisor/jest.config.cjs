// jest.config.cjs
//
// No existía ninguna configuración de Jest — mismo problema que en
// mobile-operator: sin esto, todo test suite fallaba con "Cannot use
// import statement outside a module". services/firebase.ts usa
// import.meta.env (sintaxis de Vite, inválida bajo el target
// CommonJS que necesita Jest) — se mockea por completo.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '.*/services/firebase$': '<rootDir>/src/test/__mocks__/firebase.ts',
    '^@core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@core$': '<rootDir>/../../packages/core/src/index.ts',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
}
