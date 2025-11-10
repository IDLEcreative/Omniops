/**
 * Cache Checker Module
 *
 * Determines whether a page should be skipped based on cache freshness.
 * Supports force rescrape mode to bypass cache checks.
 *
 * @module lib/scraper/cache-checker
 */

/**
 * Check if a page should be skipped based on cache state
 *
 * @param {string} pageUrl - The URL to check
 * @param {boolean} forceRescrape - If true, bypass cache checks
 * @param {Object} supabase - Supabase client instance
 * @returns {Promise<{skip: boolean, reason: string, hoursSinceLastScrape?: number}>}
 *
 * @example
 * const { skip, reason } = await shouldSkipPage(url, false, supabase);
 * if (skip) {
 *   console.log(`Skipping: ${reason}`);
 *   return;
 * }
 */
export async function shouldSkipPage(pageUrl, forceRescrape, supabase) {
  // Force rescrape mode - never skip
  if (forceRescrape) {
    return {
      skip: false,
      reason: 'Force re-scrape enabled; bypassing recency checks'
    };
  }

  // Check for existing page in cache
  let existingPage = null;
  try {
    const { data } = await supabase
      .from('scraped_pages')
      .select('scraped_at, metadata')
      .eq('url', pageUrl)
      .single();
    existingPage = data;
  } catch (error) {
    // Page not found in cache - should scrape
    return {
      skip: false,
      reason: 'Page not in cache'
    };
  }

  // Page exists - check freshness
  if (existingPage && existingPage.scraped_at) {
    const lastScraped = new Date(existingPage.scraped_at);
    const hoursSinceLastScrape = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);

    // Skip if scraped within 24 hours
    if (hoursSinceLastScrape < 24) {
      return {
        skip: true,
        reason: `Recently scraped (${hoursSinceLastScrape.toFixed(1)}h ago)`,
        hoursSinceLastScrape
      };
    }

    // Page is stale - should rescrape
    return {
      skip: false,
      reason: `Stale page (${hoursSinceLastScrape.toFixed(1)}h ago)`
    };
  }

  // Page exists but no scraped_at - should rescrape
  return {
    skip: false,
    reason: 'Page missing scraped_at timestamp'
  };
}
