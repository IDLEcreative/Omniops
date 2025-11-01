/**
 * Type definitions for embeddings system
 */

export interface SearchResult {
  content: string;
  url: string;
  title: string;
  similarity: number;
  searchMethod?: 'keyword' | 'vector';
}

export interface CachedSearchResult {
  response: string;
  chunks: SearchResult[];
  metadata?: {
    searchMethod?: string;
    chunksRetrieved?: number;
  };
}

export interface QueryTimerOptions {
  name: string;
  timeoutMs?: number;
}
