/**
 * WooCommerce Cart Test API - Test Orchestrator
 *
 * Entry point for all cart-test endpoint tests.
 * Individual test suites are organized in ./cart-tests/
 *
 * Test Coverage:
 * - GET endpoint (status checks)
 * - Informational mode (Store API disabled)
 * - Cart actions (add, get, update, remove, apply coupon)
 * - Validation & error handling
 *
 * @see __tests__/api/woocommerce/cart-tests/get-endpoint.test.ts
 * @see __tests__/api/woocommerce/cart-tests/informational-mode.test.ts
 * @see __tests__/api/woocommerce/cart-tests/cart-actions.test.ts
 * @see __tests__/api/woocommerce/cart-tests/validation-errors.test.ts
 */

import {
  mockSupabaseClient,
  mockSessionManager,
  mockStoreAPIInstance,
} from '@/__tests__/utils/woocommerce/cart-test-fixtures';

// Mock setup for all cart-test suites
jest.mock('@/lib/supabase-server', () => ({
  createServiceRoleClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/cart-session-manager', () => ({
  getCartSessionManager: jest.fn(() => mockSessionManager),
}));

jest.mock('@/lib/woocommerce-store-api', () => ({
  WooCommerceStoreAPI: jest.fn(() => mockStoreAPIInstance),
}));

// Import test suites after mocks are set up
import '@/__tests__/api/woocommerce/cart-tests/get-endpoint.test';
import '@/__tests__/api/woocommerce/cart-tests/informational-mode.test';
import '@/__tests__/api/woocommerce/cart-tests/cart-actions.test';
import '@/__tests__/api/woocommerce/cart-tests/validation-errors.test';

describe('/api/woocommerce/cart-test', () => {
  it('should have all test suites loaded', () => {
    // This orchestrator ensures all tests run together
    expect(true).toBe(true);
  });
});
