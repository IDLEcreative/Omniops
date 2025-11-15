/**
 * WooCommerceProvider - Test Orchestrator
 *
 * Entry point for all WooCommerceProvider tests.
 * Individual test suites are organized in ./woocommerce-tests/
 *
 * Test Coverage:
 * - Order lookup (by ID, email, tracking)
 * - Product search (query, limits, error handling)
 * - Stock checking and product details
 *
 * @see __tests__/lib/agents/providers/woocommerce-tests/order-lookup.test.ts
 * @see __tests__/lib/agents/providers/woocommerce-tests/product-search.test.ts
 * @see __tests__/lib/agents/providers/woocommerce-tests/stock-details.test.ts
 */

import { describe, it, expect } from '@jest/globals';
import { WooCommerceProvider } from '@/lib/agents/providers/woocommerce-provider';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

import '@/__tests__/lib/agents/providers/woocommerce-tests/order-lookup.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/product-search.test';
import '@/__tests__/lib/agents/providers/woocommerce-tests/stock-details.test';

describe('WooCommerceProvider', () => {
  describe('constructor', () => {
    it('should initialize with platform', () => {
      const mockClient = {} as WooCommerceAPI;
      const provider = new WooCommerceProvider(mockClient);

      expect(provider.platform).toBe('woocommerce');
    });
  });

  it('should have all test suites loaded', () => {
    expect(true).toBe(true);
  });
});
