#!/usr/bin/env tsx
/**
 * Cleanup Old Telemetry Data
 *
 * Deletes lookup_failures records older than specified retention period.
 * Uses batch processing to avoid long-running transactions.
 *
 * Usage:
 *   npx tsx scripts/maintenance/cleanup-old-telemetry.ts [options]
 *
 * Options:
 *   --dry-run          Show what would be deleted without actually deleting
 *   --days=N           Retention period in days (default: 90)
 *   --batch-size=N     Records to delete per batch (default: 1000)
 *   --verbose          Show detailed progress
 *
 * Examples:
 *   # Dry run with 90-day retention
 *   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --dry-run
 *
 *   # Delete records older than 30 days
 *   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=30
 *
 *   # Verbose mode with custom batch size
 *   npx tsx scripts/maintenance/cleanup-old-telemetry.ts --days=60 --batch-size=500 --verbose
 */

import { createServiceRoleClientSync } from '@/lib/supabase-server';

interface CleanupOptions {
  retentionDays: number;
  batchSize: number;
  dryRun: boolean;
  verbose: boolean;
}

interface CleanupResult {
  success: boolean;
  deletedCount: number;
  errors: string[];
  duration: number;
  oldestDeleted?: string;
  newestDeleted?: string;
}

async function cleanupOldTelemetry(options: CleanupOptions): Promise<CleanupResult> {
  const startTime = Date.now();
  const supabase = createServiceRoleClientSync();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - options.retentionDays);

  const errors: string[] = [];
  let totalDeleted = 0;
  let oldestDeleted: string | undefined;
  let newestDeleted: string | undefined;

  console.log(`\n🔍 Cleanup Configuration:`);
  console.log(`   Retention period: ${options.retentionDays} days`);
  console.log(`   Cutoff date: ${cutoffDate.toISOString()}`);
  console.log(`   Batch size: ${options.batchSize}`);
  console.log(`   Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`);
  console.log('');

  try {
    // First, count records to be deleted
    const { count: recordsToDelete, error: countError } = await supabase
      .from('lookup_failures')
      .select('*', { count: 'exact', head: true })
      .lt('timestamp', cutoffDate.toISOString());

    if (countError) {
      errors.push(`Count error: ${countError.message}`);
      return {
        success: false,
        deletedCount: 0,
        errors,
        duration: Date.now() - startTime
      };
    }

    console.log(`📊 Found ${recordsToDelete || 0} records to delete`);

    if (recordsToDelete === 0) {
      console.log('✅ No records to delete');
      return {
        success: true,
        deletedCount: 0,
        errors,
        duration: Date.now() - startTime
      };
    }

    if (options.dryRun) {
      // In dry run, get sample of records that would be deleted
      const { data: sampleRecords } = await supabase
        .from('lookup_failures')
        .select('timestamp, lookup_type, identifier')
        .lt('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: true })
        .limit(5);

      if (sampleRecords && sampleRecords.length > 0) {
        console.log('\n📋 Sample records that would be deleted:');
        sampleRecords.forEach((record, idx) => {
          console.log(`   ${idx + 1}. ${record.timestamp} - ${record.lookup_type}: ${record.identifier}`);
        });
      }

      console.log(`\n✅ DRY RUN: Would delete ${recordsToDelete} records`);
      return {
        success: true,
        deletedCount: recordsToDelete || 0,
        errors,
        duration: Date.now() - startTime
      };
    }

    // Live deletion - process in batches
    let hasMore = true;
    let batchCount = 0;
    const expectedBatches = Math.ceil((recordsToDelete || 0) / options.batchSize);

    while (hasMore) {
      batchCount++;

      if (options.verbose) {
        console.log(`\n🔄 Processing batch ${batchCount}/${expectedBatches}...`);
      }

      // Get IDs to delete in this batch
      const { data: batchRecords, error: fetchError } = await supabase
        .from('lookup_failures')
        .select('id, timestamp')
        .lt('timestamp', cutoffDate.toISOString())
        .order('timestamp', { ascending: true })
        .limit(options.batchSize);

      if (fetchError) {
        errors.push(`Batch ${batchCount} fetch error: ${fetchError.message}`);
        break;
      }

      if (!batchRecords || batchRecords.length === 0) {
        hasMore = false;
        break;
      }

      // Track oldest and newest deleted timestamps
      if (!oldestDeleted && batchRecords.length > 0) {
        oldestDeleted = batchRecords[0].timestamp;
      }
      newestDeleted = batchRecords[batchRecords.length - 1].timestamp;

      // Delete this batch
      const ids = batchRecords.map(r => r.id);
      const { error: deleteError } = await supabase
        .from('lookup_failures')
        .delete()
        .in('id', ids);

      if (deleteError) {
        errors.push(`Batch ${batchCount} delete error: ${deleteError.message}`);
        break;
      }

      totalDeleted += batchRecords.length;

      if (options.verbose) {
        console.log(`   ✅ Deleted ${batchRecords.length} records (total: ${totalDeleted})`);
      }

      // Check if there are more records to process
      if (batchRecords.length < options.batchSize) {
        hasMore = false;
      }

      // Small delay between batches to avoid overwhelming the database
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ Cleanup complete!`);
    console.log(`   Records deleted: ${totalDeleted}`);
    console.log(`   Batches processed: ${batchCount}`);
    console.log(`   Duration: ${(duration / 1000).toFixed(2)}s`);

    if (oldestDeleted && newestDeleted) {
      console.log(`   Date range: ${oldestDeleted} to ${newestDeleted}`);
    }

    return {
      success: true,
      deletedCount: totalDeleted,
      errors,
      duration,
      oldestDeleted,
      newestDeleted
    };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Unexpected error: ${errorMsg}`);
    return {
      success: false,
      deletedCount: totalDeleted,
      errors,
      duration: Date.now() - startTime
    };
  }
}

// Parse command line arguments
function parseArgs(): CleanupOptions {
  const args = process.argv.slice(2);

  const dryRun = args.includes('--dry-run');
  const verbose = args.includes('--verbose');

  const daysArg = args.find(a => a.startsWith('--days='));
  const retentionDays = daysArg ? parseInt(daysArg.split('=')[1]) : 90;

  const batchSizeArg = args.find(a => a.startsWith('--batch-size='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 1000;

  // Validate inputs
  if (isNaN(retentionDays) || retentionDays < 1) {
    console.error('❌ Invalid retention days. Must be a positive integer.');
    process.exit(1);
  }

  if (isNaN(batchSize) || batchSize < 1 || batchSize > 10000) {
    console.error('❌ Invalid batch size. Must be between 1 and 10000.');
    process.exit(1);
  }

  return {
    retentionDays,
    batchSize,
    dryRun,
    verbose
  };
}

// Main execution
async function main() {
  console.log('🗑️  Telemetry Cleanup Tool\n');

  const options = parseArgs();
  const result = await cleanupOldTelemetry(options);

  if (!result.success) {
    console.error('\n❌ Cleanup failed!');
    result.errors.forEach(err => console.error(`   - ${err}`));
    process.exit(1);
  }

  if (result.errors.length > 0) {
    console.warn('\n⚠️  Cleanup completed with warnings:');
    result.errors.forEach(err => console.warn(`   - ${err}`));
  }

  console.log('');
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

export { cleanupOldTelemetry, type CleanupOptions, type CleanupResult };
