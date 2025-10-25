/**
 * Crawler Configuration Module
 *
 * Main orchestrator for crawler configuration management.
 * This file re-exports all types, presets, and utilities for backwards compatibility.
 *
 * Refactored into modules:
 * - crawler-config-types.ts: Schemas, interfaces, constants
 * - crawler-config-defaults.ts: Presets and default configurations
 * - crawler-config-validators.ts: Validation utilities, monitors
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
