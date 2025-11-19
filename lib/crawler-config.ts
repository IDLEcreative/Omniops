/**
 * Crawler Configuration Module - AI-optimized header for fast comprehension
 *
 * @purpose Main orchestrator for crawler config - re-exports types, presets, validators for backward compatibility
 *
 * @flow
 *   1. Import request → Re-export from modular files (types, defaults, validators)
 *   2. → Types from crawler-config-types.ts
 *   3. → Presets from crawler-config-defaults.ts
 *   4. → Validators from crawler-config-validators.ts
 *
 * @keyFunctions
 *   - getCrawlerConfig (re-exported): Validates and merges crawler configuration
 *   - getAIOptimizationConfig (re-exported): Returns AI optimization settings
 *   - deepMerge (re-exported): Deep merges configuration objects
 *   - MemoryMonitor (re-exported): Monitors crawler memory usage
 *   - AIOptimizationMonitor (re-exported): Monitors AI token usage
 *
 * @exports
 *   - Types: CrawlerConfig, AIOptimizationMetrics
 *   - Schemas: AIOptimizationConfigSchema, CrawlerConfigSchema
 *   - Presets: aiOptimizationPresets, crawlerPresets
 *   - Utilities: getCrawlerConfig, deepMerge, MemoryMonitor, AIOptimizationMonitor
 *   - Constants: tokenTargetsByUseCase, chunkingStrategies, cachingConfigurations
 *
 * @modularStructure
 *   - crawler-config-types.ts: Zod schemas, TypeScript interfaces, constants
 *   - crawler-config-defaults.ts: Default presets (minimal, balanced, comprehensive)
 *   - crawler-config-validators.ts: Validation logic, monitoring utilities
 *
 * @consumers
 *   - lib/content-extractor.ts: Uses getCrawlerConfig for scraping settings
 *   - app/api/scrape/route.ts: Configures crawler based on customer settings
 *   - Tests: Import types and schemas for validation
 *
 * @totalLines 37
 * @estimatedTokens 400 (without header), 200 (with header - 50% savings)
 */

// Re-export all types and schemas
export type { CrawlerConfig, AIOptimizationMetrics } from './crawler-config-types';
export {
  AIOptimizationConfigSchema,
  CrawlerConfigSchema,
  tokenTargetsByUseCase,
  chunkingStrategies,
  cachingConfigurations,
} from './crawler-config-types';

// Re-export all presets and defaults
export {
  aiOptimizationPresets,
  crawlerPresets,
  getAIOptimizationConfig,
} from './crawler-config-defaults';

// Re-export validators and utilities
export {
  getCrawlerConfig,
  deepMerge,
  MemoryMonitor,
  AIOptimizationMonitor,
} from './crawler-config-validators';
