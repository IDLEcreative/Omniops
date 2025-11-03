/**
 * Conversation Persistence Monitoring System
 *
 * Tracks conversation persistence success rates, session restoration,
 * storage operation latencies, and error rates for the chat widget.
 *
 * Target Metrics:
 * - persistence.success_rate: >99%
 * - persistence.restore_time: <200ms
 * - persistence.data_loss: 0%
 */

import { logger } from '@/lib/logger';

export interface PersistenceMetric {
  operation: 'save' | 'restore' | 'sync' | 'delete' | 'navigation';
  success: boolean;
  duration: number;
  timestamp: Date;
  sessionId?: string;
  conversationId?: string;
  errorType?: string;
  errorMessage?: string;
  metadata?: {
    messageCount?: number;
    storageType?: 'localStorage' | 'parentStorage' | 'enhanced';
    dataSize?: number; // bytes
    crossPage?: boolean;
    tabSync?: boolean;
  };
}

export interface PersistenceStats {
  totalOperations: number;
  successCount: number;
  failureCount: number;
  successRate: number; // percentage
  avgDuration: number; // milliseconds
  p50Duration: number;
  p95Duration: number;
  p99Duration: number;
  dataLossIncidents: number;
  errorsByType: Record<string, number>;
  lastUpdated: Date;
}

export interface SessionRestorationMetric {
  sessionId: string;
  conversationId: string;
  success: boolean;
  duration: number;
  messagesRestored: number;
  timestamp: Date;
  errorType?: string;
  storageAdapter?: string;
}

export interface CrossPageNavigationMetric {
  sessionId: string;
  fromPage: string;
  toPage: string;
  success: boolean;
  dataPreserved: boolean;
  duration: number;
  timestamp: Date;
}

export class PersistenceMonitor {
  private static instance: PersistenceMonitor;
  private metrics: PersistenceMetric[] = [];
  private restorations: SessionRestorationMetric[] = [];
  private navigations: CrossPageNavigationMetric[] = [];
  private readonly MAX_METRICS = 5000; // Keep last 5000 metrics
  private readonly ALERT_THRESHOLD = 0.95; // Alert if success rate < 95%
  private dataLossCount = 0;

  private constructor() {
    // Start periodic cleanup
    setInterval(() => this.cleanOldMetrics(), 300000); // Every 5 minutes
  }

  static getInstance(): PersistenceMonitor {
    if (!PersistenceMonitor.instance) {
      PersistenceMonitor.instance = new PersistenceMonitor();
    }
    return PersistenceMonitor.instance;
  }

  /**
   * Track a persistence operation
   */
  trackOperation(metric: PersistenceMetric): void {
    this.metrics.push(metric);

    // Trim if exceeds max
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    // Track data loss
    if (!metric.success && metric.operation === 'save') {
      this.dataLossCount++;
      logger.error('Data loss incident detected', {
        operation: metric.operation,
        sessionId: metric.sessionId,
        conversationId: metric.conversationId,
        error: metric.errorMessage,
      });
    }

    // Alert on slow operations
    if (metric.duration > 500) {
      logger.warn('Slow persistence operation', {
        operation: metric.operation,
        duration: `${metric.duration}ms`,
        sessionId: metric.sessionId,
      });
    }

    // Check if success rate dropped below threshold
    const recentMetrics = this.getRecentMetrics(60000); // Last minute
    if (recentMetrics.length >= 10) {
      const successRate = this.calculateSuccessRate(recentMetrics);
      if (successRate < this.ALERT_THRESHOLD) {
        logger.error('Persistence success rate below threshold', {
          successRate: `${(successRate * 100).toFixed(2)}%`,
          threshold: `${(this.ALERT_THRESHOLD * 100)}%`,
          recentOperations: recentMetrics.length,
        });
      }
    }
  }

  /**
   * Track session restoration
   */
  trackRestoration(restoration: SessionRestorationMetric): void {
    this.restorations.push(restoration);

    // Trim if exceeds max
    if (this.restorations.length > this.MAX_METRICS) {
      this.restorations = this.restorations.slice(-this.MAX_METRICS);
    }

    if (!restoration.success) {
      logger.error('Session restoration failed', {
        sessionId: restoration.sessionId,
        conversationId: restoration.conversationId,
        errorType: restoration.errorType,
      });
    } else if (restoration.duration > 200) {
      logger.warn('Slow session restoration', {
        sessionId: restoration.sessionId,
        duration: `${restoration.duration}ms`,
        messagesRestored: restoration.messagesRestored,
      });
    }
  }

  /**
   * Track cross-page navigation
   */
  trackNavigation(navigation: CrossPageNavigationMetric): void {
    this.navigations.push(navigation);

    // Trim if exceeds max
    if (this.navigations.length > this.MAX_METRICS) {
      this.navigations = this.navigations.slice(-this.MAX_METRICS);
    }

    if (!navigation.dataPreserved) {
      this.dataLossCount++;
      logger.error('Data lost during navigation', {
        sessionId: navigation.sessionId,
        fromPage: navigation.fromPage,
        toPage: navigation.toPage,
      });
    }
  }

  /**
   * Get persistence statistics
   */
  getStats(timeWindowMs?: number): PersistenceStats {
    const metricsToAnalyze = timeWindowMs
      ? this.getRecentMetrics(timeWindowMs)
      : this.metrics;

    const totalOperations = metricsToAnalyze.length;
    const successCount = metricsToAnalyze.filter(m => m.success).length;
    const failureCount = totalOperations - successCount;

    const durations = metricsToAnalyze.map(m => m.duration).sort((a, b) => a - b);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

    // Count errors by type
    const errorsByType: Record<string, number> = {};
    metricsToAnalyze
      .filter(m => !m.success && m.errorType)
      .forEach(m => {
        const type = m.errorType!;
        errorsByType[type] = (errorsByType[type] || 0) + 1;
      });

    return {
      totalOperations,
      successCount,
      failureCount,
      successRate: totalOperations > 0 ? (successCount / totalOperations) * 100 : 100,
      avgDuration,
      p50Duration: this.percentile(durations, 50),
      p95Duration: this.percentile(durations, 95),
      p99Duration: this.percentile(durations, 99),
      dataLossIncidents: this.dataLossCount,
      errorsByType,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get session restoration statistics
   */
  getRestorationStats(timeWindowMs?: number): {
    totalRestorations: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    avgDuration: number;
    avgMessagesRestored: number;
    errorsByType: Record<string, number>;
  } {
    const restorations = timeWindowMs
      ? this.restorations.filter(r => Date.now() - r.timestamp.getTime() < timeWindowMs)
      : this.restorations;

    const totalRestorations = restorations.length;
    const successCount = restorations.filter(r => r.success).length;
    const failureCount = totalRestorations - successCount;

    const durations = restorations.map(r => r.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

    const messagesRestored = restorations.map(r => r.messagesRestored);
    const avgMessagesRestored = messagesRestored.reduce((a, b) => a + b, 0) / (messagesRestored.length || 1);

    const errorsByType: Record<string, number> = {};
    restorations
      .filter(r => !r.success && r.errorType)
      .forEach(r => {
        const type = r.errorType!;
        errorsByType[type] = (errorsByType[type] || 0) + 1;
      });

    return {
      totalRestorations,
      successCount,
      failureCount,
      successRate: totalRestorations > 0 ? (successCount / totalRestorations) * 100 : 100,
      avgDuration,
      avgMessagesRestored,
      errorsByType,
    };
  }

  /**
   * Get cross-page navigation statistics
   */
  getNavigationStats(timeWindowMs?: number): {
    totalNavigations: number;
    successCount: number;
    dataPreservedCount: number;
    dataLossCount: number;
    avgDuration: number;
  } {
    const navigations = timeWindowMs
      ? this.navigations.filter(n => Date.now() - n.timestamp.getTime() < timeWindowMs)
      : this.navigations;

    const totalNavigations = navigations.length;
    const successCount = navigations.filter(n => n.success).length;
    const dataPreservedCount = navigations.filter(n => n.dataPreserved).length;
    const dataLossCount = totalNavigations - dataPreservedCount;

    const durations = navigations.map(n => n.duration);
    const avgDuration = durations.reduce((a, b) => a + b, 0) / (durations.length || 1);

    return {
      totalNavigations,
      successCount,
      dataPreservedCount,
      dataLossCount,
      avgDuration,
    };
  }

  /**
   * Get recent metrics for time-based analysis
   */
  private getRecentMetrics(timeWindowMs: number): PersistenceMetric[] {
    const cutoff = Date.now() - timeWindowMs;
    return this.metrics.filter(m => m.timestamp.getTime() > cutoff);
  }

  /**
   * Calculate success rate for metrics
   */
  private calculateSuccessRate(metrics: PersistenceMetric[]): number {
    if (metrics.length === 0) return 1;
    const successCount = metrics.filter(m => m.success).length;
    return successCount / metrics.length;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Clean old metrics (keep last 1 hour)
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - 3600000; // 1 hour
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    this.restorations = this.restorations.filter(r => r.timestamp.getTime() > cutoff);
    this.navigations = this.navigations.filter(n => n.timestamp.getTime() > cutoff);
  }

  /**
   * Export all metrics for external analysis
   */
  exportMetrics(): {
    persistence: PersistenceMetric[];
    restorations: SessionRestorationMetric[];
    navigations: CrossPageNavigationMetric[];
    stats: PersistenceStats;
  } {
    return {
      persistence: this.metrics,
      restorations: this.restorations,
      navigations: this.navigations,
      stats: this.getStats(),
    };
  }

  /**
   * Reset all metrics (for testing)
   */
  reset(): void {
    this.metrics = [];
    this.restorations = [];
    this.navigations = [];
    this.dataLossCount = 0;
  }
}

// Export singleton instance
export const persistenceMonitor = PersistenceMonitor.getInstance();

// Convenience functions
export function trackPersistence(metric: PersistenceMetric): void {
  persistenceMonitor.trackOperation(metric);
}

export function trackRestoration(restoration: SessionRestorationMetric): void {
  persistenceMonitor.trackRestoration(restoration);
}

export function trackNavigation(navigation: CrossPageNavigationMetric): void {
  persistenceMonitor.trackNavigation(navigation);
}

export function getPersistenceStats(timeWindowMs?: number): PersistenceStats {
  return persistenceMonitor.getStats(timeWindowMs);
}
