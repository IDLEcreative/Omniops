interface StatSummary {
  min: number;
  max: number;
  avg: number;
  median: number;
  p95: number;
  p99: number;
  count: number;
}

export class PerformanceMetrics {
  private metrics: Record<string, { times: number[]; metadata: any[] }> = {};

  record(name: string, duration: number, metadata: any = {}) {
    if (!this.metrics[name]) {
      this.metrics[name] = { times: [], metadata: [] };
    }
    this.metrics[name].times.push(duration);
    this.metrics[name].metadata.push(metadata);
  }

  getStats(name: string): StatSummary | null {
    const times = this.metrics[name]?.times || [];
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      count: times.length
    };
  }

  summary() {
    const results: Record<string, StatSummary | null> = {};
    Object.keys(this.metrics).forEach(name => {
      results[name] = this.getStats(name);
    });
    return results;
  }
}
