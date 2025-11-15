#!/usr/bin/env npx tsx
/**
 * Embeddings Health Monitor CLI
 *
 * Usage:
 *   npx tsx scripts/monitoring/monitor-embeddings-health.ts check
 *   npx tsx scripts/monitoring/monitor-embeddings-health.ts auto
 *   npx tsx scripts/monitoring/monitor-embeddings-health.ts watch
 */

import { EmbeddingsHealthMonitor } from '../../lib/scripts/monitor-embeddings-health/core';
import {
  printHealthMetrics,
  printDomainHealth,
  printOverallSummary,
  printWatchStatus,
  printWatchUpdate,
  showHelp
} from '../../lib/scripts/monitor-embeddings-health/formatters';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const intervalArg = args.find(arg => arg.startsWith('--interval='))?.split('=')[1];
  const interval = intervalArg ? parseInt(intervalArg, 10) : 300;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const monitor = new EmbeddingsHealthMonitor(url, key);

  if (command === 'check') {
    console.log('\n🏥 Embeddings Health Check\n');
    console.log('='.repeat(70));

    try {
      const health = await monitor.checkHealth(domain);

      if (Array.isArray(health)) {
        console.log(`\nChecked ${health.length} domain(s)\n`);
        health.forEach(printDomainHealth);
        printOverallSummary(health);
      } else {
        console.log(`\nDomain: ${domain}\n`);
        printHealthMetrics(health);
      }

      console.log('\n' + '='.repeat(70));
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else if (command === 'auto') {
    console.log('\n🔧 Auto-Maintenance Mode\n');
    console.log('='.repeat(70));

    try {
      const health = await monitor.checkHealth(domain);

      if (Array.isArray(health)) {
        for (const domainHealth of health) {
          console.log(`\n📦 Maintaining: ${domainHealth.domain}`);
          console.log('─'.repeat(50));
          await monitor.performMaintenance(domainHealth.domain, domainHealth.metrics);
        }
      } else {
        if (!domain) throw new Error('Domain parameter required');
        await monitor.performMaintenance(domain, health);
      }

      console.log('\n✅ Auto-maintenance complete!');
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else if (command === 'watch') {
    try {
      printWatchStatus(interval);
      await monitor.watch(interval, printWatchUpdate);
    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else {
    console.error(`\n❌ Unknown command: ${command}`);
    console.log('\nRun "npx tsx scripts/monitoring/monitor-embeddings-health.ts help" for usage');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
