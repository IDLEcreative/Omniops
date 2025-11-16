/**
 * Product Embeddings Caching - Hash Calculation Tests
 *
 * Tests MD5 hash generation and validation for cache invalidation.
 * Tests cache retrieval with hash validation.
 *
 * See product-embeddings-caching-retrieval.test.ts for:
 * - Integration with scoreProductsBySimilarity
 * - Error handling and graceful degradation
 */

import { createClient } from '@supabase/supabase-js';
import {
  calculateExpectedHash,
  setupCacheHitMock,
  setupCacheMissMock,
  setupHashMismatchMock,
  verifyAccessTracking,
} from './helpers/embeddings-test-helpers';

// Mock Supabase client BEFORE imports
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock embedding generation
const mockGenerateProductEmbedding = jest.fn();
jest.mock('@/lib/embeddings/product-embeddings', () => {
  const actual = jest.requireActual('@/lib/embeddings/product-embeddings');
  return {
    ...actual,
    generateProductEmbedding: (...args: any[]) => mockGenerateProductEmbedding(...args),
  };
});

// Import after mocking
import { scoreProductsBySimilarity } from '@/lib/embeddings/product-embeddings';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe.skip('Product Embeddings Caching - Hash Calculation', () => {
  let mockSupabaseClient: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn(),
      raw: jest.fn((sql: string) => sql),
    };

    mockCreateClient.mockReturnValue(mockSupabaseClient as any);
  });

  describe('Hash Calculation (calculateHash)', () => {
    it('generates consistent MD5 hash for same input', async () => {
      const productText = 'Test Product Description';
      const productId = '123';
      const domain = 'example.com';

      // First call - cache miss, should generate and save
      setupCacheMissMock(mockSupabaseClient);
      const mockEmbedding = new Array(1536).fill(0.1);
      mockGenerateProductEmbedding.mockResolvedValue(mockEmbedding);

      const products = [
        { id: productId, name: productText, short_description: '' }
      ];
      // Query embedding must match product embedding dimensions
      const queryEmbedding = new Array(1536).fill(0.5);

      await scoreProductsBySimilarity(products, queryEmbedding, domain);

      expect(mockSupabaseClient.upsert).toHaveBeenCalled();

      // Second call with SAME text - cache should hit
      const savedHash = mockSupabaseClient.upsert.mock.calls[0][0].product_text_hash;
      setupCacheHitMock(mockSupabaseClient, mockEmbedding, savedHash);

      jest.clearAllMocks();
      await scoreProductsBySimilarity(products, queryEmbedding, domain);

      // Should NOT generate new embedding (cache hit)
      expect(mockGenerateProductEmbedding).not.toHaveBeenCalled();
    });

    it('generates different hash for different input', async () => {
      const productId = '123';
      const domain = 'example.com';

      // First product
      setupCacheMissMock(mockSupabaseClient);
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.1));

      const products1 = [
        { id: productId, name: 'Product A', short_description: 'Description A' }
      ];

      await scoreProductsBySimilarity(products1, new Array(1536).fill(0.5), domain);
      const hash1 = mockSupabaseClient.upsert.mock.calls[0][0].product_text_hash;

      // Second product with different text
      jest.clearAllMocks();
      setupCacheMissMock(mockSupabaseClient);
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.2));

      const products2 = [
        { id: productId, name: 'Product B', short_description: 'Description B' }
      ];

      await scoreProductsBySimilarity(products2, new Array(1536).fill(0.5), domain);
      const hash2 = mockSupabaseClient.upsert.mock.calls[0][0].product_text_hash;

      // Hashes should be different
      expect(hash1).not.toBe(hash2);
    });

    it('handles empty strings', async () => {
      const productId = '123';
      const domain = 'example.com';

      setupCacheMissMock(mockSupabaseClient);
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.1));

      const products = [
        { id: productId, name: '', short_description: '' }
      ];

      await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      // Should still generate a hash (even for empty string)
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
      expect(mockSupabaseClient.upsert.mock.calls[0][0]).toHaveProperty('product_text_hash');
    });
  });

  describe('Cache Retrieval (getCachedEmbedding)', () => {
    it('returns cached embedding when valid cache exists', async () => {
      const cachedEmbedding = new Array(1536).fill(0.1);
      const productText = 'Test Product';
      const productId = '123';
      const domain = 'example.com';

      const expectedHash = calculateExpectedHash('Test Product ');
      setupCacheHitMock(mockSupabaseClient, cachedEmbedding, expectedHash);

      const products = [
        { id: productId, name: productText, short_description: '' }
      ];

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(result).toHaveLength(1);
      expect(mockGenerateProductEmbedding).not.toHaveBeenCalled();
      verifyAccessTracking(mockSupabaseClient);
    });

    it('returns null when no cache entry exists', async () => {
      const productId = '123';
      const domain = 'example.com';

      setupCacheMissMock(mockSupabaseClient);
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.1));

      const products = [
        { id: productId, name: 'New Product', short_description: '' }
      ];

      await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(mockGenerateProductEmbedding).toHaveBeenCalled();
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
    });

    it('returns null when product text has changed (hash mismatch)', async () => {
      const productId = '123';
      const domain = 'example.com';

      setupHashMismatchMock(mockSupabaseClient, 'old-hash-value', new Array(1536).fill(0.1));
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.4));

      const products = [
        { id: productId, name: 'Updated Product Text', short_description: '' }
      ];

      await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      // Should regenerate embedding (hash mismatch = cache invalidation)
      expect(mockGenerateProductEmbedding).toHaveBeenCalled();
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
    });

    it('updates access tracking on cache hit', async () => {
      const cachedEmbedding = new Array(1536).fill(0.1);
      const productText = 'Test Product';
      const productId = '123';
      const domain = 'example.com';

      const expectedHash = calculateExpectedHash('Test Product ');
      setupCacheHitMock(mockSupabaseClient, cachedEmbedding, expectedHash);

      const products = [
        { id: productId, name: productText, short_description: '' }
      ];

      await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      verifyAccessTracking(mockSupabaseClient);
    });

    it('handles database errors gracefully', async () => {
      const productId = '123';
      const domain = 'example.com';

      mockSupabaseClient.single.mockRejectedValueOnce(new Error('Database connection failed'));
      mockSupabaseClient.upsert.mockResolvedValueOnce({ data: null, error: null });
      mockGenerateProductEmbedding.mockResolvedValue(new Array(1536).fill(0.1));

      const products = [
        { id: productId, name: 'Product', short_description: '' }
      ];

      // Should not throw error
      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(mockGenerateProductEmbedding).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });
});
