/**
 * Shared Test Utilities for WooCommerce Operations Tests
 *
 * Contains mock setup, shared context objects, and common helpers
 * used across all WooCommerce operation test files.
 */

import { ExecutionContext } from '../../shared/types';
import { executeWooCommerceOperation } from '@/lib/chat/woocommerce-tool';
import { normalizeDomain } from '@/lib/chat/tool-handlers/domain-utils';

// Mock dependencies
jest.mock('@/lib/chat/woocommerce-tool');
jest.mock('@/lib/chat/tool-handlers/domain-utils');
jest.mock('../../shared/utils/logger', () => ({
  logToolExecution: jest.fn(),
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    elapsed: jest.fn().mockReturnValue(150)
  }))
}));

// Export mocked functions for use in test files
export const mockExecuteWooCommerceOperation = executeWooCommerceOperation as jest.MockedFunction<typeof executeWooCommerceOperation>;
export const mockNormalizeDomain = normalizeDomain as jest.MockedFunction<typeof normalizeDomain>;

// Shared mock context
export const mockContext: ExecutionContext = {
  customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
  domain: 'thompsonseparts.co.uk',
  platform: 'woocommerce',
  traceId: 'test-trace-123'
};

// Common setup function
export function setupMocks() {
  jest.clearAllMocks();
  mockNormalizeDomain.mockImplementation((domain) => {
    if (domain?.includes('localhost') || domain === '') return '';
    return domain?.replace(/^https?:\/\//, '').replace(/^www\./, '').toLowerCase() || '';
  });
  mockNormalizeDomain.mockReturnValue('thompsonseparts.co.uk');
}

// Common test data generators
export const createMockProduct = (overrides = {}) => ({
  id: 123,
  name: 'Hydraulic Pump A4VTG90',
  sku: 'MU110667601',
  price: '1250.00',
  ...overrides
});

export const createMockOrder = (overrides = {}) => ({
  id: 12345,
  number: '12345',
  status: 'processing',
  total: '149.99',
  currency: 'GBP',
  ...overrides
});

export const createMockCart = (overrides = {}) => ({
  cartId: 'cart-123',
  itemCount: 1,
  subtotal: '150.00',
  tax: '30.00',
  total: '180.00',
  ...overrides
});

// Common response builders
export const createSuccessResponse = (data: any, message = 'Success') => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (message = 'Operation failed') => ({
  success: false,
  data: null,
  message
});

// Test assertions helper
export const expectSuccessResult = (result: any) => {
  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
  expect(result.metadata).toBeDefined();
};

export const expectErrorResult = (result: any, errorCode = 'WOOCOMMERCE_OPERATION_ERROR') => {
  expect(result.success).toBe(false);
  expect(result.error).toBeDefined();
  expect(result.error?.code).toBe(errorCode);
};

// Performance testing helper
export const measureExecutionTime = async (fn: () => Promise<any>) => {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
};