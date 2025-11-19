/**
 * Queue Types Tests
 * Tests type definitions, enums, and type guards
 */

import { describe, it, expect } from '@jest/globals';
import { JobPriority } from '@/lib/queue/types';
import type {
  JobType,
  JobStatus,
  SinglePageJobData,
  FullCrawlJobData,
  RefreshJobData,
  JobData,
} from '@/lib/queue/types';

describe('Queue Types', () => {
  describe('JobPriority Enum', () => {
    it('should have correct priority values', () => {
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

  describe('Job Data Types', () => {
    it('should accept valid SinglePageJobData', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
        turboMode: true,
        extractStructuredData: true,
        priority: JobPriority.HIGH,
      };

      expect(jobData.type).toBe('single-page');
      expect(jobData.url).toBe('https://example.com');
    });

    it('should accept valid FullCrawlJobData', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 100,
        depth: 3,
        includePaths: ['/products', '/categories'],
        excludePaths: ['/admin', '/login'],
        respectRobotsTxt: true,
        delay: 1000,
        priority: JobPriority.NORMAL,
      };

      expect(jobData.type).toBe('full-crawl');
      expect(jobData.maxPages).toBe(100);
      expect(jobData.depth).toBe(3);
    });

    it('should accept valid RefreshJobData', () => {
      const jobData: RefreshJobData = {
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com/page1', 'https://example.com/page2'],
        forceRefresh: true,
        compareContent: true,
        priority: JobPriority.LOW,
      };

      expect(jobData.type).toBe('refresh');
      expect(jobData.urls).toHaveLength(2);
    });

    it('should accept JobData union type', () => {
      const jobs: JobData[] = [
        {
          type: 'single-page',
          customerId: 'customer-1',
          url: 'https://example.com',
        },
        {
          type: 'full-crawl',
          customerId: 'customer-1',
          url: 'https://example.com',
          maxPages: 50,
        },
        {
          type: 'refresh',
          customerId: 'customer-1',
          urls: ['https://example.com'],
        },
      ];

      expect(jobs).toHaveLength(3);
      expect(jobs[0].type).toBe('single-page');
      expect(jobs[1].type).toBe('full-crawl');
      expect(jobs[2].type).toBe('refresh');
    });
  });

  describe('Optional Fields', () => {
    it('should allow minimal SinglePageJobData', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      expect(jobData.turboMode).toBeUndefined();
      expect(jobData.extractStructuredData).toBeUndefined();
    });

    it('should allow minimal FullCrawlJobData', () => {
      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
      };

      expect(jobData.depth).toBeUndefined();
      expect(jobData.includePaths).toBeUndefined();
      expect(jobData.excludePaths).toBeUndefined();
    });

    it('should allow minimal RefreshJobData', () => {
      const jobData: RefreshJobData = {
        type: 'refresh',
        customerId: 'customer-1',
        urls: ['https://example.com'],
      };

      expect(jobData.forceRefresh).toBeUndefined();
      expect(jobData.compareContent).toBeUndefined();
    });
  });

  describe('Metadata Fields', () => {
    it('should accept arbitrary metadata', () => {
      const jobData: SinglePageJobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
        metadata: {
          userId: 'user-123',
          campaign: 'summer-sale',
          tags: ['important', 'urgent'],
        },
      };

      expect(jobData.metadata?.userId).toBe('user-123');
      expect(jobData.metadata?.campaign).toBe('summer-sale');
      expect(jobData.metadata?.tags).toEqual(['important', 'urgent']);
    });

    it('should accept timestamp fields', () => {
      const now = new Date().toISOString();
      const later = new Date(Date.now() + 3600000).toISOString();

      const jobData: FullCrawlJobData = {
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 10,
        createdAt: now,
        scheduledAt: later,
      };

      expect(jobData.createdAt).toBe(now);
      expect(jobData.scheduledAt).toBe(later);
    });
  });

  describe('Type Discrimination', () => {
    it('should discriminate job types by type field', () => {
      const jobs: JobData[] = [
        { type: 'single-page', customerId: '1', url: 'https://a.com' },
        { type: 'full-crawl', customerId: '1', url: 'https://b.com', maxPages: 10 },
        { type: 'refresh', customerId: '1', urls: ['https://c.com'] },
      ];

      const singlePageJobs = jobs.filter(
        (j): j is SinglePageJobData => j.type === 'single-page'
      );
      const fullCrawlJobs = jobs.filter(
        (j): j is FullCrawlJobData => j.type === 'full-crawl'
      );
      const refreshJobs = jobs.filter(
        (j): j is RefreshJobData => j.type === 'refresh'
      );

      expect(singlePageJobs).toHaveLength(1);
      expect(fullCrawlJobs).toHaveLength(1);
      expect(refreshJobs).toHaveLength(1);

      // TypeScript should narrow types correctly
      expect(singlePageJobs[0].url).toBeDefined();
      expect(fullCrawlJobs[0].maxPages).toBe(10);
      expect(refreshJobs[0].urls).toHaveLength(1);
    });
  });
});
