/**
 * Scraper API Request Handlers
 * Handles page navigation, content extraction, and request processing
 */

import { ContentExtractor, ExtractedContent } from './content-extractor';
import { EcommerceExtractor, EcommerceExtractedContent } from './ecommerce-extractor';
import { getMemoryAwareJobManager } from './redis-enhanced';
import { ScrapedPage, AIOptimizedResult, AIOptimizationConfig } from './scraper-api-types';
import { setupTurboModeBlocking, setupLegacyBlocking } from './scraper-api-handlers/resource-blocker';
import { applyAIOptimization } from './scraper-api-handlers/ai-optimizer';

// Re-export types for backward compatibility
export type { RequestHandlerConfig } from './scraper-api-handlers/types';
export type { AIOptimizationConfig } from './scraper-api-types';

// Re-export error handler
export { handleFailedRequest } from './scraper-api-handlers/error-handler';

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

/**
 * Pre-navigation hook setup
 * Configures page settings before navigation
 */
export async function setupPreNavigationHook(page: any, finalConfig: any, turboMode: boolean): Promise<void> {
  console.log(`[SCRAPER] Pre-navigation hook started`);

  try {
    // Set viewport
    console.log(`[SCRAPER] Setting viewport to:`, finalConfig.browser.viewport);
    await page.setViewportSize(finalConfig.browser.viewport);

    // Set custom headers if any
    if (Object.keys(finalConfig.advanced.customHeaders).length > 0) {
      console.log(`[SCRAPER] Setting custom headers:`, finalConfig.advanced.customHeaders);
      await page.setExtraHTTPHeaders(finalConfig.advanced.customHeaders);
    }

    // Setup resource blocking based on mode
    if (turboMode) {
      await setupTurboModeBlocking(page);
    } else if (finalConfig.browser.blockResources.length > 0) {
      await setupLegacyBlocking(page, finalConfig.browser.blockResources);
    } else {
      console.log(`[SCRAPER] No resource blocking configured`);
    }

    console.log(`[SCRAPER] Pre-navigation hook completed successfully`);
  } catch (preNavError) {
    console.error(`[SCRAPER] Error in pre-navigation hook:`, preNavError);
    throw preNavError;
  }
}

/**
 * Request handler - processes the page and extracts content
 */
export async function handlePageRequest(
  page: any,
  request: any,
  finalConfig: any,
  config: any,
  scrapeStartTime: number
): Promise<ScrapedPage | AIOptimizedResult> {
  const startTime = Date.now();
  console.log(`[SCRAPER] Request handler started for: ${request.url}`);

  try {
    // Wait for content to load
    await waitForContent(page, finalConfig);

    // Get the full HTML
    console.log(`[SCRAPER] Extracting page HTML content...`);
    const html = await page.content();
    console.log(`[SCRAPER] Page HTML extracted, length: ${html.length} characters`);

    // Validate page size
    validatePageSize(html, finalConfig);

    // Extract content
    const extracted = await extractPageContent(html, request.url, config, finalConfig);

    // Update rate limit
    const responseTime = Date.now() - startTime;
    await updateRateLimit(request.url, responseTime, finalConfig);

    // Build and return result
    return await buildResult(extracted, request.url, config, responseTime, scrapeStartTime);

  } catch (error) {
    logRequestError(error, request.url, startTime);
    throw error;
  }
}

/**
 * Wait for page content to load
 */
async function waitForContent(page: any, finalConfig: any): Promise<void> {
  console.log(`[SCRAPER] Waiting for DOM content loaded (timeout: ${finalConfig.timeouts.navigation}ms)`);
  await page.waitForLoadState('domcontentloaded', {
    timeout: finalConfig.timeouts.navigation
  });
  console.log(`[SCRAPER] DOM content loaded successfully`);

  // Wait for specific selector if configured
  if (finalConfig.advanced.waitForSelector) {
    console.log(`[SCRAPER] Waiting for custom selector: ${finalConfig.advanced.waitForSelector}`);
    try {
      await page.waitForSelector(finalConfig.advanced.waitForSelector, {
        timeout: finalConfig.timeouts.resourceLoad
      });
      console.log(`[SCRAPER] Custom selector found: ${finalConfig.advanced.waitForSelector}`);
    } catch (selectorError) {
      console.warn(`[SCRAPER] Custom selector not found within ${finalConfig.timeouts.resourceLoad}ms: ${finalConfig.advanced.waitForSelector}`);
      console.warn(`[SCRAPER] Continuing without custom selector...`);
    }
  } else {
    // Try to wait for common content selectors
    console.log(`[SCRAPER] Waiting for common content selectors...`);
    try {
      await page.waitForSelector('main, article, [role="main"], .content', {
        timeout: finalConfig.timeouts.resourceLoad
      });
      console.log(`[SCRAPER] Common content selector found`);
    } catch (contentSelectorError) {
      console.warn(`[SCRAPER] No common content selectors found within ${finalConfig.timeouts.resourceLoad}ms`);
      console.warn(`[SCRAPER] Continuing with page as-is...`);
    }
  }
}

/**
 * Validate page size against limits
 */
function validatePageSize(html: string, finalConfig: any): void {
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
 * Extract content from page HTML
 */
async function extractPageContent(
  html: string,
  url: string,
  config: any,
  finalConfig: any
): Promise<ExtractedContent | EcommerceExtractedContent> {
  let extracted: ExtractedContent | EcommerceExtractedContent;

  if (config?.ecommerceMode !== false) {
    console.log(`[SCRAPER] Attempting e-commerce extraction...`);
    // Try e-commerce extraction first
    extracted = await EcommerceExtractor.extractEcommerce(html, url);

    // If no e-commerce platform detected, fall back to regular extraction
    if (!(extracted as EcommerceExtractedContent).platform) {
      console.log(`[SCRAPER] No e-commerce platform detected, falling back to regular extraction`);
      extracted = ContentExtractor.extractWithReadability(html, url);
    } else {
      console.log(`[SCRAPER] E-commerce platform detected: ${(extracted as EcommerceExtractedContent).platform}`);
    }
  } else {
    console.log(`[SCRAPER] Using regular content extraction`);
    extracted = ContentExtractor.extractWithReadability(html, url);
  }

  console.log(`[SCRAPER] Content extracted:`, {
    wordCount: extracted.wordCount,
    title: extracted.title,
    hasImages: extracted.images?.length > 0,
    imageCount: extracted.images?.length || 0,
    contentLength: extracted.content?.length || 0
  });

  // Validate content
  validateExtractedContent(extracted, finalConfig);

  return extracted;
}

/**
 * Validate extracted content meets requirements
 */
function validateExtractedContent(
  extracted: ExtractedContent | EcommerceExtractedContent,
  finalConfig: any
): void {
  const isProductPage = (extracted as EcommerceExtractedContent).pageType === 'product';
  console.log(`[SCRAPER] Page type: ${isProductPage ? 'PRODUCT' : 'REGULAR'}`);

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

/**
 * Update rate limit based on response time
 */
async function updateRateLimit(url: string, responseTime: number, finalConfig: any): Promise<void> {
  const domain = new URL(url).hostname;
  console.log(`[SCRAPER] Page processed in ${responseTime}ms for domain: ${domain}`);

  if (finalConfig.rateLimit.adaptiveDelay) {
    await jobManager.updateRateLimitDelay(domain, responseTime);
  }
}

/**
 * Build final result object
 */
async function buildResult(
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

/**
 * Log request processing error
 */
function logRequestError(error: unknown, url: string, startTime: number): void {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  console.error(`[SCRAPER] ERROR in requestHandler for ${url}:`);
  console.error(`[SCRAPER] Error message: ${errorMessage}`);
  if (errorStack) {
    console.error(`[SCRAPER] Error stack:`, errorStack);
  }
  console.error(`[SCRAPER] Error occurred at: ${new Date().toISOString()}`);
  console.error(`[SCRAPER] Processing time before error: ${Date.now() - startTime}ms`);
}
