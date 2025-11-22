/**
 * Test Stability Pattern Analysis
 */

import type { StabilityMetrics } from './test-stability-types';

export async function analyzePatterns(metrics: StabilityMetrics): Promise<void> {
  console.log('\n📈 Analyzing test stability patterns...\n');

  if (metrics.runs.length < 5) {
    console.log('⚠️ Not enough data for pattern analysis. Need at least 5 test runs.');
    return;
  }

  // Time-based analysis
  const hourlyStats: { [hour: string]: { runs: number; sigkills: number } } = {};
  metrics.runs.forEach(run => {
    const hour = new Date(run.timestamp).getHours();
    const key = `${hour}:00`;
    if (!hourlyStats[key]) {
      hourlyStats[key] = { runs: 0, sigkills: 0 };
    }
    hourlyStats[key].runs++;
    if (run.errors.sigkill > 0) {
      hourlyStats[key].sigkills++;
    }
  });

  console.log('📊 Time-based Analysis:');
  Object.entries(hourlyStats)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([hour, stats]) => {
      const rate = (stats.sigkills / stats.runs * 100).toFixed(1);
      console.log(`  ${hour} - Runs: ${stats.runs}, SIGKILL rate: ${rate}%`);
    });

  // Trend analysis
  const last10 = metrics.runs.slice(-10);
  const prev10 = metrics.runs.slice(-20, -10);

  if (prev10.length > 0) {
    const currentSigkillRate = last10.filter(r => r.errors.sigkill > 0).length / last10.length;
    const prevSigkillRate = prev10.filter(r => r.errors.sigkill > 0).length / prev10.length;

    console.log('\n📈 Trend Analysis:');
    if (currentSigkillRate > prevSigkillRate) {
      console.log('  ⚠️ SIGKILL rate is INCREASING');
    } else if (currentSigkillRate < prevSigkillRate) {
      console.log('  ✅ SIGKILL rate is DECREASING');
    } else {
      console.log('  ➡️ SIGKILL rate is STABLE');
    }

    console.log(`  Previous 10 runs: ${(prevSigkillRate * 100).toFixed(1)}%`);
    console.log(`  Last 10 runs: ${(currentSigkillRate * 100).toFixed(1)}%`);
  }
}
