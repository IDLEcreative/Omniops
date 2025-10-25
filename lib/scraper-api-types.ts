import { z } from 'zod';

// AI Optimization Types
export interface AIOptimizationConfig {
  enabled: boolean;
  level: 'basic' | 'standard' | 'advanced' | 'adaptive';
  tokenTarget: number; // target token count
  preserveContent: string[]; // selectors to always keep
  cacheEnabled: boolean;
  precomputeMetadata: boolean;
  deduplicationEnabled: boolean;
}

export interface SemanticChunk {
  id: string;
  content: string;
  embedding?: number[];
  tokenCount: number;
  relevanceScore?: number;
  chunkType: 'header' | 'paragraph' | 'list' | 'table' | 'code' | 'other';
}

export interface AIMetadata {
  summary: string;
  keyTopics: string[];
  entities: { name: string; type: string; confidence: number }[];
  sentiment?: { score: number; label: 'positive' | 'negative' | 'neutral' };
  language: string;
  complexity: 'low' | 'medium' | 'high';
  contentStructure: {
    hasHeaders: boolean;
    hasLists: boolean;
    hasTables: boolean;
    hasCode: boolean;
  };
}

export interface AIOptimizedResult extends ScrapedPage {
  aiOptimized: boolean;
  optimization: {
    originalTokens: number;
    optimizedTokens: number;
    reductionPercent: number;
    compressionRatio: number;
  };
  semanticChunks?: SemanticChunk[];
  aiMetadata?: AIMetadata;
  deduplication?: {
    uniqueContentId: string;
    commonElementRefs: string[];
  };
}

// Schema for scraped page data
export const ScrapedPageSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  content: z.string(),
  textContent: z.string().optional(),
  excerpt: z.string().optional(),
  contentHash: z.string().optional(),
  wordCount: z.number().optional(),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ScrapedPage = z.infer<typeof ScrapedPageSchema>;

// Enhanced crawl job schema with memory tracking
export const CrawlJobSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'paused']),
  progress: z.number().min(0).max(100),
  total: z.number(),
  completed: z.number(),
  failed: z.number().default(0),
  skipped: z.number().default(0),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  pausedAt: z.string().optional(),
  errors: z.array(z.object({
    url: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })).optional(),
  memoryStats: z.object({
    heapUsed: z.number(),
    heapTotal: z.number(),
    percentUsed: z.number(),
  }).optional(),
  config: z.any().optional(), // Store config used for this crawl
});

export type CrawlJob = z.infer<typeof CrawlJobSchema>;

// Memory stats type
export interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}
