/**
 * Shared Test Helpers for getProductDetails Tests
 *
 * Purpose: Common mock objects, providers, and setup used across all product details tests
 * Related: All test files in __tests__/commerce/products/
 */

import { ExecutionContext } from '../../../servers/commerce/shared/types';

/**
 * Standard execution context for testing
 */
export const mockContext: ExecutionContext = {
  customerId: '8dccd788-1ec1-43c2-af56-78aa3366bad3',
  domain: 'thompsonseparts.co.uk',
  platform: 'woocommerce',
  traceId: 'test-trace-123'
};

/**
 * Mock WooCommerce provider with all required methods
 */
export const mockWooCommerceProvider = {
  platform: 'woocommerce',
  getProductDetails: jest.fn(),
  lookupOrder: jest.fn(),
  searchProducts: jest.fn(),
  checkStock: jest.fn(),
};

/**
 * Mock Shopify provider with all required methods
 */
export const mockShopifyProvider = {
  platform: 'shopify',
  getProductDetails: jest.fn(),
  lookupOrder: jest.fn(),
  searchProducts: jest.fn(),
  checkStock: jest.fn(),
};

/**
 * Standard product data returned by commerce providers
 */
export const mockProductData = {
  id: '12345',
  name: 'Hydraulic Pump A4VTG90',
  sku: 'MU110667601',
  price: '1250.00',
  description: 'High-performance hydraulic pump',
  permalink: 'https://thompsonseparts.co.uk/products/a4vtg90'
};

/**
 * Formatted result after processing product data
 */
export const mockFormattedResult = {
  content: 'Hydraulic Pump A4VTG90\nPrice: 1250.00\nSKU: MU110667601',
  url: 'https://thompsonseparts.co.uk/products/a4vtg90',
  title: 'Hydraulic Pump A4VTG90',
  similarity: 0.9
};

/**
 * Semantic search results
 */
export const mockSemanticResults = [
  {
    content: 'Product information about A4VTG90 pump',
    url: 'https://thompsonseparts.co.uk/products/a4vtg90',
    title: 'A4VTG90 Details',
    similarity: 0.85
  }
];
