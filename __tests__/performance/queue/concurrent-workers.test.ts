/**
 * Concurrent Workers Performance Tests
 *
 * Tests multi-worker queue performance and scaling
 * Performance Goals:
 * - Linear scaling up to 4 workers
 * - Efficient work distribution
 * - No resource contention at scale
 */

import { describe, it, expect } from '@jest/globals';

describe('Concurrent Workers Performance', () => {
  interface WorkerMetrics {
    workerId: number;
    jobsProcessed: number;
    totalDuration: number;
    avgJobDuration: number;
  }

  class WorkerPool {
    private workers: Worker[] = [];
    private jobQueue: Array<() => Promise<void>> = [];
    private metrics: Map<number, WorkerMetrics> = new Map();

    constructor(private workerCount: number) {
      for (let i = 0; i < workerCount; i++) {
        this.workers.push(new Worker(i, this));
        this.metrics.set(i, {
          workerId: i,
          jobsProcessed: 0,
          totalDuration: 0,
          avgJobDuration: 0
        });
      }
    }

    addJob(job: () => Promise<void>): void {
      this.jobQueue.push(job);
    }

    async processAll(): Promise<void> {
      const startTime = Date.now();

      // Start all workers
      const workerPromises = this.workers.map(worker => worker.start());

      // Wait for all jobs to complete
      await Promise.all(workerPromises);

      const totalDuration = Date.now() - startTime;
      console.log(`\nAll jobs completed in ${totalDuration}ms`);
    }

    getNextJob(): (() => Promise<void>) | undefined {
      return this.jobQueue.shift();
    }

    recordJobMetrics(workerId: number, duration: number): void {
      const metrics = this.metrics.get(workerId)!;
      metrics.jobsProcessed++;
      metrics.totalDuration += duration;
      metrics.avgJobDuration = metrics.totalDuration / metrics.jobsProcessed;
    }

    getMetrics(): WorkerMetrics[] {
      return Array.from(this.metrics.values());
    }

    printMetrics(): void {
      console.log('\nWorker Performance Metrics:');
      this.getMetrics().forEach(m => {
        console.log(`  Worker ${m.workerId}:`);
        console.log(`    Jobs Processed: ${m.jobsProcessed}`);
        console.log(`    Avg Duration: ${m.avgJobDuration.toFixed(2)}ms`);
      });
    }
  }

  class Worker {
    constructor(
      private id: number,
      private pool: WorkerPool
    ) {}

    async start(): Promise<void> {
      while (true) {
        const job = this.pool.getNextJob();
        if (!job) break;

        const startTime = Date.now();
        await job();
        const duration = Date.now() - startTime;

        this.pool.recordJobMetrics(this.id, duration);
      }
    }
  }

  describe('Worker Scaling', () => {
    it('should scale throughput with 1, 2, 4, 8 workers', async () => {
      const workerCounts = [1, 2, 4, 8];
      const jobCount = 100;
      const results: Array<{ workers: number; duration: number; throughput: number }> = [];

      for (const count of workerCounts) {
        const pool = new WorkerPool(count);

        // Add jobs (simulate 50ms processing time each)
        for (let i = 0; i < jobCount; i++) {
          pool.addJob(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }

        const startTime = Date.now();
        await pool.processAll();
        const duration = Date.now() - startTime;
        const throughput = jobCount / (duration / 1000);

        results.push({ workers: count, duration, throughput });
        pool.printMetrics();

        console.log(`\n${count} Workers: ${duration}ms total, ${throughput.toFixed(2)} jobs/s`);
      }

      // Verify scaling efficiency
      // With 2 workers, should be roughly 2x faster (allow 30% overhead)
      const speedup2x = results[0].duration / results[1].duration;
      expect(speedup2x).toBeGreaterThan(1.4); // At least 1.4x speedup

      // With 4 workers, should be roughly 4x faster (allow more overhead)
      const speedup4x = results[0].duration / results[2].duration;
      expect(speedup4x).toBeGreaterThan(2.5); // At least 2.5x speedup
    }, 60000);
  });

  describe('Load Distribution', () => {
    it('should distribute work evenly across workers', async () => {
      const pool = new WorkerPool(4);
      const jobCount = 100;

      // Add jobs
      for (let i = 0; i < jobCount; i++) {
        pool.addJob(async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        });
      }

      await pool.processAll();

      const metrics = pool.getMetrics();
      pool.printMetrics();

      // Calculate distribution variance
      const jobCounts = metrics.map(m => m.jobsProcessed);
      const avgJobs = jobCounts.reduce((sum, count) => sum + count, 0) / jobCounts.length;
      const variance = jobCounts.reduce((sum, count) => sum + Math.pow(count - avgJobs, 2), 0) / jobCounts.length;
      const stdDev = Math.sqrt(variance);

      console.log(`\nLoad Distribution:`);
      console.log(`  Average jobs per worker: ${avgJobs.toFixed(2)}`);
      console.log(`  Standard deviation: ${stdDev.toFixed(2)}`);

      // Standard deviation should be low (good distribution)
      expect(stdDev).toBeLessThan(avgJobs * 0.3); // Within 30% of average
    }, 30000);
  });

  describe('Resource Contention', () => {
    it('should handle shared resource access efficiently', async () => {
      // Simulate shared resource (e.g., database connection pool)
      class SharedResource {
        private activeConnections = 0;
        private maxConnections = 0;

        async acquire(): Promise<void> {
          this.activeConnections++;
          this.maxConnections = Math.max(this.maxConnections, this.activeConnections);
          await new Promise(resolve => setTimeout(resolve, 5));
        }

        release(): void {
          this.activeConnections--;
        }

        getMaxConnections(): number {
          return this.maxConnections;
        }
      }

      const resource = new SharedResource();
      const pool = new WorkerPool(8);

      // Add jobs that use shared resource
      for (let i = 0; i < 100; i++) {
        pool.addJob(async () => {
          await resource.acquire();
          await new Promise(resolve => setTimeout(resolve, 20));
          resource.release();
        });
      }

      await pool.processAll();

      console.log(`\nMax concurrent connections: ${resource.getMaxConnections()}`);

      // Should utilize most workers (8) but may have some contention
      expect(resource.getMaxConnections()).toBeGreaterThan(4);
      expect(resource.getMaxConnections()).toBeLessThanOrEqual(8);
    }, 30000);
  });
});
