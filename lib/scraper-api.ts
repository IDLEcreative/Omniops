import { z } from 'zod';
import { spawn } from 'child_process';
import { join } from 'path';
import { ContentExtractor, ExtractedContent } from './content-extractor';
import { EcommerceExtractor, EcommerceExtractedContent } from './ecommerce-extractor';
import { getMemoryAwareJobManager, MemoryAwareCrawlJobManager } from './redis-enhanced';
import { getCrawlerConfig, CrawlerConfig, MemoryMonitor, AIOptimizationMonitor, getAIOptimizationConfig } from './crawler-config';
import { sitemapParser, SitemapEntry } from './sitemap-parser';
import { jobLimiter } from './job-limiter';
import { OwnSiteDetector } from './own-site-detector';
import { CustomerConfigLoader } from './customer-config-loader';
import { URLDeduplicator } from './url-deduplicator';
import { SmartRequestInterceptor } from './smart-request-interceptor';
import { BrowserContextPool } from './browser-context-pool';
import { 
  ScraperConfigManager, 
  ScraperConfig,
  ConfigPresets,
  applyConfigPreset,
  loadCustomerConfig,
  configManager 
} from './scraper-config';

// AI Optimization Types
export interface AIOptimizationConfig {
  enabled: boolean;
  level: 'basic' | 'standard' | 'advanced' | 'adaptive';
  tokenTarget: number; // target token count
  preserveContent: string[]; // selectors to always keep
  cacheEnabled: boolean;
  precomputeMetadata: boolean;
  deduplicationEnabled: boolean;
}

export interface SemanticChunk {
  id: string;
  content: string;
  embedding?: number[];
  tokenCount: number;
  relevanceScore?: number;
  chunkType: 'header' | 'paragraph' | 'list' | 'table' | 'code' | 'other';
}

export interface AIMetadata {
  summary: string;
  keyTopics: string[];
  entities: { name: string; type: string; confidence: number }[];
  sentiment?: { score: number; label: 'positive' | 'negative' | 'neutral' };
  language: string;
  complexity: 'low' | 'medium' | 'high';
  contentStructure: {
    hasHeaders: boolean;
    hasLists: boolean;
    hasTables: boolean;
    hasCode: boolean;
  };
}

export interface AIOptimizedResult extends ScrapedPage {
  aiOptimized: boolean;
  optimization: {
    originalTokens: number;
    optimizedTokens: number;
    reductionPercent: number;
    compressionRatio: number;
  };
  semanticChunks?: SemanticChunk[];
  aiMetadata?: AIMetadata;
  deduplication?: {
    uniqueContentId: string;
    commonElementRefs: string[];
  };
}

// Mock AI Services for Integration (to be replaced with actual implementations)
class AIContentExtractor {
  static async optimizeContent(
    content: string,
    config: AIOptimizationConfig
  ): Promise<{
    optimizedContent: string;
    semanticChunks: SemanticChunk[];
    metadata: AIMetadata;
    metrics: { originalTokens: number; optimizedTokens: number };
  }> {
    // Mock implementation - replace with actual AI service
    const originalTokens = Math.ceil(content.length / 4); // Rough token estimate
    let optimizedContent = content;
    
    // Apply optimization based on level
    switch (config.level) {
      case 'basic':
        // Remove extra whitespace and normalize
        optimizedContent = content.replace(/\s+/g, ' ').trim();
        break;
      case 'standard':
        // More aggressive optimization
        optimizedContent = content
          .replace(/\s+/g, ' ')
          .replace(/\n\s*\n/g, '\n')
          .trim();
        break;
      case 'advanced':
      case 'adaptive':
        // Intelligent content reduction
        const targetLength = Math.min(content.length, config.tokenTarget * 4);
        optimizedContent = content.substring(0, targetLength);
        break;
    }
    
    const optimizedTokens = Math.ceil(optimizedContent.length / 4);
    
    // Generate semantic chunks
    const semanticChunks: SemanticChunk[] = [
      {
        id: 'chunk-1',
        content: optimizedContent.substring(0, Math.min(500, optimizedContent.length)),
        tokenCount: Math.min(125, optimizedTokens),
        chunkType: 'paragraph'
      }
    ];
    
    // Generate AI metadata
    const metadata: AIMetadata = {
      summary: optimizedContent.substring(0, 200) + '...',
      keyTopics: ['general content'],
      entities: [],
      language: 'en',
      complexity: 'medium',
      contentStructure: {
        hasHeaders: content.includes('<h'),
        hasLists: content.includes('<ul') || content.includes('<ol'),
        hasTables: content.includes('<table'),
        hasCode: content.includes('<code') || content.includes('<pre')
      }
    };
    
    return {
      optimizedContent,
      semanticChunks,
      metadata,
      metrics: { originalTokens, optimizedTokens }
    };
  }
}

class DeduplicationService {
  private static contentHashes = new Map<string, string>();
  
  static async analyzeContent(content: string, url: string): Promise<{
    uniqueContentId: string;
    isDuplicate: boolean;
    commonElementRefs: string[];
    similarityScore: number;
  }> {
    // Mock implementation - replace with actual deduplication service
    const contentHash = this.generateHash(content);
    const uniqueContentId = `content-${contentHash}`;
    
    const isDuplicate = this.contentHashes.has(contentHash);
    if (!isDuplicate) {
      this.contentHashes.set(contentHash, url);
    }
    
    return {
      uniqueContentId,
      isDuplicate,
      commonElementRefs: ['header', 'footer', 'navigation'],
      similarityScore: isDuplicate ? 0.95 : 0.1
    };
  }
  
  private static generateHash(content: string): string {
    // Simple hash function - replace with robust hashing
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  
  static clearCache(): void {
    this.contentHashes.clear();
  }
}

// Only import Playwright for single page scraping
let PlaywrightCrawler: any;
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
  try {
    PlaywrightCrawler = require('crawlee').PlaywrightCrawler;
  } catch (e) {
    console.log('PlaywrightCrawler not available in this environment');
  }
}

// Schema for scraped page data
export const ScrapedPageSchema = z.object({
  url: z.string().url(),
  title: z.string().optional(),
  content: z.string(),
  textContent: z.string().optional(),
  excerpt: z.string().optional(),
  contentHash: z.string().optional(),
  wordCount: z.number().optional(),
  images: z.array(z.object({
    src: z.string(),
    alt: z.string(),
  })).optional(),
  metadata: z.record(z.any()).optional(),
});

export type ScrapedPage = z.infer<typeof ScrapedPageSchema>;

// Enhanced crawl job schema with memory tracking
export const CrawlJobSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed', 'paused']),
  progress: z.number().min(0).max(100),
  total: z.number(),
  completed: z.number(),
  failed: z.number().default(0),
  skipped: z.number().default(0),
  startedAt: z.string(),
  completedAt: z.string().optional(),
  pausedAt: z.string().optional(),
  errors: z.array(z.object({
    url: z.string(),
    error: z.string(),
    timestamp: z.string(),
  })).optional(),
  memoryStats: z.object({
    heapUsed: z.number(),
    heapTotal: z.number(),
    percentUsed: z.number(),
  }).optional(),
  config: z.any().optional(), // Store config used for this crawl
});

export type CrawlJob = z.infer<typeof CrawlJobSchema>;

// Get job manager instance
const jobManager = getMemoryAwareJobManager();

// Get memory monitor instance
const memoryMonitor = MemoryMonitor.getInstance();

// Get AI optimization monitor instance
const aiOptimizationMonitor = AIOptimizationMonitor.getInstance();

// Initialize performance optimizers
const urlDeduplicator = new URLDeduplicator(10000);
const requestInterceptor = new SmartRequestInterceptor(SmartRequestInterceptor.createConfig('balanced'));
const browserPool = new BrowserContextPool();

// Initialize own-site detector
OwnSiteDetector.loadFromEnvironment();

// Scrape a single page with configurable timeouts and AI optimization
export async function scrapePage(
  url: string, 
  config?: Partial<CrawlerConfig> & { 
    turboMode?: boolean; 
    ecommerceMode?: boolean;
    useNewConfig?: boolean;
    configPreset?: keyof typeof ConfigPresets;
    aiOptimization?: AIOptimizationConfig;
  }
): Promise<ScrapedPage | AIOptimizedResult> {
  const scrapeStartTime = Date.now();
  console.log(`[SCRAPER] Starting single page scrape for: ${url}`);
  console.log(`[SCRAPER] Config options:`, {
    turboMode: config?.turboMode !== false,
    ecommerceMode: config?.ecommerceMode,
    useNewConfig: config?.useNewConfig,
    configPreset: config?.configPreset,
    aiOptimizationEnabled: config?.aiOptimization?.enabled
  });

  if (!PlaywrightCrawler) {
    const error = 'PlaywrightCrawler not available - cannot scrape single pages in this environment';
    console.error(`[SCRAPER] Fatal error: ${error}`);
    throw new Error(error);
  }
  
  // Use new configuration system if requested or by default in production
  let finalConfig: any;
  if (config?.useNewConfig !== false && process.env.NODE_ENV === 'production') {
    console.log(`[SCRAPER] Using new configuration system`);
    
    // Apply preset if specified
    if (config?.configPreset) {
      console.log(`[SCRAPER] Applying config preset: ${config.configPreset}`);
      applyConfigPreset(config.configPreset);
    }
    
    // Get configuration from new system
    const scraperConfig = configManager.getEffectiveConfig(url);
    console.log(`[SCRAPER] Loaded effective config for URL: ${url}`);
    
    // Map new config structure to old crawler config structure for compatibility
    finalConfig = {
      maxConcurrency: scraperConfig.performance.concurrency.maxConcurrentPages,
      timeouts: {
        request: scraperConfig.performance.timeouts.pageLoad,
        navigation: scraperConfig.performance.timeouts.navigation,
        resourceLoad: scraperConfig.performance.timeouts.selector,
        scriptExecution: scraperConfig.performance.timeouts.script,
      },
      rateLimit: {
        requestsPerMinute: scraperConfig.rateLimiting.perDomain.requestsPerMinute,
        delayBetweenRequests: scraperConfig.performance.delays.minRequestDelay,
        adaptiveDelay: scraperConfig.performance.delays.adaptiveDelayEnabled,
        respectRobotsTxt: scraperConfig.rateLimiting.global.respectRobotsTxt,
      },
      content: {
        minWordCount: scraperConfig.extraction.filters.minDescriptionLength || 50,
        maxPageSizeMB: 10,
        extractImages: !scraperConfig.performance.resources.blockImages,
        extractLinks: true,
        extractMetadata: true,
      },
      browser: {
        headless: scraperConfig.browser.headless,
        userAgent: scraperConfig.rateLimiting.userAgents.agents[0],
        viewport: scraperConfig.browser.viewport,
        blockResources: [
          ...(scraperConfig.performance.resources.blockImages ? ['image'] : []),
          ...(scraperConfig.performance.resources.blockMedia ? ['media'] : []),
          ...(scraperConfig.performance.resources.blockFonts ? ['font'] : []),
        ],
      },
      advanced: {
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        waitForSelector: undefined,
        customHeaders: {},
      },
      ...config, // Allow direct overrides
    };
  } else {
    console.log(`[SCRAPER] Using legacy configuration system`);
    
    // Use old configuration system
    const crawlerConfig = getCrawlerConfig();
    finalConfig = { ...crawlerConfig, ...config };
  }
  
  console.log(`[SCRAPER] Final config timeouts:`, finalConfig.timeouts);
  const turboMode = config?.turboMode !== false; // Default to true
  console.log(`[SCRAPER] Turbo mode: ${turboMode ? 'ENABLED' : 'DISABLED'}`)
  
  return new Promise(async (resolve, reject) => {
    let result: ScrapedPage | null = null;
    
    console.log(`[SCRAPER] Creating PlaywrightCrawler instance`);
    console.log(`[SCRAPER] Browser settings: headless=${finalConfig.browser.headless}, userAgent=${finalConfig.browser.userAgent}`);
    
    try {
      const crawler = new PlaywrightCrawler({
        maxRequestsPerCrawl: 1,
        requestHandlerTimeoutSecs: finalConfig.timeouts.request / 1000,
        navigationTimeoutSecs: finalConfig.timeouts.navigation / 1000,
        
        browserPoolOptions: {
          useFingerprints: true,
          fingerprintOptions: {
            fingerprintGeneratorOptions: {
              browsers: ['chrome'],
              devices: ['desktop'],
              operatingSystems: ['windows', 'macos', 'linux'],
            },
          },
        },
        
        launchContext: {
          launchOptions: {
            headless: finalConfig.browser.headless,
          },
          userAgent: finalConfig.browser.userAgent,
        },
      
      preNavigationHooks: [
        async ({ page }: any) => {
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
        },
      ],
      
      requestHandler: async ({ page, request }: any) => {
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
            const optimizationStartTime = Date.now();
            let wasError = false;
            const wasCacheHit = false;
            let wasDeduplicated = false;
            let originalTokens = 0;
            let optimizedTokens = 0;
            
            try {
              console.log(`[AI] Applying ${aiOptimization.level} optimization to ${request.url}`);
              
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
                  request.url
                );
                wasDeduplicated = deduplicationResult.isDuplicate;
              }
              
              aiOptimizedData = {
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
              
            } catch (error) {
              console.error(`[AI] Optimization failed for ${request.url}:`, error);
              wasError = true;
              
              // Continue with regular extraction as fallback
              aiOptimizedData = {
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
          
          result = {
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
      },
      
      failedRequestHandler: ({ request, error }: any, crawlingContext: any) => {
        const errorMessage = error.message || String(error);
        console.error(`Failed to scrape ${request.url}: ${errorMessage}`);
        
        // Check if it's a timeout error
        if (errorMessage.includes('timeout')) {
          reject(new Error(`Timeout scraping ${url}: Page took too long to load`));
        } else {
          reject(new Error(`Failed to scrape ${url}: ${errorMessage}`));
        }
      },
    });
    
    await crawler.run([url]);
    
    if (result) {
      resolve(result);
    } else {
      reject(new Error(`Failed to scrape ${url}: No result`));
    }
  });
}

// Crawl an entire website with enhanced memory management and AI optimization
export async function crawlWebsite(
  url: string,
  options?: {
    maxPages?: number;
    includePaths?: string[];
    excludePaths?: string[];
    configPreset?: 'fast' | 'careful' | 'memoryEfficient' | 'production';
    config?: Partial<CrawlerConfig>;
    turboMode?: boolean;
    ownSite?: boolean; // Enable own-site optimizations
    customerId?: string; // Customer ID to load owned domains
    useNewConfig?: boolean; // Use new configuration system
    newConfigPreset?: keyof typeof ConfigPresets; // Preset for new config system
    aiOptimization?: AIOptimizationConfig; // AI optimization configuration
  }
): Promise<string> {
  const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const startUrl = new URL(url);
  const maxPages = options?.maxPages || 50;
  const crawlEntireSite = options?.maxPages === -1;
  
  // Load customer's owned domains if customerId provided
  if (options?.customerId) {
    await CustomerConfigLoader.initializeForScraping(options.customerId);
    
    // Load customer-specific configuration from database if using new config
    if (options?.useNewConfig) {
      await loadCustomerConfig(options.customerId);
    }
  }
  
  // Get configuration
  let crawlerConfig: any;
  
  // Use new configuration system if requested
  if (options?.useNewConfig) {
    // Apply preset if specified
    if (options?.newConfigPreset) {
      applyConfigPreset(options.newConfigPreset);
    }
    
    // Get configuration from new system
    const scraperConfig = configManager.getEffectiveConfig(url);
    
    // Map to old config structure for compatibility
    crawlerConfig = {
      maxConcurrency: scraperConfig.performance.concurrency.maxConcurrentPages,
      timeouts: {
        request: scraperConfig.performance.timeouts.pageLoad,
        navigation: scraperConfig.performance.timeouts.navigation,
        resourceLoad: scraperConfig.performance.timeouts.selector,
        scriptExecution: scraperConfig.performance.timeouts.script,
      },
      rateLimit: {
        requestsPerMinute: scraperConfig.rateLimiting.perDomain.requestsPerMinute,
        delayBetweenRequests: scraperConfig.performance.delays.minRequestDelay,
        adaptiveDelay: scraperConfig.performance.delays.adaptiveDelayEnabled,
        respectRobotsTxt: scraperConfig.rateLimiting.global.respectRobotsTxt,
      },
      memory: {
        maxResultsInMemory: 500,
        batchSize: 50,
        enableStreaming: true,
        gcThreshold: 0.7,
      },
      content: {
        minWordCount: scraperConfig.extraction.filters.minDescriptionLength || 50,
        maxPageSizeMB: 10,
        extractImages: !scraperConfig.performance.resources.blockImages,
        extractLinks: true,
        extractMetadata: true,
      },
      retry: {
        maxAttempts: 3,
        backoffMultiplier: scraperConfig.rateLimiting.backoff.multiplier,
        initialDelayMs: scraperConfig.rateLimiting.backoff.initialDelayMs,
      },
      browser: {
        headless: scraperConfig.browser.headless,
        userAgent: scraperConfig.rateLimiting.userAgents.agents[0],
        viewport: scraperConfig.browser.viewport,
        blockResources: [
          ...(scraperConfig.performance.resources.blockImages ? ['image'] : []),
          ...(scraperConfig.performance.resources.blockMedia ? ['media'] : []),
          ...(scraperConfig.performance.resources.blockFonts ? ['font'] : []),
        ],
      },
      advanced: {
        followRedirects: true,
        maxRedirects: 5,
        ignoreSslErrors: false,
        customHeaders: {},
      },
    };
  } else {
    // Use old configuration system
    crawlerConfig = getCrawlerConfig(options?.configPreset);
  }
  
  // Auto-detect if this is an owned site
  const isOwnSite = options?.ownSite || await OwnSiteDetector.isOwnSite(url);
  
  // Apply own-site optimizations if enabled or detected
  if (isOwnSite) {
    // Enable higher limits in job limiter
    jobLimiter.enableOwnSiteMode();
    
    // Import and apply own-site config
    const { ownSiteConfig } = await import('./scraper-config-own-site');
    crawlerConfig = { ...crawlerConfig, ...ownSiteConfig };
    console.log(`[${jobId}] Own-site mode ${options?.ownSite ? 'enabled' : 'auto-detected'} with optimized configuration`);
  }
  
  const finalConfig = { ...crawlerConfig, ...options?.config };
  const turboMode = options?.turboMode !== false; // Default to true
  
  // Check if we can start a new job
  // Temporarily disabled for testing - normally prevents high memory usage
  // const { allowed, reason } = await jobLimiter.canStartNewJob();
  // if (!allowed) {
  //   throw new Error(`Cannot start new job: ${reason}`);
  // }
  
  // Initialize job in Redis
  const initialJob: CrawlJob = {
    jobId,
    status: 'processing',
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    startedAt: new Date().toISOString(),
    config: finalConfig,
  };
  
  await jobManager.createJob(jobId, initialJob);
  
  // Start memory monitoring
  memoryMonitor.startMonitoring(async (stats) => {
    await jobManager.updateJob(jobId, { memoryStats: stats });
    
    // Pause crawl if memory pressure is too high
    if (stats.percentUsed > 0.9) {
      console.warn('Memory pressure critical, pausing crawl...');
      await jobManager.updateJob(jobId, { 
        status: 'paused',
        pausedAt: new Date().toISOString(),
      });
    }
  });
  
  // Start crawling in background using child process
  console.log(`[${jobId}] Spawning crawler worker process...`);
  
  // Use the scraper worker process from lib directory
  const crawlerPath = join(process.cwd(), 'lib', 'scraper-worker.js');
  
  const child = spawn('node', [
    crawlerPath,
    jobId,
    url,
    maxPages.toString(),
    turboMode.toString(),
    options?.configPreset || 'memoryEfficient', // Better default for large sites
    isOwnSite ? 'true' : 'false' // Pass own-site flag (detected or explicit)
  ], {
    cwd: process.cwd(),
    env: { ...process.env },
    stdio: 'inherit'
  });
  
  child.on('error', (error) => {
    console.error(`[${jobId}] Failed to spawn crawler worker:`, error);
    jobManager.updateJob(jobId, {
      status: 'failed',
      completedAt: new Date().toISOString(),
      errors: [{
        url: url,
        error: `Failed to spawn worker: ${error.message}`,
        timestamp: new Date().toISOString(),
      }],
    }).catch(console.error);
  });
  
  child.on('exit', (code, signal) => {
    if (code !== 0) {
      console.error(`[${jobId}] Crawler worker exited with code ${code}, signal ${signal}`);
    } else {
      console.log(`[${jobId}] Crawler worker completed successfully`);
    }
    memoryMonitor.stopMonitoring();
  });
  
  // The rest of the crawling logic is now in crawler-worker.ts
  
  return jobId;
}

// Check crawl job status with pagination support
export async function checkCrawlStatus(
  jobId: string, 
  options?: { 
    includeResults?: boolean; 
    offset?: number; 
    limit?: number; 
  }
): Promise<CrawlJob & { data?: (ScrapedPage | AIOptimizedResult)[]; resultCount?: number }> {
  const job = await jobManager.getJob(jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  // Get total result count
  const resultCount = await jobManager.getResultCount(jobId);
  
  // If completed and results requested, include paginated results
  if (job.status === 'completed' && options?.includeResults) {
    const results = await jobManager.getJobResults(
      jobId, 
      options.offset || 0, 
      options.limit || 100
    );
    return { ...job, data: results, resultCount };
  }
  
  return { ...job, resultCount };
}

// Stream results for very large crawls
export async function* streamCrawlResults(jobId: string): AsyncGenerator<ScrapedPage | AIOptimizedResult, void, unknown> {
  yield* jobManager.streamJobResults(jobId);
}

// Utility functions for AI optimization
export function createAIOptimizationConfig(overrides?: Partial<AIOptimizationConfig>): AIOptimizationConfig {
  return {
    enabled: true,
    level: 'standard',
    tokenTarget: 2000,
    preserveContent: ['h1', 'h2', 'h3', '.important', '[data-preserve]'],
    cacheEnabled: true,
    precomputeMetadata: true,
    deduplicationEnabled: true,
    ...overrides
  };
}

// Migration utilities for backward compatibility
export function isAIOptimizedResult(result: ScrapedPage | AIOptimizedResult): result is AIOptimizedResult {
  return 'aiOptimized' in result;
}

export function convertToStandardResult(result: ScrapedPage | AIOptimizedResult): ScrapedPage {
  if (isAIOptimizedResult(result)) {
    const { aiOptimized, optimization, semanticChunks, aiMetadata, deduplication, ...standardResult } = result;
    return standardResult;
  }
  return result;
}

export function getOptimizationMetrics(result: ScrapedPage | AIOptimizedResult): {
  isOptimized: boolean;
  originalTokens?: number;
  optimizedTokens?: number;
  reductionPercent?: number;
  compressionRatio?: number;
} {
  if (isAIOptimizedResult(result) && result.aiOptimized) {
    return {
      isOptimized: true,
      ...result.optimization
    };
  }
  return { isOptimized: false };
}

// Clear AI service caches
export function clearAIOptimizationCache(): void {
  DeduplicationService.clearCache();
  console.log('AI optimization caches cleared');
}

// Utility function to apply AI optimization preset to config
export function applyAIOptimizationPreset(
  preset: 'fast' | 'standard' | 'quality' | 'adaptive' | 'largescale' | 'disabled',
  overrides?: Partial<AIOptimizationConfig>
): AIOptimizationConfig {
  const baseConfig = getAIOptimizationConfig(preset);
  return { ...baseConfig, ...overrides };
}

// Resume a paused crawl
export async function resumeCrawl(jobId: string): Promise<void> {
  const job = await jobManager.getJob(jobId);
  
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }
  
  if (job.status !== 'paused') {
    throw new Error(`Job ${jobId} is not paused (status: ${job.status})`);
  }
  
  await jobManager.updateJob(jobId, {
    status: 'processing',
    pausedAt: undefined,
  });
  
  // Job details already fetched above, no need to fetch again
  
  // Extract config and progress from job
  const config = job.config || {};
  const stats = job.stats || { scraped: 0, errors: 0, total: 0 };
  const pausedAt = job.pausedAt;
  
  // Determine resume strategy based on job type and progress
  const resumeOptions: any = {
    resumeFromLastPage: true,
    skipCompletedUrls: true,
    validateExistingContent: true,
    ...config
  };
  
  console.log(`Resuming crawl ${jobId} from pause point at ${pausedAt}`);
  console.log(`Previous progress: ${stats.scraped}/${stats.total} pages scraped`);
  
  try {
    // Resume the crawl with the existing config
    if (job.config?.mode === 'single') {
      // Resume single URL crawl
      // crawlSingleUrlEnhanced function not implemented yet
      console.log('Single URL crawl resume not yet implemented');
      throw new Error('crawlSingleUrlEnhanced function not implemented');
    } else if (job.config?.mode === 'sitemap') {
      // Resume sitemap crawl
      // crawlFromSitemap function not implemented yet
      console.log('Sitemap crawl resume not yet implemented');
      throw new Error('crawlFromSitemap function not implemented');
    } else {
      // Resume general crawl
      // General crawl resume not fully implemented
      console.log('General crawl resume not fully implemented');
      throw new Error('General crawl resume not fully implemented');
    }
    
    // Mark job as completed
    await jobManager.updateJob(jobId, {
      status: 'completed',
      completedAt: new Date(),
    });
    
    console.log(`Crawl ${jobId} successfully resumed and completed`);
  } catch (error) {
    console.error(`Error resuming crawl ${jobId}:`, error);
    
    // Mark job as failed
    await jobManager.updateJob(jobId, {
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}

// Get system health status including AI optimization metrics
export async function getHealthStatus(): Promise<{
  redis: boolean;
  memory: MemoryStats;
  fallbackActive: boolean;
  crawlerReady: boolean;
  aiOptimization?: any;
}> {
  const redisHealth = await jobManager.getHealthStatus();
  const memoryStats = memoryMonitor.getMemoryStats();
  const aiMetrics = aiOptimizationMonitor.getMetrics();
  
  return {
    redis: redisHealth.redis,
    memory: memoryStats,
    fallbackActive: redisHealth.fallbackActive,
    crawlerReady: true,
    aiOptimization: {
      metrics: aiMetrics,
      insights: aiOptimizationMonitor.getInsights()
    }
  };
}

// Get detailed AI optimization metrics
export function getAIOptimizationMetrics() {
  return aiOptimizationMonitor.getMetrics();
}

// Reset AI optimization metrics
export function resetAIOptimizationMetrics(): void {
  aiOptimizationMonitor.reset();
}

// Clean up old jobs
export async function cleanupOldJobs(olderThanHours: number = 24): Promise<number> {
  // This would be implemented with Redis SCAN command
  // For now, return 0
  console.log(`Cleanup not yet implemented for jobs older than ${olderThanHours} hours`);
  return 0;
}

// Export types and utilities
export type { CrawlerConfig, MemoryStats } from './crawler-config';
export { crawlerPresets } from './crawler-config';

// Configure owned domains
export function configureOwnedDomains(domains: string[]) {
  domains.forEach(domain => OwnSiteDetector.addOwnedDomain(domain));
}

// Check if a URL is an owned site
export async function isOwnedSite(url: string): Promise<boolean> {
  return OwnSiteDetector.isOwnSite(url);
}

// Type alias for memory stats
interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  percentUsed: number;
}

// AI optimization types are already exported above