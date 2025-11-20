/**
 * Scrape API Load Tests
 *
 * Tests web scraping endpoint throughput and resource usage
 * Performance Goals:
 * - Handles 5 concurrent scrape jobs
 * - No memory leaks during sustained scraping
 * - Efficient job queue processing
 */

import { describe, it, expect } from '@jest/globals';
import { generateLoad } from '../utils/load-generator';
import { collectMetrics, collectMemoryMetrics, printMetrics, printMemoryMetrics, calculateMemoryDelta } from '../utils/metrics-collector';
import { assertResponseTime, assertNoMemoryLeak } from '../utils/assertion-helpers';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('Scrape API Load Tests', () => {
  const TEST_DOMAIN = 'test-performance.example.com';
  const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
  const describeIf = runTests ? describe : describe.skip;

  describeIf('Scrape Job Creation', () => {
    it('should handle 5 concurrent scrape job requests', async () => {
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/scrape`,
          method: 'POST',
          body: {
            domain: TEST_DOMAIN,
            url: 'https://example.com',
            maxPages: 10
          }
        },
        5,  // concurrency
        25  // total requests
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Scrape API - Job Creation');

      // Job creation should be fast (not the scraping itself)
      assertResponseTime(metrics, { p95: 1000 });
      expect(metrics.successRate).toBeGreaterThan(80);
    }, 60000);
  });

  describeIf('Scrape Status Checks', () => {
    it('should handle high-frequency status polling', async () => {
      const testJobId = 'test-job-123';

      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/scrape/status?jobId=${testJobId}`,
          method: 'GET'
        },
        20,  // high concurrency for polling
        100
      );

      const metrics = collectMetrics(results);
      printMetrics(metrics, 'Scrape API - Status Checks');

      // Status checks should be very fast
      assertResponseTime(metrics, { p95: 200 });
      expect(metrics.successRate).toBeGreaterThan(95);
    }, 60000);
  });

  describeIf('Memory Leak Detection', () => {
    it('should not leak memory during sustained scraping', async () => {
      const memoryBefore = collectMemoryMetrics();
      printMemoryMetrics(memoryBefore, 'Before Scraping');

      // Run scraping operations
      const results = await generateLoad(
        {
          url: `${BASE_URL}/api/scrape`,
          method: 'POST',
          body: {
            domain: TEST_DOMAIN,
            url: 'https://example.com',
            maxPages: 5
          }
        },
        3,
        15
      );

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const memoryAfter = collectMemoryMetrics();
      printMemoryMetrics(memoryAfter, 'After Scraping');

      const memoryDelta = calculateMemoryDelta(memoryBefore, memoryAfter);
      printMemoryMetrics(memoryDelta, 'Memory Delta');

      // Allow 100MB growth max (some growth is expected)
      assertNoMemoryLeak(memoryBefore, memoryAfter, 100);
    }, 120000);
  });

  describeIf('Concurrent Domain Scraping', () => {
    it('should handle multiple domains simultaneously', async () => {
      const domains = ['domain1.com', 'domain2.com', 'domain3.com', 'domain4.com', 'domain5.com'];

      const allResults = await Promise.all(
        domains.map(domain =>
          generateLoad(
            {
              url: `${BASE_URL}/api/scrape`,
              method: 'POST',
              body: {
                domain,
                url: `https://${domain}`,
                maxPages: 5
              }
            },
            1,
            5
          )
        )
      );

      allResults.forEach((results, index) => {
        const metrics = collectMetrics(results);
        printMetrics(metrics, `Scrape API - Domain ${domains[index]}`);

        assertResponseTime(metrics, { p95: 2000 });
      });
    }, 120000);
  });
});
