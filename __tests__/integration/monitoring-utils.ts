/**
 * Performance and Memory Monitoring Utilities
 *
 * Tools for tracking test performance and memory usage during integration tests.
 * Useful for identifying performance regressions and memory leaks.
 */

export class PerformanceMonitor {
  private startTime: number = 0;
  private checkpoints: Map<string, number> = new Map();

  start(): void {
    this.startTime = Date.now();
    this.checkpoints.clear();
  }

  checkpoint(name: string): number {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.checkpoints.set(name, elapsed);
    return elapsed;
  }

  getResults(): { totalTime: number; checkpoints: Record<string, number> } {
    const totalTime = Date.now() - this.startTime;
    const checkpoints: Record<string, number> = {};

    for (const [name, time] of this.checkpoints.entries()) {
      checkpoints[name] = time;
    }

    return { totalTime, checkpoints };
  }
}

export class MemoryTracker {
  private initialMemory: NodeJS.MemoryUsage;

  constructor() {
    this.initialMemory = process.memoryUsage();
  }

  getCurrentUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedDelta: number;
  } {
    const current = process.memoryUsage();
    return {
      heapUsed: Math.round(current.heapUsed / 1024 / 1024),
      heapTotal: Math.round(current.heapTotal / 1024 / 1024),
      external: Math.round(current.external / 1024 / 1024),
      rss: Math.round(current.rss / 1024 / 1024),
      heapUsedDelta: Math.round((current.heapUsed - this.initialMemory.heapUsed) / 1024 / 1024),
    };
  }
}
