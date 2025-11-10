#!/usr/bin/env npx tsx
/**
 * Database Cleanup Tool
 *
 * Clean scraped data, embeddings, and related content for fresh re-scraping.
 *
 * Usage:
 *   npx tsx test-database-cleanup.ts stats                    # Show statistics
 *   npx tsx test-database-cleanup.ts stats --domain=X         # Stats for domain
 *   npx tsx test-database-cleanup.ts clean                    # Clean all data
 *   npx tsx test-database-cleanup.ts clean --domain=X         # Clean specific domain
 *   npx tsx test-database-cleanup.ts clean --dry-run          # Preview deletion
 *   npx tsx test-database-cleanup.ts help                     # Show help
 *
 * Safety Features:
 * - 3-second countdown before deletion
 * - Dry-run mode for preview
 * - Domain-specific targeting
 * - Preserves customer configs and credentials
 *
 * Based on: docs/DATABASE_CLEANUP.md and lib/database-cleaner.ts
 */

import { createSupabaseClient } from '../utils/database/supabase-client';
import { showHelp, parseArgs } from './cleanup/cli-helpers';
import { handleStatsCommand, handleCleanCommand } from './cleanup/commands';

async function main() {
  const args = process.argv.slice(2);
  const { command, domain, dryRun } = parseArgs(args);

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const supabase = createSupabaseClient();

  if (command === 'stats') {
    await handleStatsCommand(supabase, domain);
  } else if (command === 'clean') {
    await handleCleanCommand(supabase, domain, dryRun);
  } else {
    console.error(`\n❌ Unknown command: ${command}`);
    console.log('\nRun "npx tsx test-database-cleanup.ts help" for usage information');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
