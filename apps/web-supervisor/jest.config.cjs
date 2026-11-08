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
    '.*/config/enlaces$': '<rootDir>/src/test/__mocks__/enlaces.ts',
    '^@core/(.*)$': '<rootDir>/../../packages/core/src/$1',
    '^@core$': '<rootDir>/../../packages/core/src/index.ts',
    // Los fuentes del núcleo se importan entre sí con extensión ".js" (ESM/NodeNext); Jest no la
    // resuelve sola. Se quita para que encuentre el .ts y los tests no necesiten mockear el núcleo.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs', jsx: 'react-jsx' } }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
}
