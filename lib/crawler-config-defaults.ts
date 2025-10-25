import type { AIOptimizationConfig } from './scraper-api';
import type { CrawlerConfig } from './crawler-config-types';

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

// Default configurations for different use cases
export const crawlerPresets = {
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
