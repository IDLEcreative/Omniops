import { createServiceRoleClient } from '@/lib/supabase-server';
import { domainCache } from '@/lib/domain-cache';
import { getRedisClient } from '@/lib/redis';

export interface ProductOverview {
  total: number;
  brands?: Array<{ value: string; count: number }>;
  categories?: Array<{ value: string; count: number }>;
  priceRanges?: Array<{ range: string; count: number }>;
  allIds?: Array<{ id: string; title: string }>;
}

// Get comprehensive metadata about search results without fetching full content
export async function getProductOverview(
  query: string,
  domain: string
): Promise<ProductOverview | null> {
  // Check Redis cache first (5-minute TTL)
  const cacheKey = `overview:${domain}:${query.toLowerCase().replace(/\s+/g, '_')}`;
  
  try {
    const redis = await getRedisClient();
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
  }
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('[ProductOverview] Failed to create Supabase client');
    return null;
  }
  
  try {
    // Get cached domain ID for performance
    const searchDomain = domain.replace('www.', '');
    const domainId = await domainCache.getDomainId(searchDomain);
    
    if (!domainId) {
      return null;
    }
    
    const queryWords = query.trim().split(/\s+/).filter(word => word.length > 0);
    const searchKeyword = queryWords.length > 0 ? queryWords[0] : '';
    
    
    // Handle empty search (return all products) vs specific search
    let titleQuery, urlQuery, titleDataQuery, urlDataQuery;
    
    if (searchKeyword === '') {
      // Empty search means return ALL products
      titleQuery = supabase
        .from('scraped_pages')
        .select('id', { count: 'exact' })
        .eq('domain_id', domainId);
      
      urlQuery = supabase
        .from('scraped_pages')
        .select('id', { count: 'exact' })
        .eq('domain_id', domainId);
      
      titleDataQuery = supabase
        .from('scraped_pages')
        .select('id, url, title')
        .eq('domain_id', domainId)
        .limit(500);
      
      urlDataQuery = supabase
        .from('scraped_pages')
        .select('id, url, title')
        .eq('domain_id', domainId)
        .limit(0); // Don't duplicate in this case
    } else {
      // Specific keyword search
      titleQuery = supabase
        .from('scraped_pages')
        .select('id', { count: 'exact' })
        .eq('domain_id', domainId)
        .ilike('title', `%${searchKeyword}%`);
      
      urlQuery = supabase
        .from('scraped_pages')
        .select('id', { count: 'exact' })
        .eq('domain_id', domainId)
        .ilike('url', `%${searchKeyword!.toLowerCase()}%`);
      
      titleDataQuery = supabase
        .from('scraped_pages')
        .select('id, url, title')
        .eq('domain_id', domainId)
        .ilike('title', `%${searchKeyword}%`)
        .limit(500);
      
      urlDataQuery = supabase
        .from('scraped_pages')
        .select('id, url, title')
        .eq('domain_id', domainId)
        .ilike('url', `%${searchKeyword!.toLowerCase()}%`)
        .limit(500);
    }
    
    // Execute queries
    const { count: titleCount, error: titleCountError } = await titleQuery;
    const { count: urlCount, error: urlCountError } = await urlQuery;
    const { data: titleMatches, error: titleError } = await titleDataQuery;
    const { data: urlMatches, error: urlError } = await urlDataQuery;
    
    if (titleError || urlError || titleCountError || urlCountError) {
      console.error('[ProductOverview] Query error:', titleError || urlError || titleCountError || urlCountError);
      return null;
    }
    
    // Calculate the true total count (deduplicated)
    let actualTotal: number;
    
    if (searchKeyword === '') {
      // For empty search, just use the total count (no deduplication needed since it's all records)
      actualTotal = titleCount || 0;
    } else {
      // For specific searches, we need to get unique URLs to avoid double counting
      const { data: allUrls, error: urlsError } = await supabase
        .from('scraped_pages')
        .select('url')
        .eq('domain_id', domainId)
        .or(`title.ilike.%${searchKeyword}%,url.ilike.%${searchKeyword!.toLowerCase()}%`);
      
      if (urlsError) {
        console.error('[ProductOverview] URLs query error:', urlsError);
        return null;
      }
      
      const uniqueUrls = new Set(allUrls?.map(item => item.url) || []);
      actualTotal = uniqueUrls.size;
    }
    
    // Merge and deduplicate sample results for category/brand analysis
    const allMatches = new Map<string, { id: string; title: string }>();
    
    if (titleMatches) {
      titleMatches.forEach(match => {
        allMatches.set(match.url, { id: match.id, title: match.title || 'Untitled' });
      });
    }
    
    if (urlMatches) {
      urlMatches.forEach(match => {
        if (!allMatches.has(match.url)) {
          allMatches.set(match.url, { id: match.id, title: match.title || 'Untitled' });
        }
      });
    }
    
    // Extract categories and brands from URLs and titles
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    
    allMatches.forEach((item, url) => {
      // Extract category from URL pattern (e.g., /product-category/pumps/)
      const categoryMatch = url?.match(/\/product-category\/([^\/]+)/);
      if (categoryMatch) {
        const category = categoryMatch[1]?.replace(/-/g, ' ');
        if (category) {
          categories.set(category, (categories.get(category) || 0) + 1);
        }
      }
      
      // Extract brand from title patterns (common: "Brand Name Product")
      const titleParts = item.title.split(/\s+/);
      if (titleParts.length > 1) {
        const potentialBrand = titleParts[0];
        // Simple heuristic: if first word is capitalized and appears multiple times
        if (potentialBrand && potentialBrand[0] === potentialBrand[0]?.toUpperCase()) {
          brands.set(potentialBrand, (brands.get(potentialBrand) || 0) + 1);
        }
      }
    });
    
    // Sort and format metadata
    const sortedCategories = Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
    
    const sortedBrands = Array.from(brands.entries())
      .filter(([_, count]) => count > 1) // Only show brands with multiple products
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([value, count]) => ({ value, count }));
    
    // Get all IDs and titles for awareness
    const allIds = Array.from(allMatches.entries())
      .slice(0, 500) // Limit to 500 to avoid token explosion
      .map(([url, data]) => ({
        id: data.id,
        title: data.title
      }));
    
    const overview: ProductOverview = {
      total: actualTotal,
      categories: sortedCategories.length > 0 ? sortedCategories : undefined,
      brands: sortedBrands.length > 0 ? sortedBrands : undefined,
      allIds: allIds.length > 20 ? allIds : undefined // Only include if we have more than what's shown in detail
    };
    
    console.log(`[ProductOverview] Found ${actualTotal} total results with ${sortedCategories.length} categories (sample size: ${allMatches.size})`);
    
    // Cache the result with 5-minute TTL
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.set(cacheKey, JSON.stringify(overview));
        console.log(`[ProductOverview] Cached result for query: "${query}" (TTL: 5min)`);
      }
    } catch (error) {
    }
    
    return overview;
    
  } catch (error) {
    console.error('[ProductOverview] Unexpected error:', error);
    return null;
  }
}