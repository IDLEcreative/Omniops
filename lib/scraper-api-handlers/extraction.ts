/**
 * Content extraction utilities
 */

import { ContentExtractor, ExtractedContent } from '../content-extractor';
import { EcommerceExtractor, EcommerceExtractedContent } from '../ecommerce-extractor';

/**
 * Extract content from page HTML
 */
export async function extractPageContent(
  html: string,
  url: string,
  config: any,
  finalConfig: any
): Promise<ExtractedContent | EcommerceExtractedContent> {
  let extracted: ExtractedContent | EcommerceExtractedContent;

  if (config?.ecommerceMode !== false) {
    // Try e-commerce extraction first
    extracted = await EcommerceExtractor.extractEcommerce(html, url);

    // If no e-commerce platform detected, fall back to regular extraction
    if (!(extracted as EcommerceExtractedContent).platform) {
      extracted = ContentExtractor.extractWithReadability(html, url);
    } else {
      console.log(`[SCRAPER] E-commerce platform detected: ${(extracted as EcommerceExtractedContent).platform}`);
    }
  } else {
    extracted = ContentExtractor.extractWithReadability(html, url);
  }

  console.log(`[SCRAPER] Content extracted:`, {
    wordCount: extracted.wordCount,
    title: extracted.title,
    hasImages: extracted.images?.length > 0,
    imageCount: extracted.images?.length || 0,
    contentLength: extracted.content?.length || 0
  });

  return extracted;
}
