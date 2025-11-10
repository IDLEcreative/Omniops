/**
 * Type definitions for performance metrics
 *
 * Defines all metric interfaces used throughout the performance monitoring system.
 */

export interface RenderMetric {
  messageId: string;
  renderTime: number; // milliseconds
  contentLength: number;
  hasMarkdown: boolean;
  hasCodeBlocks: boolean;
  timestamp: Date;
}

export interface ScrollMetric {
  fps: number;
  frameTime: number; // milliseconds per frame
  jankFrames: number; // frames that took >16ms
  timestamp: Date;
  scrollHeight: number;
  messageCount: number;
}

export interface MemorySnapshot {
  heapUsed: number; // bytes
  heapTotal: number; // bytes
  external: number; // bytes
  timestamp: Date;
  sessionId?: string;
  messageCount?: number;
}

export interface TabSyncMetric {
  operation: 'broadcast' | 'receive' | 'reconcile';
  latency: number; // milliseconds
  dataSize: number; // bytes
  success: boolean;
  timestamp: Date;
  tabId?: string;
}

export interface APIMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  duration: number; // milliseconds
  requestSize?: number; // bytes
  responseSize?: number; // bytes
  cached: boolean;
  timestamp: Date;
  errorType?: string;
}

export interface BundleLoadMetric {
  bundleName: string;
  loadTime: number; // milliseconds
  size: number; // bytes
  cached: boolean;
  timestamp: Date;
}

export interface PerformanceSnapshot {
  renders: {
    count: number;
    avgTime: number;
    p95Time: number;
    slowRenders: number; // renders >16ms
  };
  scroll: {
    avgFps: number;
    minFps: number;
    jankPercentage: number;
  };
  memory: {
    current: number;
    peak: number;
    avgUsage: number;
  };
  tabSync: {
    count: number;
    avgLatency: number;
    p95Latency: number;
    failures: number;
  };
  api: {
    totalCalls: number;
    avgDuration: number;
    p95Duration: number;
    errorRate: number;
    cacheHitRate: number;
  };
  bundles: {
    totalLoaded: number;
    totalSize: number;
    avgLoadTime: number;
    cacheHitRate: number;
  };
}
