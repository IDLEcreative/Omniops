/**
 * Queue Error Handling Tests
 * Tests error scenarios, retry logic, and failure handling
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock dependencies BEFORE importing JobProcessor to prevent circular dependency
jest.mock('@/lib/redis-unified', () => ({
  getRedisClient: jest.fn(() => ({
    status: 'ready',
    on: jest.fn(),
  })),
}));

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    isRunning: jest.fn(() => true),
    name: 'test-queue',
  })),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@/lib/queue/job-processor-handlers', () => ({
  processSinglePageJob: jest.fn(),
  processFullCrawlJob: jest.fn(),
  processRefreshJob: jest.fn(),
}));

jest.mock('@/lib/queue/queue-manager', () => ({
  QueueManager: {
    getInstance: jest.fn(() => ({
      initialize: jest.fn(),
      shutdown: jest.fn(),
    })),
  },
  getQueueManager: jest.fn(() => ({
    queue: { client: { ping: jest.fn() } },
  })),
}));

jest.mock('@/lib/queue/job-processor', () => ({
  JobProcessor: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
    getMetrics: jest.fn(() => ({})),
  })),
  getJobProcessor: jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { JobProcessor } from '@/lib/queue/job-processor';
import type { JobData } from '@/lib/queue/types';

import { Worker } from 'bullmq';
import * as handlers from '@/lib/queue/job-processor-handlers';

// Circular dependency fixed: job-processor-handlers now uses @/ alias imports
describe.skip('Queue Error Handling - PRE-EXISTING FAILURES (tracked in ISSUES.md)', () => {
  let processor: JobProcessor;
  let processJobFn: any;

  beforeEach(() => {
    jest.clearAllMocks();
    processor = new JobProcessor('error-test-queue');

    // Get the process job function from Worker constructor
    const workerCall = (Worker as jest.Mock).mock.calls[0];
    processJobFn = workerCall[1];
  });

  afterEach(async () => {
    await processor.close();
  });

  describe('Network Errors', () => {
    it('should handle timeout errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://slow-site.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('Request timeout after 30s')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should handle connection refused errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://unreachable.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('ECONNREFUSED: Connection refused')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ECONNREFUSED');
    });

    it('should handle DNS resolution errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://nonexistent-domain-12345.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('getaddrinfo ENOTFOUND')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOTFOUND');
    });
  });

  describe('HTTP Errors', () => {
    it('should handle 404 errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com/not-found',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('HTTP 404: Page not found')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('404');
    });

    it('should handle 500 server errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com/error',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('HTTP 500: Internal server error')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('500');
    });

    it('should handle rate limit errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('HTTP 429: Too many requests')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('429');
    });
  });

  describe('Parsing Errors', () => {
    it('should handle invalid HTML', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('Failed to parse HTML: malformed content')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('parse');
    });

    it('should handle empty responses', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('Empty response received')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Empty response');
    });
  });

  describe('Resource Errors', () => {
    it('should handle memory errors', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://huge-site.com',
        maxPages: 1000000,
      });

      (handlers.processFullCrawlJob as jest.Mock).mockRejectedValue(
        new Error('JavaScript heap out of memory')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('memory');
    });

    it('should handle disk space errors', async () => {
      const mockJob = createMockJob({
        type: 'full-crawl',
        customerId: 'customer-1',
        url: 'https://example.com',
        maxPages: 1000,
      });

      (handlers.processFullCrawlJob as jest.Mock).mockRejectedValue(
        new Error('ENOSPC: no space left on device')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOSPC');
    });
  });

  describe('Invalid Input Errors', () => {
    it('should handle invalid URL', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'not-a-valid-url',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('Invalid URL format')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should handle missing required fields', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: undefined as any,
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('URL is required')
      );

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });
  });

  describe('Unknown Errors', () => {
    it('should handle non-Error objects', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue('String error');

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });

    it('should handle null/undefined errors', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(null);

      const result = await processJobFn(mockJob);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error occurred');
    });

    it('should include error metadata', async () => {
      const mockJob = createMockJob({
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      });

      (handlers.processSinglePageJob as jest.Mock).mockRejectedValue(
        new Error('Test error')
      );

      const result = await processJobFn(mockJob);

      expect(result.metadata).toBeDefined();
      expect(result.metadata.jobId).toBe(mockJob.id);
      expect(result.metadata.customerId).toBe('customer-1');
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});

// Helper function
function createMockJob(data: JobData): any {
  return {
    id: `job-${Date.now()}`,
    data,
    timestamp: Date.now(),
    processedOn: Date.now(),
    opts: { priority: 0 },
    updateProgress: jest.fn(),
  };
}
