/**
 * Environment Setup for Tests
 *
 * Configures environment variables for test execution.
 * E2E tests (E2E_TEST=true) bypass this setup to use real connections.
 */

const setupTestEnvironment = () => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Mock environment variables (skip for E2E tests that need real connections)
  // E2E tests set E2E_TEST=true to bypass mocking
  if (!process.env.E2E_TEST) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-exactly-32ch';
    process.env.WOOCOMMERCE_URL = 'https://test-store.com';
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'test-consumer-key';
    process.env.REDIS_URL = 'redis://localhost:6379'; // Mock Redis URL to trigger mock client
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'test-consumer-secret';
  }
};

module.exports = {
  setupTestEnvironment,
};
