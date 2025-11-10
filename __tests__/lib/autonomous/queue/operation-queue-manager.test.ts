/**
 * Operation Queue Manager Tests
 * Tests for BullMQ-based queue management
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  OperationQueueManager,
  createOperationQueueManager,
  OperationPriority,
  WooCommerceSetupJobData,
} from '@/lib/autonomous/queue';

// Mock BullMQ and Redis BEFORE any imports
let mockQueue: any;

jest.mock('bullmq', () => {
  // Create mock queue with all necessary methods
  mockQueue = {
    add: jest.fn().mockResolvedValue({ id: 'job-123' }),
    getJob: jest.fn(),
    getJobCounts: jest.fn().mockResolvedValue({
      waiting: 5,
      active: 2,
      completed: 100,
      failed: 3,
      delayed: 1,
      paused: 0,
    }),
    getCompleted: jest.fn().mockResolvedValue([
      { finishedOn: Date.now() - 1000 },
    ]),
    pause: jest.fn().mockResolvedValue(undefined),
    resume: jest.fn().mockResolvedValue(undefined),
    clean: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    client: Promise.resolve({
      ping: jest.fn().mockResolvedValue('PONG'),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
    }),
  };

  return {
    Queue: jest.fn(() => mockQueue),
  };
});

jest.mock('@/lib/redis', () => ({
  createRedisClient: jest.fn(() => ({
    ping: jest.fn().mockResolvedValue('PONG'),
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  })),
}));

describe('OperationQueueManager', () => {
  let queueManager: OperationQueueManager;

  beforeEach(() => {
    // Reset mock implementations but keep the same objects for assertions
    if (mockQueue) {
      mockQueue.add.mockClear();
      mockQueue.getJob.mockClear();
      mockQueue.getJobCounts.mockClear();
      mockQueue.getCompleted.mockClear();
      mockQueue.pause.mockClear();
      mockQueue.resume.mockClear();
      mockQueue.clean.mockClear();
      mockQueue.close.mockClear();
      mockQueue.on.mockClear();

      // Reset implementations
      mockQueue.add.mockResolvedValue({ id: 'job-123' });
      mockQueue.getJobCounts.mockResolvedValue({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        paused: 0,
      });
      mockQueue.getCompleted.mockResolvedValue([
        { finishedOn: Date.now() - 1000 },
      ]);
      mockQueue.pause.mockResolvedValue(undefined);
      mockQueue.resume.mockResolvedValue(undefined);
      mockQueue.clean.mockResolvedValue(undefined);
      mockQueue.close.mockResolvedValue(undefined);

      // Reset the mock client on each test
      mockQueue.client = Promise.resolve({
        ping: jest.fn().mockResolvedValue('PONG'),
        incr: jest.fn().mockResolvedValue(1),
        expire: jest.fn().mockResolvedValue(1),
      });
    }

    queueManager = createOperationQueueManager();
  });

  describe('addOperation', () => {
    it('should add operation to queue with correct data', async () => {
      const jobData: WooCommerceSetupJobData = {
        operationId: 'op-123',
        organizationId: 'org-456',
        userId: 'user-789',
        service: 'woocommerce',
        operation: 'api_key_generation',
        jobType: 'woocommerce_setup',
        priority: OperationPriority.HIGH,
        config: {
          storeUrl: 'https://shop.example.com',
          headless: true,
        },
        createdAt: new Date().toISOString(),
      };

      const jobId = await queueManager.addOperation(jobData);

      expect(jobId).toBe('job-123');
      expect(mockQueue.add).toHaveBeenCalledWith(
        'woocommerce_setup',
        jobData,
        expect.objectContaining({
          priority: OperationPriority.HIGH,
          jobId: 'op-123',
        })
      );
    });

    it('should use default priority if not specified', async () => {
      const jobData: WooCommerceSetupJobData = {
        operationId: 'op-456',
        organizationId: 'org-789',
        userId: 'user-123',
        service: 'woocommerce',
        operation: 'api_key_generation',
        jobType: 'woocommerce_setup',
        config: {
          storeUrl: 'https://shop.example.com',
        },
        createdAt: new Date().toISOString(),
      };

      await queueManager.addOperation(jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'woocommerce_setup',
        jobData,
        expect.objectContaining({
          priority: OperationPriority.NORMAL,
        })
      );
    });

    it('should enforce rate limiting per organization', async () => {
      const client = await mockQueue.client;
      client.incr.mockResolvedValueOnce(11); // Exceed limit of 10

      const jobData: WooCommerceSetupJobData = {
        operationId: 'op-999',
        organizationId: 'org-rate-limited',
        userId: 'user-123',
        service: 'woocommerce',
        operation: 'api_key_generation',
        jobType: 'woocommerce_setup',
        config: {
          storeUrl: 'https://shop.example.com',
        },
        createdAt: new Date().toISOString(),
      };

      await expect(queueManager.addOperation(jobData)).rejects.toThrow(
        'Rate limit exceeded'
      );
    });
  });

  describe('getJobStatus', () => {
    it('should return job status if job exists', async () => {
      const mockJob = {
        id: 'job-123',
        data: { operationId: 'op-123' },
        getState: jest.fn().mockResolvedValue('active'),
        progress: 50,
        failedReason: null,
        processedOn: Date.now() - 5000,
        finishedOn: null,
        attemptsMade: 1,
        returnvalue: null,
      };

      mockQueue.getJob.mockResolvedValue(mockJob);

      const status = await queueManager.getJobStatus('job-123');

      expect(status).toEqual({
        id: 'job-123',
        status: 'active',
        progress: 50,
        data: { operationId: 'op-123' },
        failedReason: null,
        processedOn: mockJob.processedOn,
        finishedOn: null,
        attemptsMade: 1,
        returnvalue: null,
      });
    });

    it('should return null if job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const status = await queueManager.getJobStatus('nonexistent');

      expect(status).toBeNull();
    });
  });

  describe('cancelOperation', () => {
    it('should cancel job if it exists', async () => {
      const mockJob = {
        id: 'job-123',
        remove: jest.fn().mockResolvedValue(undefined),
      };

      mockQueue.getJob.mockResolvedValue(mockJob);

      const cancelled = await queueManager.cancelOperation('job-123');

      expect(cancelled).toBe(true);
      expect(mockJob.remove).toHaveBeenCalled();
    });

    it('should return false if job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const cancelled = await queueManager.cancelOperation('nonexistent');

      expect(cancelled).toBe(false);
    });
  });

  describe('retryOperation', () => {
    it('should retry job if it exists', async () => {
      const mockJob = {
        id: 'job-123',
        retry: jest.fn().mockResolvedValue(undefined),
      };

      mockQueue.getJob.mockResolvedValue(mockJob);

      const retried = await queueManager.retryOperation('job-123');

      expect(retried).toBe(true);
      expect(mockJob.retry).toHaveBeenCalled();
    });

    it('should return false if job does not exist', async () => {
      mockQueue.getJob.mockResolvedValue(null);

      const retried = await queueManager.retryOperation('nonexistent');

      expect(retried).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return queue statistics', async () => {
      const stats = await queueManager.getStats();

      expect(stats).toEqual({
        waiting: 5,
        active: 2,
        completed: 100,
        failed: 3,
        delayed: 1,
        paused: 0,
      });

      expect(mockQueue.getJobCounts).toHaveBeenCalledWith(
        'waiting',
        'active',
        'completed',
        'failed',
        'delayed',
        'paused'
      );
    });
  });

  describe('getHealth', () => {
    it('should return healthy status when Redis is connected', async () => {
      const health = await queueManager.getHealth();

      expect(health.healthy).toBe(true);
      expect(health.redisConnected).toBe(true);
      expect(health.queueName).toBe('autonomous-operations');
      expect(health.stats).toBeDefined();
    });

    it('should return unhealthy status when Redis is not connected', async () => {
      const client = await mockQueue.client;
      client.ping.mockRejectedValue(new Error('Connection refused'));

      const health = await queueManager.getHealth();

      expect(health.healthy).toBe(false);
      expect(health.redisConnected).toBe(false);
    });
  });

  describe('pause and resume', () => {
    it('should pause queue processing', async () => {
      await queueManager.pause();

      expect(mockQueue.pause).toHaveBeenCalled();
    });

    it('should resume queue processing', async () => {
      await queueManager.resume();

      expect(mockQueue.resume).toHaveBeenCalled();
    });
  });

  describe('clean', () => {
    it('should clean old completed and failed jobs', async () => {
      const age = 7 * 24 * 60 * 60 * 1000; // 7 days

      await queueManager.clean(age);

      expect(mockQueue.clean).toHaveBeenCalledWith(age, 100, 'completed');
      expect(mockQueue.clean).toHaveBeenCalledWith(age, 100, 'failed');
    });

    it('should use default age if not specified', async () => {
      await queueManager.clean();

      expect(mockQueue.clean).toHaveBeenCalledWith(
        7 * 24 * 60 * 60 * 1000,
        100,
        'completed'
      );
    });
  });

  describe('close', () => {
    it('should close queue connection', async () => {
      await queueManager.close();

      expect(mockQueue.close).toHaveBeenCalled();
    });
  });
});
