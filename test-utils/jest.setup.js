// Polyfills for MSW
import './jest.setup.msw'

// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'
import { server } from '../__tests__/mocks/server'
import { setupTestEnvironment } from './env-setup'
import { setupWindowMocks } from './mocks/window-mock'
import { routerMock, headersMock } from './mocks/nextjs-mocks'
import { recommendationMocks, followUpsMock } from './mocks/lib-mocks'

// Setup test environment variables
setupTestEnvironment()

// Setup window mocks for component tests
setupWindowMocks()

// Mock @/lib/supabase-server FIRST before any imports
jest.mock('@/lib/supabase-server', () => require('./mocks/supabase-mock'));

// Also mock @/lib/supabase/server with the same implementation
jest.mock('@/lib/supabase/server', () => jest.requireMock('@/lib/supabase-server'));

// Mock ioredis FIRST to prevent real Redis connections during test imports
jest.mock('ioredis', () => require('./mocks/redis-mock'));

// Mock OpenAI to avoid browser detection issues in tests
jest.mock('openai', () => require('./mocks/openai-mock'));

// Mock Next.js router
jest.mock('next/navigation', () => routerMock);

// Mock Next.js headers and cookies
jest.mock('next/headers', () => headersMock);

// Mock recommendation algorithms for testing
jest.mock('@/lib/recommendations/vector-similarity', () => recommendationMocks['@/lib/recommendations/vector-similarity']);
jest.mock('@/lib/recommendations/collaborative-filter', () => recommendationMocks['@/lib/recommendations/collaborative-filter']);
jest.mock('@/lib/recommendations/content-filter', () => recommendationMocks['@/lib/recommendations/content-filter']);

// Mock follow-ups module for cron job tests
jest.mock('@/lib/follow-ups', () => followUpsMock['@/lib/follow-ups']);

// Establish API mocking before all tests (guarded for Node/MSW compatibility)
beforeAll(() => {
  // E2E tests (E2E_TEST=true) need real HTTP calls to dev server
  // Skip MSW server for E2E tests
  if (process.env.E2E_TEST === 'true') {
    console.log('[Jest Setup] Skipping MSW server for E2E test');
    return;
  }

  try {
    // Use 'bypass' to allow module-level mocks (OpenAI, Supabase) to work without MSW interception
    // This prevents tests from hanging when unhandled requests occur
    server.listen({ onUnhandledRequest: 'bypass' })
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[MSW] Disabled in test environment:', e?.message || e)
  }
})

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  try { server.resetHandlers() } catch {}
  jest.clearAllMocks()
})

// Clean up after the tests are finished
afterAll(() => { try { server.close() } catch {} })
