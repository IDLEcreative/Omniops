/**
 * WooCommerce Sync Performance Tests
 *
 * Tests product sync performance with WooCommerce
 * Performance Goals:
 * - Sync 100 products in < 30 seconds
 * - Batch operations efficient
 * - No API rate limiting issues
 */

import { describe, it, expect } from '@jest/globals';
import { formatDuration } from '../utils/metrics-collector';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';

describe('WooCommerce Sync Performance', () => {
  const TEST_DOMAIN = 'test-performance.example.com';
  const runTests = process.env.RUN_PERFORMANCE_TESTS === 'true';
  const describeIf = runTests ? describe : describe.skip;

  describeIf('Product Sync', () => {
    it('should sync 100 products in < 30 seconds', async () => {
      const productCount = 100;
      const startTime = performance.now();

      // Initiate sync
      const syncResponse = await fetch(`${BASE_URL}/api/woocommerce/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: TEST_DOMAIN,
          syncType: 'products',
          limit: productCount
        })
      });

      expect(syncResponse.ok).toBe(true);
      const syncResult = await syncResponse.json();

      const duration = performance.now() - startTime;

      console.log(`\n📦 Product Sync Performance:`);
      console.log(`  Products synced: ${productCount}`);
      console.log(`  Duration: ${formatDuration(duration)}`);
      console.log(`  Throughput: ${(productCount / (duration / 1000)).toFixed(2)} products/s\n`);

      expect(duration).toBeLessThan(30000);
      expect(syncResult.synced || 0).toBe(productCount);
    }, 60000);
  });

  describeIf('Batch Operations', () => {
    it('should efficiently batch product updates', async () => {
      const batchSizes = [10, 25, 50, 100];
      const results: Array<{ size: number; duration: number; throughput: number }> = [];

      for (const size of batchSizes) {
        const startTime = performance.now();

        const response = await fetch(`${BASE_URL}/api/woocommerce/batch-update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            domain: TEST_DOMAIN,
            batchSize: size,
            updates: Array.from({ length: size }, (_, i) => ({
              productId: `product-${i}`,
              stock: Math.floor(Math.random() * 100)
            }))
          })
        });

        const duration = performance.now() - startTime;
        const throughput = size / (duration / 1000);

        results.push({ size, duration, throughput });

        console.log(`Batch size ${size}: ${formatDuration(duration)} (${throughput.toFixed(2)} products/s)`);
      }

      // Larger batches should be more efficient (higher throughput)
      expect(results[3].throughput).toBeGreaterThan(results[0].throughput);
    }, 60000);
  });

  describeIf('Rate Limiting', () => {
    it('should handle WooCommerce API rate limits gracefully', async () => {
      const requestCount = 50;
      const startTime = performance.now();
      let rateLimitedCount = 0;

      // Make rapid requests to trigger rate limiting
      const promises = Array.from({ length: requestCount }, async (_, i) => {
        const response = await fetch(`${BASE_URL}/api/woocommerce/products`, {
          method: 'GET',
          headers: {
            'X-Domain': TEST_DOMAIN
          }
        });

        if (response.status === 429) {
          rateLimitedCount++;
        }

        return response;
      });

      await Promise.all(promises);

      const duration = performance.now() - startTime;

      console.log(`\n🚦 Rate Limiting Test:`);
      console.log(`  Total requests: ${requestCount}`);
      console.log(`  Rate limited: ${rateLimitedCount}`);
      console.log(`  Duration: ${formatDuration(duration)}\n`);

      // Should handle rate limiting without throwing errors
      expect(rateLimitedCount).toBeGreaterThan(0);
    }, 30000);
  });

  describeIf('Incremental Sync', () => {
    it('should efficiently sync only changed products', async () => {
      // First sync (full)
      const fullSyncStart = performance.now();
      const fullSyncResponse = await fetch(`${BASE_URL}/api/woocommerce/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: TEST_DOMAIN,
          syncType: 'products',
          fullSync: true
        })
      });
      expect(fullSyncResponse.ok).toBe(true);
      const fullSyncDuration = performance.now() - fullSyncStart;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Incremental sync (only changes)
      const incrementalStart = performance.now();
      const incrementalResponse = await fetch(`${BASE_URL}/api/woocommerce/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: TEST_DOMAIN,
          syncType: 'products',
          fullSync: false
        })
      });
      expect(incrementalResponse.ok).toBe(true);
      const incrementalDuration = performance.now() - incrementalStart;

      console.log(`\n🔄 Sync Performance Comparison:`);
      console.log(`  Full sync: ${formatDuration(fullSyncDuration)}`);
      console.log(`  Incremental sync: ${formatDuration(incrementalDuration)}`);
      console.log(`  Speedup: ${(fullSyncDuration / incrementalDuration).toFixed(2)}x\n`);

      // Incremental should be much faster
      expect(incrementalDuration).toBeLessThan(fullSyncDuration * 0.3);
    }, 60000);
  });
});
