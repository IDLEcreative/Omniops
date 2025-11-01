/**
 * Performance Monitor Types
 */

export interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  totalDuration: number;
  metrics: PerformanceMetric[];
  slowestOperations: PerformanceMetric[];
  suggestions: string[];
}

export interface PerformanceThresholds {
  slow: number;
  verySlow: number;
  critical: number;
}

export interface MemorySnapshot {
  timestamp: number;
  usage: NodeJS.MemoryUsage;
}

export interface MemoryTrends {
  current: NodeJS.MemoryUsage;
  average: { heapUsed: number };
  peak: { heapUsed: number };
  trend: 'increasing' | 'decreasing' | 'stable';
}
