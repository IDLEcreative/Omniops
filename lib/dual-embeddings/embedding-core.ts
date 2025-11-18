/**
 * Embedding Core
 * Core embedding generation using OpenAI
 */

import OpenAI from 'openai';
import { createServiceRoleClient } from '../supabase-server';
import type { DualEmbeddingResult } from './types';

export async function generateSingleEmbedding(openai: OpenAI, content: string): Promise<number[]> {
  if (!content || content.length === 0) {
    return new Array(1536).fill(0);
  }

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: content,
    });

    return response.data[0]?.embedding || new Array(1536).fill(0);
  } catch (error) {
    console.error('Error generating embedding:', error);
    return new Array(1536).fill(0);
  }
}

export async function storeDualEmbeddings(
  pageId: string,
  chunks: string[],
  embeddings: DualEmbeddingResult[],
  metadata: any
): Promise<void> {
  const supabase = await createServiceRoleClient();

  if (!supabase) {
    throw new Error('Failed to create Supabase client');
  }

  const records = chunks.map((chunk, index) => ({
    page_id: pageId,
    chunk_text: chunk,
    embedding: embeddings[index]?.textEmbedding || new Array(1536).fill(0),
    metadata_embedding: embeddings[index]?.metadataEmbedding || new Array(1536).fill(0),
    embedding_type: 'dual',
    embedding_version: 2,
    metadata: {
      ...(metadata || {}),
      chunk_index: index,
      total_chunks: chunks.length,
      has_metadata_embedding: embeddings[index]?.quality?.hasStructuredData || false,
      metadata_score: embeddings[index]?.quality?.metadataScore || 0,
      recommended_weights: embeddings[index]?.quality?.recommendedWeights || { text: 0.6, metadata: 0.4 }
    }
  }));

  await supabase.from('page_embeddings').delete().eq('page_id', pageId);

  const { error } = await supabase.from('page_embeddings').insert(records);

  if (error) {
    console.error('Error storing dual embeddings:', error);
    throw error;
  }

}
