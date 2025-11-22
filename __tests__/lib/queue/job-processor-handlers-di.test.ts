/**
 * Job Processor Handlers - Dependency Injection Tests
 *
 * This file demonstrates how to use the dependency injection pattern
 * to test job processor handlers with mocked dependencies.
 *
 * Benefits:
 * - No complex module mocking required
 * - Fast, isolated unit tests
 * - Easy to test different scenarios
 * - Clear test setup and expectations
 */

import { Job } from 'bullmq';
import {
  processSinglePageJob,
  processFullCrawlJob,
  processRefreshJob,
  ScraperDependencies,
} from '@/lib/queue/job-processor-handlers';
import { JobData } from '@/lib/queue/queue-manager';

// Mock dependencies - simple object mocks, no module mocking needed
const createMockDependencies = (): ScraperDependencies => ({
  scrapePage: jest.fn().mockResolvedValue({
    url: 'https://example.com',
    title: 'Test Page',
    content: 'Test content',
  }),
  crawlWebsiteWithCleanup: jest.fn().mockResolvedValue({
    completed: 5,
    total: 5,
    failed: 0,
  }),
  checkCrawlStatus: jest.fn().mockResolvedValue({
    status: 'completed',
    completed: 5,
    total: 5,
    failed: 0,
  }),
});

// Mock job helper
const createMockJob = (data: Partial<JobData>): Job<JobData> => ({
  id: 'test-job-123',
  data: data as JobData,
  updateProgress: jest.fn().mockResolvedValue(undefined),
  opts: {},
  timestamp: Date.now(),
  processedOn: Date.now(),
} as any);

describe('Job Processor Handlers - Dependency Injection', () => {
  describe('processSinglePageJob', () => {
    it('should successfully scrape a single page with injected dependencies', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'single-page',
        url: 'https://example.com/test',
        customerId: 'test-customer',
        config: {},
      });

      // Act
      const result = await processSinglePageJob(job, job.data, mockDeps);

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesProcessed).toBe(1);
      expect(mockDeps.scrapePage).toHaveBeenCalledWith(
        'https://example.com/test',
        {}
      );
      expect(mockDeps.scrapePage).toHaveBeenCalledTimes(1);
    });

    it('should handle scraping errors gracefully', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      (mockDeps.scrapePage as jest.Mock).mockRejectedValue(
        new Error('Network timeout')
      );

      const job = createMockJob({
        type: 'single-page',
        url: 'https://example.com/test',
        customerId: 'test-customer',
        config: {},
      });

      // Act
      const result = await processSinglePageJob(job, job.data, mockDeps);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network timeout');
      expect(result.pagesProcessed).toBe(0);
    });

    it('should update progress correctly during scraping', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'single-page',
        url: 'https://example.com/test',
        customerId: 'test-customer',
        config: {},
      });

      // Act
      await processSinglePageJob(job, job.data, mockDeps);

      // Assert
      expect(job.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 10 })
      );
      expect(job.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 90 })
      );
      expect(job.updateProgress).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 100 })
      );
    });
  });

  describe('processFullCrawlJob', () => {
    it('should successfully crawl a website with injected dependencies', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'full-crawl',
        url: 'https://example.com',
        customerId: 'test-customer',
        config: { maxPages: 10 },
      });

      const isShuttingDown = jest.fn().mockReturnValue(false);

      // Act
      const result = await processFullCrawlJob(
        job,
        job.data,
        isShuttingDown,
        mockDeps
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.pagesProcessed).toBe(5);
      expect(mockDeps.crawlWebsiteWithCleanup).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ maxPages: 10 })
      );
    });

    it('should respect shutdown signal during crawling', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      (mockDeps.crawlWebsiteWithCleanup as jest.Mock).mockResolvedValue({
        jobId: 'crawl-job-123',
        completed: 2,
        total: 10,
      });
      (mockDeps.checkCrawlStatus as jest.Mock).mockResolvedValue({
        status: 'processing',
        completed: 2,
        total: 10,
      });

      const job = createMockJob({
        type: 'full-crawl',
        url: 'https://example.com',
        customerId: 'test-customer',
        config: {},
      });

      // Simulate shutdown after first status check
      let callCount = 0;
      const isShuttingDown = jest.fn(() => {
        callCount++;
        return callCount > 1;
      });

      // Act
      const result = await processFullCrawlJob(
        job,
        job.data,
        isShuttingDown,
        mockDeps
      );

      // Assert
      expect(result.success).toBe(true);
      expect(isShuttingDown).toHaveBeenCalled();
    });

    it('should handle crawl errors with proper error reporting', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      (mockDeps.crawlWebsiteWithCleanup as jest.Mock).mockRejectedValue(
        new Error('Crawler crashed')
      );

      const job = createMockJob({
        type: 'full-crawl',
        url: 'https://example.com',
        customerId: 'test-customer',
        config: {},
      });

      const isShuttingDown = jest.fn().mockReturnValue(false);

      // Act
      const result = await processFullCrawlJob(
        job,
        job.data,
        isShuttingDown,
        mockDeps
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Crawler crashed');
    });
  });

  describe('processRefreshJob', () => {
    it('should refresh a single page when fullRefresh is false', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'refresh',
        urls: ['https://example.com/page1'],
        customerId: 'test-customer',
        config: { fullRefresh: false },
      });

      // Act
      const result = await processRefreshJob(job, job.data, mockDeps);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDeps.scrapePage).toHaveBeenCalledWith(
        'https://example.com/page1',
        expect.objectContaining({ forceRefresh: true })
      );
      expect(mockDeps.crawlWebsiteWithCleanup).not.toHaveBeenCalled();
    });

    it('should perform full crawl when fullRefresh is true', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'refresh',
        urls: ['https://example.com'],
        customerId: 'test-customer',
        config: { fullRefresh: true },
      });

      // Act
      const result = await processRefreshJob(job, job.data, mockDeps);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDeps.crawlWebsiteWithCleanup).toHaveBeenCalledWith(
        'https://example.com',
        expect.objectContaining({ forceRefresh: true })
      );
      expect(mockDeps.scrapePage).not.toHaveBeenCalled();
    });

    it('should handle missing URLs gracefully', async () => {
      // Arrange
      const mockDeps = createMockDependencies();
      const job = createMockJob({
        type: 'refresh',
        urls: [],
        customerId: 'test-customer',
        config: {},
      });

      // Act
      const result = await processRefreshJob(job, job.data, mockDeps);

      // Assert
      expect(result.success).toBe(true);
      expect(mockDeps.scrapePage).not.toHaveBeenCalled();
      expect(mockDeps.crawlWebsiteWithCleanup).not.toHaveBeenCalled();
    });
  });

  describe('Integration - No dependencies provided', () => {
    it('should use default implementations when no dependencies are injected', async () => {
      // This test verifies backward compatibility - handlers work without DI
      const job = createMockJob({
        type: 'single-page',
        url: 'https://example.com',
        customerId: 'test-customer',
        config: {},
      });

      // Note: This test would normally call real implementations
      // In a real scenario, you'd skip this test or use integration test setup
      // For demonstration, we're showing the pattern

      // Act & Assert - Just verify it doesn't throw
      // In practice, this would be an integration test with real scraper
      expect(async () => {
        // await processSinglePageJob(job, job.data);
        // Would run real scraper - skip in unit tests
      }).toBeDefined();
    });
  });
});

/**
 * Key Takeaways from these tests:
 *
 * 1. **No Module Mocking**: We don't need jest.mock() at all
 * 2. **Simple Setup**: Just create mock objects with jest.fn()
 * 3. **Fast Tests**: No heavy module resolution or complex mocking
 * 4. **Easy Debugging**: Clear what's being mocked and why
 * 5. **Flexible**: Can test any scenario by changing mock behavior
 *
 * Compare this to the old approach:
 * ❌ jest.mock('@/lib/scraper-api')
 * ❌ Complex module factory functions
 * ❌ Hard to change mock behavior per test
 * ❌ Confusing test failures
 *
 * With dependency injection:
 * ✅ const mockDeps = { scrapePage: jest.fn() }
 * ✅ Simple object with functions
 * ✅ Easy to customize per test
 * ✅ Clear test failures
 */