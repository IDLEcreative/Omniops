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

import { createClient } from '@supabase/supabase-js';

interface CleanupOptions {
  domain?: string;
  includeJobs?: boolean;
  includeCache?: boolean;
  preserveConfigs?: boolean;
  dryRun?: boolean;
}

interface CleanupResult {
  success: boolean;
  deletedCounts: {
    pages?: number;
    content?: number;
    embeddings?: number;
    extractions?: number;
    jobs?: number;
    cache?: number;
    conversations?: number;
    messages?: number;
  };
  error?: string;
}

interface DatabaseStats {
  scraped_pages: number;
  website_content: number;
  embeddings: number;
  structured_extractions: number;
  scrape_jobs?: number;
  query_cache?: number;
  conversations?: number;
  messages?: number;
  domain?: string;
}

class DatabaseCleaner {
  private supabase: any;

  constructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(url, key);
  }

  async getScrapingStats(domain?: string): Promise<DatabaseStats> {
    try {
      const stats: DatabaseStats = {
        scraped_pages: 0,
        website_content: 0,
        embeddings: 0,
        structured_extractions: 0
      };

      if (domain) {
        stats.domain = domain;
      }

      // Get domain ID if provided
      let domainId: string | null = null;
      if (domain) {
        const { data: domainData } = await this.supabase
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .single();

        if (!domainData) {
          throw new Error(`Domain "${domain}" not found in database`);
        }
        domainId = domainData.id;
      }

      // Count scraped pages
      const pagesQuery = domainId
        ? this.supabase.from('scraped_pages').select('id', { count: 'exact', head: true }).eq('domain_id', domainId)
        : this.supabase.from('scraped_pages').select('id', { count: 'exact', head: true });
      const { count: pagesCount } = await pagesQuery;
      stats.scraped_pages = pagesCount || 0;

      // Count website content
      const contentQuery = domainId
        ? this.supabase.from('website_content').select('id', { count: 'exact', head: true }).eq('domain_id', domainId)
        : this.supabase.from('website_content').select('id', { count: 'exact', head: true });
      const { count: contentCount } = await contentQuery;
      stats.website_content = contentCount || 0;

      // Count embeddings
      const embeddingsQuery = domainId
        ? this.supabase.from('page_embeddings').select('id', { count: 'exact', head: true }).eq('domain_id', domainId)
        : this.supabase.from('page_embeddings').select('id', { count: 'exact', head: true });
      const { count: embeddingsCount } = await embeddingsQuery;
      stats.embeddings = embeddingsCount || 0;

      // Count structured extractions
      const extractionsQuery = domainId
        ? this.supabase.from('structured_extractions').select('id', { count: 'exact', head: true }).eq('domain_id', domainId)
        : this.supabase.from('structured_extractions').select('id', { count: 'exact', head: true });
      const { count: extractionsCount } = await extractionsQuery;
      stats.structured_extractions = extractionsCount || 0;

      // Count scrape jobs (optional table)
      try {
        const jobsQuery = domainId
          ? this.supabase.from('scrape_jobs').select('id', { count: 'exact', head: true }).eq('domain_id', domainId)
          : this.supabase.from('scrape_jobs').select('id', { count: 'exact', head: true });
        const { count: jobsCount } = await jobsQuery;
        stats.scrape_jobs = jobsCount || 0;
      } catch (e) {
        // Table might not exist
      }

      // Count query cache
      try {
        const cacheQuery = domain
          ? this.supabase.from('query_cache').select('id', { count: 'exact', head: true }).eq('domain', domain)
          : this.supabase.from('query_cache').select('id', { count: 'exact', head: true });
        const { count: cacheCount } = await cacheQuery;
        stats.query_cache = cacheCount || 0;
      } catch (e) {
        // Table might not exist
      }

      // Count conversations
      if (domain) {
        try {
          const { count: convCount } = await this.supabase
            .from('conversations')
            .select('id', { count: 'exact', head: true })
            .eq('domain', domain);
          stats.conversations = convCount || 0;
        } catch (e) {
          // Ignore
        }
      }

      return stats;

    } catch (error) {
      throw new Error(`Failed to get stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async cleanAllScrapedData(options: CleanupOptions = {}): Promise<CleanupResult> {
    const {
      domain,
      includeJobs = true,
      includeCache = true,
      preserveConfigs = true,
      dryRun = false
    } = options;

    const result: CleanupResult = {
      success: false,
      deletedCounts: {}
    };

    try {
      console.log(dryRun ? '🔍 DRY RUN MODE - No actual deletion will occur' : '🧹 Starting database cleanup...');

      // Get domain ID if specific domain provided
      let domainId: string | null = null;
      if (domain) {
        const { data: domainData } = await this.supabase
          .from('domains')
          .select('id')
          .eq('domain', domain)
          .single();

        if (domainData) {
          domainId = domainData.id;
          console.log(`📍 Target domain: ${domain} (ID: ${domainId})`);
        } else {
          throw new Error(`Domain ${domain} not found`);
        }
      } else {
        console.log('📍 Target: ALL DOMAINS');
      }

      if (dryRun) {
        console.log('\n📊 Preview of what would be deleted:');
        const stats = await this.getScrapingStats(domain);
        console.log(`  - Embeddings: ${stats.embeddings}`);
        console.log(`  - Structured extractions: ${stats.structured_extractions}`);
        console.log(`  - Website content: ${stats.website_content}`);
        console.log(`  - Scraped pages: ${stats.scraped_pages}`);
        if (includeJobs && stats.scrape_jobs !== undefined) {
          console.log(`  - Scrape jobs: ${stats.scrape_jobs}`);
        }
        if (includeCache && stats.query_cache !== undefined) {
          console.log(`  - Query cache: ${stats.query_cache}`);
        }
        if (stats.conversations !== undefined) {
          console.log(`  - Conversations: ${stats.conversations}`);
        }
        result.success = true;
        result.deletedCounts = stats;
        return result;
      }

      // Delete page embeddings first (references scraped_pages)
      const embeddingsQuery = domainId
        ? this.supabase.from('page_embeddings').delete().eq('domain_id', domainId)
        : this.supabase.from('page_embeddings').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data: embeddings, error: embError } = await embeddingsQuery.select('id');
      if (embError) throw new Error(`Failed to delete embeddings: ${embError.message}`);
      result.deletedCounts.embeddings = embeddings?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.embeddings} embeddings`);

      // Delete structured extractions
      const extractionsQuery = domainId
        ? this.supabase.from('structured_extractions').delete().eq('domain_id', domainId)
        : this.supabase.from('structured_extractions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data: extractions, error: extError } = await extractionsQuery.select('id');
      if (extError) throw new Error(`Failed to delete extractions: ${extError.message}`);
      result.deletedCounts.extractions = extractions?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.extractions} structured extractions`);

      // Delete website content
      const contentQuery = domainId
        ? this.supabase.from('website_content').delete().eq('domain_id', domainId)
        : this.supabase.from('website_content').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data: content, error: contError } = await contentQuery.select('id');
      if (contError) throw new Error(`Failed to delete content: ${contError.message}`);
      result.deletedCounts.content = content?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.content} website content entries`);

      // Delete scraped pages
      const pagesQuery = domainId
        ? this.supabase.from('scraped_pages').delete().eq('domain_id', domainId)
        : this.supabase.from('scraped_pages').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      const { data: pages, error: pageError } = await pagesQuery.select('id');
      if (pageError) throw new Error(`Failed to delete pages: ${pageError.message}`);
      result.deletedCounts.pages = pages?.length || 0;
      console.log(`✅ Deleted ${result.deletedCounts.pages} scraped pages`);

      // Delete scrape jobs if requested
      if (includeJobs) {
        try {
          const jobsQuery = domainId
            ? this.supabase.from('scrape_jobs').delete().eq('domain_id', domainId)
            : this.supabase.from('scrape_jobs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

          const { data: jobs, error: jobError } = await jobsQuery.select('id');
          if (!jobError) {
            result.deletedCounts.jobs = jobs?.length || 0;
            console.log(`✅ Deleted ${result.deletedCounts.jobs} scrape jobs`);
          }
        } catch (e) {
          console.warn('⚠️  Scrape jobs table not found (optional)');
        }
      }

      // Delete query cache if requested
      if (includeCache) {
        try {
          const cacheQuery = domain
            ? this.supabase.from('query_cache').delete().eq('domain', domain)
            : this.supabase.from('query_cache').delete().neq('id', '00000000-0000-0000-0000-000000000000');

          const { data: cache, error: cacheError } = await cacheQuery.select('id');
          if (!cacheError) {
            result.deletedCounts.cache = cache?.length || 0;
            console.log(`✅ Deleted ${result.deletedCounts.cache} cached queries`);
          }
        } catch (e) {
          console.warn('⚠️  Query cache table not found (optional)');
        }
      }

      // Delete conversations and messages for this domain
      if (domain) {
        try {
          const { data: conversations, error: convError } = await this.supabase
            .from('conversations')
            .delete()
            .eq('domain', domain)
            .select('id');

          if (!convError) {
            result.deletedCounts.conversations = conversations?.length || 0;
            console.log(`✅ Deleted ${result.deletedCounts.conversations} conversations`);
          }
        } catch (e) {
          // Conversations might not exist
        }
      }

      // Reset domain timestamps
      if (domainId) {
        await this.supabase
          .from('domains')
          .update({
            last_scraped_at: null,
            last_content_refresh: null
          })
          .eq('id', domainId);
        console.log('✅ Reset domain scraping timestamps');
      }

      result.success = true;
      console.log('\n🎉 Database cleanup completed successfully!');

      return result;

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      result.error = error instanceof Error ? error.message : String(error);
      return result;
    }
  }
}

function showHelp() {
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

async function countdown(seconds: number) {
  for (let i = seconds; i > 0; i--) {
    process.stdout.write(`\r⏱️  Starting in ${i} seconds... (Ctrl+C to cancel)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  process.stdout.write('\r                                                  \r');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    showHelp();
    return;
  }

  const domain = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const dryRun = args.includes('--dry-run');

  const cleaner = new DatabaseCleaner();

  if (command === 'stats') {
    console.log('\n📊 Database Statistics\n');
    console.log('='.repeat(50));

    try {
      const stats = await cleaner.getScrapingStats(domain);

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

    } catch (error) {
      console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }

  } else if (command === 'clean') {
    console.log('\n🧹 Database Cleanup\n');
    console.log('='.repeat(50));

    try {
      // Show stats first
      const stats = await cleaner.getScrapingStats(domain);

      if (stats.domain) {
        console.log(`\nTarget domain: ${stats.domain}`);
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

      if (!dryRun) {
        console.log('\n⚠️  This action cannot be undone!');
        await countdown(3);
      }

      const result = await cleaner.cleanAllScrapedData({
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

  } else {
    console.error(`\n❌ Unknown command: ${command}`);
    console.log('\nRun "npx tsx test-database-cleanup.ts help" for usage information');
    process.exit(1);
  }
}

// Run the tool
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
