export interface PerformanceMetrics {
  method: string;
  avgTime: number;
  minTime: number;
  maxTime: number;
  memoryDelta: number;
  samples: number;
}
