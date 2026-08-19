export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // lib/ is committed compiled build output (see lib/**/*.test.js) — exclude
  // it so jest only runs the TypeScript sources under src/ and tests/.
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
};