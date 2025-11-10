/**
 * Cache Invalidation Races Test Suite
 *
 * **Purpose:** Tests for cache stampede and single-flight pattern
 * **Critical:** Prevents thundering herd problem in cache misses
 */

import { describe, it, expect } from '@jest/globals';
import { delay } from '../../utils/race-conditions/concurrency-helpers';

describe('Cache Invalidation Races', () => {
  it('should detect cache stampede', async () => {
    let cacheHits = 0;
    let dbQueries = 0;
    const cache: Record<string, any> = {};

    const getCachedData = async (key: string) => {
      if (cache[key]) {
        cacheHits++;
        return cache[key];
      }

      dbQueries++;
      await delay(50);

      const data = `data-${Date.now()}`;
      cache[key] = data;
      return data;
    };

    const results = await Promise.all(
      Array(100)
        .fill(null)
        .map(() => getCachedData('popular-key'))
    );

    expect(dbQueries).toBeGreaterThan(1);
    expect(dbQueries).toBeLessThanOrEqual(100);

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBeGreaterThanOrEqual(1);
  });

  it('should implement single-flight pattern to prevent stampede', async () => {
    let dbQueries = 0;
    const cache: Record<string, any> = {};
    const inFlight = new Map<string, Promise<any>>();

    const getCachedDataSingleFlight = async (key: string) => {
      if (cache[key]) {
        return cache[key];
      }

      if (inFlight.has(key)) {
        return await inFlight.get(key);
      }

      const promise = (async () => {
        dbQueries++;
        await delay(50);

        const data = `data-${Date.now()}`;
        cache[key] = data;
        inFlight.delete(key);
        return data;
      })();

      inFlight.set(key, promise);
      return await promise;
    };

    const results = await Promise.all(
      Array(100)
        .fill(null)
        .map(() => getCachedDataSingleFlight('popular-key'))
    );

    expect(dbQueries).toBe(1);

    const uniqueResults = new Set(results);
    expect(uniqueResults.size).toBe(1);
  });
});
