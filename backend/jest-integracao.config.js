/**
 * Testes de integração (CT001–CT007 e CTN aplicáveis), mantidos em /tests na raiz
 * do repositório, conforme a estrutura definida na P3 (seção 6.1).
 * Exigem PostgreSQL 16 acessível em TEST_DATABASE_URL (ver docker-compose.yml).
 */
const path = require('path');

module.exports = {
  rootDir: path.resolve(__dirname, '..'),
  roots: ['<rootDir>/tests/integracao'],
  testEnvironment: 'node',
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.e2e-spec\\.ts$',
  moduleDirectories: ['node_modules', path.resolve(__dirname, 'node_modules')],
  transform: {
    '^.+\\.ts$': [
      require.resolve('ts-jest'),
      { tsconfig: path.resolve(__dirname, 'tsconfig.json'), isolatedModules: true },
    ],
  },
  globalSetup: '<rootDir>/tests/integracao/suporte/preparar-banco.ts',
  testTimeout: 60000,
  collectCoverageFrom: ['<rootDir>/backend/src/**/*.ts', '!**/*.spec.ts', '!**/main.ts', '!**/cli/**', '!**/__testes__/**'],
  coverageDirectory: '<rootDir>/backend/coverage/integracao',
  coverageReporters: ['text-summary', 'lcov'],
};
