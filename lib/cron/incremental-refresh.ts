import { createServiceRoleClient } from '@/lib/supabase-server';
import crypto from 'crypto';
import { crawlWebsite } from '@/lib/scraper-api';

export async function getChangedPages(domainId: string): Promise<string[]> {
  const supabase = await createServiceRoleClient();

  // Get all current pages with content hashes
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('url, content_hash, last_scraped_at')
    .eq('domain_id', domainId)
    .eq('status', 'success');

  if (!pages || pages.length === 0) return [];

  // Fetch live content and compare hashes
  const changedUrls: string[] = [];

  for (const page of pages) {
    try {
      const response = await fetch(page.url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OmniopsBot/1.0)',
        },
      });

      if (!response.ok) {
        // If page is not accessible, include for refresh
        changedUrls.push(page.url);
        continue;
      }

      const content = await response.text();
      const newHash = crypto.createHash('sha256').update(content).digest('hex');

      // Content changed?
      if (newHash !== page.content_hash) {
        changedUrls.push(page.url);
      }
    } catch (error) {
      // On error, include for refresh
      console.log(`[Incremental] Error checking ${page.url}, will re-scrape:`, error);
      changedUrls.push(page.url);
    }
  }

  return changedUrls;
}

export async function incrementalCrawl(
  domain: string,
  domainId: string,
  organizationId: string
): Promise<{ pagesRefreshed: number; skipped: boolean; jobId?: string }> {
  const changedPages = await getChangedPages(domainId);

  if (changedPages.length === 0) {
    console.log(`[Incremental] No changes detected for ${domain}`);
    return { pagesRefreshed: 0, skipped: true };
  }

  console.log(`[Incremental] Found ${changedPages.length} changed pages for ${domain}`);

  // Crawl only changed pages
  const jobId = await crawlWebsite(`https://${domain}`, {
    maxPages: changedPages.length,
    includePaths: changedPages,
    forceRescrape: true,
    organizationId,
    configPreset: 'production',
    turboMode: true,
  });

  return { pagesRefreshed: changedPages.length, skipped: false, jobId };
}
