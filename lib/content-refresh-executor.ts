/**
 * Content Refresh Executor
 * Core execution logic for refreshing content
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
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
  const supabase = await createServiceRoleClient();

  try {
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }

    const { data: existingPage } = await supabase
      .from('scraped_pages')
      .select('id, last_scraped_at, content_hash')
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
      .from('scraped_pages')
      .upsert({
        domain_id: domainId,
        url,
        title: scrapedPage.title || '',
        content: scrapedPage.content,
        metadata: scrapedPage.metadata,
        content_hash: contentHash,
        last_scraped_at: new Date().toISOString(),
        status: 'success',
        error_message: null,
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

    // Handle 404s and scraping errors - mark as failed instead of throwing
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found');

    try {
      await supabase
        .from('scraped_pages')
        .upsert({
          domain_id: domainId,
          url,
          status: is404 ? 'deleted' : 'failed',
          error_message: errorMessage,
          last_scraped_at: new Date().toISOString(),
        }, {
          onConflict: 'domain_id,url'
        });

      console.log(`Marked ${url} as ${is404 ? 'deleted (404)' : 'failed'}`);
    } catch (updateError) {
      console.error(`Failed to update error status for ${url}:`, updateError);
    }

    throw error;
  }
}

/**
 * Process a batch of pages for refresh
 */
async function processBatch(
  batch: Array<{ url: string; last_scraped_at: string }>,
  domainId: string,
  options?: RefreshOptions
): Promise<PageRefreshResult[]> {
  const batchResults = await Promise.allSettled(
    batch.map(async (page): Promise<PageRefreshResult> => {
      try {
        if (!options?.forceRefresh) {
          const hoursSinceRefresh =
            (Date.now() - new Date(page.last_scraped_at).getTime()) / (1000 * 60 * 60);

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
  const supabase = await createServiceRoleClient();
  const stats: RefreshStats = { refreshed: 0, skipped: 0, failed: 0 };

  try {
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }

    const { data: domain } = await supabase
      .from('domains')
      .select('domain')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    const { data: existingPages } = await supabase
      .from('scraped_pages')
      .select('url, last_scraped_at')
      .eq('domain_id', domainId)
      .order('last_scraped_at', { ascending: true })
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
