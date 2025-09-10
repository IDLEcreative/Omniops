"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIOptimizationMonitor = exports.MemoryMonitor = exports.crawlerPresets = exports.cachingConfigurations = exports.chunkingStrategies = exports.tokenTargetsByUseCase = exports.aiOptimizationPresets = exports.CrawlerConfigSchema = exports.AIOptimizationConfigSchema = void 0;
exports.getAIOptimizationConfig = getAIOptimizationConfig;
exports.getCrawlerConfig = getCrawlerConfig;
const zod_1 = require("zod");
// AI Optimization configuration schema
exports.AIOptimizationConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(false),
    level: zod_1.z.enum(['basic', 'standard', 'advanced', 'adaptive']).default('standard'),
    tokenTarget: zod_1.z.number().min(500).max(10000).default(2000),
    preserveContent: zod_1.z.array(zod_1.z.string()).default(['h1', 'h2', 'h3', '.important']),
    cacheEnabled: zod_1.z.boolean().default(true),
    precomputeMetadata: zod_1.z.boolean().default(true),
    deduplicationEnabled: zod_1.z.boolean().default(true),
}).default({});
// Crawler configuration schema
exports.CrawlerConfigSchema = zod_1.z.object({
    // Concurrency settings
    maxConcurrency: zod_1.z.number().min(1).max(20).default(5), // Optimized default for better performance
    // Timeout settings (all in milliseconds)
    timeouts: zod_1.z.object({
        request: zod_1.z.number().min(5000).max(120000).default(20000), // 20s default (reduced from 30s)
        navigation: zod_1.z.number().min(5000).max(120000).default(20000), // 20s default (reduced from 30s)
        resourceLoad: zod_1.z.number().min(1000).max(30000).default(5000), // 5s default (reduced from 10s)
        scriptExecution: zod_1.z.number().min(1000).max(30000).default(5000), // 5s default (reduced from 10s)
    }).default({}),
    // Rate limiting
    rateLimit: zod_1.z.object({
        requestsPerMinute: zod_1.z.number().min(1).max(100).default(20),
        delayBetweenRequests: zod_1.z.number().min(0).max(10000).default(1000), // 1s default
        adaptiveDelay: zod_1.z.boolean().default(true),
        respectRobotsTxt: zod_1.z.boolean().default(false), // Set to true in production
    }).default({}),
    // Memory management
    memory: zod_1.z.object({
        maxResultsInMemory: zod_1.z.number().min(100).max(10000).default(500), // Lower default for better memory management
        batchSize: zod_1.z.number().min(10).max(500).default(50), // Smaller batches for large sites
        enableStreaming: zod_1.z.boolean().default(true),
        gcThreshold: zod_1.z.number().min(0.5).max(0.95).default(0.7), // More aggressive GC for stability
    }).default({}),
    // Content settings
    content: zod_1.z.object({
        minWordCount: zod_1.z.number().min(0).max(500).default(50),
        maxPageSizeMB: zod_1.z.number().min(1).max(50).default(10),
        extractImages: zod_1.z.boolean().default(true),
        extractLinks: zod_1.z.boolean().default(true),
        extractMetadata: zod_1.z.boolean().default(true),
    }).default({}),
    // Retry settings
    retry: zod_1.z.object({
        maxAttempts: zod_1.z.number().min(0).max(5).default(3),
        backoffMultiplier: zod_1.z.number().min(1).max(5).default(2),
        initialDelayMs: zod_1.z.number().min(100).max(5000).default(1000),
    }).default({}),
    // Browser settings
    browser: zod_1.z.object({
        headless: zod_1.z.boolean().default(true),
        userAgent: zod_1.z.string().default('CustomerServiceBot/1.0 (+https://yoursite.com/bot)'),
        viewport: zod_1.z.object({
            width: zod_1.z.number().default(1920),
            height: zod_1.z.number().default(1080),
        }).default({}),
        blockResources: zod_1.z.array(zod_1.z.enum(['image', 'media', 'font', 'other'])).default([]),
    }).default({}),
    // Advanced settings
    advanced: zod_1.z.object({
        followRedirects: zod_1.z.boolean().default(true),
        maxRedirects: zod_1.z.number().min(0).max(10).default(5),
        ignoreSslErrors: zod_1.z.boolean().default(false),
        waitForSelector: zod_1.z.string().optional(),
        customHeaders: zod_1.z.record(zod_1.z.string()).default({}),
    }).default({}),
    // AI optimization settings
    aiOptimization: exports.AIOptimizationConfigSchema,
});
// AI Optimization presets for different use cases
exports.aiOptimizationPresets = {
    // Basic optimization for speed
    fast: {
        enabled: true,
        level: 'basic',
        tokenTarget: 1000,
        preserveContent: ['h1', 'h2'],
        cacheEnabled: true,
        precomputeMetadata: false,
        deduplicationEnabled: true,
    },
    // Standard optimization for balanced quality and speed
    standard: {
        enabled: true,
        level: 'standard',
        tokenTarget: 2000,
        preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]'],
        cacheEnabled: true,
        precomputeMetadata: true,
        deduplicationEnabled: true,
    },
    // Advanced optimization for maximum quality
    quality: {
        enabled: true,
        level: 'advanced',
        tokenTarget: 4000,
        preserveContent: ['h1', 'h2', 'h3', 'h4', '.important', '.highlight', '[data-preserve]', 'blockquote'],
        cacheEnabled: true,
        precomputeMetadata: true,
        deduplicationEnabled: true,
    },
    // Adaptive optimization for intelligent content processing
    adaptive: {
        enabled: true,
        level: 'adaptive',
        tokenTarget: 3000,
        preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]', '.summary'],
        cacheEnabled: true,
        precomputeMetadata: true,
        deduplicationEnabled: true,
    },
    // Large scale optimization for crawling operations
    largescale: {
        enabled: true,
        level: 'standard',
        tokenTarget: 1500,
        preserveContent: ['h1', 'h2'],
        cacheEnabled: true,
        precomputeMetadata: false,
        deduplicationEnabled: true,
    },
    // Disabled optimization for legacy compatibility
    disabled: {
        enabled: false,
        level: 'basic',
        tokenTarget: 2000,
        preserveContent: [],
        cacheEnabled: false,
        precomputeMetadata: false,
        deduplicationEnabled: false,
    }
};
// Token targets for different use cases
exports.tokenTargetsByUseCase = {
    chatbot: 2000, // Good balance for conversational AI
    search: 1500, // Optimized for search indexing
    analysis: 4000, // Detailed content analysis
    summary: 1000, // Quick summaries
    embedding: 3000, // Vector embedding generation
    training: 5000, // AI model training data
};
// Chunking strategies for different content types
exports.chunkingStrategies = {
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
};
// Caching configurations for different deployment scales
exports.cachingConfigurations = {
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
};
// Default configurations for different use cases
exports.crawlerPresets = {
    // Fast crawling for well-structured sites with optimized settings
    fast: {
        maxConcurrency: 12, // Increased from 10
        timeouts: {
            request: 10000, // Reduced from 15000
            navigation: 10000, // Reduced from 15000
            resourceLoad: 3000, // Reduced from 5000
            scriptExecution: 3000, // Reduced from 5000
        },
        browser: {
            viewport: { width: 1920, height: 1080 },
            headless: true,
            userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
            blockResources: ['image', 'media', 'font', 'other'], // Added 'other' for more blocking
        },
        rateLimit: {
            requestsPerMinute: 120, // Increased for fast crawling
            delayBetweenRequests: 100, // Reduced delay
            adaptiveDelay: true,
            respectRobotsTxt: false,
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
    // Memory-efficient for very large crawls with progressive concurrency
    memoryEfficient: {
        maxConcurrency: 5, // Increased from 3 - will adapt based on memory
        memory: {
            maxResultsInMemory: 1000, // Increased from 500
            batchSize: 100, // Increased from 50
            enableStreaming: true,
            gcThreshold: 0.6, // More aggressive GC
        },
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
        aiOptimization: exports.aiOptimizationPresets.standard,
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
        aiOptimization: exports.aiOptimizationPresets.quality,
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
        aiOptimization: exports.aiOptimizationPresets.largescale,
    }
};
// Get AI optimization configuration by preset name
function getAIOptimizationConfig(preset) {
    const baseConfig = exports.aiOptimizationPresets.standard;
    if (preset && exports.aiOptimizationPresets[preset]) {
        return { ...baseConfig, ...exports.aiOptimizationPresets[preset] };
    }
    return baseConfig;
}
// Environment-based configuration
function getCrawlerConfig(preset) {
    const baseConfig = {};
    // Apply preset if specified
    if (preset && exports.crawlerPresets[preset]) {
        Object.assign(baseConfig, exports.crawlerPresets[preset]);
    }
    // Override with environment variables
    const envConfig = {};
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
    return exports.CrawlerConfigSchema.parse(mergedConfig);
}
// Helper function for deep merge
function deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
        if (source[key] !== undefined) {
            if (typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = deepMerge(result[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
    }
    return result;
}
// Memory monitoring utilities
class MemoryMonitor {
    constructor(gcThreshold = 0.8) {
        this.checkInterval = null;
        this.gcThreshold = gcThreshold;
    }
    static getInstance(gcThreshold) {
        if (!MemoryMonitor.instance) {
            MemoryMonitor.instance = new MemoryMonitor(gcThreshold);
        }
        return MemoryMonitor.instance;
    }
    startMonitoring(callback) {
        if (this.checkInterval)
            return;
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
    stopMonitoring() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
    }
    getMemoryStats() {
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
    isMemoryPressureHigh() {
        const stats = this.getMemoryStats();
        return stats.percentUsed > this.gcThreshold;
    }
}
exports.MemoryMonitor = MemoryMonitor;
// Performance Monitoring for AI Optimization
class AIOptimizationMonitor {
    constructor() {
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
    static getInstance() {
        if (!AIOptimizationMonitor.instance) {
            AIOptimizationMonitor.instance = new AIOptimizationMonitor();
        }
        return AIOptimizationMonitor.instance;
    }
    recordOptimization(data) {
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
            }
            else {
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
    getMetrics() {
        const memoryMonitor = MemoryMonitor.getInstance();
        return {
            ...this.metrics,
            uptimeMs: Date.now() - this.startTime,
            memoryUsage: memoryMonitor.getMemoryStats()
        };
    }
    reset() {
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
    getInsights() {
        const insights = {
            performance: 'good',
            recommendations: []
        };
        // Analyze compression ratio
        if (this.metrics.averageCompressionRatio < 1.2) {
            insights.recommendations.push('Consider increasing AI optimization level for better compression');
        }
        else if (this.metrics.averageCompressionRatio > 3) {
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
exports.AIOptimizationMonitor = AIOptimizationMonitor;
