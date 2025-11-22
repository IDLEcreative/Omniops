/**
 * QueueManager Core Tests
 * Tests queue initialization, job operations, and singleton pattern
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { Queue, Job } from 'bullmq';
import Redis from 'ioredis';

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock Redis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    status: 'ready',
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
    addBulk: jest.fn().mockResolvedValue([{ id: 'job-1' }, { id: 'job-2' }]),
    getJob: jest.fn(),
    getJobs: jest.fn(),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue(['job-1', 'job-2']),
    drain: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    waitUntilReady: jest.fn().mockResolvedValue(undefined),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 10,
      failed: 1,
    }),
  })),
  QueueEvents: jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  })),
}));

// Import after mocks are defined
import { QueueManager } from '@/lib/queue/queue-manager/core';
import type { JobData, JobStatus } from '@/lib/queue/types';

describe('QueueManager Core', () => {
  let queueManager: QueueManager;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Clear singleton instances
    (QueueManager as any).instances = new Map();

    queueManager = QueueManager.getInstance('test-queue');
    await queueManager.initialize();
  });

  afterEach(async () => {
    try {
      await queueManager.shutdown();
    } catch (error) {
      // Ignore shutdown errors in tests
    }
  });

  describe('Singleton Pattern', () => {
    it('should return same instance for same queue name', () => {
      const instance1 = QueueManager.getInstance('my-queue');
      const instance2 = QueueManager.getInstance('my-queue');

      expect(instance1).toBe(instance2);
    });

    it('should return different instances for different queue names', () => {
      const instance1 = QueueManager.getInstance('queue-1');
      const instance2 = QueueManager.getInstance('queue-2');

      expect(instance1).not.toBe(instance2);
    });

    it('should remove instance after shutdown', async () => {
      const testQueue = QueueManager.getInstance('shutdown-test');
      await testQueue.initialize();
      await testQueue.shutdown();

      const newInstance = QueueManager.getInstance('shutdown-test');
      expect(newInstance).not.toBe(testQueue);
    });
  });

  describe('Initialization', () => {
    it('should initialize queue successfully', async () => {
      const newQueue = QueueManager.getInstance('init-test');
      await expect(newQueue.initialize()).resolves.not.toThrow();
    });

    it('should not re-initialize if already initialized', async () => {
      const initSpy = jest.spyOn(Queue.prototype, 'constructor' as any);
      const initialCallCount = initSpy.mock.calls.length;

      await queueManager.initialize();
      await queueManager.initialize();

      // Should not create additional queues
      expect(initSpy.mock.calls.length).toBe(initialCallCount);
    });
  });

  describe('Add Job', () => {
    it('should add single job to queue', async () => {
      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      const job = await queueManager.addJob(jobData);

      expect(job).toBeDefined();
      expect(job.id).toBe('job-123');
    });

    it('should add job with priority', async () => {
      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      await queueManager.addJob(jobData, { priority: 10 });

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        jobData,
        expect.objectContaining({ priority: 10 })
      );
    });

    it('should add job with delay', async () => {
      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      await queueManager.addJob(jobData, { delay: 5000 });

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        jobData,
        expect.objectContaining({ delay: 5000 })
      );
    });

    it('should add job with custom job ID', async () => {
      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      await queueManager.addJob(jobData, { jobId: 'custom-id-123' });

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.any(String),
        jobData,
        expect.objectContaining({ jobId: 'custom-id-123' })
      );
    });

    it('should throw error if queue not initialized', async () => {
      const uninitializedQueue = QueueManager.getInstance('uninitialized');

      const jobData: JobData = {
        type: 'single-page',
        customerId: 'customer-1',
        url: 'https://example.com',
      };

      await expect(uninitializedQueue.addJob(jobData)).rejects.toThrow(
        'Queue not initialized'
      );
    });
  });

  describe('Bulk Add Jobs', () => {
    it('should add multiple jobs in batch', async () => {
      const jobs = [
        {
          data: {
            type: 'single-page' as const,
            customerId: 'customer-1',
            url: 'https://example.com/page1',
          },
        },
        {
          data: {
            type: 'single-page' as const,
            customerId: 'customer-1',
            url: 'https://example.com/page2',
          },
        },
      ];

      const result = await queueManager.addBulkJobs(jobs);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('job-1');
      expect(result[1].id).toBe('job-2');
    });

    it('should throw error if queue not initialized', async () => {
      const uninitializedQueue = QueueManager.getInstance('bulk-uninitialized');

      await expect(uninitializedQueue.addBulkJobs([])).rejects.toThrow(
        'Queue not initialized'
      );
    });
  });

  describe('Get Job', () => {
    it('should retrieve job by ID', async () => {
      const mockJob = { id: 'job-123', data: { type: 'single-page' } };
      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      mockQueue.getJob.mockResolvedValue(mockJob);

      const job = await queueManager.getJob('job-123');

      expect(job).toEqual(mockJob);
      expect(mockQueue.getJob).toHaveBeenCalledWith('job-123');
    });

    it('should return null for non-existent job', async () => {
      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      mockQueue.getJob.mockResolvedValue(null);

      const job = await queueManager.getJob('non-existent');

      expect(job).toBeNull();
    });
  });

  describe('Get Jobs By Status', () => {
    it('should retrieve jobs by status', async () => {
      const mockJobs = [
        { id: 'job-1', data: { type: 'single-page' } },
        { id: 'job-2', data: { type: 'full-crawl' } },
      ];

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      mockQueue.getWaiting.mockResolvedValue(mockJobs);

      const jobs = await queueManager.getJobsByStatus('waiting', 10);

      expect(jobs).toEqual(mockJobs);
      expect(mockQueue.getWaiting).toHaveBeenCalledWith(0, 9);
    });

    it('should limit number of returned jobs', async () => {
      const mockQueue = (Queue as jest.Mock).mock.results[0].value;

      await queueManager.getJobsByStatus('completed', 5);

      expect(mockQueue.getCompleted).toHaveBeenCalledWith(0, 4);
    });
  });

  describe('Queue Statistics', () => {
    it('should return queue stats', async () => {
      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      mockQueue.getWaitingCount.mockResolvedValue(5);
      mockQueue.getActiveCount.mockResolvedValue(2);
      mockQueue.getCompletedCount.mockResolvedValue(10);
      mockQueue.getFailedCount.mockResolvedValue(1);
      mockQueue.getDelayedCount.mockResolvedValue(0);
      mockQueue.isPaused.mockResolvedValue(false);

      const stats = await queueManager.getQueueStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 10,
        failed: 1,
        delayed: 0,
        paused: false,
      });
    });
  });

  describe('Queue Control', () => {
    it('should pause queue', async () => {
      await queueManager.pause();

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume queue', async () => {
      await queueManager.resume();

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.resume).toHaveBeenCalled();
    });

    it('should clean completed jobs', async () => {
      const cleanedIds = await queueManager.clean(3600000, 100, 'completed');

      expect(cleanedIds).toEqual(['job-1', 'job-2']);

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.clean).toHaveBeenCalledWith(3600000, 100, 'completed');
    });

    it('should drain queue', async () => {
      await queueManager.drain();

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.drain).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should perform graceful shutdown', async () => {
      await queueManager.shutdown();

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.close).toHaveBeenCalled();
    });

    it('should force shutdown', async () => {
      await queueManager.forceShutdown();

      const mockQueue = (Queue as jest.Mock).mock.results[0].value;
      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});
