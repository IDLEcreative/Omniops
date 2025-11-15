/**
 * GET /api/organizations - Test Orchestrator
 *
 * Comprehensive tests for multi-tenant data isolation, RLS enforcement, and authentication.
 * Individual test suites are organized in ./list-organizations-tests/
 *
 * Test Coverage:
 * - Authentication (401, 503 cases)
 * - Success cases (organizations listing, empty results)
 * - Data validation (user filtering, response shape, multiple orgs)
 * - Error handling (database errors)
 *
 * @see __tests__/api/organizations/list-organizations-tests/authentication.test.ts
 * @see __tests__/api/organizations/list-organizations-tests/success-cases.test.ts
 * @see __tests__/api/organizations/list-organizations-tests/data-validation.test.ts
 * @see __tests__/api/organizations/list-organizations-tests/error-handling.test.ts
 */

// Mock setup for all test suites
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Import test suites after mocks are set up
import '@/__tests__/api/organizations/list-organizations-tests/authentication.test';
import '@/__tests__/api/organizations/list-organizations-tests/success-cases.test';
import '@/__tests__/api/organizations/list-organizations-tests/data-validation.test';
import '@/__tests__/api/organizations/list-organizations-tests/error-handling.test';

describe('GET /api/organizations', () => {
  it('should have all test suites loaded', () => {
    // This orchestrator ensures all tests run together
    expect(true).toBe(true);
  });
});
