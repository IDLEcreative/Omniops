#!/usr/bin/env tsx
/**
 * Telemetry Storage Statistics
 *
 * Analyzes lookup_failures table to provide storage and growth metrics.
 * Helps determine optimal cleanup frequency and retention periods.
 *
 * Usage:
 *   npx tsx scripts/monitoring/telemetry-storage-stats.ts
 *
 * Metrics:
 *   - Total records and storage size
 *   - Oldest and newest records
 *   - Records per day (average)
 *   - Growth rate estimation
 *   - Storage impact by age
 *   - Cleanup recommendations
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

interface TelemetryStats {
  totalRecords: number;
  oldestRecord: string | null;
  newestRecord: string | null;
  recordsLast7Days: number;
  recordsLast30Days: number;
  recordsLast90Days: number;
  recordsOlder90Days: number;
  tableSize: string;
  tableSizeBytes: number;
}

interface AgeDistribution {
  age: string;
  count: number;
  percentage: number;
}

interface CleanupRecommendation {
  retentionDays: number;
  recordsToDelete: number;
  estimatedSpaceSaved: string;
  recommendedFrequency: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

async function getTelemetryStats(): Promise<TelemetryStats | null> {
  const supabase = createServiceRoleClientSync();

  const { data, error } = await supabase
    .from('telemetry_stats')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching stats:', error.message);
    return null;
  }

  return {
    totalRecords: data.total_records,
    oldestRecord: data.oldest_record,
    newestRecord: data.newest_record,
    recordsLast7Days: data.records_last_7_days,
    recordsLast30Days: data.records_last_30_days,
    recordsLast90Days: data.records_last_90_days,
    recordsOlder90Days: data.records_older_90_days,
    tableSize: data.table_size,
    tableSizeBytes: data.table_size_bytes,
  };
}

async function getAgeDistribution(): Promise<AgeDistribution[]> {
  const supabase = createServiceRoleClientSync();

  // Get total count first
  const { count: total } = await supabase
    .from('lookup_failures')
    .select('*', { count: 'exact', head: true });

  if (!total || total === 0) {
    return [];
  }

  const distribution: AgeDistribution[] = [];
  const intervals = [
    { label: '0-7 days', days: 7 },
    { label: '8-30 days', days: 30 },
    { label: '31-90 days', days: 90 },
    { label: '91-180 days', days: 180 },
    { label: '181-365 days', days: 365 },
    { label: '365+ days', days: 9999 },
  ];

  for (let i = 0; i < intervals.length; i++) {
    const current = intervals[i];
    const previous = i > 0 ? intervals[i - 1] : { days: 0 };

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - current.days);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() - previous.days);

    const { count } = await supabase
      .from('lookup_failures')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', startDate.toISOString())
      .lt('timestamp', endDate.toISOString());

    if (count && count > 0) {
      distribution.push({
        age: current.label,
        count,
        percentage: (count / total) * 100,
      });
    }
  }

  return distribution;
}

async function getGrowthRate(): Promise<{
  recordsPerDay: number;
  recordsPerWeek: number;
  recordsPerMonth: number;
  projectedRecords90Days: number;
}> {
  const supabase = createServiceRoleClientSync();

  // Get records from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { count } = await supabase
    .from('lookup_failures')
    .select('*', { count: 'exact', head: true })
    .gte('timestamp', thirtyDaysAgo.toISOString());

  const recordsLast30Days = count || 0;
  const recordsPerDay = recordsLast30Days / 30;
  const recordsPerWeek = recordsPerDay * 7;
  const recordsPerMonth = recordsPerDay * 30;
  const projectedRecords90Days = recordsPerDay * 90;

  return {
    recordsPerDay,
    recordsPerWeek,
    recordsPerMonth,
    projectedRecords90Days,
  };
}

function generateRecommendations(
  stats: TelemetryStats,
  growthRate: { recordsPerDay: number; projectedRecords90Days: number }
): CleanupRecommendation[] {
  const recommendations: CleanupRecommendation[] = [];

  // Calculate estimated size per record
  const bytesPerRecord = stats.totalRecords > 0
    ? stats.tableSizeBytes / stats.totalRecords
    : 500; // Estimate if no data

  // 90-day retention (recommended default)
  recommendations.push({
    retentionDays: 90,
    recordsToDelete: stats.recordsOlder90Days,
    estimatedSpaceSaved: formatBytes(stats.recordsOlder90Days * bytesPerRecord),
    recommendedFrequency: 'Weekly',
    priority: stats.recordsOlder90Days > 10000 ? 'HIGH' : 'MEDIUM',
  });

  // 60-day retention (more aggressive)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recordsOlder60Days = Math.max(
    stats.totalRecords - stats.recordsLast30Days - (growthRate.recordsPerDay * 30),
    0
  );

  recommendations.push({
    retentionDays: 60,
    recordsToDelete: Math.floor(recordsOlder60Days),
    estimatedSpaceSaved: formatBytes(recordsOlder60Days * bytesPerRecord),
    recommendedFrequency: 'Weekly',
    priority: recordsOlder60Days > 20000 ? 'HIGH' : 'MEDIUM',
  });

  // 30-day retention (aggressive)
  const recordsOlder30Days = stats.totalRecords - stats.recordsLast30Days;
  recommendations.push({
    retentionDays: 30,
    recordsToDelete: recordsOlder30Days,
    estimatedSpaceSaved: formatBytes(recordsOlder30Days * bytesPerRecord),
    recommendedFrequency: 'Daily',
    priority: recordsOlder30Days > 50000 ? 'HIGH' : 'LOW',
  });

  return recommendations;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}

function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  const now = new Date();
  const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  return `${date.toISOString().split('T')[0]} (${daysAgo} days ago)`;
}

async function main() {
  console.log('📊 Telemetry Storage Statistics\n');

  // Fetch all data
  const stats = await getTelemetryStats();
  if (!stats) {
    console.error('❌ Failed to fetch telemetry stats');
    process.exit(1);
  }

  const distribution = await getAgeDistribution();
  const growthRate = await getGrowthRate();
  const recommendations = generateRecommendations(stats, growthRate);

  // Display overview
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('OVERVIEW');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total Records:        ${formatNumber(stats.totalRecords)}`);
  console.log(`Table Size:           ${stats.tableSize}`);
  console.log(`Oldest Record:        ${formatDate(stats.oldestRecord)}`);
  console.log(`Newest Record:        ${formatDate(stats.newestRecord)}`);

  // Display growth metrics
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('GROWTH METRICS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Records/Day:          ${formatNumber(Math.round(growthRate.recordsPerDay))}`);
  console.log(`Records/Week:         ${formatNumber(Math.round(growthRate.recordsPerWeek))}`);
  console.log(`Records/Month:        ${formatNumber(Math.round(growthRate.recordsPerMonth))}`);
  console.log(`Projected (90 days):  ${formatNumber(Math.round(growthRate.projectedRecords90Days))}`);

  // Display age distribution
  if (distribution.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('AGE DISTRIBUTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    distribution.forEach(dist => {
      const barLength = Math.round(dist.percentage / 2);
      const bar = '█'.repeat(barLength) + '░'.repeat(50 - barLength);
      console.log(`${dist.age.padEnd(15)} ${bar} ${dist.percentage.toFixed(1)}% (${formatNumber(dist.count)})`);
    });
  }

  // Display period breakdown
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PERIOD BREAKDOWN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Last 7 days:          ${formatNumber(stats.recordsLast7Days)}`);
  console.log(`Last 30 days:         ${formatNumber(stats.recordsLast30Days)}`);
  console.log(`Last 90 days:         ${formatNumber(stats.recordsLast90Days)}`);
  console.log(`Older than 90 days:   ${formatNumber(stats.recordsOlder90Days)}`);

  // Display recommendations
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CLEANUP RECOMMENDATIONS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  recommendations.forEach((rec, idx) => {
    console.log(`\nOption ${idx + 1}: ${rec.retentionDays}-day retention (${rec.priority} priority)`);
    console.log(`  Records to delete:  ${formatNumber(rec.recordsToDelete)}`);
    console.log(`  Space saved:        ${rec.estimatedSpaceSaved}`);
    console.log(`  Run frequency:      ${rec.recommendedFrequency}`);
  });

  // Display recommended command
  const topRecommendation = recommendations[0];
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('RECOMMENDED ACTION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`\nTest cleanup (dry run):`);
  console.log(`  npx tsx scripts/maintenance/cleanup-old-telemetry.ts --dry-run --days=${topRecommendation.retentionDays}`);
  console.log(`\nRun cleanup:`);
  console.log(`  npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=${topRecommendation.retentionDays}`);
  console.log(`\nSchedule automated cleanup:`);
  console.log(`  Deploy Supabase edge function with ${topRecommendation.recommendedFrequency.toLowerCase()} cron`);
  console.log('');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
