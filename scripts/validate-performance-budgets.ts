#!/usr/bin/env tsx
/**
 * Validate Performance Budgets
 *
 * Compares actual performance metrics against defined budgets
 * Generates budget-violations.json if any violations found
 *
 * Usage:
 *   npx tsx scripts/validate-performance-budgets.ts
 *
 * Exit codes:
 *   0 - All budgets met
 *   1 - Budget violations detected
 */

import fs from 'fs';
import path from 'path';

interface PerformanceMetrics {
  testName: string;
  category: string;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  mean?: number;
  throughput?: number;
  successRate?: number;
  errorRate?: number;
}

interface Budget {
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
  throughput?: number;
  errorRate?: number;
  maxDuration?: number;
  scalingEfficiency?: number;
  isolationScore?: number;
  maxDegradation?: number;
}

interface BudgetConfig {
  budgets: {
    [category: string]: {
      [testName: string]: Budget;
    };
  };
  thresholds?: {
    warningMultiplier?: number;
    criticalMultiplier?: number;
  };
}

interface Violation {
  test: string;
  category: string;
  metric: string;
  expected: number;
  actual: number;
  diff: number;
  severity: 'warning' | 'critical';
}

function normalizeTestName(name: string): string {
  // Convert "Chat API - Simple Queries" to "chat-endpoint-load"
  const lower = name.toLowerCase();
  if (lower.includes('chat')) return 'chat-endpoint-load';
  if (lower.includes('search')) return 'search-endpoint-load';
  if (lower.includes('scrape')) return 'scrape-endpoint-load';
  if (lower.includes('job') && lower.includes('processing')) return 'job-processing-throughput';
  if (lower.includes('concurrent') && lower.includes('workers')) return 'concurrent-workers';
  if (lower.includes('purchase')) return 'end-to-end-purchase';
  if (lower.includes('woocommerce')) return 'woocommerce-sync';
  if (lower.includes('concurrent') && lower.includes('customers')) return 'concurrent-customers';
  if (lower.includes('dashboard')) return 'dashboard-queries';

  return name.toLowerCase().replace(/\s+/g, '-');
}

function validateBudgets(
  metrics: PerformanceMetrics[],
  budgetConfig: BudgetConfig
): Violation[] {
  const violations: Violation[] = [];
  const warningMultiplier = budgetConfig.thresholds?.warningMultiplier || 0.9;
  const criticalMultiplier = budgetConfig.thresholds?.criticalMultiplier || 1.0;

  for (const metric of metrics) {
    const normalizedName = normalizeTestName(metric.testName);
    const categoryBudgets = budgetConfig.budgets[metric.category];

    if (!categoryBudgets) {
      console.log(`⚠️  No budgets defined for category: ${metric.category}`);
      continue;
    }

    const budget = categoryBudgets[normalizedName];

    if (!budget) {
      console.log(`⚠️  No budget defined for test: ${normalizedName} (${metric.testName})`);
      continue;
    }

    // Check p50
    if (budget.p50 && metric.p50) {
      const warningThreshold = budget.p50 * warningMultiplier;
      const criticalThreshold = budget.p50 * criticalMultiplier;

      if (metric.p50 > criticalThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'p50',
          expected: budget.p50,
          actual: metric.p50,
          diff: metric.p50 - budget.p50,
          severity: 'critical'
        });
      } else if (metric.p50 > warningThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'p50',
          expected: budget.p50,
          actual: metric.p50,
          diff: metric.p50 - budget.p50,
          severity: 'warning'
        });
      }
    }

    // Check p95
    if (budget.p95 && metric.p95) {
      const warningThreshold = budget.p95 * warningMultiplier;
      const criticalThreshold = budget.p95 * criticalMultiplier;

      if (metric.p95 > criticalThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'p95',
          expected: budget.p95,
          actual: metric.p95,
          diff: metric.p95 - budget.p95,
          severity: 'critical'
        });
      } else if (metric.p95 > warningThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'p95',
          expected: budget.p95,
          actual: metric.p95,
          diff: metric.p95 - budget.p95,
          severity: 'warning'
        });
      }
    }

    // Check p99
    if (budget.p99 && metric.p99) {
      const criticalThreshold = budget.p99 * criticalMultiplier;

      if (metric.p99 > criticalThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'p99',
          expected: budget.p99,
          actual: metric.p99,
          diff: metric.p99 - budget.p99,
          severity: 'critical'
        });
      }
    }

    // Check throughput (lower is worse)
    if (budget.throughput && metric.throughput) {
      const warningThreshold = budget.throughput * warningMultiplier;

      if (metric.throughput < warningThreshold) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'throughput',
          expected: budget.throughput,
          actual: metric.throughput,
          diff: budget.throughput - metric.throughput,
          severity: metric.throughput < budget.throughput ? 'critical' : 'warning'
        });
      }
    }

    // Check error rate
    if (budget.errorRate !== undefined && metric.errorRate !== undefined) {
      if (metric.errorRate > budget.errorRate) {
        violations.push({
          test: metric.testName,
          category: metric.category,
          metric: 'errorRate',
          expected: budget.errorRate,
          actual: metric.errorRate,
          diff: metric.errorRate - budget.errorRate,
          severity: 'critical'
        });
      }
    }
  }

  return violations;
}

function formatViolationReport(violations: Violation[]): string {
  const critical = violations.filter(v => v.severity === 'critical');
  const warnings = violations.filter(v => v.severity === 'warning');

  let report = '# Performance Budget Violations\n\n';

  if (critical.length > 0) {
    report += `## 🔴 Critical Violations (${critical.length})\n\n`;
    report += '| Test | Metric | Expected | Actual | Diff |\n';
    report += '|------|--------|----------|--------|------|\n';

    for (const v of critical) {
      const expectedStr = v.metric === 'throughput' ? `${v.expected} req/s` : `${v.expected}ms`;
      const actualStr = v.metric === 'throughput' ? `${v.actual.toFixed(2)} req/s` : `${v.actual.toFixed(0)}ms`;
      const diffStr = v.metric === 'throughput' ? `${v.diff.toFixed(2)} req/s` : `${v.diff.toFixed(0)}ms`;

      report += `| ${v.test} | ${v.metric} | ${expectedStr} | ${actualStr} | +${diffStr} |\n`;
    }

    report += '\n';
  }

  if (warnings.length > 0) {
    report += `## ⚠️  Warnings (${warnings.length})\n\n`;
    report += '| Test | Metric | Expected | Actual | Diff |\n';
    report += '|------|--------|----------|--------|------|\n';

    for (const v of warnings) {
      const expectedStr = v.metric === 'throughput' ? `${v.expected} req/s` : `${v.expected}ms`;
      const actualStr = v.metric === 'throughput' ? `${v.actual.toFixed(2)} req/s` : `${v.actual.toFixed(0)}ms`;
      const diffStr = v.metric === 'throughput' ? `${v.diff.toFixed(2)} req/s` : `${v.diff.toFixed(0)}ms`;

      report += `| ${v.test} | ${v.metric} | ${expectedStr} | ${actualStr} | +${diffStr} |\n`;
    }

    report += '\n';
  }

  return report;
}

async function main() {
  console.log('🔍 Validating performance budgets...\n');

  // Read metrics
  const timestamp = new Date().toISOString().split('T')[0];
  const metricsFile = `performance-metrics-${timestamp}.json`;

  if (!fs.existsSync(metricsFile)) {
    console.error(`❌ Metrics file not found: ${metricsFile}`);
    console.log('   Run extract-performance-metrics.ts first\n');
    process.exit(1);
  }

  const metrics: PerformanceMetrics[] = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));
  console.log(`📊 Loaded ${metrics.length} performance metrics`);

  // Read budgets
  const budgetsPath = path.join(process.cwd(), '.github', 'performance-budgets.json');

  if (!fs.existsSync(budgetsPath)) {
    console.error('❌ performance-budgets.json not found');
    console.log('   Expected at: .github/performance-budgets.json\n');
    process.exit(1);
  }

  const budgetConfig: BudgetConfig = JSON.parse(fs.readFileSync(budgetsPath, 'utf-8'));
  console.log('📋 Loaded performance budgets\n');

  // Validate
  const violations = validateBudgets(metrics, budgetConfig);

  if (violations.length === 0) {
    console.log('✅ All performance budgets met!\n');
    process.exit(0);
  }

  const critical = violations.filter(v => v.severity === 'critical');
  const warnings = violations.filter(v => v.severity === 'warning');

  console.log(`⚠️  Found ${violations.length} budget violations:`);
  console.log(`   🔴 Critical: ${critical.length}`);
  console.log(`   ⚠️  Warnings: ${warnings.length}\n`);

  // Write violations file
  fs.writeFileSync('budget-violations.json', JSON.stringify(violations, null, 2));
  console.log('✅ Generated budget-violations.json\n');

  // Print summary
  const report = formatViolationReport(violations);
  console.log(report);

  // Exit with error if critical violations
  if (critical.length > 0) {
    process.exit(1);
  }

  process.exit(0);
}

main().catch(error => {
  console.error('❌ Error validating budgets:', error);
  process.exit(1);
});
