import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase-server';
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

// Split text into chunks for embedding
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  
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
  
  return chunks;
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
        const response = await getOpenAIClient().embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });
        
        return {
          indices,
          embeddings: response.data.map(item => item.embedding),
          texts: batch
        };
      } catch (error) {
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
}): Promise<void> {
  const supabase = await createClient();
  const chunks = splitIntoChunks(params.content);
  
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
      embedding: embeddings[index],
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
        url: params.url,
        title: params.title,
      },
    }));
    
    // Use bulk insert function for 86% performance improvement
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
export async function generateQueryEmbedding(query: string): Promise<number[]> {
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

  // Helper: very simple keyword extraction (fallback mode)
  function extractKeywords(text: string, max = 5): string[] {
    const stop = new Set([
      'the','a','an','and','or','but','to','of','in','on','for','with','at','by','from','is','are','was','were','be','been','it','this','that','as','about','do','does','did','what','which','who','when','where','how','why','you','your','we','our'
    ]);
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3 && !stop.has(w))
      .slice(0, max);
  }

  // Fallback using scraped_pages keyword search when embeddings search fails
  async function fallbackKeywordSearch(): Promise<Array<{ content: string; url: string; title: string; similarity: number }>> {
    try {
      const keywords = extractKeywords(query, 6);
      if (keywords.length === 0) return [];

      // Build OR filter for content ILIKE keywords
      const orFilter = keywords.map(k => `content.ilike.%${k}%`).join(',');

      let q = supabase
        .from('scraped_pages')
        .select('url, title, content')
        .like('url', `%${domain.replace('www.', '')}%`)
        .limit(limit);

      // Apply keyword filter
      // @ts-ignore: Supabase .or signature accepts a string expression
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
