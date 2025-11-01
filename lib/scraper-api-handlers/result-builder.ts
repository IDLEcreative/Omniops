/**
 * Result building utilities
 */

import { ExtractedContent } from '../content-extractor';
import { EcommerceExtractedContent } from '../ecommerce-extractor';
import { ScrapedPage, AIOptimizedResult } from '../scraper-api-types';
import { applyAIOptimization } from './ai-optimizer';

/**
 * Build final result object
 */
export async function buildResult(
  extracted: ExtractedContent | EcommerceExtractedContent,
  url: string,
  config: any,
  responseTime: number,
  scrapeStartTime: number
): Promise<ScrapedPage | AIOptimizedResult> {
  const ecommerceData = extracted as EcommerceExtractedContent;

  // Apply AI optimization if enabled
  const aiOptimization = config?.aiOptimization;
  let aiOptimizedData: any = null;

  if (aiOptimization?.enabled) {
    aiOptimizedData = await applyAIOptimization(extracted, url, aiOptimization);
  }

  const result: ScrapedPage | AIOptimizedResult = {
    url: url,
    title: extracted.title,
    content: extracted.content,
    textContent: extracted.textContent,
    excerpt: extracted.excerpt,
    contentHash: extracted.contentHash,
    wordCount: extracted.wordCount,
    images: extracted.images,
    metadata: {
      ...extracted.metadata,
      author: extracted.author,
      publishedDate: extracted.publishedDate,
      modifiedDate: extracted.modifiedDate,
      lang: extracted.lang,
      readingTime: extracted.readingTime,
      extractedAt: new Date().toISOString(),
      responseTimeMs: responseTime,
      platform: ecommerceData.platform,
      pageType: ecommerceData.pageType,
      products: ecommerceData.products,
      pagination: ecommerceData.pagination,
      breadcrumbs: ecommerceData.breadcrumbs,
      aiOptimizationLevel: aiOptimization?.level,
      aiOptimizationEnabled: aiOptimization?.enabled || false,
    },
    ...aiOptimizedData
  } as ScrapedPage | AIOptimizedResult;

  console.log(`[SCRAPER] Successfully created result object for: ${url}`);
  console.log(`[SCRAPER] Result summary:`, {
    url: result.url,
    title: result.title,
    wordCount: result.wordCount,
    hasAIOptimization: 'aiOptimized' in result,
    totalProcessingTime: `${Date.now() - scrapeStartTime}ms`
  });

  return result;
}
