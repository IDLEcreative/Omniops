/**
 * Mock Helpers Orchestrator
 *
 * This file re-exports all mock utilities from categorized modules.
 * Maintains backward compatibility while organizing mocks by category.
 */

// Supabase mocks
export { mockSupabaseClient } from './mocks/supabase-mocks';

// WooCommerce mocks and data factories
export {
  mockWooCommerceClient,
  createMockProduct,
  createMockOrder,
  createMockCustomer,
} from './mocks/woocommerce-mocks';

// API mocks
export {
  mockNextRequest,
  mockStreamResponse,
} from './mocks/api-mocks';

// Test environment utilities
export {
  setupTestEnv,
  cleanupTestEnv,
} from './mocks/test-env';

// Default export for backward compatibility
const mockHelpers = {
  mockSupabaseClient: require('./mocks/supabase-mocks').mockSupabaseClient,
  mockWooCommerceClient: require('./mocks/woocommerce-mocks').mockWooCommerceClient,
  mockNextRequest: require('./mocks/api-mocks').mockNextRequest,
  mockStreamResponse: require('./mocks/api-mocks').mockStreamResponse,
  createMockProduct: require('./mocks/woocommerce-mocks').createMockProduct,
  createMockOrder: require('./mocks/woocommerce-mocks').createMockOrder,
  createMockCustomer: require('./mocks/woocommerce-mocks').createMockCustomer,
  setupTestEnv: require('./mocks/test-env').setupTestEnv,
  cleanupTestEnv: require('./mocks/test-env').cleanupTestEnv,
};

export default mockHelpers;
