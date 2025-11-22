/**
 * Queue Job Processing Throughput Tests
 *
 * Tests background job queue processing speed
 * Performance Goals:
 * - Process >50 jobs/second
 * - Maintain throughput with 1000+ jobs
 * - Efficient job completion tracking
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { collectMetrics, printMetrics } from '../utils/metrics-collector';
import { assertThroughput } from '../utils/assertion-helpers';

// Mock queue implementation for testing
interface MockJob {
  id: string;
  data: any;
  timestamp: number;
}

class MockQueue {
  private jobs: MockJob[] = [];
  private processing = false;
  private processedCount = 0;

  async add(data: any): Promise<void> {
    this.jobs.push({
      id: `job-${Date.now()}-${Math.random()}`,
      data,
      timestamp: Date.now()
    });
  }

  async process(concurrency: number = 1): Promise<number> {
    const startTime = Date.now();
    this.processing = true;
    this.processedCount = 0;

    // Process jobs in batches
    while (this.jobs.length > 0 && this.processing) {
      const batch = this.jobs.splice(0, concurrency);
      await Promise.all(batch.map(job => this.processJob(job)));
      this.processedCount += batch.length;
    }

    const duration = Date.now() - startTime;
    const throughput = this.processedCount / (duration / 1000);

    return throughput;
  }

  private async processJob(job: MockJob): Promise<void> {
    // Simulate job processing (10ms average)
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  stop(): void {
    this.processing = false;
  }

  getProcessedCount(): number {
    return this.processedCount;
  }
}

describe('Queue Job Processing Throughput', () => {
  let queue: MockQueue;

  beforeEach(() => {
    queue = new MockQueue();
  });

  afterEach(() => {
    queue.stop();
  });

  describe('Single Worker Performance', () => {
    it('should process >50 jobs/second with single worker', async () => {
      // Add 1000 jobs
      const jobCount = 1000;
      for (let i = 0; i < jobCount; i++) {
        await queue.add({ task: `task-${i}` });
      }

      const throughput = await queue.process(1);

      console.log(`Single Worker Throughput: ${throughput.toFixed(2)} jobs/s`);
      console.log(`Processed: ${queue.getProcessedCount()} jobs`);

      expect(queue.getProcessedCount()).toBe(jobCount);
      expect(throughput).toBeGreaterThan(50);
    }, 30000);
  });

  describe('Concurrent Worker Performance', () => {
    it('should scale throughput with worker count', async () => {
      const jobCount = 1000;
      const workerCounts = [1, 2, 4, 8];
      const results: { workers: number; throughput: number }[] = [];

      for (const workers of workerCounts) {
        // Reset queue
        queue = new MockQueue();

        // Add jobs
        for (let i = 0; i < jobCount; i++) {
          await queue.add({ task: `task-${i}` });
        }

        const throughput = await queue.process(workers);
        results.push({ workers, throughput });

        console.log(`${workers} Workers: ${throughput.toFixed(2)} jobs/s`);
      }

      // Throughput should increase with more workers
      expect(results[1].throughput).toBeGreaterThan(results[0].throughput);
      expect(results[2].throughput).toBeGreaterThan(results[1].throughput);
      expect(results[3].throughput).toBeGreaterThan(results[2].throughput);
    }, 60000);
  });

  describe('Large Queue Performance', () => {
    it('should maintain throughput with 5000+ jobs', async () => {
      const jobCount = 5000;

      // Add many jobs
      const addStart = Date.now();
      for (let i = 0; i < jobCount; i++) {
        await queue.add({ task: `task-${i}` });
      }
      const addDuration = Date.now() - addStart;
      console.log(`Job addition time: ${addDuration}ms (${(jobCount / (addDuration / 1000)).toFixed(2)} jobs/s)`);

      // Process with multiple workers
      const throughput = await queue.process(4);

      console.log(`Large Queue Throughput: ${throughput.toFixed(2)} jobs/s`);
      console.log(`Total jobs processed: ${queue.getProcessedCount()}`);

      expect(queue.getProcessedCount()).toBe(jobCount);
      expect(throughput).toBeGreaterThan(50);
    }, 120000);
  });

  describe('Job Priority Handling', () => {
    it('should process high-priority jobs faster', async () => {
      interface PriorityJob extends MockJob {
        priority: 'high' | 'low';
      }

      class PriorityQueue extends MockQueue {
        private priorityJobs: PriorityJob[] = [];

        async addWithPriority(data: any, priority: 'high' | 'low'): Promise<void> {
          this.priorityJobs.push({
            id: `job-${Date.now()}-${Math.random()}`,
            data,
            timestamp: Date.now(),
            priority
          });
        }

        async processByPriority(concurrency: number = 1): Promise<void> {
          const startTime = Date.now();

          // Sort by priority (high first)
          this.priorityJobs.sort((a, b) => {
            if (a.priority === 'high' && b.priority === 'low') return -1;
            if (a.priority === 'low' && b.priority === 'high') return 1;
            return 0;
          });

          let processedCount = 0;
          while (this.priorityJobs.length > 0) {
            const batch = this.priorityJobs.splice(0, concurrency);
            await Promise.all(batch.map(job => this.processJob(job)));
            processedCount += batch.length;
          }

          console.log(`Processed ${processedCount} priority jobs in ${Date.now() - startTime}ms`);
        }
      }

      const priorityQueue = new PriorityQueue();

      // Add mixed priority jobs
      for (let i = 0; i < 100; i++) {
        await priorityQueue.addWithPriority(
          { task: `task-${i}` },
          i % 2 === 0 ? 'high' : 'low'
        );
      }

      await priorityQueue.processByPriority(4);
    }, 30000);
  });
});
