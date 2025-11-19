/**
 * Queue Types Tests
 * Tests type definitions, enums, and interfaces for the queue system
 */

import {
  JobPriority,
  JobType,
  JobStatus,
  BaseJobData,
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobData,
  QueueManagerConfig,
} from '@/lib/queue/types';

describe('Queue Types', () => {
  describe('JobPriority enum', () => {
    it('should have correct priority levels', () => {
      expect(JobPriority.CRITICAL).toBe(10);
      expect(JobPriority.HIGH).toBe(5);
      expect(JobPriority.NORMAL).toBe(0);
      expect(JobPriority.LOW).toBe(-5);
      expect(JobPriority.DEFERRED).toBe(-10);
    });

    it('should order priorities correctly', () => {
      expect(JobPriority.CRITICAL).toBeGreaterThan(JobPriority.HIGH);
      expect(JobPriority.HIGH).toBeGreaterThan(JobPriority.NORMAL);
      expect(JobPriority.NORMAL).toBeGreaterThan(JobPriority.LOW);
      expect(JobPriority.LOW).toBeGreaterThan(JobPriority.DEFERRED);
    });
  });

  describe('SinglePageJobData', () => {
    it('should create valid single-page job data', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        url: 'https://example.com',
      };

      expect(jobData.type).toBe('single-page');
      expect(jobData.customerId).toBe('customer-123');
      expect(jobData.url).toBe('https://example.com');
    });

    it('should support optional turbo mode', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        url: 'https://example.com',
        turboMode: true,
      };

      expect(jobData.turboMode).toBe(true);
    });

    it('should support structured data extraction', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        url: 'https://example.com',
        extractStructuredData: true,
      };

      expect(jobData.extractStructuredData).toBe(true);
    });

    it('should support priority and metadata', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        url: 'https://example.com',
        priority: JobPriority.HIGH,
        metadata: { source: 'manual' },
      };

      expect(jobData.priority).toBe(JobPriority.HIGH);
      expect(jobData.metadata).toEqual({ source: 'manual' });
    });
  });

  describe('FullCrawlJobData', () => {
    it('should create valid full-crawl job data', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
      };

      expect(jobData.type).toBe('full-crawl');
      expect(jobData.maxPages).toBe(100);
    });

    it('should support crawl depth', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
        depth: 3,
      };

      expect(jobData.depth).toBe(3);
    });

    it('should support path filters', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
        includePaths: ['/products', '/categories'],
        excludePaths: ['/admin', '/login'],
      };

      expect(jobData.includePaths).toEqual(['/products', '/categories']);
      expect(jobData.excludePaths).toEqual(['/admin', '/login']);
    });

    it('should support robots.txt respect', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
        respectRobotsTxt: true,
      };

      expect(jobData.respectRobotsTxt).toBe(true);
    });

    it('should support delay configuration', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
        delay: 1000,
      };

      expect(jobData.delay).toBe(1000);
    });
  });

  describe('RefreshJobData', () => {
    it('should create valid refresh job data', () => {
      const jobData: RefreshJobData = {
        type: 'refresh',
        customerId: 'customer-123',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
      };

      expect(jobData.type).toBe('refresh');
      expect(jobData.urls).toHaveLength(2);
    });

    it('should support force refresh', () => {
      const jobData: RefreshJobData = {
        type: 'refresh',
        customerId: 'customer-123',
        urls: ['https://example.com'],
        forceRefresh: true,
      };

      expect(jobData.forceRefresh).toBe(true);
    });

    it('should support content comparison', () => {
      const jobData: RefreshJobData = {
        type: 'refresh',
        customerId: 'customer-123',
        urls: ['https://example.com'],
        compareContent: true,
      };

      expect(jobData.compareContent).toBe(true);
    });
  });

  describe('JobData union type', () => {
    it('should accept single-page job data', () => {
      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-123',
        url: 'https://example.com',
      };

      expect(jobData.type).toBe('single-page');
    });

    it('should accept full-crawl job data', () => {
      const jobData: JobData = {
        type: 'full-crawl',
        customerId: 'customer-123',
        url: 'https://example.com',
        maxPages: 100,
      };

      expect(jobData.type).toBe('full-crawl');
    });

    it('should accept refresh job data', () => {
      const jobData: JobData = {
        type: 'refresh',
        customerId: 'customer-123',
        urls: ['https://example.com'],
      };

      expect(jobData.type).toBe('refresh');
    });
  });

  describe('QueueManagerConfig', () => {
    it('should create config with all optional fields', () => {
      const config: QueueManagerConfig = {
        queueName: 'custom-queue',
        redisUrl: 'redis://localhost:6379',
        maxConcurrency: 5,
        defaultJobOptions: {
          attempts: 3,
          backoffDelay: 1000,
          timeout: 30000,
        },
        enableMetrics: true,
      };

      expect(config.queueName).toBe('custom-queue');
      expect(config.maxConcurrency).toBe(5);
      expect(config.enableMetrics).toBe(true);
    });

    it('should support minimal config', () => {
      const config: QueueManagerConfig = {};

      expect(config).toBeDefined();
    });

    it('should support partial job options', () => {
      const config: QueueManagerConfig = {
        defaultJobOptions: {
          attempts: 5,
        },
      };

      expect(config.defaultJobOptions?.attempts).toBe(5);
    });
  });

  describe('BaseJobData', () => {
    it('should support timestamps', () => {
      const now = new Date().toISOString();
      const jobData: BaseJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        createdAt: now,
        scheduledAt: now,
      };

      expect(jobData.createdAt).toBe(now);
      expect(jobData.scheduledAt).toBe(now);
    });

    it('should support custom metadata', () => {
      const jobData: BaseJobData = {
        type: 'single-page',
        customerId: 'customer-123',
        metadata: {
          source: 'api',
          requestId: 'req-123',
          tags: ['urgent', 'new-customer'],
        },
      };

      expect(jobData.metadata).toEqual({
        source: 'api',
        requestId: 'req-123',
        tags: ['urgent', 'new-customer'],
      });
    });
  });
});
