/**
 * Performance Optimizer Configuration
 *
 * Defines all configuration interfaces and defaults for the performance optimizer.
 * Controls thresholds, limits, and behavior for optimization features.
 */

export interface PerformanceConfig {
  virtualScrolling: {
    enabled: boolean;
    itemHeight: number; // Fixed height per message in pixels
    overscan: number; // Number of items to render outside viewport
    threshold: number; // Enable after N messages
  };
  pagination: {
    enabled: boolean;
    pageSize: number;
    initialLoad: number;
    threshold: number; // Enable after N messages
  };
  memoryManagement: {
    enabled: boolean;
    maxMessagesInMemory: number;
    cleanupThreshold: number;
  };
  batching: {
    enabled: boolean;
    batchSize: number;
    debounceMs: number;
  };
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  virtualScrolling: {
    enabled: true,
    itemHeight: 80, // Approximate message height
    overscan: 5,
    threshold: 100, // Enable for 100+ messages
  },
  pagination: {
    enabled: true,
    pageSize: 50,
    initialLoad: 30,
    threshold: 50,
  },
  memoryManagement: {
    enabled: true,
    maxMessagesInMemory: 500,
    cleanupThreshold: 600,
  },
  batching: {
    enabled: true,
    batchSize: 10,
    debounceMs: 100,
  },
};
