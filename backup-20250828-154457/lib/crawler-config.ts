import { z } from 'zod';
import type { AIOptimizationConfig } from './scraper-api';

// AI Optimization configuration schema
export const AIOptimizationConfigSchema = z.object({
  enabled: z.boolean().default(false),
  level: z.enum(['basic', 'standard', 'advanced', 'adaptive']).default('standard'),
  tokenTarget: z.number().min(500).max(10000).default(2000),
  preserveContent: z.array(z.string()).default(['h1', 'h2', 'h3', '.important']),
  cacheEnabled: z.boolean().default(true),
  precomputeMetadata: z.boolean().default(true),
  deduplicationEnabled: z.boolean().default(true),
}).default({});

// Crawler configuration schema
export const CrawlerConfigSchema = z.object({
  // Concurrency settings
  maxConcurrency: z.number().min(1).max(20).default(3), // Conservative default to avoid rate limiting
  
  // Timeout settings (all in milliseconds)
  timeouts: z.object({
    request: z.number().min(5000).max(120000).default(30000), // 30s default
    navigation: z.number().min(5000).max(120000).default(30000), // 30s default
    resourceLoad: z.number().min(1000).max(30000).default(10000), // 10s default
    scriptExecution: z.number().min(1000).max(30000).default(10000), // 10s default
  }).default({}),
  
  // Rate limiting
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).max(100).default(20),
    delayBetweenRequests: z.number().min(0).max(10000).default(1000), // 1s default
    adaptiveDelay: z.boolean().default(true),
    respectRobotsTxt: z.boolean().default(false), // Set to true in production
  }).default({}),
  
  // Memory management
  memory: z.object({
    maxResultsInMemory: z.number().min(100).max(10000).default(500), // Lower default for better memory management
    batchSize: z.number().min(10).max(500).default(50), // Smaller batches for large sites
    enableStreaming: z.boolean().default(true),
    gcThreshold: z.number().min(0.5).max(0.95).default(0.7), // More aggressive GC for stability
  }).default({}),
  
  // Content settings
  content: z.object({
    minWordCount: z.number().min(0).max(500).default(50),
    maxPageSizeMB: z.number().min(1).max(50).default(10),
    extractImages: z.boolean().default(true),
    extractLinks: z.boolean().default(true),
    extractMetadata: z.boolean().default(true),
  }).default({}),
  
  // Retry settings
  retry: z.object({
    maxAttempts: z.number().min(0).max(5).default(3),
    backoffMultiplier: z.number().min(1).max(5).default(2),
    initialDelayMs: z.number().min(100).max(5000).default(1000),
  }).default({}),
  
  // Browser settings
  browser: z.object({
    headless: z.boolean().default(true),
    userAgent: z.string().default('CustomerServiceBot/1.0 (+https://yoursite.com/bot)'),
    viewport: z.object({
      width: z.number().default(1920),
      height: z.number().default(1080),
    }).default({}),
    blockResources: z.array(z.enum(['image', 'media', 'font', 'other'])).default([]),
  }).default({}),
  
  // Advanced settings
  advanced: z.object({
    followRedirects: z.boolean().default(true),
    maxRedirects: z.number().min(0).max(10).default(5),
    ignoreSslErrors: z.boolean().default(false),
    waitForSelector: z.string().optional(),
    customHeaders: z.record(z.string()).default({}),
  }).default({}),
  
  // AI optimization settings
  aiOptimization: AIOptimizationConfigSchema,
});

export type CrawlerConfig = z.infer<typeof CrawlerConfigSchema>;

// AI Optimization presets for different use cases
export const aiOptimizationPresets = {
  // Basic optimization for speed
  fast: {
    enabled: true,
    level: 'basic' as const,
    tokenTarget: 1000,
    preserveContent: ['h1', 'h2'],
    cacheEnabled: true,
    precomputeMetadata: false,
    deduplicationEnabled: true,
  },
  
  // Standard optimization for balanced quality and speed
  standard: {
    enabled: true,
    level: 'standard' as const,
    tokenTarget: 2000,
    preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
  },
  
  // Advanced optimization for maximum quality
  quality: {
    enabled: true,
    level: 'advanced' as const,
    tokenTarget: 4000,
    preserveContent: ['h1', 'h2', 'h3', 'h4', '.important', '.highlight', '[data-preserve]', 'blockquote'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
  },
  
  // Adaptive optimization for intelligent content processing
  adaptive: {
    enabled: true,
    level: 'adaptive' as const,
    tokenTarget: 3000,
    preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]', '.summary'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
  },
  
  // Large scale optimization for crawling operations
  largescale: {
    enabled: true,
    level: 'standard' as const,
    tokenTarget: 1500,
    preserveContent: ['h1', 'h2'],
    cacheEnabled: true,
    precomputeMetadata: false,
    deduplicationEnabled: true,
  },
  
  // Disabled optimization for legacy compatibility
  disabled: {
    enabled: false,
    level: 'basic' as const,
    tokenTarget: 2000,
    preserveContent: [],
    cacheEnabled: false,
    precomputeMetadata: false,
    deduplicationEnabled: false,
  }
} satisfies Record<string, AIOptimizationConfig>;

// Token targets for different use cases
export const tokenTargetsByUseCase = {
  chatbot: 2000,        // Good balance for conversational AI
  search: 1500,         // Optimized for search indexing
  analysis: 4000,       // Detailed content analysis
  summary: 1000,        // Quick summaries
  embedding: 3000,      // Vector embedding generation
  training: 5000,       // AI model training data
} as const;

// Chunking strategies for different content types
export const chunkingStrategies = {
  // Semantic chunking preserves meaning
  semantic: {
    strategy: 'semantic',
    maxTokens: 512,
    overlap: 50,
    preserveBoundaries: ['sentence', 'paragraph'],
  },
  // Fixed size chunking for consistent processing
  fixed: {
    strategy: 'fixed',
    maxTokens: 1024,
    overlap: 100,
    preserveBoundaries: ['word'],
  },
  // Hierarchical chunking follows document structure
  hierarchical: {
    strategy: 'hierarchical',
    maxTokens: 2048,
    overlap: 0,
    preserveBoundaries: ['section', 'paragraph', 'sentence'],
  },
} as const;

// Caching configurations for different deployment scales
export const cachingConfigurations = {
  // Development - minimal caching
  development: {
    enabled: true,
    maxEntries: 100,
    ttlHours: 1,
    compressionEnabled: false,
  },
  // Production - aggressive caching
  production: {
    enabled: true,
    maxEntries: 10000,
    ttlHours: 24,
    compressionEnabled: true,
  },
  // High volume - memory-efficient caching
  highvolume: {
    enabled: true,
    maxEntries: 50000,
    ttlHours: 6,
    compressionEnabled: true,
  },
} as const;

// Default configurations for different use cases
export const crawlerPresets = {
  // Fast crawling for well-structured sites
  fast: {
    maxConcurrency: 10,
    timeouts: {
      request: 15000,
      navigation: 15000,
      resourceLoad: 5000,
      scriptExecution: 5000,
    },
    browser: {
      viewport: { width: 1920, height: 1080 },
      headless: true,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      blockResources: ['image', 'media', 'font'],
    },
  },
  
  // Careful crawling for slow or complex sites
  careful: {
    maxConcurrency: 2,
    timeouts: {
      request: 60000,
      navigation: 60000,
      resourceLoad: 20000,
      scriptExecution: 20000,
    },
    rateLimit: {
      requestsPerMinute: 10,
      delayBetweenRequests: 3000,
      adaptiveDelay: true,
      respectRobotsTxt: true,
    },
  },
  
  // Memory-efficient for very large crawls
  memoryEfficient: {
    maxConcurrency: 3,
    memory: {
      maxResultsInMemory: 500,
      batchSize: 50,
      enableStreaming: true,
      gcThreshold: 0.7,
    },
    browser: {
      viewport: { width: 1920, height: 1080 },
      headless: true,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      blockResources: ['image', 'media', 'font', 'other'],
    },
  },
  
  // Production settings with all safety features
  production: {
    rateLimit: {
      requestsPerMinute: 20,
      delayBetweenRequests: 1000,
      respectRobotsTxt: true,
      adaptiveDelay: true,
    },
    retry: {
      maxAttempts: 3,
      backoffMultiplier: 2,
      initialDelayMs: 1000,
    },
    advanced: {
      followRedirects: true,
      maxRedirects: 5,
      ignoreSslErrors: false,
      customHeaders: {},
    },
  },
  ecommerce: {
    maxConcurrency: 5,
    timeouts: {
      navigation: 45000, // Longer for product pages with lots of images
      request: 90000,
      resourceLoad: 15000,
      scriptExecution: 10000, // Standard script execution timeout
    },
    browser: {
      viewport: { width: 1920, height: 1080 },
      headless: true,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      blockResources: [], // Don't block images for product extraction
    },
    content: {
      minWordCount: 20, // Lower threshold for product pages
      maxPageSizeMB: 10,
      extractImages: true, // Important for products
      extractLinks: true,
      extractMetadata: true,
    },
    rateLimit: {
      requestsPerMinute: 60, // Respectful to e-commerce sites
      delayBetweenRequests: 1000,
      adaptiveDelay: true,
      respectRobotsTxt: true,
    },
    advanced: {
      followRedirects: true,
      maxRedirects: 5,
      ignoreSslErrors: false,
      customHeaders: {},
      waitForSelector: '.product, .product-item, [itemtype*="Product"]', // Wait for products
    },
    // Add AI optimization to ecommerce preset
    aiOptimization: aiOptimizationPresets.standard,
  },
  
  // AI-focused preset for content analysis
  aiOptimized: {
    maxConcurrency: 3,
    timeouts: {
      request: 45000,
      navigation: 45000,
      resourceLoad: 15000,
      scriptExecution: 10000,
    },
    content: {
      minWordCount: 100,
      maxPageSizeMB: 15,
      extractImages: false, // Skip images for text analysis
      extractLinks: true,
      extractMetadata: true,
    },
    browser: {
      viewport: { width: 1920, height: 1080 },
      headless: true,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      blockResources: ['image', 'media', 'font'],
    },
    rateLimit: {
      requestsPerMinute: 30,
      delayBetweenRequests: 2000,
      adaptiveDelay: true,
      respectRobotsTxt: true,
    },
    aiOptimization: aiOptimizationPresets.quality,
  },
  
  // Large-scale AI crawling preset
  aiLargescale: {
    maxConcurrency: 5,
    memory: {
      maxResultsInMemory: 1000,
      batchSize: 100,
      enableStreaming: true,
      gcThreshold: 0.6,
    },
    browser: {
      viewport: { width: 1920, height: 1080 },
      headless: true,
      userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      blockResources: ['image', 'media', 'font', 'other'],
    },
    aiOptimization: aiOptimizationPresets.largescale,
  }
} satisfies Record<string, Partial<CrawlerConfig>>;

// Get AI optimization configuration by preset name
export function getAIOptimizationConfig(preset?: keyof typeof aiOptimizationPresets): AIOptimizationConfig {
  const baseConfig = aiOptimizationPresets.standard;
  
  if (preset && aiOptimizationPresets[preset]) {
    return { ...baseConfig, ...aiOptimizationPresets[preset] };
  }
  
  return baseConfig;
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

// Helper function for deep merge
function deepMerge(target: any, source: any): any {
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

export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}

// AI Optimization Performance Metrics
export interface AIOptimizationMetrics {
  totalProcessed: number;
  totalOptimized: number;
  averageCompressionRatio: number;
  averageProcessingTimeMs: number;
  cacheHitRate: number;
  deduplicationRate: number;
  errorRate: number;
  tokensSaved: number;
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