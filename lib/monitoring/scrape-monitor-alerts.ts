/**
 * Alert processing and management for scrape monitoring system
 */
import { EventEmitter } from 'events';
import { logger } from '../logger';
import {
  Alert,
  SystemHealth,
  MonitoringConfig,
} from './scrape-monitor-types';

/**
 * Process and generate alerts based on system health
 */
export function processAlerts(
  health: SystemHealth,
  config: MonitoringConfig,
  alerts: Map<string, Alert>,
  emitter: EventEmitter
): void {
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
  if (health.metrics.memory.percentUsed > config.alertThresholds.memory.critical) {
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
  if (totalPendingJobs > config.alertThresholds.queue.critical) {
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
    alerts.set(alert.id, alert);
    logger.warn(`Alert: ${alert.level} - ${alert.message}`);
    emitter.emit('alert', alert);
  });

  // Resolve old alerts if conditions are no longer met
  resolveOutdatedAlerts(health, config, alerts, emitter);
}

/**
 * Resolve alerts that are no longer valid
 */
export function resolveOutdatedAlerts(
  health: SystemHealth,
  config: MonitoringConfig,
  alerts: Map<string, Alert>,
  emitter: EventEmitter
): void {
  alerts.forEach((alert) => {
    if (alert.resolved) return;

    let shouldResolve = false;

    switch (alert.component) {
      case 'memory':
        shouldResolve = health.metrics.memory.percentUsed < config.alertThresholds.memory.warning;
        break;
      case 'queue':
        const totalPending = health.metrics.queue.waiting + health.metrics.queue.delayed;
        shouldResolve = totalPending < config.alertThresholds.queue.warning;
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
      emitter.emit('alertResolved', alert);
    }
  });
}

/**
 * Get active (unresolved) alerts
 */
export function getActiveAlerts(alerts: Map<string, Alert>): Alert[] {
  return Array.from(alerts.values()).filter(alert => !alert.resolved);
}

/**
 * Get all alerts (including resolved)
 */
export function getAllAlerts(alerts: Map<string, Alert>): Alert[] {
  return Array.from(alerts.values());
}

/**
 * Clear resolved alerts
 */
export function clearResolvedAlerts(alerts: Map<string, Alert>): void {
  alerts.forEach((alert, alertId) => {
    if (alert.resolved) {
      alerts.delete(alertId);
    }
  });
}

/**
 * Cleanup old resolved alerts
 */
export function cleanupOldAlerts(
  alerts: Map<string, Alert>,
  config: MonitoringConfig
): void {
  const now = Date.now();
  const maxAlertAge = config.retainAlertsFor * 60 * 60 * 1000;

  alerts.forEach((alert, alertId) => {
    if (alert.resolved && (now - alert.timestamp.getTime()) > maxAlertAge) {
      alerts.delete(alertId);
    }
  });
}
