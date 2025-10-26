/**
 * Type definitions and interfaces for scrape monitoring system
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  components: {
    redis: ComponentHealth;
    queue: ComponentHealth;
    workers: ComponentHealth;
    memory: ComponentHealth;
    database: ComponentHealth;
  };
  metrics: SystemMetrics;
  alerts: Alert[];
}

export interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime?: number;
  lastCheck: Date;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  queue: QueueMetrics;
  workers: WorkerMetrics;
  memory: MemoryMetrics;
  redis: RedisMetrics;
}

export interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  throughput: number;
  avgProcessingTime: number;
}

export interface WorkerMetrics {
  total: number;
  active: number;
  idle: number;
  failed: number;
  avgMemoryUsage: number;
  avgCpuUsage: number;
}

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}

export interface RedisMetrics {
  connected: boolean;
  memoryUsage: number;
  keyCount: number;
  hitRate: number;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  component: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  checkInterval: number;
  alertThresholds: AlertThresholds;
  enableMetricsCollection: boolean;
  enableAlerting: boolean;
  retainMetricsFor: number;
  retainAlertsFor: number;
}

export interface AlertThresholds {
  memory: { warning: number; critical: number };
  queue: { warning: number; critical: number };
  responseTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
}

export const DEFAULT_MONITORING_CONFIG: MonitoringConfig = {
  checkInterval: 30000,
  alertThresholds: {
    memory: { warning: 0.75, critical: 0.9 },
    queue: { warning: 100, critical: 500 },
    responseTime: { warning: 5000, critical: 10000 },
    errorRate: { warning: 0.05, critical: 0.1 },
  },
  enableMetricsCollection: true,
  enableAlerting: true,
  retainMetricsFor: 24,
  retainAlertsFor: 72,
};
