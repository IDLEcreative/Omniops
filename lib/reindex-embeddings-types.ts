/**
 * Type definitions for the embedding reindex system
 *
 * This module contains all interfaces, types, and constants
 * used throughout the reindexing process.
 */

// Configuration constants
export const CHUNK_SIZE = 1500; // Target chunk size
export const BATCH_SIZE = 10; // Pages per batch
export const EMBEDDING_BATCH_SIZE = 50; // Embeddings per API batch
export const PAGE_FETCH_LIMIT = 500; // Pages to fetch per query
export const EMBEDDING_DELETE_BATCH_SIZE = 100; // Embeddings to delete per batch
export const MIN_CHUNK_SIZE = 100; // Minimum viable chunk size
export const MIN_SENTENCE_LENGTH = 20; // Minimum sentence length
export const VALIDATION_SAMPLE_SIZE = 100; // Samples for validation
export const MAX_CONTAMINATION_RATE = 0.05; // 5% max contamination
export const RATE_LIMIT_DELAY_MS = 100; // Delay between batches

export interface ReindexOptions {
  domainId?: string;
  chunkSize?: number;
  clearExisting?: boolean;
  validateResults?: boolean;
  dryRun?: boolean;
  onProgress?: (progress: ReindexProgress) => void;
}

export interface ReindexProgress {
  phase: 'clearing' | 'chunking' | 'embedding' | 'validating' | 'complete';
  current: number;
  total: number;
  percentage: number;
  message: string;
  errors?: string[];
}

export interface ReindexResult {
  success: boolean;
  pagesProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  averageChunkSize: number;
  maxChunkSize: number;
  errors: string[];
  duration: number;
}

export interface PageData {
  id: string;
  url: string;
  title: string | null;
  text_content: string | null;
  content: string | null;
  domain_id: string;
  scraped_at: string;
}

export interface EmbeddingMetadata {
  chunk_index: number;
  total_chunks: number;
  chunk_size: number;
  url: string;
  title: string;
  reindexed: boolean;
  reindex_date: string;
  version: number;
}

export interface EmbeddingRecord {
  page_id: string;
  domain_id: string;
  chunk_text: string;
  embedding: number[];
  metadata: EmbeddingMetadata;
}

export interface ValidationSample {
  chunk_text: string;
  metadata: EmbeddingMetadata;
}

export interface ChunkStatistics {
  sizes: number[];
  totalChunks: number;
  averageSize: number;
  maxSize: number;
}
