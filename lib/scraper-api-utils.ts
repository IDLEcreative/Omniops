import { getMemoryAwareJobManager } from './redis-enhanced';
import { MemoryMonitor, AIOptimizationMonitor, getAIOptimizationConfig } from './crawler-config';
import { DeduplicationService } from './scraper-api-ai';
import type { ScrapedPage, AIOptimizedResult, CrawlJob, AIOptimizationConfig } from './scraper-api-types';

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

// Get memory monitor instance
const memoryMonitor = MemoryMonitor.getInstance();

// Get AI optimization monitor instance
const aiOptimizationMonitor = AIOptimizationMonitor.getInstance();

// Utility functions for AI optimization
export function createAIOptimizationConfig(overrides?: Partial<AIOptimizationConfig>): AIOptimizationConfig {
  return {
    enabled: true,
    level: 'standard',
    tokenTarget: 2000,
    preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
    ...overrides
  };
}

// Migration utilities for backward compatibility
export function isAIOptimizedResult(result: ScrapedPage | AIOptimizedResult): result is AIOptimizedResult {
  return 'aiOptimized' in result;
}

export function convertToStandardResult(result: ScrapedPage | AIOptimizedResult): ScrapedPage {
  if (isAIOptimizedResult(result)) {
    const { aiOptimized, optimization, semanticChunks, aiMetadata, deduplication, ...standardResult } = result;
    return standardResult;
  }
  return result;
}

export function getOptimizationMetrics(result: ScrapedPage | AIOptimizedResult): {
  isOptimized: boolean;
  originalTokens?: number;
  optimizedTokens?: number;
  reductionPercent?: number;
  compressionRatio?: number;
} {
  if (isAIOptimizedResult(result) && result.aiOptimized) {
    return {
      isOptimized: true,
      ...result.optimization
    };
  }
  return { isOptimized: false };
}

// Clear AI service caches
export function clearAIOptimizationCache(): void {
  DeduplicationService.clearCache();
}

// Utility function to apply AI optimization preset to config
export function applyAIOptimizationPreset(
  preset: 'fast' | 'standard' | 'quality' | 'adaptive' | 'largescale' | 'disabled',
  overrides?: Partial<AIOptimizationConfig>
): AIOptimizationConfig {
  const baseConfig = getAIOptimizationConfig(preset);
  return { ...baseConfig, ...overrides };
}

// Get system health status including AI optimization metrics
export async function getHealthStatus(): Promise<{
  redis: boolean;
  memory: any;
  fallbackActive: boolean;
  crawlerReady: boolean;
  aiOptimization?: any;
}> {
  const redisHealth = await jobManager.getHealthStatus();
  const memoryStats = memoryMonitor.getMemoryStats();
  const aiMetrics = aiOptimizationMonitor.getMetrics();

  return {
    redis: redisHealth.redis,
    memory: memoryStats,
    fallbackActive: redisHealth.fallbackActive,
    crawlerReady: true,
    aiOptimization: {
      metrics: aiMetrics,
      insights: aiOptimizationMonitor.getInsights()
    }
  };
}

// Get detailed AI optimization metrics
export function getAIOptimizationMetrics() {
  return aiOptimizationMonitor.getMetrics();
}

// Reset AI optimization metrics
export function resetAIOptimizationMetrics(): void {
  aiOptimizationMonitor.reset();
}

// Clean up old jobs
export async function cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
  return 0;
}

// Check crawl job status with pagination support
export async function checkCrawlStatus(
  jobId: string,
  options?: {
    includeResults?: boolean;
    offset?: number;
    limit?: number;
  }
): Promise<CrawlJob & { data?: (ScrapedPage | AIOptimizedResult)[]; resultCount?: number }> {
  const job = await jobManager.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  const resultCount = await jobManager.getResultCount(jobId);

  // Ensure job object has all required CrawlJob fields
  const fullJob: CrawlJob = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    total: job.total,
    completed: job.completed,
    failed: job.failed ?? 0,
    skipped: job.skipped ?? 0,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    pausedAt: job.pausedAt,
    errors: job.errors,
    memoryStats: job.memoryStats,
    config: job.config,
  };

  if (fullJob.status === 'completed' && options?.includeResults) {
    const results = await jobManager.getJobResults(
      jobId,
      options.offset || 0,
      options.limit || 100
    );
    return { ...fullJob, data: results, resultCount };
  }

  return { ...fullJob, resultCount };
}

// Stream results for very large crawls
export async function* streamCrawlResults(jobId: string): AsyncGenerator<ScrapedPage | AIOptimizedResult, void, unknown> {
  let count = 0;
  for await (const result of jobManager.streamJobResults(jobId)) {
    count++;
    if (count % 10 === 0) {
    }
    yield result;
  }
}

// Resume a paused crawl
export async function resumeCrawl(jobId: string): Promise<void> {
  const job = await jobManager.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== 'paused') {
    throw new Error(`Job ${jobId} is not paused (status: ${job.status})`);
  }

  await jobManager.updateJob(jobId, {
    status: 'processing',
    pausedAt: undefined,
  });

  const config = job.config || {};
  const stats = job.stats || { scraped: 0, errors: 0, total: 0 };


  try {
    throw new Error('Resume functionality not fully implemented');
  } catch (error) {
    await jobManager.updateJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
