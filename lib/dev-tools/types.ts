/**
 * Shared types for universal developer tools
 */

export interface PerformanceMetrics {
  duration: number;
  memoryUsed: number;
  timestamp: number;
  args?: unknown[];
  result?: unknown;
  error?: Error;
}

export interface FunctionCallInfo {
  name: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryBefore: number;
  memoryAfter: number;
  memoryDelta: number;
  args: unknown[];
  result?: unknown;
  error?: Error;
  callStack: string[];
}

export interface ProfilerStats {
  count: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  totalMemory: number;
  avgMemory: number;
  errorCount: number;
}

export interface MemorySnapshot {
  used: number;
  total: number;
  external: number;
  timestamp: number;
  heapUsed: number;
  heapTotal: number;
}

export interface ChromeDevToolsProfile {
  version: string;
  type: string;
  title: string;
  nodes: ChromeProfileNode[];
  startTime: number;
  endTime: number;
  samples: number[];
  timeDeltas: number[];
}

export interface ChromeProfileNode {
  id: number;
  callFrame: {
    functionName: string;
    scriptId: string;
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  hitCount: number;
  children?: number[];
}

export interface ProfilerReport {
  summary: {
    totalFunctions: number;
    totalCalls: number;
    totalTime: number;
    totalMemory: number;
    topBottlenecks: string[];
  };
  functions: Record<string, ProfilerStats>;
  memoryLeaks: {
    suspected: boolean;
    growthRate: number;
    snapshots: MemorySnapshot[];
  };
  recommendations: string[];
  timestamp: number;
}

export interface AutoInstrumentOptions {
  includePrivate?: boolean;
  excludePatterns?: RegExp[];
  maxCallStackDepth?: number;
  trackMemory?: boolean;
  sampleRate?: number;
}

export interface ProfilerOptions {
  trackMemory?: boolean;
  maxHistory?: number;
  autoFlush?: boolean;
  flushInterval?: number;
  enableCallStack?: boolean;
  maxCallStackDepth?: number;
}