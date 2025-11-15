/**
 * Jest Configuration for Next.js Application
 *
 * TEST FRAMEWORK SEPARATION:
 * This config is for Jest tests only. Other test frameworks are excluded:
 *
 * 1. PLAYWRIGHT TESTS (Browser E2E Testing)
 *    - Location: __tests__/playwright/, __tests__/e2e/
 *    - Files: .spec.ts files
 *    - Why excluded: Requires browser automation, incompatible with Jest's jsdom
 *    - Run with: npx playwright test
 *
 * 2. VITEST TESTS (Vite-based Testing)
 *    - Location: __tests__/integration/shopify-ux-flow.test.ts
 *    - Why excluded: Uses Vitest API (describe/it/expect) which conflicts with Jest
 *    - Run with: npx vitest
 *
 * JEST TESTS (Unit & Integration):
 *    - Location: All other test files in __tests__ directory
 *    - Run with: npm test
 */

const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/test-utils/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
  moduleNameMapper: {
    // External dependencies
    '^@woocommerce/woocommerce-rest-api$': '<rootDir>/__mocks__/@woocommerce/woocommerce-rest-api.js',
    '^@supabase/supabase-js$': '<rootDir>/__mocks__/@supabase/supabase-js.js',
    '^@supabase/ssr$': '<rootDir>/__mocks__/@supabase/ssr.js',
    // Map cheerio to its CommonJS build to avoid ESM issues in Jest
    '^cheerio$': '<rootDir>/node_modules/cheerio/dist/commonjs/index.js',
    // Internal module mocks - MUST come before the catch-all '^@/(.*)$' pattern
    // NOTE: supabase-server and supabase/server are both mocked via jest.mock() in jest.setup.js, NOT via moduleNameMapper
    '^@/lib/supabase/client$': '<rootDir>/__mocks__/@/lib/supabase/client.ts',
    '^@/lib/autonomous/security/consent-operations$': '<rootDir>/__mocks__/@/lib/autonomous/security/consent-operations.ts',
    '^@/lib/autonomous/security/consent-manager$': '<rootDir>/__mocks__/@/lib/autonomous/security/consent-manager.ts',
    '^@/lib/autonomous/security/audit-logger$': '<rootDir>/__mocks__/@/lib/autonomous/security/audit-logger.ts',
    '^@/lib/autonomous/security/credential-vault$': '<rootDir>/__mocks__/@/lib/autonomous/security/credential-vault.ts',
    '^@/lib/autonomous/core/operation-service$': '<rootDir>/__mocks__/@/lib/autonomous/core/operation-service.ts',
    '^@/lib/encryption/crypto-core$': '<rootDir>/__mocks__/@/lib/encryption/crypto-core.ts',
    '^@/lib/woocommerce-full$': '<rootDir>/__mocks__/@/lib/woocommerce-full.ts',
    '^@/lib/woocommerce-dynamic$': '<rootDir>/__mocks__/@/lib/woocommerce-dynamic.ts',
    '^@/lib/shopify-dynamic$': '<rootDir>/__mocks__/@/lib/shopify-dynamic.ts',
    '^@/lib/embeddings$': '<rootDir>/__mocks__/@/lib/embeddings.ts',
    '^@/lib/redis$': '<rootDir>/__mocks__/@/lib/redis.js',
    '^@/lib/redis-enhanced$': '<rootDir>/__mocks__/@/lib/redis-enhanced.ts',
    // NOTE: scraper-api and scraper-with-cleanup NOW in moduleNameMapper for reliable mocking
    '^@/lib/scraper-api$': '<rootDir>/__mocks__/@/lib/scraper-api.ts',
    '^@/lib/scraper-with-cleanup$': '<rootDir>/__mocks__/@/lib/scraper-with-cleanup.ts',
    '^@/lib/middleware/csrf$': '<rootDir>/__mocks__/@/lib/middleware/csrf.ts',
    // NOTE: recommendation mocks (vector-similarity, collaborative-filter, content-filter)
    // are mocked via jest.mock() in jest.setup.js, NOT via moduleNameMapper
    // Catch-all pattern - MUST be last
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx|js)',
    '**/__tests__/**/*.spec.(ts|tsx|js)',
    '**/*.test.(ts|tsx|js)',
    '**/*.spec.(ts|tsx|js)'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/utils/',
    '/__tests__/mocks/',
    '/__tests__/fixtures/',
    // Playwright tests - use separate test runner (npx playwright test)
    // These tests require browser automation and are incompatible with Jest
    '/__tests__/playwright/', // Playwright test directory
    '/__tests__/e2e/', // E2E tests using Playwright
    '.spec.ts$', // Exclude all .spec.ts files (Playwright convention)
    // Vitest tests - use separate test runner (npx vitest)
    // These tests use Vitest API which conflicts with Jest
    '__tests__/integration/shopify-ux-flow.test.ts', // Uses Vitest describe/it/expect
    // Integration tests requiring running dev server (not suitable for pre-push)
    '__tests__/integration/agent4-correction-tracking.test.ts', // Requires dev server
    // TEMPORARY: Organizations tests have Supabase mocking issues - needs refactoring
    '__tests__/api/organizations/', // TODO: Fix Supabase mocking in these tests
    '/ARCHIVE/' // Exclude archived files and reports
  ],
  // Transform ESM packages in node_modules
  // Note: cheerio is mapped to CommonJS build above, but its dependencies may need transformation
  transformIgnorePatterns: [
    '/node_modules/(?!(parse5|dom-serializer|domhandler|domutils|entities|htmlparser2|bullmq|uuid)/)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  globals: {
    'ts-jest': {
      isolatedModules: true,
    },
  },
  // Worker configuration to prevent crashes
  maxWorkers: '50%', // Use 50% of CPU cores to prevent resource exhaustion
  workerIdleMemoryLimit: '512MB', // Kill workers if they exceed 512MB idle memory
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
