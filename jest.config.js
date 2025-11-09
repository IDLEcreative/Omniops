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
    // Map cheerio to its CommonJS build to avoid ESM issues in Jest
    '^cheerio$': '<rootDir>/node_modules/cheerio/dist/commonjs/index.js',
    // Internal module mocks - MUST come before the catch-all '^@/(.*)$' pattern
    // NOTE: supabase-server is mocked via jest.mock() in jest.setup.js, NOT via moduleNameMapper
    '^@/lib/supabase/server$': '<rootDir>/__mocks__/@/lib/supabase/server.ts',
    '^@/lib/woocommerce-full$': '<rootDir>/__mocks__/@/lib/woocommerce-full.ts',
    '^@/lib/woocommerce-dynamic$': '<rootDir>/__mocks__/@/lib/woocommerce-dynamic.ts',
    '^@/lib/shopify-dynamic$': '<rootDir>/__mocks__/@/lib/shopify-dynamic.ts',
    '^@/lib/embeddings$': '<rootDir>/__mocks__/@/lib/embeddings.ts',
    '^@/lib/redis$': '<rootDir>/__mocks__/@/lib/redis.js',
    '^@/lib/redis-enhanced$': '<rootDir>/__mocks__/@/lib/redis-enhanced.ts',
    // NOTE: scraper-api and scraper-with-cleanup are mocked via jest.mock() in test-setup.ts
    // NOT via moduleNameMapper, so they can be properly spied on
    '^@/lib/middleware/csrf$': '<rootDir>/__mocks__/@/lib/middleware/csrf.ts',
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
    '/__tests__/playwright/', // Exclude Playwright tests (use npx playwright test)
    '.spec.ts$', // Exclude all .spec.ts files (Playwright convention)
    '/ARCHIVE/' // Exclude archived files and reports
  ],
  // Transform ESM packages in node_modules
  // Note: cheerio is mapped to CommonJS build above, but its dependencies may need transformation
  transformIgnorePatterns: [
    '/node_modules/(?!(parse5|dom-serializer|domhandler|domutils|entities|htmlparser2)/)',
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
