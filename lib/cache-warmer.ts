/**
 * Cache Warmer
 * Pre-populates cache with common queries after deployment or cache clear
 */

import { searchSimilarContent } from './embeddings';

// Define common queries that should be pre-cached for each domain
const COMMON_QUERIES_BY_DOMAIN: Record<string, string[]> = {
  'thompsonseparts.co.uk': [
    'Cifa',
    'hydraulic pump',
    'tipper',
    'valve',
    'cylinder',
    'Cifa products',
    'all Cifa',
    'pump',
    'parts'
  ]
};

/**
 * Warm the cache with common queries
 * Run this after deployment or cache clear
 */
export async function warmCache(domain: string): Promise<void> {
  console.log(`[CacheWarmer] Starting cache warming for ${domain}`);
  
  const queries = COMMON_QUERIES_BY_DOMAIN[domain] || [];
  
  if (queries.length === 0) {
    console.log(`[CacheWarmer] No queries defined for ${domain}`);
    return;
  }
  
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;
  
  // Process queries in parallel batches
  const batchSize = 3;
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (query) => {
        try {
          console.log(`[CacheWarmer] Warming: "${query}"`);
          const results = await searchSimilarContent(query, domain, 100, 0.15);
          console.log(`[CacheWarmer] ✓ Cached "${query}" (${results.length} results)`);
          successCount++;
        } catch (error) {
          console.error(`[CacheWarmer] ✗ Failed to cache "${query}":`, error);
          errorCount++;
        }
      })
    );
  }
  
  const duration = Date.now() - startTime;
  console.log(`[CacheWarmer] Cache warming complete for ${domain}`);
  console.log(`[CacheWarmer] Success: ${successCount}, Errors: ${errorCount}, Duration: ${duration}ms`);
}

/**
 * Warm cache for all configured domains
 */
export async function warmAllCaches(): Promise<void> {
  const domains = Object.keys(COMMON_QUERIES_BY_DOMAIN);
  
  for (const domain of domains) {
    await warmCache(domain);
  }
}

/**
 * Check if cache needs warming (e.g., after version change)
 */
export async function checkCacheHealth(domain: string): Promise<{
  needsWarming: boolean;
  missingQueries: string[];
}> {
  const queries = COMMON_QUERIES_BY_DOMAIN[domain] || [];
  const missingQueries: string[] = [];
  
  // This would check if key queries are cached
  // Implementation depends on having access to cache manager
  
  return {
    needsWarming: missingQueries.length > 0,
    missingQueries
  };
}