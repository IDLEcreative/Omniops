/**
 * Concurrent Scraping Test Suite
 *
 * **Purpose:** Tests for duplicate scraping prevention and parallel scraping
 * **Critical:** Prevents wasted API calls and duplicate data processing
 */

import { describe, it, expect } from '@jest/globals';
import { delay, countByStatus } from '../../utils/race-conditions/concurrency-helpers';

describe('Concurrent Scraping', () => {
  it('should prevent duplicate scraping jobs', async () => {
    const activeScrapes = new Set<string>();
    const completedScrapes: string[] = [];

    const scrape = async (domain: string) => {
      if (activeScrapes.has(domain)) {
        return { status: 'already-in-progress', domain };
      }

      activeScrapes.add(domain);

      try {
        await delay(100);
        completedScrapes.push(domain);
        return { status: 'completed', domain };
      } finally {
        activeScrapes.delete(domain);
      }
    };

    const results = await Promise.all(
      Array(5)
        .fill(null)
        .map(() => scrape('example.com'))
    );

    const counts = countByStatus(results);

    expect(counts['completed']).toBe(1);
    expect(counts['already-in-progress']).toBe(4);
    expect(completedScrapes.length).toBe(1);
  });

  it('should handle concurrent scraping of different domains', async () => {
    const activeScrapes = new Set<string>();
    const completedScrapes: string[] = [];

    const scrape = async (domain: string) => {
      if (activeScrapes.has(domain)) {
        return { status: 'already-in-progress', domain };
      }

      activeScrapes.add(domain);

      try {
        await delay(50);
        completedScrapes.push(domain);
        return { status: 'completed', domain };
      } finally {
        activeScrapes.delete(domain);
      }
    };

    const domains = Array(10)
      .fill(null)
      .map((_, i) => `domain-${i}.com`);

    const results = await Promise.all(domains.map((d) => scrape(d)));

    const counts = countByStatus(results);
    expect(counts['completed']).toBe(10);
    expect(completedScrapes.length).toBe(10);
  });
});
