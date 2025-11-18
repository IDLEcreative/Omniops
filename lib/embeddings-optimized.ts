import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import { embeddingCache } from '@/lib/embedding-cache';
import { getSearchCacheManager } from '@/lib/search-cache';
import { domainIdCache } from '@/lib/domain-id-cache';

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
    openai = new OpenAI({
      apiKey,
      timeout: 20 * 1000,    // 20 seconds (embeddings need 1-5s normally)
      maxRetries: 2,          // Retry failed requests twice
    });
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
    await cacheManager.trackCacheAccess(true);
    return cachedResult.chunks;
  }
  
  await cacheManager.trackCacheAccess(false);
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return [];
  }

  try {
    // OPTIMIZATION 1: Check domain ID cache first
    const searchDomain = domain.replace('www.', '');
    let domainId = domainIdCache.get(searchDomain);

    if (!domainId) {
      // Cache miss - fetch from database
      const domainTimer = new QueryTimer('Domain Lookup (Cache Miss)', 1000);

      const { data: domainData } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', searchDomain)
        .single();

      domainTimer.end();

      if (!domainData?.id) {
        return [];
      }

      domainId = domainData.id;

      // Cache the result for future requests
      domainIdCache.set(searchDomain, domainId);
    } else {
    }
    
    // SHORT QUERY OPTIMIZATION - for 1-2 word queries, use fast keyword search
    const queryWords = query.trim().split(/\s+/);
    const isShortQuery = queryWords.length <= 2;
    
    if (isShortQuery) {
      
      const keywordTimer = new QueryTimer('Keyword Search', 3000);
      
      // Use a more efficient query with LIMIT in database
      const { data: results } = await supabase
        .from('scraped_pages')
        .select('url, title, content')
        .eq('domain_id', domainId)
        .or(`title.ilike.%${query}%,url.ilike.%${query.toLowerCase()}%,content.ilike.%${query}%`)
        .limit(Math.min(limit * 2, 20)) // Get 2x limit but cap at 20
        .abortSignal(AbortSignal.timeout(3000));
      
      keywordTimer.end();
      
      if (results && results.length > 0) {
        const searchResults = results
          .map((row: any) => ({
            content: row.content?.substring(0, 500) || '', // Limit content size
            url: row.url || '',
            title: row.title || 'Untitled',
            similarity: row.url?.includes('/product/') ? 0.95 : 0.85
          }))
          .slice(0, limit);
        
        // Cache and return
        await cacheManager.cacheResult(query, { 
          response: '', 
          chunks: searchResults 
        }, domain, limit);
        
        return searchResults;
      }
    }
    
    // VECTOR SEARCH - for longer queries
    
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
      match_count: Math.min(limit, 10), // Hard cap at 10 for performance
    }).abortSignal(AbortSignal.timeout(5000));
    
    vectorTimer.end();
    
    if (error) {
      console.error('Vector search error:', error);
      
      // FALLBACK to keyword search on error
      
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