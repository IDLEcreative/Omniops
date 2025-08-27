/**
 * Integration Test Setup
 * Additional setup for integration tests specifically
 */

import { jest } from '@jest/globals'

// Set longer timeout for integration tests
jest.setTimeout(120000) // 2 minutes

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

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test'
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.REDIS_URL = 'redis://localhost:6379'
process.env.OPENAI_API_KEY = 'test-openai-key'

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

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null })
  }))
}))

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