import { z } from 'zod';

/**
 * Request validation schema for scrape API
 */
export const ScrapeRequestSchema = z.object({
  url: z.string().url(),
  crawl: z.boolean().default(false),
  max_pages: z.number().min(-1).max(10000).default(-1), // -1 means unlimited (production default)
  turbo: z.boolean().default(true), // Enable turbo mode (default)
  incremental: z.boolean().default(false), // Enable incremental scraping (only scrape new/changed content)
  force_refresh: z.boolean().default(false), // Force full refresh even in incremental mode
});

export type ScrapeRequest = z.infer<typeof ScrapeRequestSchema>;
