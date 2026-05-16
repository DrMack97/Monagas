// TODO: Reglas de linting compartidas - Player 3 (Fullstack)
// Paso 1: Extender eslint/recommended y typescript/recommended
// Paso 2: Configurar reglas para React/TS
// Entregable: pnpm lint no muestra errores en código base
module.exports = {
  root: true,
  env: { node: true, browser: true },
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn'
  }
};
