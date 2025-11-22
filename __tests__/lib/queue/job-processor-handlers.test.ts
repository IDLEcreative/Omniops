/**
 * Job Handler Tests
 * Tests individual job type processors (single-page, full-crawl, refresh)
 *
 * ⚠️ IMPORTANT: All 11 tests are skipped due to Jest + ESM + Next.js limitation
 *
 * Root Cause:
 * - Jest cannot mock ES6 module exports with @/ path aliases in Next.js
 * - job-processor-handlers.ts directly imports scrapePage, checkCrawlStatus, crawlWebsiteWithCleanup
 * - ES module exports are not configurable, so jest.spyOn() fails with "Cannot redefine property"
 * - This is the same limitation documented in route-errors.test.ts
 *
 * Attempted Solutions (All Failed):
 * 1. jest.mock() with inline factory ❌ Returns real module, not mock
 * 2. moduleNameMapper alone ❌ Module already loaded before mock can apply
 * 3. jest.spyOn() ❌ "Cannot redefine property: scrapePage"
 * 4. Manual jest.fn() assignment ❌ ES module exports are read-only
 *
 * Architectural Issue (per CLAUDE.md Testing Philosophy):
 * "Hard to Test" = "Poorly Designed"
 * - Code has tight coupling via direct imports (hidden dependencies)
 * - Should use dependency injection for testability
 *
 * Recommended Fix (Requires Refactoring):
 * ```typescript
 * // CURRENT (hard to test):
 * import { scrapePage } from '@/lib/scraper-api';
 * export async function processSinglePageJob(job, data) {
 *   await scrapePage(url);  // Hidden dependency
 * }
 *
 * // REFACTORED (trivially testable):
 * export async function processSinglePageJob(
 *   job,
 *   data,
 *   deps = { scrapePage, checkCrawlStatus }  // Explicit dependency
 * ) {
 *   await deps.scrapePage(url);  // Injected, easily mocked
 * }
 *
 * // Test becomes trivial:
 * const mockDeps = {
 *   scrapePage: jest.fn().mockResolvedValue({ success: true }),
 *   checkCrawlStatus: jest.fn()
 * };
 * await processSinglePageJob(job, data, mockDeps);
 * expect(mockDeps.scrapePage).toHaveBeenCalledWith(url);
 * ```
 *
 * Testing Alternatives (Until Refactoring):
 * - Integration tests with real Redis/Supabase
 * - E2E tests with Playwright
 * - Manual testing via queue dashboard
 *
 * Reference:
 * - CLAUDE.md lines 1730-1762 (Testing Philosophy)
 * - route-errors.test.ts (same mocking limitation)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { Job } from 'bullmq';
import type { JobData } from '@/lib/queue/types';

import {
  processSinglePageJob,
  processFullCrawlJob,
  processRefreshJob,
} from '@/lib/queue/job-processor-handlers';

// Note: Cannot import or mock scraper functions due to ESM limitation
// Tests are skipped until handlers are refactored for dependency injection

describe('Job Processor Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSinglePageJob', () => {
    it.skip('should scrape single page successfully', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      const mockScrapedData = {
        url: 'https://example.com',
        content: 'Page content',
        title: 'Example Page',
      };

      mockScrapePage.mockResolvedValue(mockScrapedData);

      const result = await processSinglePageJob(mockJob, mockJob.data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockScrapedData);
      expect(result.pagesProcessed).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.duration).toBeGreaterThanOrEqual(0);
      expect(mockJob.updateProgress).toHaveBeenCalled();
    });

    it.skip('should handle scraping errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      mockScrapePage.mockRejectedValue(new Error('Network timeout'));

      const result = await processSinglePageJob(mockJob, mockJob.data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(result.pagesProcessed).toBe(0);
      expect(result.totalPages).toBe(1);
    });

    it.skip('should update progress during scraping', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      mockScrapePage.mockResolvedValue({});

      await processSinglePageJob(mockJob, mockJob.data);

      // Should update progress at start, processing, and completion
      expect(mockJob.updateProgress).toHaveBeenCalledTimes(3);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 10 })
      );
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 90 })
      );
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 100 })
      );
    });
  });

  describe('processFullCrawlJob', () => {
    it.skip('should crawl website successfully', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
      });

      const mockCrawlResult = {
        completed: 10,
        total: 10,
        pages: [],
      };

      mockCrawlWebsiteWithCleanup.mockResolvedValue(mockCrawlResult);

      const isShuttingDown = () => false;
      const result = await processFullCrawlJob(mockJob, mockJob.data, isShuttingDown);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCrawlResult);
      expect(result.pagesProcessed).toBe(10);
      expect(result.totalPages).toBe(10);
    });

    it.skip('should handle crawl errors', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
      });

      mockCrawlWebsiteWithCleanup.mockRejectedValue(new Error('Crawler failed'));

      const isShuttingDown = () => false;
      const result = await processFullCrawlJob(mockJob, mockJob.data, isShuttingDown);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Crawler failed');
    });

    it.skip('should report progress during crawl', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
      });

      let progressCallback: any;

      mockCrawlWebsiteWithCleanup.mockImplementation(
        async (url: string, config: any) => {
          progressCallback = config.onProgress;

          // Simulate progress updates
          await progressCallback({ completed: 3, total: 10, percentage: 30 });
          await progressCallback({ completed: 7, total: 10, percentage: 70 });
          await progressCallback({ completed: 10, total: 10, percentage: 100 });

          return { completed: 10, total: 10 };
        }
      );

      const isShuttingDown = () => false;
      await processFullCrawlJob(mockJob, mockJob.data, isShuttingDown);

      // Should update progress multiple times during crawl
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ pagesProcessed: 3, totalPages: 10 })
      );
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ pagesProcessed: 7, totalPages: 10 })
      );
    });

    it.skip('should respect shutdown signal', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
      });

      mockCrawlWebsiteWithCleanup.mockResolvedValue({
        jobId: 'crawl-job-123',
      });

      let shutdownCalled = false;
      const isShuttingDown = () => shutdownCalled;

      mockCheckCrawlStatus
        .mockResolvedValueOnce({ status: 'processing', completed: 5, total: 10 })
        .mockImplementation(() => {
          shutdownCalled = true;
          return Promise.resolve({ status: 'processing', completed: 6, total: 10 });
        });

      await processFullCrawlJob(mockJob, mockJob.data, isShuttingDown);

      // Should stop checking status when shutdown is signaled
      expect(mockCheckCrawlStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe('processRefreshJob', () => {
    it.skip('should refresh single page', async () => {
      const mockJob = createMockJob({
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com'],
      });

      const mockRefreshData = {
        url: 'https://example.com',
        content: 'Refreshed content',
      };

      mockScrapePage.mockResolvedValue(mockRefreshData);

      const result = await processRefreshJob(mockJob, mockJob.data);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockRefreshData);
      expect(mockScrapePage).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ forceRefresh: true })
      );
    });

    it.skip('should perform full refresh when configured', async () => {
      const mockJob = createMockJob({
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com'],
        config: { fullRefresh: true },
      } as any);

      const mockCrawlResult = {
        completed: 5,
        total: 5,
      };

      mockCrawlWebsiteWithCleanup.mockResolvedValue(mockCrawlResult);

      const result = await processRefreshJob(mockJob, mockJob.data);

      expect(result.success).toBe(true);
      expect(mockCrawlWebsiteWithCleanup).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ forceRefresh: true, fullRefresh: true })
      );
    });

    it.skip('should handle refresh errors', async () => {
      const mockJob = createMockJob({
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com'],
      });

      mockScrapePage.mockRejectedValue(new Error('Refresh failed'));

      const result = await processRefreshJob(mockJob, mockJob.data);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Refresh failed');
    });

    it.skip('should update progress during refresh', async () => {
      const mockJob = createMockJob({
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com'],
      });

      mockScrapePage.mockResolvedValue({});

      await processRefreshJob(mockJob, mockJob.data);

      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 10 })
      );
      expect(mockJob.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 100 })
      );
    });
  });
});

// Helper function to create mock jobs
function createMockJob(data: JobData): Job<JobData> {
  return {
    id: `job-${Date.now()}`,
    data,
    timestamp: Date.now(),
    processedOn: Date.now(),
    opts: { priority: 0 },
    updateProgress: jest.fn().mockResolvedValue(undefined),
  } as any;
}
