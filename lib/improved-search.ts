/**
 * Improved Search Implementation
 * This module contains the optimized search logic with better accuracy
 * based on testing and analysis of current limitations.
 */

import { createServiceRoleClient } from '@/lib/supabase-server';
import { generateQueryEmbedding } from './embeddings';
import { detectQueryType, getOptimizedSearchParams } from './improved-search-config';
import {
  combineProductChunks,
  applySmartTruncation,
  rerankResults,
  getSearchQualityMetrics
} from './improved-search-utils';

// Re-export for backwards compatibility
export { detectQueryType, getOptimizedSearchParams, getSearchQualityMetrics };

/**
 * Enhanced search function with all improvements
 */
export async function searchWithImprovements(
  query: string,
  domain: string,
  options: {
    forceQueryType?: 'product' | 'support' | 'policy' | 'general';
    includeAllProductChunks?: boolean;
    enableQueryExpansion?: boolean;
  } = {}
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
  enhanced?: boolean;
}>> {
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('[Improved Search] No database connection');
    return [];
  }
  
  try {
    // 1. Detect query type for optimization
    const queryType = options.forceQueryType || detectQueryType(query);
    
    // 2. Get optimized parameters
    const params = getOptimizedSearchParams(queryType);
    
    // 3. Get domain_id
    const searchDomain = domain.replace('www.', '');
    const { data: domainData } = await supabase
      .from('domains')
      .select('id')
      .eq('domain', searchDomain)
      .single();
    
    if (!domainData) {
      console.warn(`[Improved Search] Domain not found: ${searchDomain}`);
      return [];
    }
    
    // 4. Generate embedding with query expansion if enabled
    let processedQuery = query;
    if (options.enableQueryExpansion) {
      // Add context markers for better matching
      if (queryType === 'product') {
        processedQuery = `product specifications details ${query}`;
      } else if (queryType === 'support') {
        processedQuery = `help guide instructions ${query}`;
      }
    }
    
    const queryEmbedding = await generateQueryEmbedding(processedQuery, true, domain);
    
    // 5. Search with improved parameters
    const { data: embeddings, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainData.id,
      match_threshold: params.similarityThreshold,
      match_count: params.chunkLimit
    });
    
    if (error) {
      console.error('[Improved Search] RPC error:', error);
      return [];
    }
    
    if (!embeddings || embeddings.length === 0) {
      return [];
    }
    
    // 6. Process results
    let results = embeddings.map((r: any) => ({
      content: r.content || r.chunk_text || '',
      url: r.url || r.metadata?.url || '',
      title: r.title || r.metadata?.title || 'Untitled',
      similarity: r.similarity || 0,
      enhanced: false
    }));
    
    // 7. CRITICAL ENHANCEMENT: Fetch ALL chunks for product pages
    // PERFORMANCE OPTIMIZATION: Batched queries instead of loop-based individual queries
    // Before: O(n³) - 100-200 DB calls for 10 products (1 query per product × 2 query types × chunks)
    // After: O(n) - 2 DB calls total (1 batch for pages + 1 batch for chunks)
    if ((queryType === 'product' || options.includeAllProductChunks) && results.length > 0) {
      const productUrls = results
        .filter((r: any) => r.url.includes('/product/'))
        .map((r: any) => r.url);

      if (productUrls.length === 0) {
      } else {

        try {
          // BATCH QUERY 1: Fetch ALL product pages at once
          const { data: allPages, error: pagesError } = await supabase
            .from('scraped_pages')
            .select('id, url, content')
            .in('url', productUrls);

          if (pagesError) {
            console.error('[Improved Search] Error fetching pages:', pagesError);
          } else if (allPages && allPages.length > 0) {

            // Build URL -> page lookup map
            const pagesByUrl = new Map(allPages.map(p => [p.url, p]));

            // BATCH QUERY 2: Fetch ALL chunks for these pages at once
            const pageIds = allPages.map(p => p.id);
            const { data: allChunks, error: chunksError } = await supabase
              .from('page_embeddings')
              .select('page_id, chunk_text, metadata')
              .in('page_id', pageIds)
              .order('metadata->chunk_index', { ascending: true });

            if (chunksError) {
              console.error('[Improved Search] Error fetching chunks:', chunksError);
            } else if (allChunks && allChunks.length > 0) {

              // Build page_id -> chunks[] lookup map for efficient grouping
              const chunksByPageId = new Map<string, any[]>();
              for (const chunk of allChunks) {
                if (!chunksByPageId.has(chunk.page_id)) {
                  chunksByPageId.set(chunk.page_id, []);
                }
                chunksByPageId.get(chunk.page_id)!.push(chunk);
              }

              // Enhance each product URL result with batched data
              for (const productUrl of productUrls) {
                const pageData = pagesByUrl.get(productUrl);
                if (pageData) {
                  // Option 1: Use full page content if available
                  if ((pageData as any).content && (pageData as any).content.length > 100) {
                    const index = results.findIndex((r: any) => r.url === productUrl);
                    if (index >= 0) {
                      results[index].content = (pageData as any).content;
                      results[index].enhanced = true;
                    }
                  } else {
                    // Option 2: Combine all embedding chunks from lookup map
                    const chunks = chunksByPageId.get((pageData as any).id) || [];
                    if (chunks.length > 0) {
                      const combinedContent = combineProductChunks(chunks);
                      const index = results.findIndex((r: any) => r.url === productUrl);
                      if (index >= 0) {
                        results[index].content = combinedContent;
                        results[index].enhanced = true;
                      }
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('[Improved Search] Error in batched enhancement:', error);
        }
      }
    }
    
    // 8. Apply smart truncation based on content type
    results = applySmartTruncation(results, params.truncationLength);
    
    // 9. Re-rank results based on query type priorities
    results = rerankResults(results, queryType);
    
    return results;
    
  } catch (error) {
    console.error('[Improved Search] Error:', error);
    return [];
  }
}

