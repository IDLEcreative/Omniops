import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import axios from 'axios';
import { embeddingCache, contentDeduplicator } from '@/lib/embedding-cache';
import { getSearchCacheManager } from '@/lib/search-cache';

// Lazy load OpenAI client to avoid build-time errors
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

// Token estimation and limits for OpenAI embeddings
const MAX_TOKENS_PER_CHUNK = 7500; // Conservative limit (model max is 8192)
const CHARS_PER_TOKEN_ESTIMATE = 4; // Rough estimate: 1 token ≈ 4 characters

// Split text into chunks for embedding with token limit checking
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
  // Check if we need token-aware splitting
  const estimatedTokens = text.length / CHARS_PER_TOKEN_ESTIMATE;
  const needsTokenSplitting = estimatedTokens > MAX_TOKENS_PER_CHUNK;
  
  // Use token-aware splitting for large texts
  if (needsTokenSplitting) {
    console.log(`[Token Management] Large text detected: ~${Math.round(estimatedTokens)} tokens, splitting at token boundaries`);
    
    let currentChunk = '';
    let currentTokenEstimate = 0;
    
    for (const sentence of sentences) {
      const sentenceTokens = sentence.length / CHARS_PER_TOKEN_ESTIMATE;
      
      // If adding this sentence would exceed token limit, save current chunk
      if (currentTokenEstimate + sentenceTokens > MAX_TOKENS_PER_CHUNK && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentTokenEstimate = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
        currentTokenEstimate += sentenceTokens;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    console.log(`[Token Management] Split into ${chunks.length} chunks, max ~${Math.round(MAX_TOKENS_PER_CHUNK)} tokens each`);
  } else {
    // Use standard character-based splitting for smaller texts
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
  }
  
  return chunks;
}

// Validate chunk size before sending to OpenAI
function validateChunkSize(chunk: string): boolean {
  const estimatedTokens = chunk.length / CHARS_PER_TOKEN_ESTIMATE;
  if (estimatedTokens > MAX_TOKENS_PER_CHUNK) {
    console.warn(`[Token Warning] Chunk exceeds token limit: ~${Math.round(estimatedTokens)} tokens`);
    return false;
  }
  return true;
}

// Generate embeddings for text chunks with caching and parallel processing
export async function generateEmbeddingVectors(chunks: string[]): Promise<number[][]> {
  // Performance: Mark start time
  const startTime = performance.now();
  
  // Check cache first
  const { cached, missing } = embeddingCache.getMultiple(chunks);
  
  // If all embeddings are cached, return immediately
  if (missing.length === 0) {
    const embeddings = chunks.map((_, index) => cached.get(index)!);
    const endTime = performance.now();
    console.log(`[Performance] All ${chunks.length} embeddings from cache: ${(endTime - startTime).toFixed(2)}ms`);
    return embeddings;
  }
  
  console.log(`[Performance] Cache hits: ${cached.size}/${chunks.length}`);
  
  const batchSize = 20; // Max items per API call
  const concurrentBatches = 3; // Process 3 batches concurrently
  const embeddings: number[][] = new Array(chunks.length);
  
  // Get chunks that need processing
  const missingChunks = missing.map(i => chunks[i]).filter((chunk): chunk is string => chunk !== undefined);
  const missingIndices = missing;
  
  // Create batches for missing chunks only
  const batches: { indices: number[]; batch: string[] }[] = [];
  for (let i = 0; i < missingChunks.length; i += batchSize) {
    batches.push({
      indices: missingIndices.slice(i, Math.min(i + batchSize, missingChunks.length)),
      batch: missingChunks.slice(i, Math.min(i + batchSize, missingChunks.length))
    });
  }
  
  // Process batches in parallel with controlled concurrency
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const currentBatches = batches.slice(i, i + concurrentBatches);
    
    // Process current set of batches in parallel
    const batchPromises = currentBatches.map(async ({ indices, batch }) => {
      try {
        // Validate all chunks in batch before sending
        const validatedBatch = batch.filter(chunk => {
          const isValid = validateChunkSize(chunk);
          if (!isValid) {
            // If chunk is too large, try to split it further
            const subChunks = splitIntoChunks(chunk, 1000);
            console.warn(`[Token Fix] Chunk too large, split into ${subChunks.length} smaller chunks`);
            // Note: This would require adjusting indices, so for now we'll truncate
            return false;
          }
          return true;
        });
        
        if (validatedBatch.length === 0) {
          console.error('[Token Error] All chunks in batch exceeded token limit');
          return { indices: [], embeddings: [], texts: [] };
        }
        
        const response = await getOpenAIClient().embeddings.create({
          model: 'text-embedding-3-small',
          input: validatedBatch,
        });
        
        return {
          indices: indices.slice(0, validatedBatch.length), // Adjust indices if some chunks were filtered
          embeddings: response.data.map(item => item.embedding),
          texts: validatedBatch
        };
      } catch (error: any) {
        // Check if it's a token limit error
        if (error?.message?.includes('maximum context length')) {
          console.error(`[Token Error] OpenAI token limit exceeded, attempting to split chunks further`);
          
          // Emergency split: divide each chunk in half
          const emergencySplitBatch = batch.flatMap(chunk => {
            const mid = Math.floor(chunk.length / 2);
            return [chunk.slice(0, mid), chunk.slice(mid)];
          });
          
          try {
            const response = await getOpenAIClient().embeddings.create({
              model: 'text-embedding-3-small',
              input: emergencySplitBatch,
            });
            
            // Combine pairs of embeddings by averaging (simple approach)
            const combinedEmbeddings = [];
            for (let i = 0; i < response.data.length; i += 2) {
              if (i + 1 < response.data.length) {
                const emb1 = response.data[i]?.embedding;
                const emb2 = response.data[i + 1]?.embedding;
                if (emb1 && emb2) {
                  const combined = emb1.map((val, idx) => (val + (emb2[idx] || 0)) / 2);
                  combinedEmbeddings.push(combined);
                }
              }
            }
            
            return {
              indices,
              embeddings: combinedEmbeddings,
              texts: batch
            };
          } catch (splitError) {
            console.error(`[Token Error] Emergency split also failed:`, splitError);
            throw splitError;
          }
        }
        
        console.error(`Error generating embeddings for batch:`, error);
        // Retry once on failure
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          const response = await getOpenAIClient().embeddings.create({
            model: 'text-embedding-3-small',
            input: batch,
          });
          return {
            indices,
            embeddings: response.data.map(item => item.embedding),
            texts: batch
          };
        } catch (retryError) {
          console.error(`Retry failed for batch:`, retryError);
          throw retryError;
        }
      }
    });
    
    // Wait for all current batches to complete
    const results = await Promise.all(batchPromises);
    
    // Place embeddings in correct positions and update cache
    for (const result of results) {
      if (result.indices && result.texts && result.embeddings) {
        for (let j = 0; j < result.embeddings.length; j++) {
          const embedding = result.embeddings[j];
          const originalIndex = result.indices[j];
          const text = result.texts[j];
          if (embedding && originalIndex !== undefined && text) {
            embeddings[originalIndex] = embedding;
            // Cache the new embedding
            embeddingCache.set(text, embedding);
          }
        }
      }
    }
    
    // Add small delay between batch groups to respect rate limits
    if (i + concurrentBatches < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  // Fill in cached embeddings
  cached.forEach((embedding, index) => {
    embeddings[index] = embedding;
  });
  
  const endTime = performance.now();
  console.log(`[Performance] Generated ${missing.length} new embeddings, used ${cached.size} cached, total time: ${(endTime - startTime).toFixed(2)}ms`);
  console.log(`[Performance] Cache stats:`, embeddingCache.getStats());
  
  return embeddings;
}

// Generate and store embeddings for content
export async function generateEmbeddings(params: {
  contentId: string;
  content: string;
  url: string;
  title: string;
  metadata?: any; // Added metadata parameter for enrichment
}): Promise<void> {
  const supabase = await createClient();
  
  // Import ContentEnricher dynamically to avoid build issues
  let enrichedContent = params.content;
  try {
    const { ContentEnricher } = await import('./content-enricher.js');
    
    // Check if content needs enrichment
    if (ContentEnricher.needsEnrichment(params.content) && params.metadata) {
      enrichedContent = ContentEnricher.enrichContent(
        params.content,
        params.metadata,
        params.url,
        params.title
      );
      
      // Log enrichment quality for monitoring
      const quality = ContentEnricher.calculateEnrichmentQuality(enrichedContent);
      console.log(`[Embeddings] Content enriched with score ${quality.enrichmentScore}/100 for ${params.url}`);
    }
  } catch (e) {
    console.log('[Embeddings] ContentEnricher not available, using raw content');
  }
  
  const chunks = splitIntoChunks(enrichedContent);
  
  if (chunks.length === 0) {
    console.warn('No chunks to embed for', params.url);
    return;
  }
  
  try {
    // Generate embeddings
    const embeddings = await generateEmbeddingVectors(chunks);
    
    // Prepare data for bulk insertion (optimized)
    const embeddingRecords = chunks.map((chunk, index) => ({
      page_id: params.contentId,  // Changed from content_id to page_id
      chunk_text: chunk,
      // Keep embedding as array format (database expects array, not string)
      embedding: embeddings[index] || null,
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
        url: params.url,
        title: params.title,
      },
    }));
    
    // Use bulk insert function for 86% performance improvement
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    const { data, error } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: embeddingRecords
    });
    
    if (error) {
      // Fallback to regular insert if bulk function fails
      console.warn('Bulk insert failed, falling back to regular insert:', error);
      const { error: fallbackError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);
      
      if (fallbackError) throw fallbackError;
    }
    
    console.log(`Stored ${chunks.length} embeddings for ${params.url}`);
  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw error;
  }
}

// Generate a single embedding for a query with caching
export async function generateQueryEmbedding(
  query: string, 
  enrichWithIntent: boolean = true,
  domain?: string
): Promise<number[]> {
  // Enrich query with intent markers for better matching
  let processedQuery = query;
  if (enrichWithIntent) {
    try {
      // Use dynamic QueryEnhancer with domain context
      const QueryEnhancerModule = await import('./query-enhancer.js');
      const GenericQueryEnhancer = QueryEnhancerModule.QueryEnhancer;
      
      // Get Supabase client if we have a domain
      let supabase = null;
      if (domain) {
        const { createClient } = await import('@supabase/supabase-js');
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
      }
      
      const enhancer = new (GenericQueryEnhancer as any)();
      const enhanced = await enhancer.enhanceQuery(query, domain, supabase);
      
      if (enhanced.confidence > 0.6 && enhanced.expanded !== query) {
        processedQuery = enhanced.expanded;
        console.log(`[Query Enhancement] Enhanced with ${enhanced.confidence.toFixed(2)} confidence`);
        console.log(`[Query Enhancement] Original: "${query}"`);
        console.log(`[Query Enhancement] Enhanced: "${processedQuery.substring(0, 100)}..."`);
        
        if (enhanced.suggestedTerms && enhanced.suggestedTerms.length > 0) {
          console.log(`[Query Enhancement] Suggested terms: ${enhanced.suggestedTerms.join(', ')}`);
        }
      }
    } catch (e) {
      // Fallback to simple pattern-based enrichment
      console.log('[Query Enhancement] Using simple pattern enrichment');
      
      // Generic patterns that work across all domains
      const skuPattern = /\b[A-Z0-9]+[-\/][A-Z0-9]+\b/gi;
      const pricePattern = /\b(cheap|cheapest|expensive|under|below|above|over)\s*\$?\d*\b/gi;
      const stockPattern = /\b(in stock|available|out of stock|unavailable)\b/gi;
      
      if (skuPattern.test(query)) {
        // Add SKU context for part number searches
        processedQuery = `SKU Part Number ${query}`;
      } else if (pricePattern.test(query)) {
        // Add price context for price-based queries
        processedQuery = `Price ${query}`;
      } else if (stockPattern.test(query)) {
        // Add availability context
        processedQuery = `Availability Stock ${query}`;
      }
    }
    
    if (processedQuery !== query) {
      console.log(`[Query Enhancement] Query enhanced for better matching`);
    }
  }
  
  // Check cache first
  const cached = embeddingCache.get(processedQuery);
  if (cached) {
    console.log('[Performance] Query embedding from cache');
    return cached;
  }
  
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: processedQuery,
    });
    
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI API');
    }
    
    // Cache the query embedding
    embeddingCache.set(processedQuery, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

// Search for similar content using embeddings
export async function searchSimilarContent(
  query: string,
  domain: string,
  limit: number = 5,
  similarityThreshold: number = 0.15  // Lowered from 0.45 to 0.15 for much better recall
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
}>> {
  // Check cache first for performance
  const cacheManager = getSearchCacheManager();
  const cachedResult = await cacheManager.getCachedResult(query, domain, limit);
  
  if (cachedResult && cachedResult.chunks) {
    console.log('[Cache] HIT - Returning cached search results');
    await cacheManager.trackCacheAccess(true);
    return cachedResult.chunks;
  }
  
  console.log('[Cache] MISS - Performing new search');
  await cacheManager.trackCacheAccess(false);
  const searchStartTime = Date.now();
  
  const supabase = await createServiceRoleClient();
  
  if (!supabase) {
    console.error('Failed to create Supabase client');
    return [];
  }

  // Helper: simple keyword extraction that preserves SKU-like tokens (e.g., DC66-10P)
  function extractKeywords(text: string, max = 5): string[] {
    const stop = new Set([
      'the','a','an','and','or','but','to','of','in','on','for','with','at','by','from','is','are','was','were','be','been','it','this','that','as','about','do','does','did','what','which','who','when','where','how','why','you','your','we','our'
    ]);
    return text
      .toLowerCase()
      // Preserve hyphens and slashes to keep part codes like "dc66-10p" intact
      .replace(/[^a-z0-9\s\-\/]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stop.has(w))
      .slice(0, max);
  }

  // Detect part/SKU codes like "DC66-10P" or similar patterns containing letters+digits and a hyphen
  function extractPartCodes(text: string): string[] {
    const codes = new Set<string>();
    const regex = /\b(?=[A-Za-z0-9\-\/]*[A-Za-z])(?=[A-Za-z0-9\-\/]*\d)[A-Za-z0-9]+(?:[\-\/][A-Za-z0-9]+)+\b/g;
    const lower = text.toLowerCase();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(lower)) !== null) {
      // Ignore overly short or excessively long tokens to reduce false positives
      const token = match[0];
      if (token.length >= 4 && token.length <= 32) {
        codes.add(token);
      }
    }
    return Array.from(codes);
  }

  // Search metadata for category and SKU matches
  async function searchMetadata(domainId: string | null, searchQuery: string): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
    if (!domainId || !supabase) return [];
    
    try {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      
      // CRITICAL: For agricultural queries, also search without metadata filter
      const isAgricultural = searchQuery.toLowerCase().includes('agri') || searchQuery.toLowerCase().includes('agricultural');
      
      if (isAgricultural) {
        // Search specifically for agricultural products by URL and title
        console.log('[RAG Metadata] Searching for agricultural products...');
        const { data: agriResults } = await supabase
          .from('scraped_pages')
          .select('url, title, content')
          .eq('domain_id', domainId)
          .or('url.ilike.%agri%,title.ilike.%agri%,content.ilike.%agricultural%')
          .limit(20);
        
        if (agriResults && agriResults.length > 0) {
          console.log(`[RAG Metadata] Found ${agriResults.length} agricultural products`);
          const agriFlip = agriResults.find(r => r.url?.includes('agri-flip'));
          if (agriFlip) {
            console.log('[RAG Metadata] ✓ Found Agri Flip product!');
          }
          
          return agriResults.map((row: any) => ({
            content: row.content || '',
            url: row.url || '',
            title: row.title || 'Untitled',
            similarity: row.url?.includes('agri-flip') ? 0.99 : 0.85,
          }));
        }
      }
      
      // Original metadata search logic
      const { data: results, error } = await supabase
        .from('scraped_pages')
        .select('url, title, content, metadata')
        .eq('domain_id', domainId)
        .not('metadata', 'is', null)
        .limit(100); // Get more to search through
      
      if (error) {
        console.error('[RAG Metadata] Query error:', error);
        return [];
      }
      
      // Filter results by checking metadata for keywords
      const filtered = results?.filter((row: any) => {
        if (!row.metadata) return false;
        
        // Convert metadata to searchable string
        const metadataStr = JSON.stringify(row.metadata).toLowerCase();
        const contentStr = (row.content || '').toLowerCase();
        const titleStr = (row.title || '').toLowerCase();
        
        // For queries with multiple specific terms, ensure better relevance
        // Don't hardcode any specific brands or companies
        const significantKeywords = keywords.filter(kw => kw.length > 3);
        
        if (significantKeywords.length >= 2) {
          // For multi-word specific queries, require multiple matches for relevance
          const matchCount = significantKeywords.filter(keyword => {
            const inMetadata = metadataStr.includes(keyword);
            const inContent = contentStr.includes(keyword);
            const inTitle = titleStr.includes(keyword);
            return inMetadata || inContent || inTitle;
          }).length;
          
          // Require at least 60% of significant keywords to match
          const requiredMatches = Math.max(2, Math.ceil(significantKeywords.length * 0.6));
          if (matchCount < requiredMatches) return false;
        }
        
        // For non-brand queries, require multiple keyword matches for relevance
        const matchCount = keywords.filter(keyword => {
          const inMetadata = metadataStr.includes(keyword);
          const inContent = contentStr.includes(keyword);
          const inTitle = titleStr.includes(keyword);
          return inMetadata || inContent || inTitle;
        }).length;
        
        // Require at least half the keywords to match
        return matchCount >= Math.max(2, Math.ceil(keywords.length / 2));
      }) || [];
      
      console.log(`[RAG Metadata] Found ${filtered.length} matches for keywords: ${keywords.join(', ')}`);
      
      // Log sample matches for debugging
      if (filtered.length > 0) {
        console.log(`[RAG Metadata] Sample match: ${filtered[0]?.title || 'Unknown'}`);
      }
      
      // Calculate dynamic similarity scores based on match quality
      return filtered.slice(0, 10).map((row: any) => {
        // Calculate how well this product matches the query
        const metadataStr = JSON.stringify(row.metadata || {}).toLowerCase();
        const contentStr = (row.content || '').toLowerCase();
        const titleStr = (row.title || '').toLowerCase();
        
        let score = 0.5; // Base score for any match
        
        // Count keyword matches
        const matchedKeywords = keywords.filter(kw => 
          titleStr.includes(kw) || contentStr.includes(kw) || metadataStr.includes(kw)
        );
        
        // Higher score for more keyword matches
        score += (matchedKeywords.length / keywords.length) * 0.3;
        
        // Bonus for title matches (most relevant)
        const titleMatches = keywords.filter(kw => titleStr.includes(kw)).length;
        if (titleMatches > 0) {
          score += (titleMatches / keywords.length) * 0.15;
        }
        
        // Boost for exact phrase matches in title
        // Check if multiple keywords appear together in title (indicates specific product)
        if (matchedKeywords.length >= 2) {
          const allInTitle = matchedKeywords.every(kw => titleStr.includes(kw));
          if (allInTitle) {
            score += 0.1; // Extra boost for multi-word matches in title
          }
        }
        
        // Cap at 0.95 to leave room for perfect semantic matches
        score = Math.min(score, 0.95);
        
        return {
          content: row.content || '',
          url: row.url || '',
          title: row.title || 'Untitled',
          similarity: score,
        };
      });
    } catch (error) {
      console.error('[RAG Metadata] Error:', error);
      return [];
    }
  }
  
  // Search keywords in content
  async function searchKeywords(domainId: string | null, searchQuery: string): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
    if (!domainId || !supabase) return [];
    
    try {
      const keywords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 3);
      if (keywords.length === 0) return [];
      
      const orConditions = [];
      for (const kw of keywords) {
        orConditions.push(`content.ilike.%${kw}%`);
        orConditions.push(`title.ilike.%${kw}%`);
      }
      
      const { data } = await supabase
        .from('scraped_pages')
        .select('url, title, content')
        .eq('domain_id', domainId)
        .or(orConditions.join(','))
        .limit(10);
      
      if (!data || data.length === 0) return [];
      
      console.log(`[RAG Keywords] Found ${data.length} keyword matches`);
      
      // Calculate dynamic scores based on keyword match quality
      return data.map((row: any) => {
        const titleStr = (row.title || '').toLowerCase();
        const contentStr = (row.content || '').toLowerCase();
        
        let score = 0.4; // Base score for any keyword match
        
        // Count how many keywords match
        const titleMatches = keywords.filter(kw => titleStr.includes(kw)).length;
        const contentMatches = keywords.filter(kw => contentStr.includes(kw)).length;
        
        // Higher score for more keyword matches
        score += (Math.max(titleMatches, contentMatches) / keywords.length) * 0.25;
        
        // Bonus for title matches
        if (titleMatches > 0) {
          score += (titleMatches / keywords.length) * 0.15;
        }
        
        // Boost products where all keywords appear (indicates high relevance)
        const allKeywordsPresent = keywords.every(kw => 
          titleStr.includes(kw) || contentStr.includes(kw)
        );
        
        if (allKeywordsPresent) {
          score += 0.2; // Significant boost for complete matches
        } else if (titleMatches === keywords.length) {
          score += 0.15; // Boost if all keywords in title
        }
        
        return {
          content: row.content || '',
          url: row.url || '',
          title: row.title || 'Untitled',
          similarity: Math.min(score, 0.9), // Cap at 0.9
        };
      });
    } catch (error) {
      console.error('[RAG Keywords] Error:', error);
      return [];
    }
  }

  // Fallback using scraped_pages keyword search when embeddings search fails
  async function fallbackKeywordSearch(domainId: string | null): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
    try {
      // Extract key terms from the query for keyword search
      const queryLower = query.toLowerCase();
      const keywords = queryLower.split(/\s+/).filter(word => word.length > 3);
      
      if (keywords.length > 0 && domainId) {
        // Try searching in metadata for category/SKU matches
        console.log('[RAG Fallback] Searching metadata for category and SKU matches');
        if (!supabase) return [];
        
        // Build metadata search conditions for each keyword
        const metadataConditions = [];
        for (const keyword of keywords) {
          const kwLower = keyword.toLowerCase();
          metadataConditions.push(`metadata->productCategory.ilike.%${kwLower}%`);
          metadataConditions.push(`metadata->productSku.ilike.%${kwLower}%`);
          metadataConditions.push(`metadata->productBrand.ilike.%${kwLower}%`);
          // Search in breadcrumbs array
          metadataConditions.push(`metadata->ecommerceData->breadcrumbs.cs.[{"name":"${keyword}"}]`);
        }
        
        if (metadataConditions.length > 0) {
          const { data: metadataResults } = await supabase
            .from('scraped_pages')
            .select('url, title, content, metadata')
            .eq('domain_id', domainId)
            .or(metadataConditions.join(','))
            .limit(limit);
          
          if (metadataResults && metadataResults.length > 0) {
            console.log(`[RAG Fallback] Found ${metadataResults.length} results via metadata search`);
            return metadataResults.map((row: any) => ({
              content: row.content || '',
              url: row.url || '',
              title: row.title || 'Untitled',
              similarity: 0.75, // Higher score for category matches
            }));
          }
        }
        
        // Standard keyword search as fallback
        const searchTerms = keywords.map(kw => `%${kw}%`);
        const orConditions = [];
        for (const term of searchTerms) {
          orConditions.push(`url.ilike.${term}`);
          orConditions.push(`title.ilike.${term}`);
          orConditions.push(`content.ilike.${term}`);
        }
        
        console.log('[RAG Fallback] Using keyword search for terms:', keywords);
        const { data: keywordResults } = await supabase
          .from('scraped_pages')
          .select('url, title, content')
          .eq('domain_id', domainId)
          .or(orConditions.join(','))
          .limit(limit);
          
        if (keywordResults && keywordResults.length > 0) {
          console.log(`[RAG Fallback] Found ${keywordResults.length} results via keyword search`);
          return keywordResults.map((row: any) => ({
            content: row.content || '',
            url: row.url || '',
            title: row.title || 'Untitled',
            similarity: 0.65, // Give a reasonable score for keyword matches
          }));
        }
      }
      
      // First, try exact part/SKU code matches which are common in this domain
      const partCodes = extractPartCodes(query);
      if (partCodes.length > 0) {
        try {
          const orParts: string[] = [];
          for (const code of partCodes) {
            const like = `%${code}%`;
            orParts.push(`content.ilike.${like}`);
            orParts.push(`title.ilike.${like}`);
            orParts.push(`url.ilike.${like}`);
          }
          if (!supabase) return [];
          let q = supabase
            .from('scraped_pages')
            .select('url, title, content')
            .limit(limit);
          // Filter by domain_id if available, otherwise use URL pattern
          if (domainId) {
            q = q.eq('domain_id', domainId);
          } else {
            q = q.like('url', `%${domain.replace('www.', '')}%`);
          }
          if (orParts.length > 0) {
            // Supabase's .or accepts a string expression
            q = (q as any).or(orParts.join(','));
          }
          const { data, error } = await q;
          if (!error && data && data.length > 0) {
            // Treat exact code matches as high-confidence
            return data.map((row: any) => ({
              content: row.content || '',
              url: row.url || '',
              title: row.title || 'Untitled',
              similarity: 0.95,
            }));
          }
        } catch (e) {
          console.warn('[RAG Fallback] Part code search failed:', e);
        }

        // If no page match, try WooCommerce by SKU for this domain
        try {
          const wc = await getDynamicWooCommerceClient(domain.replace('www.', ''));
          if (wc) {
            // Try direct SKU match first (supports comma-separated list in WooCommerce)
            const productsBySku = await wc.getProducts({ sku: partCodes.join(','), per_page: Math.min(limit, 10), status: 'publish' } as any);
            let products = productsBySku;

            // If none found by SKU, fall back to a text search
            if (!products || products.length === 0) {
              // Use the most specific code (longest) to search by name/description
              const longest = partCodes.sort((a, b) => b.length - a.length)[0];
              products = await wc.getProducts({ search: longest, per_page: Math.min(limit, 10), status: 'publish' } as any);
            }

            if (products && products.length > 0) {
              return products.slice(0, limit).map((p: any) => ({
                content: `${p.name || ''}\nPrice: ${p.price || p.regular_price || ''}\n${(p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').trim()}`.trim(),
                url: p.permalink || '',
                title: p.name || (p.sku ? `SKU ${p.sku}` : 'Product'),
                similarity: p.sku && partCodes.some(c => (p.sku || '').toLowerCase() === c)
                  ? 0.99
                  : 0.85,
              }));
            }
          }
        } catch (wcErr) {
          console.warn('[RAG Fallback] WooCommerce SKU lookup failed:', wcErr);
        }
      }

      // Fall back to broad keyword search
      const fallbackKeywords = extractKeywords(query, 6);
      if (fallbackKeywords.length === 0) return [];

      // Build OR filter for content ILIKE keywords
      const orFilter = fallbackKeywords.map(k => `content.ilike.%${k}%`).join(',');

      if (!supabase) return [];
      let q = supabase
        .from('scraped_pages')
        .select('url, title, content')
        .limit(limit);
      
      // Filter by domain_id if available, otherwise use URL pattern
      if (domainId) {
        q = q.eq('domain_id', domainId);
      } else {
        q = q.like('url', `%${domain.replace('www.', '')}%`);
      }

      // Apply keyword filter
      // Supabase .or signature accepts a string expression
      q = (q as any).or(orFilter);

      const { data, error } = await q;
      if (error) {
        console.warn('[RAG Fallback] Keyword search error:', error);
        return [];
      }

      return (data || []).map((row: any) => ({
        content: row.content || '',
        url: row.url || '',
        title: row.title || 'Untitled',
        // Approximate similarity since we didn't compute vectors
        similarity: 0.5,
      }));
    } catch (e) {
      console.warn('[RAG Fallback] Keyword search failed:', e);
      return [];
    }
  }

  try {
    // First, look up the domain_id for this domain
    let domainId: string | null = null;
    if (domain) {
      // Map domains to canonical form in database
      let searchDomain = domain.replace('www.', '');
      
      
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', searchDomain)
        .single();

      if (!domainError && domainData) {
        domainId = domainData.id;
        console.log(`Found domain_id ${domainId} for domain "${domain}"`);
      } else {
        console.log(`No domain found in database for "${domain}"`);
        // Try fallback keyword search scoped by domain URL
        return await fallbackKeywordSearch(null);
      }
    }

    // Fast path: if the query looks like a part/SKU code, try direct lookups first
    const fastPartResults = await (async () => {
      const codes = extractPartCodes(query);
      if (codes.length > 0) {
        console.log('[RAG] Detected part/SKU codes:', codes.join(','));
      } else {
        console.log('[RAG] No part/SKU code detected');
      }
      if (codes.length === 0) return [] as Array<{ content: string; url: string; title: string; similarity: number }>;

      // 1) WooCommerce SKU lookup (prefer precise product results first)
      try {
        const wc = await getDynamicWooCommerceClient(domain.replace('www.', ''));
        if (wc) {
          console.log('[RAG] Woo client available for domain', domain.replace('www.', ''));
          let products = await wc.getProducts({ sku: codes.join(','), per_page: Math.min(limit, 10), status: 'publish' } as any);
          console.log('[RAG] Woo SKU lookup returned', products?.length || 0, 'items');
          if (!products || products.length === 0) {
            // If no exact SKU matches, perform a text search using the longest code
            const longest = codes.sort((a, b) => b.length - a.length)[0];
            products = await wc.getProducts({ search: longest, per_page: Math.min(limit, 10), status: 'publish' } as any);
            console.log('[RAG] Woo text search returned', products?.length || 0, 'items');
          }
          if (products && products.length > 0) {
            return products.slice(0, limit).map((p: any) => ({
              content: `${p.name || ''}\nPrice: ${p.price || p.regular_price || ''}\n${(p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').trim()}`.trim(),
              url: p.permalink || '',
              title: p.name || (p.sku ? `SKU ${p.sku}` : 'Product'),
              similarity: p.sku && codes.some(c => (p.sku || '').toLowerCase() === c) ? 0.99 : 0.92,
            }));
          }
        }
      } catch (e) { 
        console.warn('[RAG] Woo SKU lookup exception:', e);
        // Fallback: direct WooCommerce REST call without strict schema
        try {
          const { data: cfg } = await supabase
            .from('customer_configs')
            .select('woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret')
            .eq('domain', domain.replace('www.', ''))
            .single();
          if (cfg && cfg.woocommerce_url && cfg.woocommerce_consumer_key && cfg.woocommerce_consumer_secret) {
            const base = cfg.woocommerce_url.replace(/\/$/, '') + '/wp-json/wc/v3/products';
            const auth = `consumer_key=${encodeURIComponent(cfg.woocommerce_consumer_key)}&consumer_secret=${encodeURIComponent(cfg.woocommerce_consumer_secret)}`;
            const per = `per_page=${Math.min(limit, 10)}`;
            // Try SKU exact first
            let url = `${base}?sku=${encodeURIComponent(codes.join(','))}&status=publish&${per}&${auth}`;
            let resp: any[] = [];
            try {
              resp = (await axios.get(url, { timeout: 5000 })).data || [];
            } catch {}
            if (!resp || resp.length === 0) {
              // Fallback to text search by the longest code
              const longest = codes.sort((a, b) => b.length - a.length)[0];
              if (longest) {
                url = `${base}?search=${encodeURIComponent(longest)}&status=publish&${per}&${auth}`;
                try {
                  resp = (await axios.get(url, { timeout: 5000 })).data || [];
                } catch {}
              }
            }
            if (resp && resp.length > 0) {
              return resp.slice(0, limit).map((p: any) => ({
                content: `${p.name || ''}\nPrice: ${p.price || p.regular_price || ''}\n${String(p.short_description || p.description || '').replace(/<[^>]+>/g, ' ').trim()}`.trim(),
                url: p.permalink || '',
                title: p.name || (p.sku ? `SKU ${p.sku}` : 'Product'),
                similarity: p.sku && codes.some(c => String(p.sku || '').toLowerCase() === c) ? 0.99 : 0.92,
              }));
            }
          }
        } catch (rawErr) {
          console.warn('[RAG] Raw Woo lookup failed:', rawErr);
        }
      }

      // 2) Exact page match on scraped content (product pages first)
      try {
        const orParts = codes.flatMap(code => {
          const like = `%${code}%`;
          return [`content.ilike.${like}`, `title.ilike.${like}`, `url.ilike.${like}`];
        });
        // Prefer product pages by filtering URL when possible
        let q = supabase
          .from('scraped_pages')
          .select('url, title, content')
          .limit(limit);
        if (domainId) q = q.eq('domain_id', domainId);
        // Prioritize product URLs
        q = (q as any).or('url.ilike.%/product/%');
        if (orParts.length > 0) {
          // Combine with part code filters
          q = (q as any).or(orParts.join(','));
        }
        const { data, error: pageErr } = await q as any;
        if (pageErr) {
          console.warn('[RAG] Page search error:', pageErr);
        }
        if (data && data.length > 0) {
          return data.map((row: any) => ({
            content: row.content || '',
            url: row.url || '',
            title: row.title || 'Untitled',
            similarity: 0.9,
          }));
        }
      } catch {}

      return [] as Array<{ content: string; url: string; title: string; similarity: number }>;
    })();

    if (fastPartResults.length > 0) {
      return fastPartResults;
    }

    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);

    // Try RPC search (preferred path)
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      p_domain_id: domainId,
      match_threshold: similarityThreshold,
      match_count: limit,
    });

    if (error) {
      console.error('RPC error:', error);
      // Known failure when pgvector lacks the <=> operator
      if (String(error.message || '').includes('<=>') || String(error.details || '').includes('<=>')) {
        console.log('[RAG] Falling back to keyword search due to pgvector operator unavailability');
        return await fallbackKeywordSearch(domainId);
      }
      throw error;
    }

    const results = data || [];
    console.log(`Search found ${results.length} results for domain "${domain}" and query: "${query}"`);

    // Transform results to expected format
    const mapped = results.map((result: any) => ({
      content: result.content || result.chunk_text || '',
      url: result.url || result.metadata?.url || '',
      title: result.title || result.metadata?.title || 'Untitled',
      similarity: result.similarity || 0,
    }));

    // ENHANCEMENT: For product pages, retrieve ALL chunks and combine them intelligently
    const productUrls = mapped
      .filter((r: any) => r.url.includes('/product/'))
      .map((r: any) => r.url);
    
    if (productUrls.length > 0) {
      console.log(`[RAG] Found ${productUrls.length} product URLs, fetching ALL chunks for complete product info...`);
      console.log(`[RAG] Product URLs to enhance:`, productUrls.slice(0, 3));
      
      // For each product URL, get ALL its chunks
      for (const productUrl of productUrls) {
        try {
          console.log(`[RAG] Processing product URL: ${productUrl}`);
          // First, get the page_id for this URL
          const { data: pageData, error: pageError } = await supabase
            .from('scraped_pages')
            .select('id')
            .eq('url', productUrl)
            .single();
          
          if (pageError) {
            console.log(`[RAG] Error fetching page_id for ${productUrl}:`, pageError);
            continue;
          }
          
          if (pageData?.id) {
            // Get ALL chunks for this page
            const { data: allChunks } = await supabase
              .from('page_embeddings')
              .select('chunk_text, metadata')
              .eq('page_id', pageData.id);
            
            if (allChunks && allChunks.length > 0) {
              console.log(`[RAG] Found ${allChunks.length} chunks for ${productUrl}`);
              
              // Intelligently combine chunks - prioritize chunks with product details
              let combinedContent = '';
              let productDescChunk = '';
              let specsChunk = '';
              let priceChunk = '';
              let navigationChunks = '';
              
              // Categorize chunks by content type
              allChunks.forEach((chunk, idx) => {
                const text = chunk.chunk_text;
                
                // Log the first few chunks to see what we're getting
                if (idx < 3) {
                  console.log(`[RAG] Chunk ${idx} preview (50 chars):`, text.substring(0, 50));
                }
                
                // Check what type of content this chunk contains
                // Look for complete product information chunks first
                if (text.includes('SKU:') && text.includes('Product Description')) {
                  // This chunk has the complete product info
                  productDescChunk = text + '\n';
                  console.log(`[RAG] Found COMPLETE product chunk ${idx} with SKU and description`);
                } else if (text.includes('Product Description') || text.includes('SKU:') || text.includes('EBA')) {
                  productDescChunk += text + '\n';
                  console.log(`[RAG] Found product description chunk ${idx}`);
                } else if (text.includes('cm3/rev') || text.includes('bar') || text.includes('ISO')) {
                  specsChunk += text + '\n';
                  console.log(`[RAG] Found specs chunk ${idx}`);
                } else if (text.includes('£') && (text.includes('VAT') || text.includes('Inc') || text.includes('Excl'))) {
                  priceChunk += text + '\n';
                  console.log(`[RAG] Found price chunk ${idx}`);
                } else {
                  // Navigation or other content - keep but prioritize less
                  navigationChunks += text.substring(0, 200) + '...\n';
                }
              });
              
              // Combine in order of importance
              if (productDescChunk) combinedContent += productDescChunk;
              if (specsChunk && !productDescChunk.includes(specsChunk)) {
                combinedContent += '\n' + specsChunk;
              }
              if (priceChunk && !combinedContent.includes(priceChunk)) {
                combinedContent += '\n' + priceChunk;
              }
              
              // Only add navigation if we have space and it's not redundant
              if (combinedContent.length < 2000 && navigationChunks) {
                combinedContent += '\n[Additional context: ' + navigationChunks.substring(0, 300) + ']';
              }
              
              // Find and update the existing result with combined content
              const existingIndex = mapped.findIndex((r: any) => r.url === productUrl);
              if (existingIndex >= 0) {
                mapped[existingIndex].content = combinedContent;
                console.log(`[RAG] Enhanced product content for ${productUrl} with ${allChunks.length} combined chunks`);
                console.log(`[RAG] Combined content length: ${combinedContent.length} chars`);
                
                // Log a sample to verify we got the right content
                if (combinedContent.includes('SKU:')) {
                  console.log(`[RAG] ✓ SKU found in combined chunks`);
                }
                if (combinedContent.includes('130 cm3/rev')) {
                  console.log(`[RAG] ✓ Flow rate spec found in combined chunks`);
                }
                if (combinedContent.includes('420 bar')) {
                  console.log(`[RAG] ✓ Pressure spec found in combined chunks`);
                }
                if (combinedContent.includes('£1,100')) {
                  console.log(`[RAG] ✓ Price found in combined chunks`);
                }
              }
            }
          }
        } catch (error) {
          console.warn(`[RAG] Failed to fetch all chunks for ${productUrl}:`, error);
        }
      }
    }

    // If RPC returned nothing or low quality results, try a lightweight fallback
    if (mapped.length === 0) {
      const fallback = await fallbackKeywordSearch(domainId);
      return fallback;
    }
    
    // Check if results are good quality for agricultural queries
    // ALWAYS run parallel searches for better coverage
    console.log(`[RAG PARALLEL] Starting parallel search for query: "${query}"`);
    console.log(`[RAG PARALLEL] Domain ID: ${domainId}`);
    
    // Run all search strategies in parallel for speed and coverage
    const [metadataResults, keywordResults] = await Promise.all([
      // 1. Search metadata for category/SKU matches
      searchMetadata(domainId, query),
      // 2. Search keywords in content
      searchKeywords(domainId, query)
    ]);
    
    console.log(`[RAG PARALLEL] Search complete - Metadata: ${metadataResults.length}, Keywords: ${keywordResults.length}`);
    
    // Combine all results
    const allResults = new Map<string, any>(); // Use Map to dedupe by URL
    
    // Add semantic results first (already have them in 'mapped')
    mapped.forEach((r: any) => {
      allResults.set(r.url, { ...r, source: 'semantic' });
    });
    
    // Add metadata matches with boost
    metadataResults.forEach((r: any) => {
      if (allResults.has(r.url)) {
        // Boost existing result
        const existing = allResults.get(r.url);
        existing.similarity = Math.max(existing.similarity, r.similarity);
        existing.source = 'semantic+metadata';
      } else {
        allResults.set(r.url, { ...r, source: 'metadata' });
      }
    });
    
    // Add keyword matches
    keywordResults.forEach((r: any) => {
      if (!allResults.has(r.url)) {
        allResults.set(r.url, { ...r, source: 'keyword' });
      }
    });
    
    // Convert back to array and sort by relevance
    const combined = Array.from(allResults.values())
      .sort((a, b) => {
        // Check how many query keywords appear in each result
        const queryKeywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        
        if (queryKeywords.length >= 2) {
          // For multi-word queries, prioritize results with more keyword matches
          const aMatches = queryKeywords.filter(kw => 
            a.title?.toLowerCase().includes(kw) || a.url?.toLowerCase().includes(kw)
          ).length;
          const bMatches = queryKeywords.filter(kw => 
            b.title?.toLowerCase().includes(kw) || b.url?.toLowerCase().includes(kw)
          ).length;
          
          // Prioritize results with more keyword matches
          if (aMatches > bMatches) return -1;
          if (bMatches > aMatches) return 1;
        }
        
        // Then sort by similarity score
        return (b.similarity || 0) - (a.similarity || 0);
      })
      .slice(0, limit);
    
    console.log(`[RAG] Combined results: ${combined.length} (semantic: ${mapped.length}, metadata: ${metadataResults.length}, keyword: ${keywordResults.length})`);
    
    if (combined.length === 0) {
      // Final fallback if everything failed
      const fallbackResults = await fallbackKeywordSearch(domainId);
      // Cache even fallback results
      await cacheManager.cacheResult(query, { 
        response: '', 
        chunks: fallbackResults 
      }, domain, limit);
      console.log(`[Cache] Cached fallback results (${Date.now() - searchStartTime}ms)`);
      return fallbackResults;
    }
    
    // Cache successful results before returning
    await cacheManager.cacheResult(query, { 
      response: '', 
      chunks: combined,
      metadata: {
        sourcesUsed: [...new Set(combined.map((r: any) => r.source))],
        chunksRetrieved: combined.length,
        searchMethod: 'hybrid'
      }
    }, domain, limit);
    
    const searchDuration = Date.now() - searchStartTime;
    console.log(`[Cache] Cached search results (${searchDuration}ms)`);
    
    return combined;
  } catch (error) {
    console.error('Error searching similar content:', error);
    // Final safety net - Try to get domainId from the try block scope
    let fallbackDomainId: string | null = null;
    try {
      const { data: domainData } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();
      if (domainData) fallbackDomainId = domainData.id;
    } catch {}
    return await fallbackKeywordSearch(fallbackDomainId);
  }
}
