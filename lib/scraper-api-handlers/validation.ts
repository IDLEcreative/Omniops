/**
 * Content validation utilities
 */

import { ContentExtractor, ExtractedContent } from '../content-extractor';
import { EcommerceExtractedContent } from '../ecommerce-extractor';

/**
 * Validate page size against limits
 */
export function validatePageSize(html: string, finalConfig: any): void {
  const pageSizeBytes = new TextEncoder().encode(html).length;
  const pageSizeMB = pageSizeBytes / (1024 * 1024);
  console.log(`[SCRAPER] Page size: ${pageSizeMB.toFixed(2)}MB (limit: ${finalConfig.content.maxPageSizeMB}MB)`);

  if (pageSizeMB > finalConfig.content.maxPageSizeMB) {
    const error = `Page too large: ${pageSizeMB.toFixed(2)}MB exceeds limit of ${finalConfig.content.maxPageSizeMB}MB`;
    console.error(`[SCRAPER] ${error}`);
    throw new Error(error);
  }
}

/**
 * Validate extracted content meets requirements
 */
export function validateExtractedContent(
  extracted: ExtractedContent | EcommerceExtractedContent,
  finalConfig: any
): void {
  const isProductPage = (extracted as EcommerceExtractedContent).pageType === 'product';

  if (!isProductPage && extracted.wordCount < finalConfig.content.minWordCount) {
    const error = `Insufficient content: ${extracted.wordCount} words < ${finalConfig.content.minWordCount} minimum`;
    console.error(`[SCRAPER] ${error}`);
    throw new Error(error);
  }

  if (!isProductPage && !ContentExtractor.isValidContent(extracted)) {
    const error = 'Invalid or error page content detected';
    console.error(`[SCRAPER] ${error} - page might be an error page, login page, or have insufficient content`);
    throw new Error(error);
  }
}
