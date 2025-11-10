/**
 * Content Refresh System
 * Main orchestrator for content refresh operations
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import {
  findSitemaps,
  findUrlsInRobots,
  parseSitemap,
  isRelevantUrl,
  scheduleContentRefresh as scheduleRefresh,
} from './content-refresh-scheduler';
import {
  refreshPageContent as executeRefreshPage,
  refreshDomainContent as executeRefreshDomain,
} from './content-refresh-executor';

import type {
  RefreshConfig,
  RefreshStats,
  RefreshOptions,
} from './content-refresh-types';

/**
 * Refresh a single page's content and embeddings
 */
export async function refreshPageContent(
  url: string,
  domainId: string
): Promise<boolean> {
  return executeRefreshPage(url, domainId);
}

/**
 * Refresh all content for a domain
 */
export async function refreshDomainContent(
  domainId: string,
  options?: RefreshOptions
): Promise<RefreshStats> {
  return executeRefreshDomain(domainId, options);
}

/**
 * Discover and add new pages from sitemap
 */
export async function discoverNewPages(
  domainId: string,
  baseUrl: string
): Promise<string[]> {
  const supabase = await createServiceRoleClient();
  const newPages: string[] = [];

  try {
    const urlObj = new URL(baseUrl);
    const domain = urlObj.hostname;

    console.log(`Sitemap discovery for ${baseUrl}`);

    if (!supabase) {
      throw new Error('Database connection unavailable');
    }

    const { data: existingPages } = await supabase
      .from('scraped_pages')
      .select('url')
      .eq('domain_id', domainId);

    const existingUrls = new Set(existingPages?.map(p => p.url) || []);

    try {
      const sitemapUrls = await findSitemaps(domain);
      console.log(`Found ${sitemapUrls.length} sitemaps for ${domain}`);

      for (const sitemapUrl of sitemapUrls) {
        try {
          const sitemapPages = await parseSitemap(sitemapUrl);
          const newSitemapPages = sitemapPages.filter(page =>
            !existingUrls.has(page.url) &&
            isRelevantUrl(page.url)
          );

          console.log(`Found ${newSitemapPages.length} new pages from sitemap: ${sitemapUrl}`);
          newPages.push(...newSitemapPages.map(page => page.url));

        } catch (sitemapError) {
          console.warn(`Error processing sitemap ${sitemapUrl}:`, sitemapError);
        }
      }
    } catch (sitemapDiscoveryError) {
      console.warn(`Error discovering sitemaps for ${domain}:`, sitemapDiscoveryError);
    }

    try {
      const robotsUrls = await findUrlsInRobots(domain);
      const newRobotsUrls = robotsUrls.filter(url =>
        !existingUrls.has(url) &&
        isRelevantUrl(url)
      );

      newPages.push(...newRobotsUrls);
      console.log(`Added ${newRobotsUrls.length} new pages from robots.txt`);

    } catch (robotsError) {
      console.warn(`Error parsing robots.txt for ${domain}:`, robotsError);
    }

    return newPages;
  } catch (error) {
    console.error('Error discovering new pages:', error);
    throw error;
  }
}

/**
 * Schedule periodic content refresh
 */
export async function scheduleContentRefresh(
  config: RefreshConfig
): Promise<void> {
  return scheduleRefresh(config);
}

/**
 * Re-export types for convenience
 */
export type {
  RefreshConfig,
  RefreshStats,
  RefreshOptions,
} from './content-refresh-types';
