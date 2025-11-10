/**
 * Stats Query Service
 * Retrieves database statistics for cleanup preview
 */

import { DatabaseStats } from '../../utils/database/types';
import { getDomainId } from '../../utils/database/domain-helper';

interface CountOptions {
  count: 'exact';
  head: true;
}

async function countTable(
  supabase: any,
  tableName: string,
  domainId?: string
): Promise<number> {
  const query = supabase.from(tableName).select('id', { count: 'exact', head: true } as CountOptions);

  if (domainId) {
    query.eq('domain_id', domainId);
  }

  const { count } = await query;
  return count || 0;
}

async function countCacheTable(
  supabase: any,
  domain?: string
): Promise<number> {
  const query = supabase.from('query_cache').select('id', { count: 'exact', head: true } as CountOptions);

  if (domain) {
    query.eq('domain', domain);
  }

  const { count } = await query;
  return count || 0;
}

async function safeCountTable(supabase: any, tableName: string, domainId?: string): Promise<number | undefined> {
  try {
    return await countTable(supabase, tableName, domainId);
  } catch {
    return undefined;
  }
}

export async function getScrapingStats(supabase: any, domain?: string): Promise<DatabaseStats> {
  const stats: DatabaseStats = {
    scraped_pages: 0,
    website_content: 0,
    embeddings: 0,
    structured_extractions: 0
  };

  if (domain) {
    stats.domain = domain;
  }

  let domainId: string | null = null;
  if (domain) {
    domainId = await getDomainId(supabase, domain);
  }

  stats.scraped_pages = await countTable(supabase, 'scraped_pages', domainId);
  stats.website_content = await countTable(supabase, 'website_content', domainId);
  stats.embeddings = await countTable(supabase, 'page_embeddings', domainId);
  stats.structured_extractions = await countTable(supabase, 'structured_extractions', domainId);

  stats.scrape_jobs = await safeCountTable(supabase, 'scrape_jobs', domainId);

  if (domain) {
    stats.query_cache = await safeCountTable(supabase, 'query_cache', undefined);
    const convCount = await safeCountTable(supabase, 'conversations', undefined);
    if (convCount !== undefined) stats.conversations = convCount;
  }

  return stats;
}
