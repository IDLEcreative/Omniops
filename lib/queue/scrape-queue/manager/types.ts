/**
 * Scrape queue manager types
 */

export interface JobOptions {
  priority?: number;
  delay?: number;
  jobId?: string;
  deduplicate?: boolean;
}

export interface CleanupResult {
  cleanedJobIds: string[];
}
