/**
 * Mock Helpers Orchestrator
 *
 * This file re-exports all mock utilities from categorized modules.
 * Maintains backward compatibility while organizing mocks by category.
 */

// Supabase mocks
import { mockSupabaseClient } from './mocks/supabase-mocks';
export { mockSupabaseClient };

// WooCommerce mocks and data factories
import {
  mockWooCommerceClient,
  createMockProduct,
  createMockOrder,
  createMockCustomer,
} from './mocks/woocommerce-mocks';
export {
  mockWooCommerceClient,
  createMockProduct,
  createMockOrder,
  createMockCustomer,
};

// API mocks
import {
  mockNextRequest,
  mockStreamResponse,
} from './mocks/api-mocks';
export {
  mockNextRequest,
  mockStreamResponse,
};

// Test environment utilities
import {
  setupTestEnv,
  cleanupTestEnv,
} from './mocks/test-env';
export {
  setupTestEnv,
  cleanupTestEnv,
};

// Default export for backward compatibility
const mockHelpers = {
  mockSupabaseClient,
  mockWooCommerceClient,
  mockNextRequest,
  mockStreamResponse,
  createMockProduct,
  createMockOrder,
  createMockCustomer,
  setupTestEnv,
  cleanupTestEnv,
};

export default mockHelpers;
