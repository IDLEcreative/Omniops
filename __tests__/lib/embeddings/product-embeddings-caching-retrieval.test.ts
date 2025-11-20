/**
 * Product Embeddings Caching - Retrieval and Integration Tests
 *
 * Tests integration with scoreProductsBySimilarity and error handling.
 * Tests caching behavior with and without domain parameter.
 *
 * See product-embeddings-caching-hash.test.ts for hash calculation tests
 */

import { createClient } from '@supabase/supabase-js';
import {
  calculateExpectedHash,
  setupCacheHitMock,
  setupCacheMissMock,
  verifyCacheSave,
} from './helpers/embeddings-test-helpers';

// Mock Supabase client BEFORE imports
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(),
}));

// Mock embedding cache to prevent caching interference
jest.mock('@/lib/embedding-cache', () => ({
  embeddingCache: {
    get: jest.fn(() => null), // Always return null to force generation
    set: jest.fn(),
    clear: jest.fn(),
    getStats: jest.fn(() => ({ hits: 0, misses: 0, evictions: 0 })),
  },
}));

// Mock OpenAI client
const mockOpenAIEmbeddings = jest.fn();
jest.mock('@/lib/embeddings/openai-client', () => ({
  getOpenAIClient: () => ({
    embeddings: {
      create: mockOpenAIEmbeddings,
    },
  }),
}));

// Import after mocking
import { scoreProductsBySimilarity } from '@/lib/embeddings/product-embeddings';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Product Embeddings Caching - Retrieval and Integration', () => {
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

    // Default mock for OpenAI embeddings
    mockOpenAIEmbeddings.mockImplementation(async () => ({
      data: [{ embedding: new Array(1536).fill(0.1) }],
    }));
  });

  describe('scoreProductsBySimilarity - WITH Domain (Caching Enabled)', () => {
    it.skip('uses cached embeddings when available', async () => {
      const cachedEmbedding = new Array(1536).fill(0.1);
      const products = [
        { id: '123', name: 'Cached Product', short_description: '' }
      ];
      const domain = 'example.com';

      const expectedHash = calculateExpectedHash('Cached Product');
      setupCacheHitMock(mockSupabaseClient, cachedEmbedding, expectedHash);

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(mockOpenAIEmbeddings).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('similarity');
    });

    it('generates and caches embeddings on cache miss', async () => {
      const products = [
        { id: '123', name: 'New Product', short_description: '' }
      ];
      const domain = 'example.com';

      setupCacheMissMock(mockSupabaseClient);
      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(mockOpenAIEmbeddings).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'New Product',
      });
      verifyCacheSave(mockSupabaseClient, domain);
      expect(result).toHaveLength(1);
    });

    it('passes domain to cache functions', async () => {
      const domain = 'test-domain.com';
      const products = [
        { id: '456', name: 'Product', short_description: '' }
      ];

      setupCacheMissMock(mockSupabaseClient);
      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('domain', domain);
      verifyCacheSave(mockSupabaseClient, domain);
    });

    it('returns products sorted by similarity', async () => {
      const products = [
        { id: '1', name: 'Low Match', short_description: '' },
        { id: '2', name: 'High Match', short_description: '' },
        { id: '3', name: 'Medium Match', short_description: '' },
      ];
      const domain = 'example.com';

      // All cache misses - generate embeddings
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } });

      mockSupabaseClient.upsert.mockResolvedValue({ data: null, error: null });

      // Generate different embeddings with varying similarity
      mockOpenAIEmbeddings
        .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.1) }] }) // Low similarity
        .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.5) }] }) // High similarity (same as query)
        .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.3) }] }); // Medium similarity

      const queryEmbedding = new Array(1536).fill(0.5);
      const result = await scoreProductsBySimilarity(products, queryEmbedding, domain);

      // Should be sorted by similarity (highest first)
      expect(result[0].id).toBe('2'); // High Match
      expect(result[1].id).toBe('3'); // Medium Match
      expect(result[2].id).toBe('1'); // Low Match
    });
  });

  describe('scoreProductsBySimilarity - WITHOUT Domain (Caching Disabled)', () => {
    it('generates embeddings without caching', async () => {
      const products = [
        { id: '123', name: 'Product', short_description: '' }
      ];

      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      // Call WITHOUT domain
      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5));

      expect(mockOpenAIEmbeddings).toHaveBeenCalled();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(mockSupabaseClient.upsert).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('similarity');
    });

    it('works correctly when domain is undefined', async () => {
      const products = [
        { id: '123', name: 'Product', short_description: '' }
      ];

      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), undefined);

      expect(mockOpenAIEmbeddings).toHaveBeenCalled();
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });

    it('backward compatible with existing code', async () => {
      const products = [
        { id: '1', name: 'Product A', description: 'Description A' },
        { id: '2', name: 'Product B', description: 'Description B' },
      ];

      mockOpenAIEmbeddings
        .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.8) }] })
        .mockResolvedValueOnce({ data: [{ embedding: new Array(1536).fill(0.2) }] });

      // Old-style call without domain parameter
      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.8));

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1'); // Higher similarity
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling & Graceful Degradation', () => {
    it('continues scoring when caching fails', async () => {
      const products = [
        { id: '123', name: 'Product', short_description: '' }
      ];
      const domain = 'example.com';

      mockSupabaseClient.single.mockRejectedValueOnce(new Error('DB connection failed'));
      mockSupabaseClient.upsert.mockResolvedValueOnce({ data: null, error: null });
      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(result).toHaveLength(1);
      expect(mockOpenAIEmbeddings).toHaveBeenCalled();
    });

    it('continues when cache save fails', async () => {
      const products = [
        { id: '123', name: 'Product', short_description: '' }
      ];
      const domain = 'example.com';

      setupCacheMissMock(mockSupabaseClient);
      mockSupabaseClient.upsert.mockRejectedValueOnce(new Error('Write failed'));
      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('similarity');
    });

    it('handles missing environment variables gracefully', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const products = [
        { id: '123', name: 'Product', short_description: '' }
      ];
      const domain = 'example.com';

      mockOpenAIEmbeddings.mockResolvedValue({
        data: [{ embedding: new Array(1536).fill(0.1) }],
      });

      const result = await scoreProductsBySimilarity(products, new Array(1536).fill(0.5), domain);

      expect(result).toHaveLength(1);

      // Restore environment for other tests
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
    });
  });
});
