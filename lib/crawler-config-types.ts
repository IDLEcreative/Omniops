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
  maxConcurrency: z.number().min(1).max(20).default(5), // Optimized default for better performance

  // Timeout settings (all in milliseconds)
  timeouts: z.object({
    request: z.number().min(5000).max(120000).default(20000), // 20s default (reduced from 30s)
    navigation: z.number().min(5000).max(120000).default(20000), // 20s default (reduced from 30s)
    resourceLoad: z.number().min(1000).max(30000).default(5000), // 5s default (reduced from 10s)
    scriptExecution: z.number().min(1000).max(30000).default(5000), // 5s default (reduced from 10s)
  }).default({}),

  // Rate limiting
  rateLimit: z.object({
    requestsPerMinute: z.number().min(1).max(200).default(20), // Increased max to 200 for fast presets
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
