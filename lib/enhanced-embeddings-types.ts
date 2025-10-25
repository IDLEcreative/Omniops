/**
 * Type definitions and constants for Enhanced Embeddings Service
 */

// Constants for chunk retrieval configuration
export const DEFAULT_CHUNKS = 20; // Increased from 10 for better recall
export const MAX_CHUNKS = 25;     // Maximum chunks to retrieve (increased from 15)
export const MIN_CHUNKS = 15;     // Minimum chunks for good context (increased from 8)
export const MAX_TOKENS = 12000;  // Leave room for response
export const DEFAULT_SIMILARITY_THRESHOLD = 0.15; // Lowered from 0.45 to 0.15 for maximum recall

/**
 * Represents a search result chunk from the database
 */
export interface ChunkResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
  page_id?: string;
  chunk_index?: number;
  chunk_position?: number;
  metadata?: any;
  priority?: number;
}

/**
 * Options for configuring enhanced search behavior
 */
export interface EnhancedSearchOptions {
  minChunks?: number;
  maxChunks?: number;
  similarityThreshold?: number;
  prioritizeFirst?: boolean;
  includeMetadata?: boolean;
  groupByPage?: boolean;
}

/**
 * Result structure from enhanced search
 */
export interface EnhancedSearchResult {
  chunks: ChunkResult[];
  groupedContext: Map<string, PageGroup>;
  totalRetrieved: number;
  averageSimilarity: number;
}

/**
 * Grouped chunks by page for better context
 */
export interface PageGroup {
  url: string;
  title: string;
  chunks: ChunkResult[];
  maxSimilarity: number;
  metadata?: any;
}

/**
 * Statistics about context window usage
 */
export interface ContextStats {
  totalChunks: number;
  totalTokens: number;
  averageSimilarity: number;
  highQualityChunks: number;
  pagesRepresented: number;
}

/**
 * Standard search result format for API compatibility
 */
export interface SearchResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
}
