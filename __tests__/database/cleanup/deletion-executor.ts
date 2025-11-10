/**
 * Deletion Executor
 * Performs actual deletion operations with error handling
 */

import { CleanupOptions, CleanupResult } from '../../utils/database/types';
import { getDomainId, resetDomainTimestamps } from '../../utils/database/domain-helper';
import { getScrapingStats } from './stats-query';

interface DeleteQuery {
  eq(field: string, value: string): any;
  neq(field: string, value: string): any;
  select(columns: string): Promise<any>;
}

async function deleteFromTable(
  supabase: any,
  tableName: string,
  domainId?: string
): Promise<number> {
  const query: DeleteQuery = supabase.from(tableName).delete();

  if (domainId) {
    query.eq('domain_id', domainId);
  } else {
    query.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { data, error } = await query.select('id');
  if (error) throw new Error(`Failed to delete from ${tableName}: ${error.message}`);

  return data?.length || 0;
}

async function safeDeleteFromTable(
  supabase: any,
  tableName: string,
  domainId?: string,
  fieldName?: string
): Promise<number> {
  try {
    const query: DeleteQuery = supabase.from(tableName).delete();

    if (domainId) {
      query.eq(fieldName || 'domain_id', domainId);
    } else if (fieldName) {
      query.eq(fieldName, '');
    } else {
      query.neq('id', '00000000-0000-0000-0000-000000000000');
    }

    const { data, error } = await query.select('id');
    if (!error) return data?.length || 0;

    return 0;
  } catch {
    return 0;
  }
}

export async function executeCleanup(
  supabase: any,
  options: CleanupOptions
): Promise<CleanupResult> {
  const {
    domain,
    includeJobs = true,
    includeCache = true,
    dryRun = false
  } = options;

  const result: CleanupResult = {
    success: false,
    deletedCounts: {}
  };

  try {
    console.log(dryRun ? '🔍 DRY RUN MODE - No actual deletion will occur' : '🧹 Starting database cleanup...');

    let domainId: string | null = null;
    if (domain) {
      domainId = await getDomainId(supabase, domain);
      console.log(`📍 Target domain: ${domain} (ID: ${domainId})`);
    } else {
      console.log('📍 Target: ALL DOMAINS');
    }

    if (dryRun) {
      console.log('\n📊 Preview of what would be deleted:');
      const stats = await getScrapingStats(supabase, domain);
      displayDeletionPreview(stats, includeJobs, includeCache);
      result.success = true;
      result.deletedCounts = stats;
      return result;
    }

    // Execute deletions in dependency order
    result.deletedCounts.embeddings = await deleteFromTable(supabase, 'page_embeddings', domainId);
    console.log(`✅ Deleted ${result.deletedCounts.embeddings} embeddings`);

    result.deletedCounts.extractions = await deleteFromTable(supabase, 'structured_extractions', domainId);
    console.log(`✅ Deleted ${result.deletedCounts.extractions} structured extractions`);

    result.deletedCounts.content = await deleteFromTable(supabase, 'website_content', domainId);
    console.log(`✅ Deleted ${result.deletedCounts.content} website content entries`);

    result.deletedCounts.pages = await deleteFromTable(supabase, 'scraped_pages', domainId);
    console.log(`✅ Deleted ${result.deletedCounts.pages} scraped pages`);

    if (includeJobs) {
      result.deletedCounts.jobs = await safeDeleteFromTable(supabase, 'scrape_jobs', domainId);
      if (result.deletedCounts.jobs > 0) {
        console.log(`✅ Deleted ${result.deletedCounts.jobs} scrape jobs`);
      }
    }

    if (includeCache) {
      if (domain) {
        const cacheQuery = supabase.from('query_cache').delete().eq('domain', domain);
        const { data: cache } = await cacheQuery.select('id');
        result.deletedCounts.cache = cache?.length || 0;
        if (result.deletedCounts.cache > 0) {
          console.log(`✅ Deleted ${result.deletedCounts.cache} cached queries`);
        }
      }
    }

    if (domain) {
      const convQuery = supabase.from('conversations').delete().eq('domain', domain);
      const { data: conversations } = await convQuery.select('id');
      result.deletedCounts.conversations = conversations?.length || 0;
      if (result.deletedCounts.conversations > 0) {
        console.log(`✅ Deleted ${result.deletedCounts.conversations} conversations`);
      }
    }

    if (domainId) {
      await resetDomainTimestamps(supabase, domainId);
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

function displayDeletionPreview(stats: any, includeJobs: boolean, includeCache: boolean): void {
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
}
