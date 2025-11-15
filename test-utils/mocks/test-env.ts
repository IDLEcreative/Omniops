import { jest } from '@jest/globals';

/**
 * Helper to set up common test environment variables
 */
export function setupTestEnv() {
  process.env.WOOCOMMERCE_URL = 'https://test-store.com';
  process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key';
  process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret';
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  process.env.OPENAI_API_KEY = 'test-openai-key';
}

/**
 * Helper to clean up test environment
 */
export function cleanupTestEnv() {
  // Clear all mocks
  jest.clearAllMocks();

  // Reset modules if needed
  jest.resetModules();
}
