import OpenAI from 'openai';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

// Generate embeddings for text chunks with parallel processing
export async function generateEmbeddingVectors(chunks: string[]): Promise<number[][]> {
  const batchSize = 20; // Max items per API call
  const concurrentBatches = 3; // Process 3 batches concurrently
  const embeddings: number[][] = new Array(chunks.length);
  
  // Create batches
  const batches: { startIdx: number; batch: string[] }[] = [];
  for (let i = 0; i < chunks.length; i += batchSize) {
    batches.push({
      startIdx: i,
      batch: chunks.slice(i, Math.min(i + batchSize, chunks.length))
    });
  }
  
  // Process batches in parallel with controlled concurrency
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const currentBatches = batches.slice(i, i + concurrentBatches);
    
    // Process current set of batches in parallel
    const batchPromises = currentBatches.map(async ({ startIdx, batch }) => {
      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });
        
        return {
          startIdx,
          embeddings: response.data.map(item => item.embedding)
        };
      } catch (error) {
        console.error(`Error generating embeddings for batch starting at ${startIdx}:`, error);
        // Retry once on failure
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: batch,
          });
          return {
            startIdx,
            embeddings: response.data.map(item => item.embedding)
          };
        } catch (retryError) {
          console.error(`Retry failed for batch starting at ${startIdx}:`, retryError);
          throw retryError;
        }
      }
    });
    
    // Wait for all current batches to complete
    const results = await Promise.all(batchPromises);
    
    // Place embeddings in correct positions
    for (const result of results) {
      for (let j = 0; j < result.embeddings.length; j++) {
        const embedding = result.embeddings[j];
        if (embedding) {
          embeddings[result.startIdx + j] = embedding;
        }
      }
    }
    
    // Add small delay between batch groups to respect rate limits
    if (i + concurrentBatches < batches.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
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

// Generate a single embedding for a query
export async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
    });
    
    const embedding = response.data[0]?.embedding;
    if (!embedding) {
      throw new Error('No embedding returned from OpenAI API');
    }
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
    // Using the correct parameter names as expected by the database function
    const { data, error } = await supabase.rpc('search_embeddings', {
      query_embedding: queryEmbedding,
      similarity_threshold: similarityThreshold,
      match_count: limit
      // p_domain_id is optional - omitting it searches all embeddings
    });
    
    if (error) {
      console.error('RPC error:', error);
      throw error;
    }
    
    console.log(`Search found ${data?.length || 0} results for query: "${query}"`);
    return data || [];
  } catch (error) {
    console.error('Error searching similar content:', error);
    throw error;
  }
}