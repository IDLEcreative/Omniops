import { OwnSiteDetector } from './own-site-detector';
import { URLDeduplicator } from './url-deduplicator';
import { SmartRequestInterceptor } from './smart-request-interceptor';
import { BrowserContextPool } from './browser-context-pool';

// Re-export types
export type {
  AIOptimizationConfig,
  SemanticChunk,
  AIMetadata,
  AIOptimizedResult,
  ScrapedPage,
  CrawlJob,
  MemoryStats
} from './scraper-api-types';

export { ScrapedPageSchema, CrawlJobSchema } from './scraper-api-types';

// Re-export AI services
export { AIContentExtractor, DeduplicationService } from './scraper-api-ai';

// Re-export core scraping function
export { scrapePage } from './scraper-api-core';

// Re-export crawl function
export { crawlWebsite } from './scraper-api-crawl';

// Re-export utility functions
export {
  createAIOptimizationConfig,
  isAIOptimizedResult,
  convertToStandardResult,
  getOptimizationMetrics,
  clearAIOptimizationCache,
  applyAIOptimizationPreset,
  getHealthStatus,
  getAIOptimizationMetrics,
  resetAIOptimizationMetrics,
  cleanupOldJobs,
  checkCrawlStatus,
  streamCrawlResults,
  resumeCrawl
} from './scraper-api-utils';

// Initialize performance optimizers
const urlDeduplicator = new URLDeduplicator(10000);
const requestInterceptor = new SmartRequestInterceptor(SmartRequestInterceptor.createConfig('balanced'));
const browserPool = new BrowserContextPool();

// Initialize own-site detector
OwnSiteDetector.loadFromEnvironment();

// Export types and utilities
export type { CrawlerConfig } from './crawler-config';
export { crawlerPresets } from './crawler-config';

// Configure owned domains
export function configureOwnedDomains(domains: string[]) {
  domains.forEach(domain => OwnSiteDetector.addOwnedDomain(domain));
}

// Check if a URL is an owned site
export async function isOwnedSite(url: string): Promise<boolean> {
  return OwnSiteDetector.isOwnSite(url);
}
