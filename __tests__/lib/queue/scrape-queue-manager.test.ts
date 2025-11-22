/**
 * ScrapeQueueManager Tests
 * Tests scrape-specific queue functionality including deduplication
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Queue, QueueEvents, Job } from 'bullmq';
import Redis from 'ioredis';

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
    ttl: jest.fn(),
    on: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});

// Mock BullMQ
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 2,
      active: 1,
      completed: 10,
      failed: 0,
    }),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue(['job-1']),
    drain: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    waitUntilReady: jest.fn().mockResolvedValue(undefined),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

import { ScrapeQueueManager } from '@/lib/queue/scrape-queue/manager';
import type { ScrapeJobData } from '@/lib/queue/scrape-queue-types';

describe('ScrapeQueueManager', () => {
  let queueManager: ScrapeQueueManager;
  let mockRedis: any;
  let mockQueue: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockRedis = (Redis as jest.MockedClass<typeof Redis>).mock.results[0]?.value;
    mockQueue = (Queue as jest.Mock).mock.results[0]?.value;

    queueManager = ScrapeQueueManager.getInstance('test-scrape-queue');
    await queueManager.initialize();
  });

  afterEach(async () => {
    try {
      await queueManager.shutdown();
    } catch (error) {
      // Ignore shutdown errors
    }
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same queue name', () => {
      const instance1 = ScrapeQueueManager.getInstance('my-scrape-queue');
      const instance2 = ScrapeQueueManager.getInstance('my-scrape-queue');

      expect(instance1).toBe(instance2);
    });

    it('should use default queue name', () => {
      const defaultInstance = ScrapeQueueManager.getInstance();
      expect(defaultInstance).toBeDefined();
    });
  });

  describe('Add Job with Deduplication', () => {
    it('should add scrape job successfully', async () => {
      const jobData: ScrapeJobData = {
        url: 'https://example.com',
        customerId: 'customer-1',
        type: 'single-page',
      };

      mockRedis.get = jest.fn().mockResolvedValue(null); // No duplicate
      mockRedis.setex = jest.fn().mockResolvedValue('OK');

      const job = await queueManager.addJob(jobData);

      expect(job.id).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should prevent duplicate jobs', async () => {
      const jobData: ScrapeJobData = {
        url: 'https://example.com',
        customerId: 'customer-1',
        type: 'single-page',
      };

      mockRedis.get = jest.fn().mockResolvedValue('existing-job-id');

      const job = await queueManager.addJob(jobData);

      // Should not add to queue if duplicate exists
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should add job with priority', async () => {
      const jobData: ScrapeJobData = {
        url: 'https://example.com',
        customerId: 'customer-1',
        type: 'full-crawl',
      };

      mockRedis.get = jest.fn().mockResolvedValue(null);

      await queueManager.addJob(jobData, { priority: 10 });

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        jobData,
        expect.objectContaining({ priority: 10 })
      );
    });

    it('should add job with delay', async () => {
      const jobData: ScrapeJobData = {
        url: 'https://example.com',
        customerId: 'customer-1',
        type: 'single-page',
      };

      mockRedis.get = jest.fn().mockResolvedValue(null);

      await queueManager.addJob(jobData, { delay: 5000 });

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        jobData,
        expect.objectContaining({ delay: 5000 })
      );
    });
  });

  describe('Queue Statistics', () => {
    it('should return queue stats', async () => {
      const stats = await queueManager.getQueueStats();

      expect(stats).toEqual({
        waiting: 2,
        active: 1,
        completed: 10,
        failed: 0,
      });
    });

    it('should return deduplication stats', async () => {
      mockRedis.keys = jest.fn().mockResolvedValue([
        'scrape:dedup:url1',
        'scrape:dedup:url2',
      ]);
      mockRedis.ttl = jest.fn().mockResolvedValue(1800);

      const dedupStats = await queueManager.getDeduplicationStats();

      expect(dedupStats.totalKeys).toBe(2);
      expect(dedupStats.avgTTL).toBeGreaterThan(0);
    });

    it('should return combined queue metrics', async () => {
      mockRedis.keys = jest.fn().mockResolvedValue(['scrape:dedup:url1']);
      mockRedis.ttl = jest.fn().mockResolvedValue(3600);

      const metrics = await queueManager.getQueueMetrics();

      expect(metrics.queue).toBeDefined();
      expect(metrics.deduplication).toBeDefined();
      expect(metrics.redis).toBeDefined();
      expect(metrics.redis.connected).toBe(true);
    });
  });

  describe('Job Operations', () => {
    it('should get job by ID', async () => {
      const mockJob = { id: 'job-123', data: { url: 'https://example.com' } };
      mockQueue.getJob = jest.fn().mockResolvedValue(mockJob);

      const job = await queueManager.getJob('job-123');

      expect(job).toEqual(mockJob);
    });

    it('should cancel job', async () => {
      const mockJob = {
        id: 'job-123',
        remove: jest.fn().mockResolvedValue(undefined),
      };
      mockQueue.getJob = jest.fn().mockResolvedValue(mockJob);

      await queueManager.cancelJob('job-123');

      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should handle cancel non-existent job', async () => {
      mockQueue.getJob = jest.fn().mockResolvedValue(null);

      await expect(queueManager.cancelJob('non-existent')).rejects.toThrow(
        'Job not found'
      );
    });
  });

  describe('Queue Control', () => {
    it('should pause queue', async () => {
      await queueManager.pause();
      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume queue', async () => {
      await queueManager.resume();
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it('should cleanup old jobs', async () => {
      const cleanedIds = await queueManager.cleanup({
        grace: 7200000,
        limit: 50,
        type: 'completed',
      });

      expect(cleanedIds).toEqual(['job-1']);
      expect(mockQueue.clean).toHaveBeenCalledWith(7200000, 50, 'completed');
    });

    it('should drain queue', async () => {
      await queueManager.drain();
      expect(mockQueue.drain).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should perform graceful shutdown', async () => {
      await queueManager.shutdown();

      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockRedis.quit).toHaveBeenCalled();
    });

    it('should force shutdown', async () => {
      await queueManager.forceShutdown();

      expect(mockQueue.close).toHaveBeenCalled();
      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
