/**
 * Job Handler Tests
 * Tests individual job type processors (single-page, full-crawl, refresh)
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Job } from 'bullmq';
import {
  processSinglePageJob,
  processFullCrawlJob,
  processRefreshJob,
} from '@/lib/queue/job-processor-handlers';
import type { JobData, SinglePageJobData, FullCrawlJobData, RefreshJobData } from '@/lib/queue/types';

// Create mock functions
const mockScrapePage = jest.fn();
const mockCheckCrawlStatus = jest.fn();
const mockCrawlWebsiteWithCleanup = jest.fn();

// Mock scraper functions
jest.mock('@/lib/scraper-api', () => ({
  scrapePage: mockScrapePage,
  checkCrawlStatus: mockCheckCrawlStatus,
}));

jest.mock('@/lib/scraper-with-cleanup', () => ({
  crawlWebsiteWithCleanup: mockCrawlWebsiteWithCleanup,
}));

import { scrapePage, checkCrawlStatus } from '@/lib/scraper-api';
import { crawlWebsiteWithCleanup } from '@/lib/scraper-with-cleanup';

describe('Job Processor Handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processSinglePageJob', () => {
    it('should scrape single page successfully', async () => {
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

    it('should handle scraping errors', async () => {
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

    it('should update progress during scraping', async () => {
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
    it('should crawl website successfully', async () => {
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

    it('should handle crawl errors', async () => {
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

    it('should report progress during crawl', async () => {
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

    it('should respect shutdown signal', async () => {
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
      expect(checkCrawlStatus).toHaveBeenCalledTimes(2);
    });
  });

  describe('processRefreshJob', () => {
    it('should refresh single page', async () => {
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
      expect(scrapePage).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ forceRefresh: true })
      );
    });

    it('should perform full refresh when configured', async () => {
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
      expect(crawlWebsiteWithCleanup).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ forceRefresh: true, fullRefresh: true })
      );
    });

    it('should handle refresh errors', async () => {
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

    it('should update progress during refresh', async () => {
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
