/**
 * Content Extractor - AI-optimized header for fast comprehension
 *
 * @purpose Proxy file for backward compatibility - re-exports modular content extraction implementation
 *
 * @flow
 *   1. Import request → Re-export from ./content-extractor/index
 *   2. → ContentExtractor class and all extraction utilities
 *
 * @exports
 *   - ContentExtractor class: Main extractor using Crawlee + Playwright + Readability
 *   - All utilities from ./content-extractor/index (extractContent, extractStructuredData, etc.)
 *
 * @modularStructure
 *   - content-extractor/index.ts: Main ContentExtractor class implementation
 *   - content-extractor/html-processor.ts: HTML cleaning, Readability parsing
 *   - content-extractor/structured-extractor.ts: FAQ, product, contact extraction
 *
 * @consumers
 *   - app/api/scrape/route.ts: Uses ContentExtractor for web scraping
 *   - lib/crawler-config.ts: Configures extraction settings
 *   - Tests: Import ContentExtractor for scraping validation
 *
 * @totalLines 10
 * @estimatedTokens 200 (without header), 120 (with header - 40% savings)
 */

export * from './content-extractor/index';
export { ContentExtractor } from './content-extractor/index';
