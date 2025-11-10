/**
 * Shared test utilities for content-based filtering tests
 */
import { jest } from '@jest/globals';

/**
 * Creates a mock Supabase client for content-filter tests
 */
export function createMockSupabaseClient() {
  const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
  };

  return mockSupabase;
}

/**
 * Sets up mock Supabase client with createClient
 */
export function setupSupabaseMock(mockCreateClient: jest.Mock, mockSupabase: any) {
  mockCreateClient.mockResolvedValue(mockSupabase);
}

/**
 * Creates mock product metadata
 */
export function createMockProductMetadata(
  productId: string,
  categories: string[] = [],
  tags: string[] = []
) {
  return {
    product_id: productId,
    metadata: {
      categories,
      tags,
    },
  };
}

/**
 * Mocks reference products response
 */
export function mockReferenceProducts(
  mockSupabase: any,
  products: Array<{ productId: string; categories: string[]; tags: string[] }>
) {
  mockSupabase.select.mockResolvedValueOnce({
    data: products.map((p) => createMockProductMetadata(p.productId, p.categories, p.tags)),
    error: null,
  });
}

/**
 * Mocks all products response for comparison
 */
export function mockAllProducts(
  mockSupabase: any,
  products: Array<{ productId: string; categories: string[]; tags: string[] }>
) {
  mockSupabase.select.mockResolvedValueOnce({
    data: products.map((p) => createMockProductMetadata(p.productId, p.categories, p.tags)),
    error: null,
  });
}
