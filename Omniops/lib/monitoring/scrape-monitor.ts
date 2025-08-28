import { EventEmitter } from 'events';
import { getQueueManager, ScrapeQueueManager } from '../queue/scrape-queue';
import { getResilientRedisClient } from '../redis-enhanced';
import { logger } from '../logger';

/**
 * Comprehensive health monitoring system for scraper workers and queue system
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
  queue: {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    throughput: number; // jobs per minute
    avgProcessingTime: number; // ms
  };
  workers: {
    total: number;
    active: number;
    idle: number;
    failed: number;
    avgMemoryUsage: number;
    avgCpuUsage: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    percentUsed: number;
  };
  redis: {
    connected: boolean;
    memoryUsage: number;
    keyCount: number;
    hitRate: number;
  };
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
  checkInterval: number; // ms
  alertThresholds: {
    memory: { warning: number; critical: number };
    queue: { warning: number; critical: number };
    responseTime: { warning: number; critical: number };
    errorRate: { warning: number; critical: number };
  };
  enableMetricsCollection: boolean;
  enableAlerting: boolean;
  retainMetricsFor: number; // hours
  retainAlertsFor: number; // hours
}

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

  // Default configuration
  private static readonly DEFAULT_CONFIG: MonitoringConfig = {
    checkInterval: 30000, // 30 seconds
    alertThresholds: {
      memory: { warning: 0.75, critical: 0.9 },
      queue: { warning: 100, critical: 500 },
      responseTime: { warning: 5000, critical: 10000 },
      errorRate: { warning: 0.05, critical: 0.1 },
    },
    enableMetricsCollection: true,
    enableAlerting: true,
    retainMetricsFor: 24, // 24 hours
    retainAlertsFor: 72, // 72 hours
  };

  constructor(config: Partial<MonitoringConfig> = {}) {
    super();
    this.config = { ...ScrapeMonitor.DEFAULT_CONFIG, ...config };
    this.queueManager = getQueueManager();
    
    this.setupEventListeners();
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

      // Perform initial health check
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
        this.checkRedisHealth(),
        this.checkQueueHealth(),
        this.checkWorkersHealth(),
        this.checkMemoryHealth(),
        this.checkDatabaseHealth(),
      ]);

      const components = {
        redis: this.extractResult(redisHealth),
        queue: this.extractResult(queueHealth),
        workers: this.extractResult(workersHealth),
        memory: this.extractResult(memoryHealth),
        database: this.extractResult(databaseHealth),
      };

      const metrics = await this.collectMetrics();
      const alerts = this.getActiveAlerts();

      // Determine overall system health
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

      // Store metrics if enabled
      if (this.config.enableMetricsCollection) {
        this.storeMetrics(metrics);
      }

      // Check for alerts
      if (this.config.enableAlerting) {
        await this.processAlerts(health);
      }

      // Clean up old data
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
        metrics: this.getEmptyMetrics(),
        alerts: [],
      };

      this.emit('healthCheck', errorHealth);
      return errorHealth;
    }
  }

  /**
   * Check Redis health
   */
  private async checkRedisHealth(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      const pingResult = await this.redisClient.ping();
      const responseTime = Date.now() - startTime;

      if (pingResult) {
        return {
          status: responseTime > this.config.alertThresholds.responseTime.warning ? 'degraded' : 'healthy',
          responseTime,
          lastCheck: new Date(),
          message: `Redis responding in ${responseTime}ms`,
        };
      } else {
        return {
          status: 'unhealthy',
          responseTime,
          lastCheck: new Date(),
          message: 'Redis ping failed',
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        status: 'unhealthy',
        responseTime,
        lastCheck: new Date(),
        message: `Redis connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check queue health
   */
  private async checkQueueHealth(): Promise<ComponentHealth> {
    try {
      const metrics = await this.queueManager.getQueueMetrics();
      const queueStats = metrics.queue;

      const totalPendingJobs = queueStats.waiting + queueStats.delayed;
      const isOverloaded = totalPendingJobs > this.config.alertThresholds.queue.critical;
      const isDegraded = totalPendingJobs > this.config.alertThresholds.queue.warning;

      return {
        status: isOverloaded ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        message: `${totalPendingJobs} pending jobs, ${queueStats.active} active`,
        details: {
          ...queueStats,
          redis: metrics.redis,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: `Queue health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check workers health
   */
  private async checkWorkersHealth(): Promise<ComponentHealth> {
    try {
      // Note: Worker metrics are not available from ScrapeQueueManager
      // Using default values for now
      const workerMetrics: any[] = [];
      const activeWorkers = 0;
      const failedWorkers = 0;
      const totalWorkers = workerMetrics.length;

      const healthyRatio = activeWorkers / Math.max(totalWorkers, 1);
      const isUnhealthy = healthyRatio < 0.5;
      const isDegraded = healthyRatio < 0.8;

      return {
        status: isUnhealthy ? 'unhealthy' : isDegraded ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        message: `${activeWorkers}/${totalWorkers} workers active, ${failedWorkers} failed`,
        details: {
          total: totalWorkers,
          active: activeWorkers,
          failed: failedWorkers,
          metrics: workerMetrics,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: `Worker health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<ComponentHealth> {
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = require('os').totalmem();
      const percentUsed = memUsage.heapUsed / totalMemory;

      const isCritical = percentUsed > this.config.alertThresholds.memory.critical;
      const isWarning = percentUsed > this.config.alertThresholds.memory.warning;

      return {
        status: isCritical ? 'unhealthy' : isWarning ? 'degraded' : 'healthy',
        lastCheck: new Date(),
        message: `Memory usage: ${(percentUsed * 100).toFixed(1)}% (${Math.round(memUsage.heapUsed / 1024 / 1024)}MB)`,
        details: {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss,
          percentUsed,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: `Memory health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Check database health (simplified - checks if we can connect)
   */
  private async checkDatabaseHealth(): Promise<ComponentHealth> {
    try {
      // This is a simplified check - in production, you might want to check Supabase specifically
      const startTime = Date.now();
      
      // Check if database environment variables are set
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return {
          status: 'unhealthy',
          lastCheck: new Date(),
          message: 'Database configuration missing',
        };
      }

      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
        lastCheck: new Date(),
        message: 'Database configuration present',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        message: `Database health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<SystemMetrics> {
    try {
      const [queueMetricsData, memoryUsage] = await Promise.all([
        this.queueManager.getQueueMetrics(),
        Promise.resolve(process.memoryUsage()),
      ]);
      
      const queueMetrics = queueMetricsData.queue;
      const workerMetrics: any[] = []; // Worker metrics not available from ScrapeQueueManager

      const totalMemory = require('os').totalmem();
      const activeWorkers = workerMetrics.filter((w: any) => w.isRunning);
      
      return {
        queue: {
          waiting: queueMetrics.waiting,
          active: queueMetrics.active,
          completed: queueMetrics.completed,
          failed: queueMetrics.failed,
          delayed: queueMetrics.delayed,
          throughput: this.calculateThroughput(),
          avgProcessingTime: this.calculateAvgProcessingTime(),
        },
        workers: {
          total: workerMetrics.length,
          active: activeWorkers.length,
          idle: workerMetrics.length - activeWorkers.length,
          failed: workerMetrics.filter((w: any) => !w.isRunning).length,
          avgMemoryUsage: 0, // Simplified - would need worker-specific memory tracking
          avgCpuUsage: 0, // Simplified - would need worker-specific CPU tracking
        },
        memory: {
          heapUsed: memoryUsage.heapUsed,
          heapTotal: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss,
          percentUsed: memoryUsage.heapUsed / totalMemory,
        },
        redis: {
          connected: await this.redisClient.ping(),
          memoryUsage: 0, // Would need Redis INFO command
          keyCount: 0, // Would need Redis DBSIZE command
          hitRate: 0, // Would need Redis statistics
        },
      };
    } catch (error) {
      logger.error('Failed to collect metrics:', error);
      return this.getEmptyMetrics();
    }
  }

  /**
   * Process and generate alerts based on system health
   */
  private async processAlerts(health: SystemHealth): Promise<void> {
    const newAlerts: Alert[] = [];

    // Check each component for alert conditions
    Object.entries(health.components).forEach(([component, componentHealth]) => {
      if (componentHealth.status === 'unhealthy') {
        newAlerts.push({
          id: `${component}_unhealthy_${Date.now()}`,
          level: 'critical',
          component,
          message: `${component} is unhealthy: ${componentHealth.message}`,
          timestamp: new Date(),
          resolved: false,
          metadata: componentHealth.details,
        });
      } else if (componentHealth.status === 'degraded') {
        newAlerts.push({
          id: `${component}_degraded_${Date.now()}`,
          level: 'warning',
          component,
          message: `${component} is degraded: ${componentHealth.message}`,
          timestamp: new Date(),
          resolved: false,
          metadata: componentHealth.details,
        });
      }
    });

    // Check metrics for alert conditions
    if (health.metrics.memory.percentUsed > this.config.alertThresholds.memory.critical) {
      newAlerts.push({
        id: `memory_critical_${Date.now()}`,
        level: 'critical',
        component: 'memory',
        message: `Critical memory usage: ${(health.metrics.memory.percentUsed * 100).toFixed(1)}%`,
        timestamp: new Date(),
        resolved: false,
        metadata: { memoryUsage: health.metrics.memory },
      });
    }

    const totalPendingJobs = health.metrics.queue.waiting + health.metrics.queue.delayed;
    if (totalPendingJobs > this.config.alertThresholds.queue.critical) {
      newAlerts.push({
        id: `queue_overload_${Date.now()}`,
        level: 'critical',
        component: 'queue',
        message: `Queue overloaded: ${totalPendingJobs} pending jobs`,
        timestamp: new Date(),
        resolved: false,
        metadata: { queueMetrics: health.metrics.queue },
      });
    }

    // Store new alerts
    newAlerts.forEach(alert => {
      this.alerts.set(alert.id, alert);
      logger.warn(`Alert: ${alert.level} - ${alert.message}`);
      this.emit('alert', alert);
    });

    // Resolve old alerts if conditions are no longer met
    this.resolveOutdatedAlerts(health);
  }

  /**
   * Resolve alerts that are no longer valid
   */
  private resolveOutdatedAlerts(health: SystemHealth): void {
    this.alerts.forEach((alert, alertId) => {
      if (alert.resolved) return;

      let shouldResolve = false;

      switch (alert.component) {
        case 'memory':
          shouldResolve = health.metrics.memory.percentUsed < this.config.alertThresholds.memory.warning;
          break;
        case 'queue':
          const totalPending = health.metrics.queue.waiting + health.metrics.queue.delayed;
          shouldResolve = totalPending < this.config.alertThresholds.queue.warning;
          break;
        case 'redis':
        case 'workers':
        case 'database':
          shouldResolve = health.components[alert.component]?.status === 'healthy';
          break;
      }

      if (shouldResolve) {
        alert.resolved = true;
        logger.info(`Alert resolved: ${alert.message}`);
        this.emit('alertResolved', alert);
      }
    });
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
    // Worker metrics not available from ScrapeQueueManager
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
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  /**
   * Get all alerts (including resolved)
   */
  getAllAlerts(): Alert[] {
    return Array.from(this.alerts.values());
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 1): SystemMetrics[] {
    const cutoff = Date.now() - hours * 60 * 60 * 1000;
    return this.metricsHistory.filter(m => Date.now() - cutoff > 0);
  }

  /**
   * Clear resolved alerts
   */
  clearResolvedAlerts(): void {
    this.alerts.forEach((alert, alertId) => {
      if (alert.resolved) {
        this.alerts.delete(alertId);
      }
    });
  }

  // Private helper methods

  private setupEventListeners(): void {
    // Listen to queue manager events
    // Note: ScrapeQueueManager doesn't expose event emitter interface
    // Event listeners are commented out until the queue manager supports event emitting
    
    /*
    this.queueManager.on('workerFailed', (data: any) => {
      const alert: Alert = {
        id: `worker_failed_${Date.now()}`,
        level: 'error',
        component: 'workers',
        message: `Worker ${data.workerId} failed: ${data.error}`,
        timestamp: new Date(),
        resolved: false,
        metadata: data,
      };
      this.alerts.set(alert.id, alert);
      this.emit('alert', alert);
    });

    this.queueManager.on('redisError', (error: any) => {
      const alert: Alert = {
        id: `redis_error_${Date.now()}`,
        level: 'critical',
        component: 'redis',
        message: `Redis error: ${error.message}`,
        timestamp: new Date(),
        resolved: false,
        metadata: { error: error.message },
      };
      this.alerts.set(alert.id, alert);
      this.emit('alert', alert);
    });
    */
  }

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
    
    // Keep only recent metrics
    const maxAge = this.config.retainMetricsFor * 60 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    this.metricsHistory = this.metricsHistory.filter(m => Date.now() - cutoff > 0);
  }

  private cleanup(): void {
    const now = Date.now();
    
    // Clean up old alerts
    const maxAlertAge = this.config.retainAlertsFor * 60 * 60 * 1000;
    this.alerts.forEach((alert, alertId) => {
      if (alert.resolved && (now - alert.timestamp.getTime()) > maxAlertAge) {
        this.alerts.delete(alertId);
      }
    });
  }

  private calculateThroughput(): number {
    // Simplified calculation - would need historical data
    return 0;
  }

  private calculateAvgProcessingTime(): number {
    // Simplified calculation - would need job timing data
    return 0;
  }

  private getEmptyMetrics(): SystemMetrics {
    return {
      queue: {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
        throughput: 0,
        avgProcessingTime: 0,
      },
      workers: {
        total: 0,
        active: 0,
        idle: 0,
        failed: 0,
        avgMemoryUsage: 0,
        avgCpuUsage: 0,
      },
      memory: {
        heapUsed: 0,
        heapTotal: 0,
        external: 0,
        rss: 0,
        percentUsed: 0,
      },
      redis: {
        connected: false,
        memoryUsage: 0,
        keyCount: 0,
        hitRate: 0,
      },
    };
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

export async function getMetrics(): Promise<SystemMetrics> {
  const monitorInstance = getMonitor();
  return await monitorInstance.getMetrics();
}

// Types are already exported as interfaces above