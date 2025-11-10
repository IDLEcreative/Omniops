export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number[]> = new Map();
  private memorySnapshots: Map<string, NodeJS.MemoryUsage> = new Map();

  mark(name: string) {
    this.marks.set(name, performance.now());
    this.memorySnapshots.set(name, process.memoryUsage());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start && end) {
      const duration = end - start;
      if (!this.measures.has(name)) {
        this.measures.set(name, []);
      }
      this.measures.get(name)!.push(duration);
      return duration;
    }
    return 0;
  }

  getMemoryDelta(startMark: string, endMark: string): number {
    const start = this.memorySnapshots.get(startMark);
    const end = this.memorySnapshots.get(endMark);

    if (start && end) {
      return (end.heapUsed - start.heapUsed) / 1024 / 1024;
    }
    return 0;
  }

  getStats(measureName: string) {
    const times = this.measures.get(measureName) || [];
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      samples: times.length
    };
  }

  reset() {
    this.marks.clear();
    this.measures.clear();
    this.memorySnapshots.clear();
  }
}
