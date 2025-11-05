/**
 * Shared embedding functions for the application
 * This module provides the core embedding generation functionality
 * that was previously missing from exports
 */

import OpenAI from 'openai';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { embeddingCache } from '@/lib/embedding-cache';

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

/**
 * Split content into chunks for embedding generation
 * @param text The text to split into chunks
 * @param maxChunkSize Maximum size of each chunk in characters
 * @returns Array of text chunks
 */
export function splitIntoChunks(text: string, maxChunkSize: number = 1000): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    if (!trimmedSentence) continue;

    // If adding this sentence would exceed the limit, save current chunk and start new one
    if (currentChunk.length > 0 && currentChunk.length + trimmedSentence.length + 1 > maxChunkSize) {
      chunks.push(currentChunk.trim());
      currentChunk = trimmedSentence;
    } else {
      // Add sentence to current chunk
      currentChunk = currentChunk ? `${currentChunk}. ${trimmedSentence}` : trimmedSentence;
    }
  }

  // Add any remaining content
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate embedding vectors for multiple text chunks with caching
 * @param chunks Array of text chunks
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingVectors(chunks: string[]): Promise<number[][]> {
  if (!chunks || chunks.length === 0) {
    return [];
  }

  try {
    // Check cache for all chunks
    const { cached, missing } = embeddingCache.getMultiple(chunks);

    // If all chunks are cached, return immediately
    if (missing.length === 0) {
      console.log(`[Performance] All ${chunks.length} embeddings from cache`);
      const results: number[][] = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = cached.get(i);
        if (embedding) {
          results.push(embedding);
        }
      }
      return results;
    }

    // Generate embeddings only for missing chunks
    const missingChunks = missing.map(index => chunks[index]);
    console.log(`[Performance] Generating ${missingChunks.length}/${chunks.length} embeddings (${cached.size} from cache)`);

    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: missingChunks,
    });

    const newEmbeddings = response.data.map(item => item.embedding);

    // Cache the new embeddings
    embeddingCache.setMultiple(missingChunks, newEmbeddings);

    // Combine cached and new embeddings in correct order
    const results: number[][] = [];
    let newEmbeddingIndex = 0;
    for (let i = 0; i < chunks.length; i++) {
      if (cached.has(i)) {
        results.push(cached.get(i)!);
      } else {
        results.push(newEmbeddings[newEmbeddingIndex++]);
      }
    }

    return results;
  } catch (error) {
    console.error('Error generating embedding vectors:', error);
    throw error;
  }
}

/**
 * Generate embeddings for content and store them in the database
 * @param params Parameters for embedding generation
 */
export async function generateEmbeddings(params: {
  contentId: string;
  content: string;
  url: string;
  title: string;
  domain?: string;
}): Promise<void> {
  const { contentId, content, url, title, domain } = params;

  if (!content || content.trim().length === 0) {
    console.warn('No content to generate embeddings for', url);
    return;
  }

  const chunks = splitIntoChunks(content);
  
  if (chunks.length === 0) {
    console.warn('No chunks to embed for', url);
    return;
  }

  try {
    const embeddings = await generateEmbeddingVectors(chunks);
    const supabase = await createServiceRoleClient();
    
    if (!supabase) {
      throw new Error('Failed to create Supabase client');
    }

    // Prepare embedding records
    const embeddingRecords = chunks.map((chunk, index) => ({
      page_id: contentId,
      chunk_text: chunk,
      embedding: embeddings[index],
      metadata: {
        url,
        title,
        domain,
        chunk_index: index,
        total_chunks: chunks.length,
        chunk_size: chunk.length,
      }
    }));

    // Try bulk insert first
    const { error } = await supabase.rpc('bulk_insert_embeddings', {
      embeddings: embeddingRecords
    });

    if (error) {
      // Fallback to regular insert if bulk function fails
      console.warn('Bulk insert failed, falling back to regular insert:', error);
      const { error: fallbackError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);
      
      if (fallbackError) {
        throw fallbackError;
      }
    }

    console.log(`Successfully stored ${chunks.length} embeddings for ${url}`);
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}