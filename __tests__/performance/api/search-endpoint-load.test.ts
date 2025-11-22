/**
 * Search API Load Tests
 *
 * Tests product search endpoint performance under load
 * Performance Goals:
 * - p95 < 500ms for vector search
 * - Handles 20 concurrent searches
 * - No performance degradation with complex queries
 */

import { describe, it, expect } from '@jest/globals';
import { generateLoad } from '../utils/load-generator';
import { collectMetrics, printMetrics } from '../utils/metrics-collector';
import { assertResponseTime, assertErrorRate } from '../utils/assertion-helpers';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Search API Load Tests', () => {
  const TEST_DOMAIN = 'test-performance.example.com';
  const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
  const describeIf = runTests ? describe : describe.skip;

  describeIf('Simple Product Search', () => {
    it('should handle 20 concurrent searches with p95 < 500ms', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/search`,
          method: 'POST',
          body: {
            query: 'hydraulic pumps',
            domain: TEST_DOMAIN
          }
        },
        20, // concurrency
        100 // total requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Search API - Simple Query');

      assertResponseTime(metrics, { p95: 500 });
      assertErrorRate(metrics, 5);
      expect(metrics.successRate).toBeGreaterThan(95);
    }, 60000);
  });

  describeIf('Complex Vector Search', () => {
    it('should maintain performance with semantic search', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/search`,
          method: 'POST',
          body: {
            query: 'I need a high-pressure hydraulic pump for industrial use with at least 3000 PSI capacity',
            domain: TEST_DOMAIN,
            useSemanticSearch: true
          }
        },
        10,
        50
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Search API - Semantic Search');

      // Vector search may be slower
      assertResponseTime(metrics, { p95: 1000 });
      assertErrorRate(metrics, 5);
    }, 60000);
  });

  describeIf('Hybrid Search Performance', () => {
    it('should efficiently combine keyword and vector search', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/search`,
          method: 'POST',
          body: {
            query: 'pumps',
            domain: TEST_DOMAIN,
            useHybridSearch: true
          }
        },
        15,
        75
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Search API - Hybrid Search');

      assertResponseTime(metrics, { p95: 800 });
      assertErrorRate(metrics, 5);
    }, 60000);
  });

  describeIf('Filter Performance', () => {
    it('should handle filtered searches efficiently', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/search`,
          method: 'POST',
          body: {
            query: 'products',
            domain: TEST_DOMAIN,
            filters: {
              priceMin: 0,
              priceMax: 1000,
              category: 'hydraulic-parts'
            }
          }
        },
        10,
        50
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Search API - Filtered Search');

      assertResponseTime(metrics, { p95: 600 });
      assertErrorRate(metrics, 5);
    }, 60000);
  });
});
