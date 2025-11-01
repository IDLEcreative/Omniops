/**
 * Comprehensive health monitoring system for scraper workers and queue system
 */

import { ScrapeMonitor } from './core';
import type { MonitoringConfig, SystemHealth, SystemMetrics } from '../scrape-monitor-types';

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

// Re-export core class and types
export { ScrapeMonitor };
export * from '../scrape-monitor-types';
