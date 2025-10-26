/**
 * Types for scraper API handlers
 * Extracted from scraper-api-handlers.ts
 */

import { AIOptimizationConfig } from '../scraper-api-types';

export interface RequestHandlerConfig {
  ecommerceMode?: boolean;
  aiOptimization?: AIOptimizationConfig;
}

export interface PageProcessingMetrics {
  responseTime: number;
  pageSizeMB: number;
  wordCount: number;
  processingTime: number;
}

export interface AIOptimizationMetrics {
  processingTimeMs: number;
  originalTokens: number;
  optimizedTokens: number;
  wasError: boolean;
  wasCacheHit: boolean;
  wasDeduplicated: boolean;
}

// Re-export for convenience
export type { AIOptimizationConfig };
