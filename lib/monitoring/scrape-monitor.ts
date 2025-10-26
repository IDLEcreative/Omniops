/**
 * Comprehensive health monitoring system for scraper workers and queue system
 */
import { EventEmitter } from 'events';
import { getQueueManager, ScrapeQueueManager } from '../queue/scrape-queue';
import { getResilientRedisClient } from '../redis-enhanced';
import { logger } from '../logger';
import {
  SystemHealth,
  ComponentHealth,
  SystemMetrics,
  Alert,
  MonitoringConfig,
  DEFAULT_MONITORING_CONFIG,
} from './scrape-monitor-types';
import {
  checkRedisHealth,
  checkQueueHealth,
  checkWorkersHealth,
  checkMemoryHealth,
  checkDatabaseHealth,
  collectSystemMetrics,
  getEmptyMetrics,
} from './scrape-monitor-collectors';
import {
  processAlerts,
  getActiveAlerts,
  getAllAlerts,
  clearResolvedAlerts,
  cleanupOldAlerts,
} from './scrape-monitor-alerts';

/**
 * Health monitoring and alerting system
 */
export class ScrapeMonitor extends EventEmitter {
  private queueManager: ScrapeQueueManager;
  private redisClient = getResilientRedisClient();
  private config: MonitoringConfig;
  private checkInterval: NodeJS.Timeout | null = null;
  private isRunning = false;
  private metricsHistory: SystemMetrics[] = [];
  private alerts: Map<string, Alert> = new Map();
  private startTime = Date.now();

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.config = { ...DEFAULT_MONITORING_CONFIG, ...config };
    this.queueManager = getQueueManager();
  }

  /**
   * Start the monitoring system
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Monitor is already running');
      return;
    }

    try {
      await this.queueManager.initialize();

      this.isRunning = true;
      this.checkInterval = setInterval(
        () => this.performHealthCheck(),
        this.config.checkInterval
      );

      await this.performHealthCheck();

      logger.info('ScrapeMonitor started successfully');
      this.emit('started');
    } catch (error) {
      logger.error('Failed to start ScrapeMonitor:', error);
      throw error;
    }
  }

  /**
   * Stop the monitoring system
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    this.isRunning = false;
    logger.info('ScrapeMonitor stopped');
    this.emit('stopped');
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const checkStartTime = Date.now();

    try {
      const [
        redisHealth,
        queueHealth,
        workersHealth,
        memoryHealth,
        databaseHealth,
      ] = await Promise.allSettled([
        checkRedisHealth(this.redisClient, this.config),
        checkQueueHealth(this.queueManager, this.config),
        checkWorkersHealth(),
        checkMemoryHealth(this.config),
        checkDatabaseHealth(),
      ]);

      const components = {
        redis: this.extractResult(redisHealth),
        queue: this.extractResult(queueHealth),
        workers: this.extractResult(workersHealth),
        memory: this.extractResult(memoryHealth),
        database: this.extractResult(databaseHealth),
      };

      const metrics = await this.collectMetrics();
      const alerts = getActiveAlerts(this.alerts);

      const componentStatuses = Object.values(components).map(c => c.status);
      const systemStatus = this.determineOverallHealth(componentStatuses);

      const health: SystemHealth = {
        status: systemStatus,
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        components,
        metrics,
        alerts,
      };

      if (this.config.enableMetricsCollection) {
        this.storeMetrics(metrics);
      }

      if (this.config.enableAlerting) {
        processAlerts(health, this.config, this.alerts, this);
      }

      this.cleanup();

      const checkDuration = Date.now() - checkStartTime;
      logger.debug(`Health check completed in ${checkDuration}ms`);

      this.emit('healthCheck', health);
      return health;
    } catch (error) {
      logger.error('Health check failed:', error);

      const errorHealth: SystemHealth = {
        status: 'unhealthy',
        timestamp: new Date(),
        uptime: Date.now() - this.startTime,
        components: {
          redis: { status: 'unhealthy', lastCheck: new Date(), message: 'Health check failed' },
          queue: { status: 'unhealthy', lastCheck: new Date(), message: 'Health check failed' },
          workers: { status: 'unhealthy', lastCheck: new Date(), message: 'Health check failed' },
          memory: { status: 'unhealthy', lastCheck: new Date(), message: 'Health check failed' },
          database: { status: 'unhealthy', lastCheck: new Date(), message: 'Health check failed' },
        },
        metrics: getEmptyMetrics(),
        alerts: [],
      };

      this.emit('healthCheck', errorHealth);
      return errorHealth;
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      return await collectSystemMetrics(this.queueManager, this.redisClient);
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      return getEmptyMetrics();
    }
  }

  /**
   * Get current system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return await this.performHealthCheck();
  }

  /**
   * Get worker status
   */
  async getWorkerStatus(): Promise<any[]> {
    return [];
  }

  /**
   * Get current metrics
   */
  async getMetrics(): Promise<SystemMetrics> {
    return await this.collectMetrics();
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return getActiveAlerts(this.alerts);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): Alert[] {
    return getAllAlerts(this.alerts);
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 1): SystemMetrics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter(() => Date.now() - cutoff > 0);
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    clearResolvedAlerts(this.alerts);
  }

  // Private helper methods

  private extractResult(settledResult: PromiseSettledResult<ComponentHealth>): ComponentHealth {
    if (settledResult.status === 'fulfilled') {
      return settledResult.value;
    } else {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: `Check failed: ${settledResult.reason}`,
      };
    }
  }

  private determineOverallHealth(statuses: ComponentHealth['status'][]): SystemHealth['status'] {
    if (statuses.some(s => s === 'unhealthy')) return 'unhealthy';
    if (statuses.some(s => s === 'degraded')) return 'degraded';
    return 'healthy';
  }

  private storeMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push(metrics);

    const maxAge = this.config.retainMetricsFor * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    this.metricsHistory = this.metricsHistory.filter(() => Date.now() - cutoff > 0);
  }

  private cleanup(): void {
    cleanupOldAlerts(this.alerts, this.config);
  }
}

// Singleton instance
let monitor: ScrapeMonitor | null = null;

/**
 * Get the singleton monitor instance
 */
export function getMonitor(config?: Partial<MonitoringConfig>): ScrapeMonitor {
  if (!monitor) {
    monitor = new ScrapeMonitor(config);
  }
  return monitor;
}

/**
 * Initialize and start the monitoring system
 */
export async function startMonitoring(config?: Partial<MonitoringConfig>): Promise<ScrapeMonitor> {
  const monitorInstance = getMonitor(config);
  await monitorInstance.start();
  return monitorInstance;
}

/**
 * Stop the monitoring system
 */
export async function stopMonitoring(): Promise<void> {
  if (monitor) {
    await monitor.stop();
  }
}

// Convenience functions for scripts
export async function checkSystemHealth(): Promise<SystemHealth> {
  const monitorInstance = getMonitor();
  return await monitorInstance.getSystemHealth();
}

export async function getWorkerStatus(): Promise<any[]> {
  const monitorInstance = getMonitor();
  return await monitorInstance.getWorkerStatus();
}

export async function getSystemMetrics(): Promise<SystemMetrics> {
  const monitorInstance = getMonitor();
  return await monitorInstance.getMetrics();
}

// Re-export types for convenience
export * from './scrape-monitor-types';
