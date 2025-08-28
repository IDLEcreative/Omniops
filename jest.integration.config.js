const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Custom Jest configuration for integration tests
const customJestConfig = {
  // Use the integration test environment
  displayName: 'Integration Tests',
  
  // Test environment
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/jest.setup.js',
    '<rootDir>/__tests__/utils/integration-setup.js'
  ],
  
  // Test patterns - only run integration tests
  testMatch: [
    '<rootDir>/__tests__/integration/**/*.test.[jt]s?(x)',
  ],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/__tests__/utils/$1',
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  
  // Files to ignore
  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
    '<rootDir>/__tests__/unit/',
    '<rootDir>/__tests__/api/',
    '<rootDir>/__tests__/app/',
    '<rootDir>/__tests__/lib/',
  ],
  
  // Module paths to ignore
  modulePathIgnorePatterns: [
    '<rootDir>/.next/',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    '!lib/**/*.d.ts',
    '!lib/**/*.test.{js,jsx,ts,tsx}',
    '!lib/**/__tests__/**',
    '!**/*.config.{js,ts}',
    '!**/node_modules/**',
  ],
  
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Coverage thresholds (relaxed for integration tests)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
  
  // Test timeout for integration tests (longer than unit tests)
  testTimeout: 120000, // 2 minutes
  
  // Verbose output for integration tests
  verbose: true,
  
  // Detect open handles (important for integration tests)
  detectOpenHandles: true,
  
  // Force exit after tests complete
  forceExit: true,
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Global setup and teardown
  globalSetup: '<rootDir>/__tests__/utils/global-setup.js',
  globalTeardown: '<rootDir>/__tests__/utils/global-teardown.js',
  
  // Handle ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  
  // Module directories
  moduleDirectories: ['node_modules', '<rootDir>/'],
  
  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Resolver
  resolver: undefined,
  
  // Mock configuration
  automock: false,
  
  // Error handling
  bail: false, // Continue running tests even if some fail
  
  // Snapshot serializers (if needed)
  snapshotSerializers: [],
  
  // Watch plugins (for development)
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  
  // Performance hints
  maxWorkers: '50%', // Use 50% of available cores for stability
  
  // Cache directory
  cacheDirectory: '<rootDir>/.jest-cache/integration',
  
  // Additional configuration for Next.js and TypeScript
  preset: undefined,
  
  // Handle static assets
  moduleNameMapping: {
    ...require('next/jest')().moduleNameMapping,
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/jest.env.js'],
}

// Create the Jest config
module.exports = createJestConfig(customJestConfig)