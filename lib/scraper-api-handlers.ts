import { ContentExtractor, ExtractedContent } from './content-extractor';
import { EcommerceExtractor, EcommerceExtractedContent } from './ecommerce-extractor';
import { getMemoryAwareJobManager } from './redis-enhanced';
import { AIOptimizationMonitor } from './crawler-config';
import { ScrapedPage, AIOptimizedResult, AIOptimizationConfig } from './scraper-api-types';
import { AIContentExtractor, DeduplicationService } from './scraper-api-ai';

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

// Get AI optimization monitor instance
const aiOptimizationMonitor = AIOptimizationMonitor.getInstance();

// Pre-navigation hook setup
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

    // Turbo mode: Use intelligent request blocking
    if (turboMode) {
      console.log(`[SCRAPER] Setting up turbo mode request blocking`);
      await page.route('**/*', (route: any) => {
        const url = route.request().url();
        const resourceType = route.request().resourceType();

        // Block unnecessary resources for speed
        const blockedTypes = ['image', 'media', 'font', 'stylesheet'];
        const blockedDomains = ['googletagmanager.com', 'google-analytics.com', 'facebook.com'];

        if (blockedTypes.includes(resourceType) ||
            blockedDomains.some(domain => url.includes(domain))) {
          // Only log first few blocks to avoid spam
          if (Math.random() < 0.05) { // Log 5% of blocks
            console.log(`[SCRAPER] Blocked resource: type=${resourceType}, domain=${new URL(url).hostname}`);
          }
          route.abort();
        } else {
          route.continue();
        }
      });
      console.log(`[SCRAPER] Turbo mode blocking configured for: images, media, fonts, stylesheets, tracking domains`);
    } else if (finalConfig.browser.blockResources.length > 0) {
      // Legacy mode: Block configured resources
      console.log(`[SCRAPER] Setting up legacy resource blocking for:`, finalConfig.browser.blockResources);
      await page.route('**/*', (route: any) => {
        const resourceType = route.request().resourceType();
        if (finalConfig.browser.blockResources.includes(resourceType as any)) {
          route.abort();
        } else {
          route.continue();
        }
      });
    } else {
      console.log(`[SCRAPER] No resource blocking configured`);
    }

    console.log(`[SCRAPER] Pre-navigation hook completed successfully`);
  } catch (preNavError) {
    console.error(`[SCRAPER] Error in pre-navigation hook:`, preNavError);
    throw preNavError;
  }
}

// Request handler - processes the page and extracts content
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

    // Get the full HTML
    console.log(`[SCRAPER] Extracting page HTML content...`);
    const html = await page.content();
    console.log(`[SCRAPER] Page HTML extracted, length: ${html.length} characters`);

    // Check page size
    const pageSizeBytes = new TextEncoder().encode(html).length;
    const pageSizeMB = pageSizeBytes / (1024 * 1024);
    console.log(`[SCRAPER] Page size: ${pageSizeMB.toFixed(2)}MB (limit: ${finalConfig.content.maxPageSizeMB}MB)`);

    if (pageSizeMB > finalConfig.content.maxPageSizeMB) {
      const error = `Page too large: ${pageSizeMB.toFixed(2)}MB exceeds limit of ${finalConfig.content.maxPageSizeMB}MB`;
      console.error(`[SCRAPER] ${error}`);
      throw new Error(error);
    }

    // Extract content - use e-commerce extractor if enabled or auto-detected
    let extracted: ExtractedContent | EcommerceExtractedContent;

    if (config?.ecommerceMode !== false) {
      console.log(`[SCRAPER] Attempting e-commerce extraction...`);
      // Try e-commerce extraction first
      extracted = await EcommerceExtractor.extractEcommerce(html, request.url);

      // If no e-commerce platform detected, fall back to regular extraction
      if (!(extracted as EcommerceExtractedContent).platform) {
        console.log(`[SCRAPER] No e-commerce platform detected, falling back to regular extraction`);
        extracted = ContentExtractor.extractWithReadability(html, request.url);
      } else {
        console.log(`[SCRAPER] E-commerce platform detected: ${(extracted as EcommerceExtractedContent).platform}`);
      }
    } else {
      console.log(`[SCRAPER] Using regular content extraction`);
      // Use regular extraction
      extracted = ContentExtractor.extractWithReadability(html, request.url);
    }

    console.log(`[SCRAPER] Content extracted:`, {
      wordCount: extracted.wordCount,
      title: extracted.title,
      hasImages: extracted.images?.length > 0,
      imageCount: extracted.images?.length || 0,
      contentLength: extracted.content?.length || 0
    });

    // Check if content meets minimum requirements (skip for product pages)
    const isProductPage = (extracted as EcommerceExtractedContent).pageType === 'product';
    console.log(`[SCRAPER] Page type: ${isProductPage ? 'PRODUCT' : 'REGULAR'}`);

    if (!isProductPage && extracted.wordCount < finalConfig.content.minWordCount) {
      const error = `Insufficient content: ${extracted.wordCount} words < ${finalConfig.content.minWordCount} minimum`;
      console.error(`[SCRAPER] ${error}`);
      throw new Error(error);
    }

    // Check if content is valid
    if (!isProductPage && !ContentExtractor.isValidContent(extracted)) {
      const error = 'Invalid or error page content detected';
      console.error(`[SCRAPER] ${error} - page might be an error page, login page, or have insufficient content`);
      throw new Error(error);
    }

    // Update rate limit based on response time
    const responseTime = Date.now() - startTime;
    const domain = new URL(request.url).hostname;
    console.log(`[SCRAPER] Page processed in ${responseTime}ms for domain: ${domain}`);

    if (finalConfig.rateLimit.adaptiveDelay) {
      await jobManager.updateRateLimitDelay(domain, responseTime);
    }

    // Build result with e-commerce data if available
    const ecommerceData = extracted as EcommerceExtractedContent;

    // Apply AI optimization if enabled
    const aiOptimization = config?.aiOptimization;
    let aiOptimizedData: any = null;

    if (aiOptimization?.enabled) {
      aiOptimizedData = await applyAIOptimization(extracted, request.url, aiOptimization);
    }

    const result: ScrapedPage | AIOptimizedResult = {
      url: request.url,
      title: extracted.title,
      content: extracted.content,
      textContent: extracted.textContent,
      excerpt: extracted.excerpt,
      contentHash: extracted.contentHash,
      wordCount: extracted.wordCount,
      images: finalConfig.content.extractImages ? extracted.images : undefined,
      metadata: {
        ...extracted.metadata,
        author: extracted.author,
        publishedDate: extracted.publishedDate,
        modifiedDate: extracted.modifiedDate,
        lang: extracted.lang,
        readingTime: extracted.readingTime,
        extractedAt: new Date().toISOString(),
        responseTimeMs: responseTime,
        // Add e-commerce specific metadata
        platform: ecommerceData.platform,
        pageType: ecommerceData.pageType,
        products: ecommerceData.products,
        pagination: ecommerceData.pagination,
        breadcrumbs: ecommerceData.breadcrumbs,
        // Add AI optimization metadata
        aiOptimizationLevel: aiOptimization?.level,
        aiOptimizationEnabled: aiOptimization?.enabled || false,
      },
      // Extend with AI optimization data if available
      ...aiOptimizedData
    } as ScrapedPage | AIOptimizedResult;

    console.log(`[SCRAPER] Successfully created result object for: ${request.url}`);
    console.log(`[SCRAPER] Result summary:`, {
      url: result.url,
      title: result.title,
      wordCount: result.wordCount,
      hasAIOptimization: 'aiOptimized' in result,
      totalProcessingTime: `${Date.now() - scrapeStartTime}ms`
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    console.error(`[SCRAPER] ERROR in requestHandler for ${request.url}:`);
    console.error(`[SCRAPER] Error message: ${errorMessage}`);
    if (errorStack) {
      console.error(`[SCRAPER] Error stack:`, errorStack);
    }
    console.error(`[SCRAPER] Error occurred at: ${new Date().toISOString()}`);
    console.error(`[SCRAPER] Processing time before error: ${Date.now() - startTime}ms`);

    throw error;
  }
}

// Apply AI optimization to extracted content
async function applyAIOptimization(
  extracted: ExtractedContent | EcommerceExtractedContent,
  url: string,
  aiOptimization: AIOptimizationConfig
): Promise<any> {
  const optimizationStartTime = Date.now();
  let wasError = false;
  const wasCacheHit = false;
  let wasDeduplicated = false;
  let originalTokens = 0;
  let optimizedTokens = 0;

  try {
    console.log(`[AI] Applying ${aiOptimization.level} optimization to ${url}`);

    // Run AI content optimization
    const aiResult = await AIContentExtractor.optimizeContent(
      extracted.content,
      aiOptimization
    );

    originalTokens = aiResult.metrics.originalTokens;
    optimizedTokens = aiResult.metrics.optimizedTokens;

    // Run deduplication if enabled
    let deduplicationResult = null;
    if (aiOptimization.deduplicationEnabled) {
      deduplicationResult = await DeduplicationService.analyzeContent(
        extracted.content,
        url
      );
      wasDeduplicated = deduplicationResult.isDuplicate;
    }

    const aiOptimizedData = {
      aiOptimized: true,
      optimization: {
        originalTokens: aiResult.metrics.originalTokens,
        optimizedTokens: aiResult.metrics.optimizedTokens,
        reductionPercent: Math.round(
          ((aiResult.metrics.originalTokens - aiResult.metrics.optimizedTokens) /
           aiResult.metrics.originalTokens) * 100
        ),
        compressionRatio: aiResult.metrics.originalTokens / aiResult.metrics.optimizedTokens
      },
      semanticChunks: aiResult.semanticChunks,
      aiMetadata: aiResult.metadata,
      deduplication: deduplicationResult ? {
        uniqueContentId: deduplicationResult.uniqueContentId,
        commonElementRefs: deduplicationResult.commonElementRefs
      } : undefined
    };

    // Use optimized content if it meets quality thresholds
    if (aiResult.optimizedContent.length > 100) {
      extracted.content = aiResult.optimizedContent;
    }

    console.log(`[AI] Optimization complete: ${aiOptimizedData.optimization.reductionPercent}% reduction`);

    return aiOptimizedData;

  } catch (error) {
    console.error(`[AI] Optimization failed for ${url}:`, error);
    wasError = true;

    // Continue with regular extraction as fallback
    return {
      aiOptimized: false,
      optimization: {
        originalTokens: 0,
        optimizedTokens: 0,
        reductionPercent: 0,
        compressionRatio: 1
      }
    };
  } finally {
    // Record performance metrics
    const processingTime = Date.now() - optimizationStartTime;
    aiOptimizationMonitor.recordOptimization({
      processingTimeMs: processingTime,
      originalTokens,
      optimizedTokens,
      wasError,
      wasCacheHit,
      wasDeduplicated
    });
  }
}

// Failed request handler
export function handleFailedRequest(
  request: any,
  error: any,
  url: string,
  finalConfig: any,
  scrapeStartTime: number,
  reject: (error: Error) => void
): void {
  const errorMessage = error.message || String(error);
  const errorStack = error.stack || undefined;

  console.error(`[SCRAPER] FAILED REQUEST HANDLER triggered for: ${request.url}`);
  console.error(`[SCRAPER] Error type: ${error.name || 'Unknown'}`);
  console.error(`[SCRAPER] Error message: ${errorMessage}`);
  if (errorStack) {
    console.error(`[SCRAPER] Error stack:`, errorStack);
  }
  console.error(`[SCRAPER] Failed at: ${new Date().toISOString()}`);
  console.error(`[SCRAPER] Total time before failure: ${Date.now() - scrapeStartTime}ms`);

  // Check if it's a timeout error
  if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
    const timeoutError = `Timeout scraping ${url}: Page took too long to load (exceeded ${finalConfig.timeouts.navigation}ms)`;
    console.error(`[SCRAPER] Identified as TIMEOUT error`);
    reject(new Error(timeoutError));
  } else if (errorMessage.includes('net::') || errorMessage.includes('NS_ERROR')) {
    const networkError = `Network error scraping ${url}: ${errorMessage}`;
    console.error(`[SCRAPER] Identified as NETWORK error`);
    reject(new Error(networkError));
  } else {
    console.error(`[SCRAPER] Identified as GENERAL error`);
    reject(new Error(`Failed to scrape ${url}: ${errorMessage}`));
  }
}
