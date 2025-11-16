/**
 * Shared test helpers for WooCommerceProvider tests
 */

import { jest } from '@jest/globals';
import type { WooCommerceAPI } from '@/lib/woocommerce-api';

/**
 * Create a mock WooCommerce client for testing
 */
export function createMockWooCommerceClient(): jest.Mocked<Partial<WooCommerceAPI>> {
  return {
    getProducts: jest.fn(),
  } as jest.Mocked<Partial<WooCommerceAPI>>;
}

/**
 * Create mock embedding provider that returns predefined embedding
 */
export function createMockEmbeddingProvider(embedding: number[]) {
  return jest.fn().mockResolvedValue(embedding);
}

/**
 * Create mock product scorer that returns predefined scored products
 */
export function createMockProductScorer(scoredProducts: any[]) {
  return jest.fn().mockResolvedValue(scoredProducts);
}
