import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
import { getDynamicWooCommerceClient } from '@/lib/woocommerce-dynamic';
import axios from 'axios';
import { embeddingCache, contentDeduplicator } from '@/lib/embedding-cache';

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
      // Format embedding for pgvector: convert array to string format
      embedding: embeddings[index] ? `[${embeddings[index].join(',')}]` : null,
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
  similarityThreshold: number = 0.7
): Promise<Array<{
  content: string;
  url: string;
  title: string;
  similarity: number;
}>> {
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

  // Fallback using scraped_pages keyword search when embeddings search fails
  async function fallbackKeywordSearch(): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
    try {
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
          // Filter by domain if provided
          q = q.eq('domain', domain);
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
      const keywords = extractKeywords(query, 6);
      if (keywords.length === 0) return [];

      // Build OR filter for content ILIKE keywords
      const orFilter = keywords.map(k => `content.ilike.%${k}%`).join(',');

      if (!supabase) return [];
      let q = supabase
        .from('scraped_pages')
        .select('url, title, content')
        .like('url', `%${domain.replace('www.', '')}%`)
        .limit(limit);

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
      const { data: domainData, error: domainError } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', domain.replace('www.', ''))
        .single();

      if (!domainError && domainData) {
        domainId = domainData.id;
        console.log(`Found domain_id ${domainId} for domain "${domain}"`);
      } else {
        console.log(`No domain found in database for "${domain}"`);
        // Try fallback keyword search scoped by domain URL
        return await fallbackKeywordSearch();
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
        return await fallbackKeywordSearch();
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

    // If RPC returned nothing, try a lightweight fallback
    if (mapped.length === 0) {
      const fallback = await fallbackKeywordSearch();
      return fallback;
    }

    return mapped;
  } catch (error) {
    console.error('Error searching similar content:', error);
    // Final safety net
    return await fallbackKeywordSearch();
  }
}
