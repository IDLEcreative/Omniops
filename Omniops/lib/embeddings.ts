import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
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
    
    // Prepare data for insertion
    const embeddingRecords = chunks.map((chunk, index) => ({
      content_id: params.contentId,
      chunk_text: chunk,
      embedding: embeddings[index],
      metadata: {
        chunk_index: index,
        total_chunks: chunks.length,
        url: params.url,
        title: params.title,
      },
    }));
    
    // Store embeddings
    const { error } = await supabase
      .from('content_embeddings')
      .insert(embeddingRecords);
    
    if (error) throw error;
    
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
  
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateQueryEmbedding(query);
    
    // Search for similar content
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      similarity_threshold: similarityThreshold,
      match_count: limit
    });
    
    if (error) {
      console.error('RPC error:', error);
      throw error;
    }
    
    // Filter results by domain if specified
    let filteredData = data || [];
    if (domain && filteredData.length > 0) {
      // Filter results to only include URLs from the specified domain
      filteredData = filteredData.filter((result: any) => {
        if (result.url) {
          try {
            const url = new URL(result.url);
            const resultDomain = url.hostname.replace('www.', '');
            const targetDomain = domain.replace('www.', '');
            return resultDomain === targetDomain;
          } catch {
            return false;
          }
        }
        return false;
      });
      
      console.log(`Filtered ${data?.length || 0} results to ${filteredData.length} for domain "${domain}"`);
    }
    
    console.log(`Search found ${filteredData.length} results for domain "${domain}" and query: "${query}"`);
    
    // If no results found for the specific domain, return empty array
    // This prevents generic responses when domain has no content
    if (filteredData.length === 0) {
      console.log(`No embeddings found for domain: ${domain}`);
      return [];
    }
    
    return filteredData;
  } catch (error) {
    console.error('Error searching similar content:', error);
    throw error;
  }
}