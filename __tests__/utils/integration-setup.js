/**
 * Integration Test Setup
 * Additional setup for integration tests specifically
 */

import { jest } from '@jest/globals'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
// This overrides the mock env vars from test-utils/jest.setup.js
config({ path: resolve(process.cwd(), '.env.local'), override: true })

// Set longer timeout for integration tests
jest.setTimeout(120000) // 2 minutes

// Log that we're using real credentials (not mocks)
console.log('[Integration Tests] Using REAL Supabase credentials from .env.local');
console.log('[Integration Tests] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...');
console.log('[Integration Tests] Has service key:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

// Mock console methods to reduce noise during tests
const originalConsoleError = console.error
const originalConsoleWarn = console.warn
const originalConsoleLog = console.log

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn()
  console.warn = jest.fn()
  console.log = jest.fn()
})

afterEach(() => {
  // Restore console methods after each test
  console.error = originalConsoleError
  console.warn = originalConsoleWarn
  console.log = originalConsoleLog
})

// Mock environment variables for consistent testing (but keep real Supabase credentials)
process.env.NODE_ENV = 'test'
// Supabase credentials loaded from .env.local above
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-openai-key'

// Global test utilities
global.testUtils = {
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  waitFor: async (condition, timeout = 10000) => {
    const start = Date.now()
    while (Date.now() - start < timeout) {
      if (await condition()) return true
      await global.testUtils.sleep(100)
    }
    throw new Error('Condition not met within timeout')
  },
  
  retry: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn()
      } catch (error) {
        if (i === retries - 1) throw error
        await global.testUtils.sleep(delay * Math.pow(2, i))
      }
    }
  }
}

// Mock external services that might cause issues in CI/CD
jest.mock('ioredis', () => {
  return jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    exists: jest.fn(),
    flushall: jest.fn(),
    quit: jest.fn(),
    on: jest.fn(),
  }))
})

// DO NOT mock Supabase for integration tests - we need real DB calls for RLS testing
// Supabase mocking is only for unit tests

// Mock OpenAI client
jest.mock('openai', () => {
  return jest.fn(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mock AI response' } }]
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: Array(1536).fill(0.1) }]
      })
    }
  }))
})

// Supabase Auth API requests are now handled by the main MSW server in __tests__/mocks/server.ts
// The handlers are configured to use passthrough() for RLS testing

// Performance monitoring for integration tests
let performanceStart = Date.now()

beforeAll(() => {
  performanceStart = Date.now()
  console.log('🚀 Starting integration tests...')
})

afterAll(() => {
  const duration = Date.now() - performanceStart
  console.log(`✅ Integration tests completed in ${duration}ms`)
  
  // Force cleanup of any remaining handles
  if (global.gc) {
    global.gc()
  }
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})