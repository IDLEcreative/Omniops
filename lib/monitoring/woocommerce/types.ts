/**
 * WooCommerce Monitoring Types
 * Type definitions for health checks and monitoring reports
 */

export interface HealthStatus {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  details?: string;
  error?: string;
}

export interface MonitoringReport {
  timestamp: string;
  overallStatus: 'healthy' | 'degraded' | 'down';
  checks: HealthStatus[];
  metrics: {
    apiResponseTime: number;
    databaseResponseTime: number;
    cacheHitRate?: number;
  };
  recommendations: string[];
}

export async function measureResponseTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;
  return { result, duration };
}
