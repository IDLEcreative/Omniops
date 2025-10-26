/**
 * Performance Measurement Utilities
 * Tools for measuring and tracking test performance
 */

export class PerformanceHelpers {
  private static timers: Map<string, number> = new Map();
  private static measurements: Map<string, number[]> = new Map();

  /**
   * Start timing an operation
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * End timing and record measurement
   */
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return duration;
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    total: number;
  } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
      total: measurements.reduce((sum, m) => sum + m, 0)
    };
  }

  /**
   * Clear all measurements
   */
  static reset(): void {
    this.timers.clear();
    this.measurements.clear();
  }

  /**
   * Get current memory usage
   */
  static getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024)
    };
  }

  /**
   * Measure async operation performance
   */
  static async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<{
    result: T;
    duration: number;
    memoryBefore: ReturnType<typeof PerformanceHelpers.getMemoryUsage>;
    memoryAfter: ReturnType<typeof PerformanceHelpers.getMemoryUsage>;
  }> {
    const memoryBefore = this.getMemoryUsage();
    this.startTimer(name);

    try {
      const result = await operation();
      const duration = this.endTimer(name);
      const memoryAfter = this.getMemoryUsage();

      return {
        result,
        duration,
        memoryBefore,
        memoryAfter
      };
    } catch (error) {
      this.timers.delete(name); // Clean up timer on error
      throw error;
    }
  }
}
