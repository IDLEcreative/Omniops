/**
 * Performance Monitoring and Optimization Utilities
 * Tracks performance metrics and provides insights for optimization
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  totalDuration: number;
  metrics: PerformanceMetric[];
  slowestOperations: PerformanceMetric[];
  suggestions: string[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric>;
  private completedMetrics: PerformanceMetric[];
  private thresholds = {
    slow: 1000, // 1 second
    verySlow: 5000, // 5 seconds
    critical: 10000, // 10 seconds
  };

  constructor() {
    this.metrics = new Map();
    this.completedMetrics = [];
  }

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End timing an operation
   */
  end(name: string): number {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PerformanceMonitor] No metric found for: ${name}`);
      return 0;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;
    
    this.completedMetrics.push(metric);
    this.metrics.delete(name);

    // Log slow operations
    if (metric.duration > this.thresholds.slow) {
      const severity = metric.duration > this.thresholds.critical ? 'CRITICAL' :
                      metric.duration > this.thresholds.verySlow ? 'VERY SLOW' : 'SLOW';
      console.warn(`[PerformanceMonitor] ${severity}: ${name} took ${metric.duration.toFixed(2)}ms`);
    }

    return metric.duration;
  }

  /**
   * Measure async function performance
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Measure sync function performance
   */
  measureSync<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const allMetrics = [...this.completedMetrics];
    
    // Add any pending metrics
    this.metrics.forEach(metric => {
      if (!metric.endTime) {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
      }
      allMetrics.push(metric);
    });

    // Calculate total duration
    const totalDuration = allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);

    // Find slowest operations
    const slowestOperations = [...allMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);

    // Generate suggestions
    const suggestions = this.generateSuggestions(allMetrics);

    return {
      totalDuration,
      metrics: allMetrics,
      slowestOperations,
      suggestions,
    };
  }

  /**
   * Generate optimization suggestions based on metrics
   */
  private generateSuggestions(metrics: PerformanceMetric[]): string[] {
    const suggestions: string[] = [];

    // Check for slow database queries
    const dbMetrics = metrics.filter(m => m.name.includes('database') || m.name.includes('query'));
    if (dbMetrics.some(m => (m.duration || 0) > 500)) {
      suggestions.push('Consider adding database indexes or optimizing queries');
    }

    // Check for slow API calls
    const apiMetrics = metrics.filter(m => m.name.includes('api') || m.name.includes('fetch'));
    if (apiMetrics.some(m => (m.duration || 0) > 1000)) {
      suggestions.push('Consider implementing request caching or batching API calls');
    }

    // Check for slow rendering
    const renderMetrics = metrics.filter(m => m.name.includes('render') || m.name.includes('component'));
    if (renderMetrics.some(m => (m.duration || 0) > 100)) {
      suggestions.push('Consider using React.memo or useMemo for expensive components');
    }

    // Check for repeated operations
    const operationCounts = new Map<string, number>();
    metrics.forEach(m => {
      const baseName = m.name.replace(/\d+/g, '');
      operationCounts.set(baseName, (operationCounts.get(baseName) || 0) + 1);
    });
    
    operationCounts.forEach((count, name) => {
      if (count > 10) {
        suggestions.push(`Consider batching or caching "${name}" operations (called ${count} times)`);
      }
    });

    return suggestions;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics = [];
  }

  /**
   * Log summary
   */
  logSummary(): void {
    const report = this.getReport();
    
    console.log('\n=== Performance Summary ===');
    console.log(`Total Duration: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`Operations: ${report.metrics.length}`);
    
    if (report.slowestOperations.length > 0) {
      console.log('\nSlowest Operations:');
      report.slowestOperations.forEach((op, i) => {
        console.log(`  ${i + 1}. ${op.name}: ${op.duration?.toFixed(2)}ms`);
      });
    }
    
    if (report.suggestions.length > 0) {
      console.log('\nOptimization Suggestions:');
      report.suggestions.forEach((suggestion, i) => {
        console.log(`  ${i + 1}. ${suggestion}`);
      });
    }
    
    console.log('========================\n');
  }
}

// Singleton instance
export const perfMonitor = new PerformanceMonitor();

/**
 * Performance decorator for class methods
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`;
    return perfMonitor.measure(methodName, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

/**
 * Resource usage monitor
 */
export class ResourceMonitor {
  private memorySnapshots: Array<{ timestamp: number; usage: any }> = [];
  private maxSnapshots: number = 100;

  /**
   * Take a memory snapshot
   */
  takeSnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.memorySnapshots.push({
        timestamp: Date.now(),
        usage,
      });

      // Limit snapshots
      if (this.memorySnapshots.length > this.maxSnapshots) {
        this.memorySnapshots.shift();
      }
    }
  }

  /**
   * Get memory usage trends
   */
  getMemoryTrends(): {
    current: any;
    average: any;
    peak: any;
    trend: 'increasing' | 'decreasing' | 'stable';
  } | null {
    if (this.memorySnapshots.length === 0) return null;

    const current = this.memorySnapshots[this.memorySnapshots.length - 1].usage;
    
    const heapUsed = this.memorySnapshots.map(s => s.usage.heapUsed);
    const average = heapUsed.reduce((a, b) => a + b, 0) / heapUsed.length;
    const peak = Math.max(...heapUsed);

    // Determine trend
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (this.memorySnapshots.length > 10) {
      const recent = heapUsed.slice(-10);
      const older = heapUsed.slice(-20, -10);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      
      const change = ((recentAvg - olderAvg) / olderAvg) * 100;
      if (change > 10) trend = 'increasing';
      else if (change < -10) trend = 'decreasing';
    }

    return {
      current,
      average: { heapUsed: average },
      peak: { heapUsed: peak },
      trend,
    };
  }

  /**
   * Check for memory leaks
   */
  checkForLeaks(): string[] {
    const warnings: string[] = [];
    const trends = this.getMemoryTrends();
    
    if (!trends) return warnings;

    // Check if memory is consistently increasing
    if (trends.trend === 'increasing' && trends.current.heapUsed > 100 * 1024 * 1024) {
      warnings.push('Potential memory leak detected: heap usage consistently increasing');
    }

    // Check if approaching heap limit
    if (trends.current.heapUsed / trends.current.heapTotal > 0.9) {
      warnings.push('Warning: Heap usage above 90% of total heap size');
    }

    return warnings;
  }
}

export const resourceMonitor = new ResourceMonitor();

// Auto-monitor in development
if (process.env.NODE_ENV === 'development') {
  // Take memory snapshots every minute
  setInterval(() => {
    resourceMonitor.takeSnapshot();
    const warnings = resourceMonitor.checkForLeaks();
    if (warnings.length > 0) {
      console.warn('[ResourceMonitor] Warnings:', warnings);
    }
  }, 60000);
}