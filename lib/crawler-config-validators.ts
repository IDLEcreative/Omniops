import type { MemoryStats } from './scraper-api-types';
import type { AIOptimizationMetrics } from './crawler-config-types';
import { CrawlerConfigSchema, type CrawlerConfig } from './crawler-config-types';
import { crawlerPresets } from './crawler-config-defaults';

// Helper function for deep merge
export function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] !== undefined) {
      if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }

  return result;
}

// Environment-based configuration
export function getCrawlerConfig(preset?: keyof typeof crawlerPresets): CrawlerConfig {
  const baseConfig: Partial<CrawlerConfig> = {};

  // Apply preset if specified
  if (preset && crawlerPresets[preset]) {
    Object.assign(baseConfig, crawlerPresets[preset]);
  }

  // Override with environment variables
  const envConfig: any = {};

  if (process.env.CRAWLER_MAX_CONCURRENCY) {
    envConfig.maxConcurrency = parseInt(process.env.CRAWLER_MAX_CONCURRENCY);
  }

  if (process.env.CRAWLER_TIMEOUT_REQUEST || process.env.CRAWLER_TIMEOUT_NAVIGATION) {
    envConfig.timeouts = {};
    if (process.env.CRAWLER_TIMEOUT_REQUEST) {
      envConfig.timeouts.request = parseInt(process.env.CRAWLER_TIMEOUT_REQUEST);
    }
    if (process.env.CRAWLER_TIMEOUT_NAVIGATION) {
      envConfig.timeouts.navigation = parseInt(process.env.CRAWLER_TIMEOUT_NAVIGATION);
    }
  }

  if (process.env.CRAWLER_RATE_LIMIT || process.env.CRAWLER_RESPECT_ROBOTS) {
    envConfig.rateLimit = {};
    if (process.env.CRAWLER_RATE_LIMIT) {
      envConfig.rateLimit.requestsPerMinute = parseInt(process.env.CRAWLER_RATE_LIMIT);
    }
    if (process.env.CRAWLER_RESPECT_ROBOTS === 'true') {
      envConfig.rateLimit.respectRobotsTxt = true;
    }
  }

  if (process.env.CRAWLER_MAX_RESULTS_MEMORY) {
    envConfig.memory = {
      maxResultsInMemory: parseInt(process.env.CRAWLER_MAX_RESULTS_MEMORY)
    };
  }

  // Merge configs (env vars take precedence)
  const mergedConfig = deepMerge(baseConfig, envConfig);

  // Validate and return
  return CrawlerConfigSchema.parse(mergedConfig);
}

// Memory monitoring utilities
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private checkInterval: NodeJS.Timeout | null = null;
  private gcThreshold: number;

  private constructor(gcThreshold: number = 0.8) {
    this.gcThreshold = gcThreshold;
  }

  static getInstance(gcThreshold?: number): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor(gcThreshold);
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(callback?: (stats: MemoryStats) => void): void {
    if (this.checkInterval) return;

    this.checkInterval = setInterval(() => {
      const stats = this.getMemoryStats();

      if (stats.percentUsed > this.gcThreshold && global.gc) {
        console.log(`Memory usage high (${(stats.percentUsed * 100).toFixed(1)}%), forcing garbage collection`);
        global.gc();
      }

      if (callback) {
        callback(stats);
      }
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getMemoryStats(): MemoryStats {
    const usage = process.memoryUsage();
    const heapTotal = usage.heapTotal;
    const heapUsed = usage.heapUsed;
    const external = usage.external;
    const rss = usage.rss;

    return {
      heapUsed: Math.round(heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(heapTotal / 1024 / 1024), // MB
      external: Math.round(external / 1024 / 1024), // MB
      rss: Math.round(rss / 1024 / 1024), // MB
      percentUsed: heapUsed / heapTotal,
    };
  }

  isMemoryPressureHigh(): boolean {
    const stats = this.getMemoryStats();
    return stats.percentUsed > this.gcThreshold;
  }
}

// Performance Monitoring for AI Optimization
export class AIOptimizationMonitor {
  private static instance: AIOptimizationMonitor;
  private metrics: AIOptimizationMetrics;
  private processingTimes: number[];
  private compressionRatios: number[];
  private cacheStats: { hits: number; misses: number };
  private startTime: number;

  private constructor() {
    this.metrics = {
      totalProcessed: 0,
      totalOptimized: 0,
      averageCompressionRatio: 1,
      averageProcessingTimeMs: 0,
      cacheHitRate: 0,
      deduplicationRate: 0,
      errorRate: 0,
      tokensSaved: 0
    };
    this.processingTimes = [];
    this.compressionRatios = [];
    this.cacheStats = { hits: 0, misses: 0 };
    this.startTime = Date.now();
  }

  static getInstance(): AIOptimizationMonitor {
    if (!AIOptimizationMonitor.instance) {
      AIOptimizationMonitor.instance = new AIOptimizationMonitor();
    }
    return AIOptimizationMonitor.instance;
  }

  recordOptimization(data: {
    processingTimeMs: number;
    originalTokens: number;
    optimizedTokens: number;
    wasError: boolean;
    wasCacheHit?: boolean;
    wasDeduplicated?: boolean;
  }): void {
    this.metrics.totalProcessed++;

    if (!data.wasError) {
      this.metrics.totalOptimized++;
      this.processingTimes.push(data.processingTimeMs);

      const compressionRatio = data.originalTokens / data.optimizedTokens;
      this.compressionRatios.push(compressionRatio);

      this.metrics.tokensSaved += (data.originalTokens - data.optimizedTokens);

      // Update averages
      this.metrics.averageProcessingTimeMs = this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length;
      this.metrics.averageCompressionRatio = this.compressionRatios.reduce((a, b) => a + b, 0) / this.compressionRatios.length;
    }

    // Update cache stats
    if (data.wasCacheHit !== undefined) {
      if (data.wasCacheHit) {
        this.cacheStats.hits++;
      } else {
        this.cacheStats.misses++;
      }

      const totalCacheRequests = this.cacheStats.hits + this.cacheStats.misses;
      this.metrics.cacheHitRate = totalCacheRequests > 0 ? this.cacheStats.hits / totalCacheRequests : 0;
    }

    // Update error rate
    this.metrics.errorRate = this.metrics.totalProcessed > 0 ?
      (this.metrics.totalProcessed - this.metrics.totalOptimized) / this.metrics.totalProcessed : 0;

    // Update deduplication rate
    if (data.wasDeduplicated !== undefined && data.wasDeduplicated) {
      this.metrics.deduplicationRate = (this.metrics.deduplicationRate * (this.metrics.totalProcessed - 1) + 1) / this.metrics.totalProcessed;
    }

    // Keep arrays bounded to prevent memory leaks
    if (this.processingTimes.length > 1000) {
      this.processingTimes = this.processingTimes.slice(-500);
    }
    if (this.compressionRatios.length > 1000) {
      this.compressionRatios = this.compressionRatios.slice(-500);
    }
  }

  getMetrics(): AIOptimizationMetrics & {
    uptimeMs: number;
    memoryUsage: MemoryStats;
  } {
    const memoryMonitor = MemoryMonitor.getInstance();
    return {
      ...this.metrics,
      uptimeMs: Date.now() - this.startTime,
      memoryUsage: memoryMonitor.getMemoryStats()
    };
  }

  reset(): void {
    this.metrics = {
      totalProcessed: 0,
      totalOptimized: 0,
      averageCompressionRatio: 1,
      averageProcessingTimeMs: 0,
      cacheHitRate: 0,
      deduplicationRate: 0,
      errorRate: 0,
      tokensSaved: 0
    };
    this.processingTimes = [];
    this.compressionRatios = [];
    this.cacheStats = { hits: 0, misses: 0 };
    this.startTime = Date.now();
  }

  // Get performance insights
  getInsights(): {
    performance: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const insights = {
      performance: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
      recommendations: [] as string[]
    };

    // Analyze compression ratio
    if (this.metrics.averageCompressionRatio < 1.2) {
      insights.recommendations.push('Consider increasing AI optimization level for better compression');
    } else if (this.metrics.averageCompressionRatio > 3) {
      insights.performance = 'excellent';
    }

    // Analyze processing time
    if (this.metrics.averageProcessingTimeMs > 5000) {
      insights.recommendations.push('Consider reducing token targets or optimization level to improve speed');
      insights.performance = 'fair';
    }

    // Analyze error rate
    if (this.metrics.errorRate > 0.1) {
      insights.recommendations.push('High error rate detected - check AI service configuration');
      insights.performance = 'poor';
    }

    // Analyze cache performance
    if (this.metrics.cacheHitRate < 0.3) {
      insights.recommendations.push('Low cache hit rate - consider increasing cache size or TTL');
    }

    return insights;
  }
}
