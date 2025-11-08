/**
 * Performance Analysis & Suggestions
 */

import type { PerformanceMetric, PerformanceReport } from './types';

export class PerformanceAnalyzer {
  static generateReport(
    completedMetrics: PerformanceMetric[],
    pendingMetrics: PerformanceMetric[]
  ): PerformanceReport {
    const allMetrics = [...completedMetrics];

    // Add any pending metrics with current duration
    pendingMetrics.forEach(metric => {
      if (!metric.endTime) {
        metric.endTime = performance.now();
        metric.duration = metric.endTime - metric.startTime;
      }
      allMetrics.push(metric);
    });

    const totalDuration = allMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    const slowestOperations = [...allMetrics]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5);
    const suggestions = this.generateSuggestions(allMetrics);

    return {
      totalDuration,
      metrics: allMetrics,
      slowestOperations,
      suggestions,
    };
  }

  static generateSuggestions(metrics: PerformanceMetric[]): string[] {
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
    const renderMetrics = metrics.filter(m => m.name.includes('render') || m.name.includes('element'));
    if (renderMetrics.some(m => (m.duration || 0) > 100)) {
      suggestions.push('Consider using React.memo or useMemo for expensive elements');
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

  static logSummary(report: PerformanceReport): void {
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
