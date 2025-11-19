/**
 * Process training data to generate embeddings asynchronously
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';

/**
 * Process training data to generate embeddings asynchronously
 */
export async function processTrainingDataAsync(
  trainingId: string,
  content: string,
  metadata: any,
  supabase: SupabaseClient,
  domain: string
): Promise<void> {
  try {
    // Update status to processing
    await supabase
      .from('training_data')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);

    // Import embedding functions dynamically to avoid circular dependencies
    const { splitIntoChunks, generateEmbeddingVectors } = await import('@/lib/embeddings');

    // Split content into chunks (similar to web scraping)
    const chunks = splitIntoChunks(content);

    // Generate embedding vectors for each chunk
    const embeddings = await generateEmbeddingVectors(chunks);

    // Store embeddings in the database
    const embeddingRecords = embeddings.map((embedding: number[], index: number) => ({
      page_id: trainingId, // Use training ID as page reference
      chunk_index: index,
      chunk_text: chunks[index],
      embedding: embedding,
      metadata: {
        ...metadata,
        source: 'training_data',
        domain: domain,
        training_id: trainingId
      }
    }));

    if (embeddingRecords.length > 0) {
      const { error: embedError } = await supabase
        .from('page_embeddings')
        .insert(embeddingRecords);

      if (embedError) {
        throw embedError;
      }
    }

    // Update training data status to completed
    await supabase
      .from('training_data')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString(),
        embedding_count: embeddingRecords.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);

    logger.info('Training data processed successfully', {
      trainingId,
      chunkCount: chunks.length,
      embeddingCount: embeddingRecords.length
    });

  } catch (error) {
    logger.error('Failed to process training data', error, { trainingId });

    // Update status to failed
    await supabase
      .from('training_data')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Processing failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', trainingId);
  }
}
