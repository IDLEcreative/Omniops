import Redis from 'ioredis';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CleanupConfig {
  maxJobAgeHours?: number;
  checkIntervalMinutes?: number;
  maxMemoryMB?: number;
  maxRetries?: number;
}

export class ScraperCleanupService {
  private redis: Redis;
  private config: Required<CleanupConfig>;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(redisUrl?: string, config: CleanupConfig = {}) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.config = {
      maxJobAgeHours: config.maxJobAgeHours ?? 2,
      checkIntervalMinutes: config.checkIntervalMinutes ?? 15,
      maxMemoryMB: config.maxMemoryMB ?? 1024,
      maxRetries: config.maxRetries ?? 3,
    };
  }

  async cleanupStaleJobs(): Promise<number> {
    console.log('[Cleanup] Starting stale job cleanup...');
    let cleanedCount = 0;
    
    try {
      const crawlKeys = await this.redis.keys('crawl:crawl_*');
      const now = Date.now();
      const maxAge = this.config.maxJobAgeHours * 60 * 60 * 1000;

      for (const key of crawlKeys) {
        const job = await this.redis.hgetall(key);
        
        if (!job || !job.status) continue;

        if (job.status === 'processing' || job.status === 'pending') {
          const startedAt = job.startedAt ? new Date(job.startedAt).getTime() : 0;
          const jobAge = now - startedAt;

          if (jobAge > maxAge) {
            console.log(`[Cleanup] Cleaning stale job ${key} (age: ${Math.round(jobAge / 1000 / 60)} minutes)`);
            
            if (job.workerPid) {
              await this.killWorkerProcess(parseInt(job.workerPid));
            }

            await this.redis.hmset(key, {
              status: 'failed',
              error: `Job timed out after ${this.config.maxJobAgeHours} hours - auto-cleaned`,
              completedAt: new Date().toISOString(),
              cleanedBy: 'auto-cleanup',
            });
            
            cleanedCount++;
          }
        }

        if (job.status === 'processing' && job.workerPid) {
          const isAlive = await this.isProcessAlive(parseInt(job.workerPid));
          if (!isAlive) {
            console.log(`[Cleanup] Marking orphaned job ${key} as failed (dead worker PID: ${job.workerPid})`);
            
            await this.redis.hmset(key, {
              status: 'failed',
              error: 'Worker process died unexpectedly - auto-cleaned',
              completedAt: new Date().toISOString(),
              cleanedBy: 'auto-cleanup',
            });
            
            cleanedCount++;
          }
        }

        if (job['stats.memoryMB']) {
          const memoryMB = parseFloat(job['stats.memoryMB']);
          if (memoryMB > this.config.maxMemoryMB) {
            console.log(`[Cleanup] Killing job ${key} due to excessive memory usage: ${memoryMB}MB`);
            
            if (job.workerPid) {
              await this.killWorkerProcess(parseInt(job.workerPid));
            }

            await this.redis.hmset(key, {
              status: 'failed',
              error: `Job killed due to excessive memory usage: ${memoryMB}MB`,
              completedAt: new Date().toISOString(),
              cleanedBy: 'auto-cleanup',
            });
            
            cleanedCount++;
          }
        }
      }

      await this.cleanupOldCompletedJobs();
      
      console.log(`[Cleanup] Cleaned ${cleanedCount} stale jobs`);
      return cleanedCount;
    } catch (error) {
      console.error('[Cleanup] Error during cleanup:', error);
      throw error;
    }
  }

  private async cleanupOldCompletedJobs(): Promise<void> {
    const crawlKeys = await this.redis.keys('crawl:crawl_*');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const key of crawlKeys) {
      const job = await this.redis.hgetall(key);
      
      if (job.status === 'completed' || job.status === 'failed') {
        const completedAt = job.completedAt ? new Date(job.completedAt).getTime() : 0;
        
        if (completedAt && completedAt < thirtyDaysAgo) {
          await this.redis.del(key);
          deletedCount++;
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`[Cleanup] Deleted ${deletedCount} old completed/failed jobs`);
    }
  }

  private async isProcessAlive(pid: number): Promise<boolean> {
    try {
      await execAsync(`ps -p ${pid}`);
      return true;
    } catch {
      return false;
    }
  }

  private async killWorkerProcess(pid: number): Promise<void> {
    try {
      const isAlive = await this.isProcessAlive(pid);
      if (isAlive) {
        console.log(`[Cleanup] Killing worker process ${pid}`);
        await execAsync(`kill -TERM ${pid}`);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const stillAlive = await this.isProcessAlive(pid);
        if (stillAlive) {
          console.log(`[Cleanup] Force killing worker process ${pid}`);
          await execAsync(`kill -9 ${pid}`);
        }
      }
    } catch (error) {
      console.error(`[Cleanup] Failed to kill process ${pid}:`, error);
    }
  }

  async cleanupQueuedJobs(): Promise<number> {
    console.log('[Cleanup] Checking scrape queue for stale jobs...');
    let cleanedCount = 0;

    try {
      const queueLength = await this.redis.llen('scrape:queue');
      const jobs = await this.redis.lrange('scrape:queue', 0, -1);
      const validJobs: string[] = [];
      const now = Date.now();
      const maxQueueAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const jobStr of jobs) {
        try {
          const job = JSON.parse(jobStr);
          const createdAt = job.createdAt ? new Date(job.createdAt).getTime() : 0;
          const jobAge = now - createdAt;

          if (jobAge < maxQueueAge) {
            validJobs.push(jobStr);
          } else {
            console.log(`[Cleanup] Removing stale queued job ${job.jobId} (age: ${Math.round(jobAge / 1000 / 60 / 60 / 24)} days)`);
            cleanedCount++;
          }
        } catch (e) {
          console.error('[Cleanup] Failed to parse queue job:', e);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        await this.redis.del('scrape:queue');
        if (validJobs.length > 0) {
          await this.redis.rpush('scrape:queue', ...validJobs);
        }
        console.log(`[Cleanup] Removed ${cleanedCount} stale jobs from queue`);
      }

      return cleanedCount;
    } catch (error) {
      console.error('[Cleanup] Error cleaning queue:', error);
      throw error;
    }
  }

  startAutoCleanup(): void {
    if (this.cleanupInterval) {
      console.log('[Cleanup] Auto-cleanup already running');
      return;
    }

    console.log(`[Cleanup] Starting auto-cleanup (interval: ${this.config.checkIntervalMinutes} minutes)`);
    
    this.runCleanupCycle();
    
    this.cleanupInterval = setInterval(
      () => this.runCleanupCycle(),
      this.config.checkIntervalMinutes * 60 * 1000
    );
  }

  private async runCleanupCycle(): Promise<void> {
    try {
      console.log(`[Cleanup] Running cleanup cycle at ${new Date().toISOString()}`);
      const staleJobs = await this.cleanupStaleJobs();
      const queuedJobs = await this.cleanupQueuedJobs();
      console.log(`[Cleanup] Cycle complete. Cleaned ${staleJobs} stale jobs, ${queuedJobs} queued jobs`);
    } catch (error) {
      console.error('[Cleanup] Cleanup cycle failed:', error);
    }
  }

  stopAutoCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
      console.log('[Cleanup] Auto-cleanup stopped');
    }
  }

  async disconnect(): Promise<void> {
    this.stopAutoCleanup();
    await this.redis.quit();
  }
}

export default ScraperCleanupService;