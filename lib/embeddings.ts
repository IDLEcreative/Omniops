import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { embeddingCache } from '@/lib/embedding-cache';
import { getSearchCacheManager } from '@/lib/search-cache';
import { domainCache } from '@/lib/domain-cache';

// Performance monitoring
class QueryTimer {
  private startTime: number;
  private name: string;
  private timeout: number;

  constructor(name: string, timeoutMs: number = 5000) {
    this.name = name;
    this.startTime = Date.now();
    this.timeout = timeoutMs;
  }

  check(): void {
    const elapsed = Date.now() - this.startTime;
    if (elapsed > this.timeout) {
      throw new Error(`Query timeout: ${this.name} took ${elapsed}ms (limit: ${this.timeout}ms)`);
    }
  }

  end(): number {
    const elapsed = Date.now() - this.startTime;
    console.log(`[Performance] ${this.name}: ${elapsed}ms`);
    return elapsed;
  }
}

// Lazy load OpenAI client
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

// Generate a single embedding for a query with caching
export async function generateQueryEmbedding(
  query: string, 
  enrichWithIntent: boolean = true,
  domain?: string
): Promise<number[]> {
  // Check cache first
  const cached = embeddingCache.get(query);
  if (cached) {
    console.log('[Performance] Query embedding from cache');
    return cached;
  }
  
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI API');
    }
    
    // Cache the query embedding
    embeddingCache.set(query, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

// Optimized search with proper timeouts and limits
export async function searchSimilarContentOptimized(
  query: string,
  domain: string,
  limit: number = 5,
  similarityThreshold: number = 0.15,
  timeoutMs: number = 10000 // 10 second total timeout
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
}>> {
  const overallTimer = new QueryTimer('Total Search', timeoutMs);
  
  // Check cache first
  const cacheManager = getSearchCacheManager();
  const cachedResult = await cacheManager.getCachedResult(query, domain, limit);
  
  if (cachedResult && cachedResult.chunks) {
    console.log('[Cache] HIT - Returning cached search results');
    await cacheManager.trackCacheAccess(true);
    return cachedResult.chunks;
  }
  
  console.log('[Cache] MISS - Performing optimized search');
  await cacheManager.trackCacheAccess(false);
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return [];
  }

  try {
    // Use cached domain lookup - reduces from 21000ms to <1ms
    const domainTimer = new QueryTimer('Domain Lookup (Cached)', 100);
    const searchDomain = domain.replace('www.', '');
    
    const domainId = await domainCache.getDomainId(searchDomain);
    domainTimer.end();
    
    if (!domainId) {
      console.log(`No domain found for "${searchDomain}" (original: "${domain}")`);
      return [];
    }
    
    // SMART HYBRID SEARCH - Keyword first with vector fallback for short queries
    const queryWords = query.trim().split(/\s+/);
    const isShortQuery = queryWords.length <= 2;
    const MIN_KEYWORD_RESULTS = 3; // Minimum results before falling back to vector
    
    if (isShortQuery) {
      // For multi-word short queries, identify the most important keyword
      const commonWords = ['products', 'items', 'all', 'the', 'a', 'an', 'show', 'me', 'list'];
      const significantWords = queryWords.filter(w => !commonWords.includes(w.toLowerCase()));
      const searchKeyword = significantWords[0] || queryWords[0];
      
      console.log(`[HYBRID] Short query (${queryWords.length} words): "${query}" - trying keyword search first`);
      
      const keywordTimer = new QueryTimer('Keyword Search', 3000); // Shorter timeout for keyword
      
      let keywordResults: any[] = [];
      
      try {
        // Try keyword search first
        const { data: titleResults } = await supabase
          .from('scraped_pages')
          .select('url, title, content')
          .eq('domain_id', domainId)
          .ilike('title', `%${searchKeyword}%`)
          .limit(100); // Reduced limit for faster response
        
        if (titleResults) keywordResults.push(...titleResults);
        
        // Also search in URLs
        const { data: urlResults } = await supabase
          .from('scraped_pages')
          .select('url, title, content')
          .eq('domain_id', domainId)
          .ilike('url', `%${searchKeyword!.toLowerCase()}%`)
          .limit(100);
        
        if (urlResults) {
          const existingUrls = new Set(keywordResults.map(r => r.url));
          const newResults = urlResults.filter(r => !existingUrls.has(r.url));
          keywordResults.push(...newResults);
        }
        
        keywordTimer.end();
        console.log(`[HYBRID] Keyword search found ${keywordResults.length} results`);
        
        // Check if we have enough good results
        if (keywordResults.length >= MIN_KEYWORD_RESULTS) {
          // Sort and return keyword results
          keywordResults.sort((a, b) => {
            const aIsProduct = a.url?.includes('/product/');
            const bIsProduct = b.url?.includes('/product/');
            if (aIsProduct && !bIsProduct) return -1;
            if (!aIsProduct && bIsProduct) return 1;
            
            const aInTitle = a.title?.toLowerCase().includes(query.toLowerCase());
            const bInTitle = b.title?.toLowerCase().includes(query.toLowerCase());
            if (aInTitle && !bInTitle) return -1;
            if (!aInTitle && bInTitle) return 1;
            
            return 0;
          });
          
          const searchResults = keywordResults
            .slice(0, Math.min(limit, keywordResults.length))
            .map((row: any) => ({
              content: row.content?.substring(0, 500) || '',
              url: row.url || '',
              title: row.title || 'Untitled',
              similarity: row.url?.includes('/product/') ? 0.95 : 0.85,
              searchMethod: 'keyword' // Track which method was used
            }));
          
          console.log(`[HYBRID] Returning ${searchResults.length} keyword results`);
          
          // Cache and return
          await cacheManager.cacheResult(query, { 
            response: '', 
            chunks: searchResults 
          }, domain, limit);
          
          return searchResults;
        }
        
        // Not enough keyword results, fall through to vector search
        console.log(`[HYBRID] Only ${keywordResults.length} keyword results, falling back to vector search`);
        
      } catch (error) {
        console.log(`[HYBRID] Keyword search error, falling back to vector: ${error}`);
      }
    }
    
    // VECTOR SEARCH - for longer queries or when keyword search has insufficient results
    console.log(`[HYBRID] Using vector search for: "${query}"`);
    
    // Generate embedding with timeout
    const embeddingTimer = new QueryTimer('Generate Embedding', 2000);
    const queryEmbedding = await Promise.race([
      generateQueryEmbedding(query, false, domain),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Embedding generation timeout')), 2000)
      )
    ]);
    embeddingTimer.end();
    
    // Execute vector search with timeout and proper limit
    const vectorTimer = new QueryTimer('Vector Search', 5000);
    
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: similarityThreshold,
      match_count: Math.min(limit, 20), // Optimized limit for performance vs results
    }).abortSignal(AbortSignal.timeout(5000));
    
    vectorTimer.end();
    
    if (error) {
      console.error('Vector search error:', error);
      
      // FALLBACK to keyword search on error
      console.log('[OPTIMIZATION] Falling back to keyword search');
      
      const fallbackTimer = new QueryTimer('Fallback Search', 3000);
      
      const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2).slice(0, 3);
      const orConditions = keywords.map(k => `content.ilike.%${k}%`).join(',');
      
      const { data: fallbackResults } = await supabase
        .from('scraped_pages')
        .select('url, title, content')
        .eq('domain_id', domainId)
        .or(orConditions)
        .limit(limit)
        .abortSignal(AbortSignal.timeout(3000));
      
      fallbackTimer.end();
      
      const results = (fallbackResults || []).map((row: any) => ({
        content: row.content?.substring(0, 500) || '',
        url: row.url || '',
        title: row.title || 'Untitled',
        similarity: 0.5
      }));
      
      // Cache and return
      await cacheManager.cacheResult(query, { 
        response: '', 
        chunks: results 
      }, domain, limit);
      
      return results;
    }
    
    // Process vector search results
    const results = (data || []).map((result: any) => ({
      content: result.content?.substring(0, 500) || result.chunk_text?.substring(0, 500) || '',
      url: result.url || result.metadata?.url || '',
      title: result.title || result.metadata?.title || 'Untitled',
      similarity: result.similarity || 0,
    }));
    
    // OPTIMIZATION: Don't fetch all chunks for products - too slow
    // Instead, return the matched chunks as-is
    console.log(`[OPTIMIZATION] Returning ${results.length} results without chunk enhancement`);
    
    // Cache successful results
    await cacheManager.cacheResult(query, { 
      response: '', 
      chunks: results,
      metadata: {
        searchMethod: 'vector',
        chunksRetrieved: results.length
      }
    }, domain, limit);
    
    overallTimer.end();
    
    return results;
    
  } catch (error: any) {
    console.error('Search error:', error);
    
    // Check if we hit timeout
    if (error.message?.includes('timeout')) {
      console.error('[TIMEOUT] Search operation timed out');
      
      // Return any partial results from cache or empty
      const partialCache = await cacheManager.getCachedResult(query, domain, limit);
      if (partialCache?.chunks) {
        return partialCache.chunks;
      }
    }
    
    return [];
  }
}

// Export the optimized function as the main search function
export const searchSimilarContent = searchSimilarContentOptimized;

// Re-export the missing functions from embeddings-functions.ts
export { 
  generateEmbeddings, 
  splitIntoChunks, 
  generateEmbeddingVectors 
} from './embeddings-functions';