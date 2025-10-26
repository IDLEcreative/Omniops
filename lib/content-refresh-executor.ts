/**
 * Content Refresh Executor
 * Core execution logic for refreshing content
 */

import { createClient } from '@/lib/supabase-server';
import { scrapePage } from '@/lib/scraper-api';
import { generateEmbeddings } from '@/lib/embeddings';
import { generateContentHash } from './content-refresh-scheduler';
import type { RefreshStats, RefreshOptions, PageRefreshResult } from './content-refresh-types';

/**
 * Refresh a single page's content and embeddings
 */
export async function refreshPageContent(
  url: string,
  domainId: string
): Promise<boolean> {
  const supabase = await createClient();

  try {
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }

    const { data: existingPage } = await supabase
      .from('website_content')
      .select('id, scraped_at, content_hash')
      .eq('url', url)
      .eq('domain_id', domainId)
      .single();

    const scrapedPage = await scrapePage(url);
    const contentHash = await generateContentHash(scrapedPage.content);

    if (existingPage?.content_hash === contentHash) {
      console.log(`Content unchanged for ${url}`);
      return false;
    }

    if (existingPage) {
      await supabase
        .from('page_embeddings')
        .delete()
        .eq('page_id', existingPage.id);
    }

    const { data: updatedContent, error: contentError } = await supabase
      .from('website_content')
      .upsert({
        domain_id: domainId,
        url,
        title: scrapedPage.title || '',
        content: scrapedPage.content,
        metadata: scrapedPage.metadata,
        content_hash: contentHash,
        scraped_at: new Date().toISOString(),
      }, {
        onConflict: 'domain_id,url'
      })
      .select()
      .single();

    if (contentError) throw contentError;

    await generateEmbeddings({
      contentId: updatedContent.id,
      content: scrapedPage.content,
      url,
      title: scrapedPage.title || '',
    });

    console.log(`Successfully refreshed content for ${url}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing ${url}:`, error);
    throw error;
  }
}

/**
 * Process a batch of pages for refresh
 */
async function processBatch(
  batch: Array<{ url: string; scraped_at: string }>,
  domainId: string,
  options?: RefreshOptions
): Promise<PageRefreshResult[]> {
  const batchResults = await Promise.allSettled(
    batch.map(async (page): Promise<PageRefreshResult> => {
      try {
        if (!options?.forceRefresh) {
          const hoursSinceRefresh =
            (Date.now() - new Date(page.scraped_at).getTime()) / (1000 * 60 * 60);

          if (hoursSinceRefresh < 24) {
            return { status: 'skipped', url: page.url };
          }
        }

        const wasRefreshed = await refreshPageContent(page.url, domainId);
        return {
          status: wasRefreshed ? 'refreshed' : 'skipped',
          url: page.url
        };
      } catch (error) {
        console.error(`Failed to refresh ${page.url}:`, error);
        return { status: 'failed', url: page.url, error };
      }
    })
  );

  return batchResults.map(result => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error('Batch processing error:', result.reason);
    return { status: 'failed', url: 'unknown', error: result.reason };
  });
}

/**
 * Refresh all content for a domain
 */
export async function refreshDomainContent(
  domainId: string,
  options?: RefreshOptions
): Promise<RefreshStats> {
  const supabase = await createClient();
  const stats: RefreshStats = { refreshed: 0, skipped: 0, failed: 0 };

  try {
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }

    const { data: domain } = await supabase
      .from('domains')
      .select('domain, settings')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    const { data: existingPages } = await supabase
      .from('website_content')
      .select('url, scraped_at')
      .eq('domain_id', domainId)
      .order('scraped_at', { ascending: true })
      .limit(options?.maxPages || 100);

    const BATCH_SIZE = 5;
    const pages = existingPages || [];

    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch, domainId, options);

      batchResults.forEach((result) => {
        if (result.status === 'refreshed') stats.refreshed++;
        else if (result.status === 'skipped') stats.skipped++;
        else if (result.status === 'failed') stats.failed++;
      });

      if (i + BATCH_SIZE < pages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    await supabase
      .from('domains')
      .update({
        last_content_refresh: new Date().toISOString()
      })
      .eq('id', domainId);

    return stats;
  } catch (error) {
    console.error('Error refreshing domain content:', error);
    throw error;
  }
}
