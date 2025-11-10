/**
 * Demo Scraper - Re-export from modular implementation
 * This file maintained for backward compatibility
 */

export type {
  ScrapedPage,
  QuickScrapeOptions,
  QuickScrapeResult,
  ChunkMetadata,
  DemoEmbeddingsResult
} from './demo-scraper/types';

export { quickScrape, generateDemoEmbeddings } from './demo-scraper/index';
