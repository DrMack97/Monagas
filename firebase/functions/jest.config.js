export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  transformIgnorePatterns: ['node_modules/(?!(chai|sinon)/)'],
};