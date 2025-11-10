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
import {
  calculatePersistenceStats,
  calculateRestorationStats,
  calculateNavigationStats,
} from './persistence-stats';

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

    return calculatePersistenceStats(metricsToAnalyze, this.dataLossCount);
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

    return calculateRestorationStats(restorations);
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

    return calculateNavigationStats(navigations);
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
   * Clean old metrics (keep last 1 hour)
   */
  private cleanOldMetrics(): void {
    const cutoff = Date.now() - 3600000;
    this.metrics = this.metrics.filter(m => m.timestamp.getTime() > cutoff);
    this.restorations = this.restorations.filter(r => r.timestamp.getTime() > cutoff);
    this.navigations = this.navigations.filter(n => n.timestamp.getTime() > cutoff);
  }

  exportMetrics() {
    return {
      persistence: this.metrics,
      restorations: this.restorations,
      navigations: this.navigations,
      stats: this.getStats(),
    };
  }

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
