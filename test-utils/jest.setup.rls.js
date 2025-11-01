/* eslint-disable @typescript-eslint/no-require-imports */

/**
 * Jest setup for RLS integration tests
 *
 * These tests require REAL Supabase credentials to validate RLS policies.
 * They should NOT use mocked environment variables.
 */

// Mark as E2E test BEFORE other setup files run
process.env.E2E_TEST = 'true';

// Import the main Jest setup (which will skip mocking when E2E_TEST is set)
require('./jest.setup');
