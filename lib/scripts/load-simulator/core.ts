import { VirtualUser } from './virtual-user';
import { ScenarioRunner } from './scenarios';
import { LoadTestFormatter } from './formatters';
import type { LoadTestConfig, LoadTestMetrics } from './types';

export type { LoadTestConfig, LoadTestMetrics } from './types';
export { VirtualUser } from './virtual-user';

export class LoadTestOrchestrator {
  private config: LoadTestConfig;
  private users: VirtualUser[] = [];
  private metrics: Partial<LoadTestMetrics> = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    errors: [],
  };
  private startTime?: number;
  private memorySnapshots: number[] = [];
  private formatter = new LoadTestFormatter();

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async run(): Promise<LoadTestMetrics> {
    console.log('🚀 Starting Load Test');
    console.log(`📊 Configuration:`, this.config);
    console.log('');

    this.recordMemorySnapshot();
    this.startTime = Date.now();

    const scenarioRunner = new ScenarioRunner(
      this.config,
      this.metrics,
      this.startTime,
      this.executeRequest.bind(this),
      this.printProgressReport.bind(this),
      this.formatMemory.bind(this),
      this.getCurrentMemory.bind(this),
      this.recordMemorySnapshot.bind(this)
    );

    switch (this.config.scenario) {
      case 'burst':
        this.users = await scenarioRunner.runBurstScenario();
        break;
      case 'sustained':
        this.users = await scenarioRunner.runSustainedScenario();
        break;
      case 'ramp-up':
        this.users = await scenarioRunner.runRampUpScenario();
        break;
      case 'memory-leak':
        this.users = await scenarioRunner.runMemoryLeakScenario();
        break;
    }

    this.recordMemorySnapshot();
    return this.calculateMetrics();
  }

  private async executeRequest(user: VirtualUser, message: string): Promise<void> {
    this.metrics.totalRequests!++;

    try {
      await user.sendMessage(message);
      this.metrics.successfulRequests!++;
    } catch (error) {
      this.metrics.failedRequests!++;
      this.recordError(error as Error);
    }
  }

  private recordError(error: Error): void {
    const errorType = error.message.split(':')[0] || 'Unknown';
    const existing = this.metrics.errors!.find((e) => e.type === errorType);

    if (existing) {
      existing.count++;
    } else {
      this.metrics.errors!.push({ type: errorType, count: 1 });
    }
  }

  private recordMemorySnapshot(): void {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      this.memorySnapshots.push(usage.heapUsed);
    }
  }

  private getCurrentMemory(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  private formatMemory(bytes: number): string {
    return this.formatter.formatMemory(bytes);
  }

  private calculateMetrics(): LoadTestMetrics {
    const allResponseTimes: number[] = [];

    for (const user of this.users) {
      allResponseTimes.push(...user.getResponseTimes());
    }

    allResponseTimes.sort((a, b) => a - b);
    const totalDuration = Date.now() - this.startTime!;

    return {
      totalRequests: this.metrics.totalRequests!,
      successfulRequests: this.metrics.successfulRequests!,
      failedRequests: this.metrics.failedRequests!,
      totalDuration,
      avgResponseTime:
        allResponseTimes.reduce((a, b) => a + b, 0) /
        allResponseTimes.length,
      minResponseTime: allResponseTimes[0] || 0,
      maxResponseTime: allResponseTimes[allResponseTimes.length - 1] || 0,
      p50ResponseTime: this.percentile(allResponseTimes, 50),
      p95ResponseTime: this.percentile(allResponseTimes, 95),
      p99ResponseTime: this.percentile(allResponseTimes, 99),
      requestsPerSecond: (this.metrics.totalRequests! / totalDuration) * 1000,
      memoryUsage: {
        initial: this.memorySnapshots[0] || 0,
        peak: Math.max(...this.memorySnapshots, 0),
        final: this.memorySnapshots[this.memorySnapshots.length - 1] || 0,
        leaked:
          (this.memorySnapshots[this.memorySnapshots.length - 1] || 0) -
          (this.memorySnapshots[0] || 0),
      },
      errors: this.metrics.errors!,
    };
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)] ?? 0;
  }

  private printProgressReport(): void {
    const elapsed = ((Date.now() - this.startTime!) / 1000).toFixed(1);

    console.log(
      `⏱️  Progress: ${elapsed}s | ` +
        `Requests: ${this.metrics.totalRequests} | ` +
        `Success: ${this.metrics.successfulRequests} | ` +
        `Failed: ${this.metrics.failedRequests} | ` +
        `RPS: ${((this.metrics.totalRequests! / parseFloat(elapsed)) || 0).toFixed(1)}`
    );
  }

  printFinalReport(metrics: LoadTestMetrics): void {
    this.formatter.printFinalReport(metrics);
  }
}
