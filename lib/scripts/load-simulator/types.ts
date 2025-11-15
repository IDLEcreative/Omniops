export interface LoadTestConfig {
  users: number;
  duration: number;
  messagesPerUser: number;
  scenario: 'burst' | 'sustained' | 'ramp-up' | 'memory-leak';
  apiUrl: string;
  reportInterval: number;
}

export interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    leaked: number;
  };
  errors: Array<{ type: string; count: number }>;
}
