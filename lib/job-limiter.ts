import { getMemoryAwareJobManager } from './redis-enhanced';

export class JobLimiter {
  private static instance: JobLimiter;
  private jobManager = getMemoryAwareJobManager();
  
  // Configuration - can be overridden for own-site scraping
  private MAX_CONCURRENT_JOBS = 5;
  private MAX_PAGES_PER_JOB = 1000;
  private MAX_TOTAL_PAGES = 3000; // Across all jobs
  
  // Own-site configuration (much higher limits)
  private readonly OWN_SITE_MAX_CONCURRENT_JOBS = 20;
  private readonly OWN_SITE_MAX_PAGES_PER_JOB = 5000;
  private readonly OWN_SITE_MAX_TOTAL_PAGES = 50000;
  
  static getInstance(): JobLimiter {
    if (!JobLimiter.instance) {
      JobLimiter.instance = new JobLimiter();
    }
    return JobLimiter.instance;
  }
  
  // Enable own-site mode for higher limits
  enableOwnSiteMode(): void {
    this.MAX_CONCURRENT_JOBS = this.OWN_SITE_MAX_CONCURRENT_JOBS;
    this.MAX_PAGES_PER_JOB = this.OWN_SITE_MAX_PAGES_PER_JOB;
    this.MAX_TOTAL_PAGES = this.OWN_SITE_MAX_TOTAL_PAGES;
    console.log('Job limiter: Own-site mode enabled with higher limits');
  }
  
  // Reset to normal limits
  disableOwnSiteMode(): void {
    this.MAX_CONCURRENT_JOBS = 5;
    this.MAX_PAGES_PER_JOB = 1000;
    this.MAX_TOTAL_PAGES = 3000;
    console.log('Job limiter: Returned to normal limits');
  }
  
  async canStartNewJob(): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Get all active jobs
      const activeJobs = await this.getActiveJobs();
      
      // Check concurrent job limit
      if (activeJobs.length >= this.MAX_CONCURRENT_JOBS) {
        return {
          allowed: false,
          reason: `Maximum ${this.MAX_CONCURRENT_JOBS} concurrent jobs already running`
        };
      }
      
      // Check total pages being scraped
      const totalPagesInProgress = activeJobs.reduce((sum, job) => {
        return sum + (job.maxPages || 0);
      }, 0);
      
      if (totalPagesInProgress >= this.MAX_TOTAL_PAGES) {
        return {
          allowed: false,
          reason: `Total pages limit reached (${totalPagesInProgress}/${this.MAX_TOTAL_PAGES})`
        };
      }
      
      // Check system resources
      const memoryUsage = process.memoryUsage();
      const memoryPercent = memoryUsage.heapUsed / memoryUsage.heapTotal;
      
      if (memoryPercent > 0.8) {
        return {
          allowed: false,
          reason: 'System memory usage too high (>80%)'
        };
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking job limits:', error);
      return { allowed: true }; // Allow if check fails
    }
  }
  
  async getActiveJobs(): Promise<any[]> {
    try {
      // Get all job keys from Redis using SCAN instead of KEYS for better performance
      const redis = this.jobManager.getRedisClient();
      const activeJobs = [];

      // Use SCAN for non-blocking iteration
      let cursor = '0';
      do {
        const [newCursor, keys] = await redis.scan(
          cursor,
          'MATCH', 'job:*',
          'COUNT', 100
        );
        cursor = newCursor;

        for (const key of keys) {
          // Skip result keys
          if (key.includes(':results')) continue;

          const job = await redis.hgetall(key);
          if (job && (job.status === 'queued' || job.status === 'processing')) {
            activeJobs.push({
              id: job.id,
              status: job.status,
              url: job.url,
              maxPages: parseInt(job.maxPages || '0') || 0,
              pagesCrawled: parseInt(job.pagesCrawled || '0') || 0,
              startTime: job.startTime
            });
          }
        }
      } while (cursor !== '0');

      return activeJobs;
    } catch (error) {
      console.error('Error getting active jobs:', error);
      return [];
    }
  }
  
  async getJobStats(): Promise<{
    activeJobs: number;
    totalPagesInProgress: number;
    memoryUsage: number;
    canStartNew: boolean;
  }> {
    const activeJobs = await this.getActiveJobs();
    const totalPagesInProgress = activeJobs.reduce((sum, job) => sum + job.maxPages, 0);
    const memoryUsage = process.memoryUsage();
    const memoryPercent = Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
    const { allowed } = await this.canStartNewJob();
    
    return {
      activeJobs: activeJobs.length,
      totalPagesInProgress,
      memoryUsage: memoryPercent,
      canStartNew: allowed
    };
  }
}

export const jobLimiter = JobLimiter.getInstance();