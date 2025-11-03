#!/usr/bin/env tsx

/**
 * Load Testing Simulator
 *
 * Tests system performance under various load conditions:
 * - Concurrent users (100, 1000, 10000)
 * - Message throughput
 * - Storage operation load
 * - API endpoint stress
 * - Memory leak detection
 *
 * Usage:
 *   npx tsx scripts/testing/load-simulator.ts --users=100 --duration=60
 *   npx tsx scripts/testing/load-simulator.ts --scenario=burst
 *   npx tsx scripts/testing/load-simulator.ts --scenario=sustained
 *   npx tsx scripts/testing/load-simulator.ts --scenario=memory-leak
 */

interface LoadTestConfig {
  users: number;
  duration: number; // seconds
  messagesPerUser: number;
  scenario: 'burst' | 'sustained' | 'ramp-up' | 'memory-leak';
  apiUrl: string;
  reportInterval: number; // seconds
}

interface LoadTestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    leaked: number;
  };
  errors: Array<{ type: string; count: number }>;
}

// ============================================================================
// Virtual User Simulator
// ============================================================================

class VirtualUser {
  private id: string;
  private sessionId: string;
  private conversationId?: string;
  private apiUrl: string;
  private responseTimes: number[] = [];

  constructor(id: string, apiUrl: string) {
    this.id = id;
    this.sessionId = `load-test-${id}`;
    this.apiUrl = apiUrl;
  }

  async sendMessage(message: string): Promise<number> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          session_id: this.sessionId,
          conversation_id: this.conversationId,
          domain: 'load-test.com',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.conversationId = data.conversation_id;

      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);

      return duration;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.responseTimes.push(duration);
      throw error;
    }
  }

  getResponseTimes(): number[] {
    return [...this.responseTimes];
  }

  getId(): string {
    return this.id;
  }
}

// ============================================================================
// Load Test Orchestrator
// ============================================================================

class LoadTestOrchestrator {
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

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async run(): Promise<LoadTestMetrics> {
    console.log('🚀 Starting Load Test');
    console.log(`📊 Configuration:`, this.config);
    console.log('');

    // Record initial memory
    this.recordMemorySnapshot();

    this.startTime = Date.now();

    // Run scenario
    switch (this.config.scenario) {
      case 'burst':
        await this.runBurstScenario();
        break;
      case 'sustained':
        await this.runSustainedScenario();
        break;
      case 'ramp-up':
        await this.runRampUpScenario();
        break;
      case 'memory-leak':
        await this.runMemoryLeakScenario();
        break;
    }

    // Record final memory
    this.recordMemorySnapshot();

    // Calculate final metrics
    return this.calculateMetrics();
  }

  // ==========================================================================
  // Scenario: Burst Traffic
  // ==========================================================================

  private async runBurstScenario(): Promise<void> {
    console.log(`🎯 Scenario: BURST (${this.config.users} simultaneous users)`);

    // Create all users
    for (let i = 0; i < this.config.users; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    // All users send messages simultaneously
    const promises = this.users.map(async (user) => {
      for (let i = 0; i < this.config.messagesPerUser; i++) {
        await this.executeRequest(user, `Burst message ${i}`);
      }
    });

    await Promise.all(promises);

    console.log('✅ Burst scenario complete');
  }

  // ==========================================================================
  // Scenario: Sustained Load
  // ==========================================================================

  private async runSustainedScenario(): Promise<void> {
    console.log(
      `🎯 Scenario: SUSTAINED (${this.config.users} users over ${this.config.duration}s)`
    );

    // Create users
    for (let i = 0; i < this.config.users; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    const endTime = Date.now() + this.config.duration * 1000;
    let reportTime = Date.now() + this.config.reportInterval * 1000;

    // Continuously send messages until duration expires
    while (Date.now() < endTime) {
      // Each user sends one message
      const promises = this.users.map((user) =>
        this.executeRequest(user, `Sustained message at ${Date.now()}`)
      );

      await Promise.all(promises);

      // Report progress
      if (Date.now() >= reportTime) {
        this.printProgressReport();
        reportTime = Date.now() + this.config.reportInterval * 1000;
      }

      // Small delay to prevent overwhelming
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ Sustained scenario complete');
  }

  // ==========================================================================
  // Scenario: Ramp-Up
  // ==========================================================================

  private async runRampUpScenario(): Promise<void> {
    console.log(
      `🎯 Scenario: RAMP-UP (0 → ${this.config.users} users over ${this.config.duration}s)`
    );

    const usersPerInterval = Math.ceil(
      this.config.users / (this.config.duration / 5)
    );
    const endTime = Date.now() + this.config.duration * 1000;
    let reportTime = Date.now() + this.config.reportInterval * 1000;

    while (Date.now() < endTime && this.users.length < this.config.users) {
      // Add new users
      const currentCount = this.users.length;
      const newCount = Math.min(
        currentCount + usersPerInterval,
        this.config.users
      );

      for (let i = currentCount; i < newCount; i++) {
        this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
      }

      // All active users send messages
      const promises = this.users.map((user) =>
        this.executeRequest(user, `Ramp-up message from ${user.getId()}`)
      );

      await Promise.all(promises);

      // Report progress
      if (Date.now() >= reportTime) {
        this.printProgressReport();
        reportTime = Date.now() + this.config.reportInterval * 1000;
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    console.log('✅ Ramp-up scenario complete');
  }

  // ==========================================================================
  // Scenario: Memory Leak Detection
  // ==========================================================================

  private async runMemoryLeakScenario(): Promise<void> {
    console.log(`🎯 Scenario: MEMORY LEAK DETECTION (${this.config.duration}s)`);

    // Create a fixed set of users
    for (let i = 0; i < 100; i++) {
      this.users.push(new VirtualUser(`user-${i}`, this.config.apiUrl));
    }

    const endTime = Date.now() + this.config.duration * 1000;
    let iteration = 0;

    while (Date.now() < endTime) {
      iteration++;

      // Take memory snapshot
      this.recordMemorySnapshot();

      // Each user sends messages
      const promises = this.users.map((user) =>
        this.executeRequest(user, `Memory test iteration ${iteration}`)
      );

      await Promise.all(promises);

      // Report memory
      console.log(
        `📈 Iteration ${iteration}: Memory ${this.formatMemory(this.getCurrentMemory())}`
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log('✅ Memory leak detection complete');
  }

  // ==========================================================================
  // Request Execution
  // ==========================================================================

  private async executeRequest(
    user: VirtualUser,
    message: string
  ): Promise<void> {
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

  // ==========================================================================
  // Memory Monitoring
  // ==========================================================================

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
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  // ==========================================================================
  // Metrics Calculation
  // ==========================================================================

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
    return sorted[Math.max(0, index)];
  }

  // ==========================================================================
  // Progress Reporting
  // ==========================================================================

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

  // ==========================================================================
  // Final Report
  // ==========================================================================

  printFinalReport(metrics: LoadTestMetrics): void {
    console.log('');
    console.log('='.repeat(70));
    console.log('📊 LOAD TEST RESULTS');
    console.log('='.repeat(70));
    console.log('');

    console.log('📈 Request Statistics:');
    console.log(`  Total Requests: ${metrics.totalRequests}`);
    console.log(`  Successful: ${metrics.successfulRequests}`);
    console.log(`  Failed: ${metrics.failedRequests}`);
    console.log(
      `  Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`
    );
    console.log(`  Duration: ${(metrics.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Throughput: ${metrics.requestsPerSecond.toFixed(2)} req/s`);
    console.log('');

    console.log('⏱️  Response Time Statistics:');
    console.log(`  Average: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${metrics.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max: ${metrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`  P50: ${metrics.p50ResponseTime.toFixed(2)}ms`);
    console.log(`  P95: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  P99: ${metrics.p99ResponseTime.toFixed(2)}ms`);
    console.log('');

    console.log('💾 Memory Statistics:');
    console.log(`  Initial: ${this.formatMemory(metrics.memoryUsage.initial)}`);
    console.log(`  Peak: ${this.formatMemory(metrics.memoryUsage.peak)}`);
    console.log(`  Final: ${this.formatMemory(metrics.memoryUsage.final)}`);
    console.log(
      `  Leaked: ${this.formatMemory(metrics.memoryUsage.leaked)} ${
        metrics.memoryUsage.leaked > 10 * 1024 * 1024 ? '⚠️ WARNING' : '✅'
      }`
    );
    console.log('');

    if (metrics.errors.length > 0) {
      console.log('❌ Errors:');
      metrics.errors.forEach((error) => {
        console.log(`  ${error.type}: ${error.count}`);
      });
      console.log('');
    }

    // Performance assessment
    console.log('🎯 Performance Assessment:');
    const assessments = [
      {
        name: 'Response Time (P95)',
        value: metrics.p95ResponseTime,
        threshold: 1000,
        unit: 'ms',
      },
      {
        name: 'Throughput',
        value: metrics.requestsPerSecond,
        threshold: 10,
        unit: 'req/s',
      },
      {
        name: 'Success Rate',
        value: (metrics.successfulRequests / metrics.totalRequests) * 100,
        threshold: 99,
        unit: '%',
      },
      {
        name: 'Memory Leak',
        value: metrics.memoryUsage.leaked / 1024 / 1024,
        threshold: 10,
        unit: 'MB',
        invert: true,
      },
    ];

    assessments.forEach((assessment) => {
      const pass = assessment.invert
        ? assessment.value < assessment.threshold
        : assessment.value > assessment.threshold;

      console.log(
        `  ${pass ? '✅' : '❌'} ${assessment.name}: ${assessment.value.toFixed(2)}${assessment.unit} ` +
          `(${assessment.invert ? '<' : '>'} ${assessment.threshold}${assessment.unit})`
      );
    });

    console.log('');
    console.log('='.repeat(70));
  }
}

// ============================================================================
// CLI Entry Point
// ============================================================================

async function main() {
  const args = process.argv.slice(2);

  const config: LoadTestConfig = {
    users: 100,
    duration: 60,
    messagesPerUser: 5,
    scenario: 'sustained',
    apiUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    reportInterval: 10,
  };

  // Parse arguments
  for (const arg of args) {
    const [key, value] = arg.split('=');

    switch (key) {
      case '--users':
        config.users = parseInt(value);
        break;
      case '--duration':
        config.duration = parseInt(value);
        break;
      case '--messages':
        config.messagesPerUser = parseInt(value);
        break;
      case '--scenario':
        config.scenario = value as LoadTestConfig['scenario'];
        break;
      case '--api-url':
        config.apiUrl = value;
        break;
    }
  }

  // Run load test
  const orchestrator = new LoadTestOrchestrator(config);
  const metrics = await orchestrator.run();

  // Print results
  orchestrator.printFinalReport(metrics);

  // Exit with appropriate code
  const successRate = metrics.successfulRequests / metrics.totalRequests;
  process.exit(successRate >= 0.99 ? 0 : 1);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Load test failed:', error);
    process.exit(1);
  });
}

export { LoadTestOrchestrator, VirtualUser };
