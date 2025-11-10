/**
 * Demo Scraper - Type Definitions
 */

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  contentLength: number;
}

export interface QuickScrapeOptions {
  maxPages: number;
  timeout: number;
  useSitemap: boolean;
}

export interface QuickScrapeResult {
  pages: ScrapedPage[];
  totalPages: number;
  scrapeDuration: number;
  error?: string;
}

export interface ChunkMetadata {
  url: string;
  title: string;
  chunkIndex: number;
}

export interface DemoEmbeddingsResult {
  chunks: string[];
  embeddings: number[][];
  metadata: ChunkMetadata[];
}
