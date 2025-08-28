// Jest configuration for Node environment tests
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/test-utils/jest.setup.node.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/woocommerce.test.ts',
    '**/__tests__/**/rate-limit.test.ts',
    '**/__tests__/**/product-normalizer.test.ts',
    '**/__tests__/**/ecommerce-extractor.test.ts',
    '**/__tests__/**/pagination-crawler.test.ts',
    '**/__tests__/**/pattern-learner.test.ts',
    '**/__tests__/api/**/*.test.ts',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true,
        moduleResolution: 'node',
      },
    }],
  },
}