/**
 * Scrape Monitor - Proxy File
 *
 * This file maintains backward compatibility by re-exporting from the modular implementation.
 * The actual implementation is in lib/monitoring/scrape-monitor/
 */

export * from './scrape-monitor/index';
export {
  ScrapeMonitor,
  getMonitor,
  startMonitoring,
  stopMonitoring,
  checkSystemHealth,
  getWorkerStatus,
  getSystemMetrics,
} from './scrape-monitor/index';
