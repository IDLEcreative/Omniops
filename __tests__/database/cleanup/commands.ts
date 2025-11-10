/**
 * CLI Commands
 * Handlers for stats and clean commands
 */

import { getScrapingStats } from './stats-query';
import { executeCleanup } from './deletion-executor';
import { displayStatistics, displayCleanupWarning, countdown } from './cli-helpers';

export async function handleStatsCommand(supabase: any, domain?: string): Promise<void> {
  try {
    const stats = await getScrapingStats(supabase, domain);
    displayStatistics(stats);
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

export async function handleCleanCommand(
  supabase: any,
  domain?: string,
  dryRun = false
): Promise<void> {
  try {
    const stats = await getScrapingStats(supabase, domain);
    displayCleanupWarning(stats, domain);

    if (!dryRun) {
      console.log('\n⚠️  This action cannot be undone!');
      await countdown(3);
    }

    const result = await executeCleanup(supabase, {
      domain,
      includeJobs: true,
      includeCache: true,
      preserveConfigs: true,
      dryRun
    });

    if (!result.success) {
      console.error('\n❌ Cleanup failed:', result.error);
      process.exit(1);
    }

    if (dryRun) {
      console.log('\n✅ Dry run complete - no data was deleted');
    }

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
