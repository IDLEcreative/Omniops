import { LoadTestMetrics } from './types';

export class LoadTestFormatter {
  formatMemory(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  printFinalReport(metrics: LoadTestMetrics): void {
    console.log('='.repeat(70));
    console.log('='.repeat(70));

    console.log(
      `  Success Rate: ${((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(2)}%`
    );
    console.log(`  Duration: ${(metrics.totalDuration / 1000).toFixed(2)}s`);
    console.log(`  Throughput: ${metrics.requestsPerSecond.toFixed(2)} req/s`);

    console.log(`  Average: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${metrics.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max: ${metrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`  P50: ${metrics.p50ResponseTime.toFixed(2)}ms`);
    console.log(`  P95: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  P99: ${metrics.p99ResponseTime.toFixed(2)}ms`);

    console.log(`  Initial: ${this.formatMemory(metrics.memoryUsage.initial)}`);
    console.log(`  Peak: ${this.formatMemory(metrics.memoryUsage.peak)}`);
    console.log(`  Final: ${this.formatMemory(metrics.memoryUsage.final)}`);
    console.log(
      `  Leaked: ${this.formatMemory(metrics.memoryUsage.leaked)} ${
        metrics.memoryUsage.leaked > 10 * 1024 * 1024 ? '⚠️ WARNING' : '✅'
      }`
    );

    if (metrics.errors.length > 0) {
      metrics.errors.forEach((error) => {
      });
    }

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

    console.log('='.repeat(70));
  }
}
