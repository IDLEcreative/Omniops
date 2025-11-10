/**
 * CLI Helpers
 * Utilities for command-line interface operations
 */

import { DatabaseStats } from '../../utils/database/types';

export function showHelp(): void {
  console.log(`
Database Cleanup Tool - Clean scraped data for fresh re-scraping

USAGE:
  npx tsx test-database-cleanup.ts <command> [options]

COMMANDS:
  stats                Show database statistics
  clean                Perform cleanup
  help                 Show this help message

OPTIONS:
  --domain=<domain>    Target specific domain (e.g., --domain=example.com)
  --dry-run            Preview what would be deleted without executing

EXAMPLES:
  # Show statistics for all domains
  npx tsx test-database-cleanup.ts stats

  # Show statistics for specific domain
  npx tsx test-database-cleanup.ts stats --domain=example.com

  # Preview cleanup (dry run)
  npx tsx test-database-cleanup.ts clean --dry-run

  # Clean all domains (with safety countdown)
  npx tsx test-database-cleanup.ts clean

  # Clean specific domain
  npx tsx test-database-cleanup.ts clean --domain=example.com

WHAT GETS DELETED:
  ✓ Page embeddings (vector search data)
  ✓ Scraped pages (raw HTML and content)
  ✓ Website content (processed content)
  ✓ Structured extractions (FAQs, products, contact info)
  ✓ Scrape jobs (background job queue)
  ✓ Query cache (cached search results)
  ✓ Conversations (chat history for domain)

WHAT'S PRESERVED:
  ✓ Customer configurations
  ✓ Domain settings
  ✓ User accounts
  ✓ Encrypted credentials

SAFETY FEATURES:
  • 3-second countdown before deletion
  • Dry-run mode for preview
  • Domain-specific targeting
  • Preserves customer configs

For more information, see: docs/DATABASE_CLEANUP.md
`);
}

export async function countdown(seconds: number): Promise<void> {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏱️  Starting in ${i} seconds... (Ctrl+C to cancel)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  process.stdout.write('\r                                                  \r');
}

export function displayStatistics(stats: DatabaseStats): void {
  console.log('\n📊 Database Statistics\n');
  console.log('='.repeat(50));

  if (stats.domain) {
    console.log(`\nDomain: ${stats.domain}`);
  } else {
    console.log('\nScope: ALL DOMAINS');
  }

  console.log('\nRecords:');
  console.log(`  Scraped pages:          ${stats.scraped_pages.toLocaleString()}`);
  console.log(`  Website content:        ${stats.website_content.toLocaleString()}`);
  console.log(`  Embeddings:             ${stats.embeddings.toLocaleString()}`);
  console.log(`  Structured extractions: ${stats.structured_extractions.toLocaleString()}`);

  if (stats.scrape_jobs !== undefined) {
    console.log(`  Scrape jobs:            ${stats.scrape_jobs.toLocaleString()}`);
  }
  if (stats.query_cache !== undefined) {
    console.log(`  Query cache:            ${stats.query_cache.toLocaleString()}`);
  }
  if (stats.conversations !== undefined) {
    console.log(`  Conversations:          ${stats.conversations.toLocaleString()}`);
  }

  const total = stats.scraped_pages + stats.website_content + stats.embeddings + stats.structured_extractions;
  console.log(`\nTotal records:            ${total.toLocaleString()}`);
  console.log('\n' + '='.repeat(50));
}

export function displayCleanupWarning(stats: DatabaseStats, domain?: string): void {
  console.log('\n🧹 Database Cleanup\n');
  console.log('='.repeat(50));

  if (domain) {
    console.log(`\nTarget domain: ${domain}`);
  } else {
    console.log('\n⚠️  WARNING: This will clean ALL DOMAINS!');
  }

  console.log('\nRecords to be deleted:');
  console.log(`  Embeddings:             ${stats.embeddings.toLocaleString()}`);
  console.log(`  Structured extractions: ${stats.structured_extractions.toLocaleString()}`);
  console.log(`  Website content:        ${stats.website_content.toLocaleString()}`);
  console.log(`  Scraped pages:          ${stats.scraped_pages.toLocaleString()}`);

  if (stats.scrape_jobs !== undefined) {
    console.log(`  Scrape jobs:            ${stats.scrape_jobs.toLocaleString()}`);
  }
  if (stats.query_cache !== undefined) {
    console.log(`  Query cache:            ${stats.query_cache.toLocaleString()}`);
  }
  if (stats.conversations !== undefined) {
    console.log(`  Conversations:          ${stats.conversations.toLocaleString()}`);
  }

  const total = stats.scraped_pages + stats.website_content + stats.embeddings + stats.structured_extractions;
  console.log(`\nTotal:                    ${total.toLocaleString()} records`);
  console.log('\n' + '='.repeat(50));
}

export function parseArgs(args: string[]): { command?: string; domain?: string; dryRun: boolean } {
  return {
    command: args[0],
    domain: args.find(arg => arg.startsWith('--domain='))?.split('=')[1],
    dryRun: args.includes('--dry-run')
  };
}
