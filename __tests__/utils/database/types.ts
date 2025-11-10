/**
 * Database Cleanup Types
 * Shared types for database cleanup operations
 */

export interface CleanupOptions {
  domain?: string;
  includeJobs?: boolean;
  includeCache?: boolean;
  preserveConfigs?: boolean;
  dryRun?: boolean;
}

export interface CleanupResult {
  success: boolean;
  deletedCounts: {
    pages?: number;
    content?: number;
    embeddings?: number;
    extractions?: number;
    jobs?: number;
    cache?: number;
    conversations?: number;
    messages?: number;
  };
  error?: string;
}

export interface DatabaseStats {
  scraped_pages: number;
  website_content: number;
  embeddings: number;
  structured_extractions: number;
  scrape_jobs?: number;
  query_cache?: number;
  conversations?: number;
  messages?: number;
  domain?: string;
}
