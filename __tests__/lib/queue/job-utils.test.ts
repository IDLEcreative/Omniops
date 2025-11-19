/**
 * Job Utils Tests
 * Tests job creation utilities for the queue system
 */

import { JobUtils, JobPriority } from '@/lib/queue/queue-utils';
import type { JobType } from '@/lib/queue/queue-utils';

// Mock the queue manager
jest.mock('@/lib/queue/queue-manager', () => ({
  getQueueManager: jest.fn(() => ({
    addJob: jest.fn((data: any, options: any) => ({
      id: `job-${Date.now()}`,
      data,
      opts: options || {},
    })),
  })),
  SinglePageJobData: {},
  FullCrawlJobData: {},
  RefreshJobData: {},
  JobPriority: {
    CRITICAL: 10,
    HIGH: 5,
    NORMAL: 0,
    LOW: -5,
    DEFERRED: -10,
  },
}));

describe('JobUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSinglePageJob', () => {
    it('should create a single-page job with required fields', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
      expect(result.deduplicated).toBe(false);
    });

    it('should support turbo mode option', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        metadata: { turboMode: true },
      });

      expect(result).toBeDefined();
    });

    it('should support priority option', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        priority: JobPriority.HIGH,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support delay option', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        delay: 5000,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support custom metadata', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        metadata: {
          source: 'manual',
          requestId: 'req-123',
        },
      });

      expect(result.jobId).toBeDefined();
    });

    it('should handle new customer flag', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        isNewCustomer: true,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should use default customerId if not provided', async () => {
      const result = await JobUtils.createSinglePageJob('https://example.com');

      expect(result.jobId).toBeDefined();
    });
  });

  describe('createFullCrawlJob', () => {
    it('should create a full-crawl job with required fields', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
      expect(result.deduplicated).toBe(false);
    });

    it('should support maxPages option', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
        maxPages: 50,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should use default maxPages of 100', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support depth option', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
        depth: 2,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should use default depth of 3', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support includeSubdomains option', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
        includeSubdomains: true,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support priority and delay', async () => {
      const result = await JobUtils.createFullCrawlJob('https://example.com', {
        customerId: 'customer-123',
        priority: JobPriority.CRITICAL,
        delay: 10000,
      });

      expect(result.jobId).toBeDefined();
    });
  });

  describe('createRefreshJob', () => {
    it('should create a refresh job with required fields', async () => {
      const result = await JobUtils.createRefreshJob('https://example.com', {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
      expect(result.deduplicated).toBe(false);
    });

    it('should support forceRefresh option', async () => {
      const result = await JobUtils.createRefreshJob('https://example.com', {
        customerId: 'customer-123',
        forceRefresh: true,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support fullRefresh option', async () => {
      const result = await JobUtils.createRefreshJob('https://example.com', {
        customerId: 'customer-123',
        fullRefresh: true,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support lastCrawledAt metadata', async () => {
      const lastCrawled = new Date();
      const result = await JobUtils.createRefreshJob('https://example.com', {
        customerId: 'customer-123',
        lastCrawledAt: lastCrawled,
      });

      expect(result.jobId).toBeDefined();
    });

    it('should support priority and delay', async () => {
      const result = await JobUtils.createRefreshJob('https://example.com', {
        customerId: 'customer-123',
        priority: JobPriority.LOW,
        delay: 2000,
      });

      expect(result.jobId).toBeDefined();
    });
  });

  describe('createRecurringRefreshJob', () => {
    it('should create a recurring refresh job', async () => {
      const jobId = await JobUtils.createRecurringRefreshJob(
        'https://example.com',
        '0 0 * * *',
        {
          customerId: 'customer-123',
        }
      );

      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should support custom metadata', async () => {
      const jobId = await JobUtils.createRecurringRefreshJob(
        'https://example.com',
        '0 0 * * *',
        {
          customerId: 'customer-123',
          metadata: { frequency: 'daily' },
        }
      );

      expect(jobId).toBeDefined();
    });
  });

  describe('createBatchJobs', () => {
    it('should create batch single-page jobs', async () => {
      const urls = [
        'https://example.com/page1',
        'https://example.com/page2',
        'https://example.com/page3',
      ];

      const results = await JobUtils.createBatchJobs(urls, 'single-page', {
        customerId: 'customer-123',
      });

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.jobId).toBeDefined();
        expect(result.url).toBeDefined();
        expect(result.deduplicated).toBe(false);
      });
    });

    it('should create batch full-crawl jobs', async () => {
      const urls = ['https://example1.com', 'https://example2.com'];

      const results = await JobUtils.createBatchJobs(urls, 'full-crawl', {
        customerId: 'customer-123',
        maxPages: 50,
      });

      expect(results).toHaveLength(2);
    });

    it('should create batch refresh jobs', async () => {
      const urls = ['https://example.com/page1', 'https://example.com/page2'];

      const results = await JobUtils.createBatchJobs(urls, 'refresh', {
        customerId: 'customer-123',
      });

      expect(results).toHaveLength(2);
    });

    it('should stagger batch jobs with delay', async () => {
      const urls = ['https://example.com/page1', 'https://example.com/page2'];

      const results = await JobUtils.createBatchJobs(urls, 'single-page', {
        customerId: 'customer-123',
        staggerDelay: 500,
      });

      expect(results).toHaveLength(2);
    });

    it('should use default stagger delay of 1000ms', async () => {
      const urls = ['https://example.com/page1', 'https://example.com/page2'];

      const results = await JobUtils.createBatchJobs(urls, 'single-page', {
        customerId: 'customer-123',
      });

      expect(results).toHaveLength(2);
    });

    it('should throw error for unsupported job type', async () => {
      const urls = ['https://example.com'];

      await expect(
        JobUtils.createBatchJobs(urls, 'invalid-type' as JobType, {
          customerId: 'customer-123',
        })
      ).rejects.toThrow('Unsupported job type');
    });

    it('should handle empty URLs array', async () => {
      const results = await JobUtils.createBatchJobs([], 'single-page', {
        customerId: 'customer-123',
      });

      expect(results).toHaveLength(0);
    });

    it('should support priority for batch jobs', async () => {
      const urls = ['https://example.com/page1', 'https://example.com/page2'];

      const results = await JobUtils.createBatchJobs(urls, 'single-page', {
        customerId: 'customer-123',
        priority: JobPriority.HIGH,
      });

      expect(results).toHaveLength(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long URLs', async () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000);

      const result = await JobUtils.createSinglePageJob(longUrl, {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
    });

    it('should handle special characters in URLs', async () => {
      const specialUrl = 'https://example.com/page?param=value&other=123#anchor';

      const result = await JobUtils.createSinglePageJob(specialUrl, {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
    });

    it('should handle unicode in URLs', async () => {
      const unicodeUrl = 'https://example.com/ページ';

      const result = await JobUtils.createSinglePageJob(unicodeUrl, {
        customerId: 'customer-123',
      });

      expect(result.jobId).toBeDefined();
    });

    it('should handle large metadata objects', async () => {
      const largeMetadata = {
        data: Array(100)
          .fill(0)
          .map((_, i) => ({ key: `value${i}` })),
      };

      const result = await JobUtils.createSinglePageJob('https://example.com', {
        customerId: 'customer-123',
        metadata: largeMetadata,
      });

      expect(result.jobId).toBeDefined();
    });
  });
});
