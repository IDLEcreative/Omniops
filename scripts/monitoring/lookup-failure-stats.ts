#!/usr/bin/env tsx
import { getLookupFailureStats } from '@/lib/telemetry/lookup-failures';

async function main() {
  const days = parseInt(process.argv[2] || '7', 10);
  console.log(`\n📊 Lookup Failure Statistics (Last ${days} days)\n`);

  const stats = await getLookupFailureStats(undefined, days);

  if (!stats) {
    console.error('Failed to fetch stats');
    process.exit(1);
  }

  console.log(`Total Failures: ${stats.totalFailures}\n`);

  console.log('By Error Type:');
  Object.entries(stats.byErrorType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} (${Math.round((count / stats.totalFailures) * 100)}%)`);
  });

  console.log('\nBy Platform:');
  Object.entries(stats.byPlatform).forEach(([platform, count]) => {
    console.log(`  ${platform}: ${count} (${Math.round((count / stats.totalFailures) * 100)}%)`);
  });

  console.log('\nTop 10 Failed Queries:');
  stats.topFailedQueries.forEach((q, i) => {
    console.log(`  ${i + 1}. "${q.query}" (${q.count}x)`);
  });

  if (stats.commonPatterns.length > 0) {
    console.log('\n⚠️  Patterns Detected:');
    stats.commonPatterns.forEach(p => console.log(`  - ${p}`));
  }

  console.log('');
}

main().catch(console.error);
