export class PerformanceTracker {
  constructor(name) {
    this.name = name;
    this.metrics = [];
    this.startTime = null;
  }

  start() {
    this.startTime = process.hrtime.bigint();
  }

  end() {
    if (!this.startTime) return 0;
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - this.startTime) / 1_000_000;
    this.metrics.push(duration);
    this.startTime = null;
    return duration;
  }

  getStats() {
    if (this.metrics.length === 0) return null;
    const sorted = [...this.metrics].sort((a, b) => a - b);
    return {
      count: this.metrics.length,
      min: Math.round(sorted[0]),
      max: Math.round(sorted[sorted.length - 1]),
      avg: Math.round(this.metrics.reduce((a, b) => a + b, 0) / this.metrics.length),
      p50: Math.round(sorted[Math.floor(sorted.length * 0.5)]),
      p95: Math.round(sorted[Math.floor(sorted.length * 0.95)]),
      p99: Math.round(sorted[Math.floor(sorted.length * 0.99)]),
    };
  }
}
