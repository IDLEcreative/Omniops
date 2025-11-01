/**
 * Performance monitoring for query operations
 */

export class QueryTimer {
  private startTime: number;
  private name: string;
  private timeout: number;

  constructor(name: string, timeoutMs: number = 5000) {
    this.name = name;
    this.startTime = Date.now();
    this.timeout = timeoutMs;
  }

  check(): void {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.timeout) {
      throw new Error(`Query timeout: ${this.name} took ${elapsed}ms (limit: ${this.timeout}ms)`);
    }
  }

  end(): number {
    const elapsed = Date.now() - this.startTime;
    console.log(`[Performance] ${this.name}: ${elapsed}ms`);
    return elapsed;
  }
}
