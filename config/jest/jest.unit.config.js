const path = require('path')
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: path.resolve(__dirname, '../..'),
})

// Fast unit tests without MSW overhead
const customJestConfig = {
  rootDir: path.resolve(__dirname, '../..'),
  displayName: 'Unit Tests',

  // Node environment for fast execution
  testEnvironment: 'node',

  // Setup WITHOUT MSW - this is the key performance optimization
  setupFilesAfterEnv: [
    '<rootDir>/test-utils/jest.setup.unit.js',
    // NO MSW - this eliminates 410 lines of polyfills and event listeners
  ],

  // Only run unit tests (lib, components, utils)
  testMatch: [
    '<rootDir>/__tests__/lib/**/*.test.[jt]s?(x)',
    '<rootDir>/__tests__/components/**/*.test.[jt]s?(x)',
    '<rootDir>/__tests__/utils/**/*.test.[jt]s?(x)',
  ],

  // Exclude integration and API tests
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/api/',
    '/__tests__/integration/',
    '/__tests__/e2e/',
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/utils/(.*)$': '<rootDir>/__tests__/utils/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Coverage configuration
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
  ],

  // Performance optimizations
  maxWorkers: '50%', // Use half CPU cores for parallel execution
  testTimeout: 5000, // Fast tests should complete quickly

  // Cache configuration
  cacheDirectory: '<rootDir>/.jest-cache/unit',

  // Verbose output for debugging
  verbose: false, // Keep quiet for fast runs
  silent: false,
}

// Export the config
module.exports = createJestConfig(customJestConfig)
