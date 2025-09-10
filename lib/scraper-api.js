"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.crawlerPresets = exports.CrawlJobSchema = exports.ScrapedPageSchema = void 0;
exports.scrapePage = scrapePage;
exports.crawlWebsite = crawlWebsite;
exports.checkCrawlStatus = checkCrawlStatus;
exports.streamCrawlResults = streamCrawlResults;
exports.createAIOptimizationConfig = createAIOptimizationConfig;
exports.isAIOptimizedResult = isAIOptimizedResult;
exports.convertToStandardResult = convertToStandardResult;
exports.getOptimizationMetrics = getOptimizationMetrics;
exports.clearAIOptimizationCache = clearAIOptimizationCache;
exports.applyAIOptimizationPreset = applyAIOptimizationPreset;
exports.resumeCrawl = resumeCrawl;
exports.getHealthStatus = getHealthStatus;
exports.getAIOptimizationMetrics = getAIOptimizationMetrics;
exports.resetAIOptimizationMetrics = resetAIOptimizationMetrics;
exports.cleanupOldJobs = cleanupOldJobs;
exports.configureOwnedDomains = configureOwnedDomains;
exports.isOwnedSite = isOwnedSite;
const zod_1 = require("zod");
const child_process_1 = require("child_process");
const path_1 = require("path");
const ioredis_1 = __importDefault(require("ioredis"));
const content_extractor_1 = require("./content-extractor");
const ecommerce_extractor_1 = require("./ecommerce-extractor");
const redis_enhanced_1 = require("./redis-enhanced");
const crawler_config_1 = require("./crawler-config");
const sitemap_parser_1 = require("./sitemap-parser");
const job_limiter_1 = require("./job-limiter");
const own_site_detector_1 = require("./own-site-detector");
const customer_config_loader_1 = require("./customer-config-loader");
const url_deduplicator_1 = require("./url-deduplicator");
const smart_request_interceptor_1 = require("./smart-request-interceptor");
const browser_context_pool_1 = require("./browser-context-pool");
const scraper_config_1 = require("./scraper-config");
// Mock AI Services for Integration (to be replaced with actual implementations)
class AIContentExtractor {
    static async optimizeContent(content, config) {
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
        const semanticChunks = [
            {
                id: 'chunk-1',
                content: optimizedContent.substring(0, Math.min(500, optimizedContent.length)),
                tokenCount: Math.min(125, optimizedTokens),
                chunkType: 'paragraph'
            }
        ];
        // Generate AI metadata
        const metadata = {
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
    static async analyzeContent(content, url) {
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
    static generateHash(content) {
        // Simple hash function - replace with robust hashing
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(36);
    }
    static clearCache() {
        this.contentHashes.clear();
    }
}
DeduplicationService.contentHashes = new Map();
// Only import Playwright for single page scraping
let PlaywrightCrawler;
if (typeof window === 'undefined' && !process.env.NEXT_RUNTIME) {
    try {
        PlaywrightCrawler = require('crawlee').PlaywrightCrawler;
    }
    catch (e) {
        console.log('PlaywrightCrawler not available in this environment');
    }
}
// Schema for scraped page data
exports.ScrapedPageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    title: zod_1.z.string().optional(),
    content: zod_1.z.string(),
    textContent: zod_1.z.string().optional(),
    excerpt: zod_1.z.string().optional(),
    contentHash: zod_1.z.string().optional(),
    wordCount: zod_1.z.number().optional(),
    images: zod_1.z.array(zod_1.z.object({
        src: zod_1.z.string(),
        alt: zod_1.z.string(),
    })).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
});
// Enhanced crawl job schema with memory tracking
exports.CrawlJobSchema = zod_1.z.object({
    jobId: zod_1.z.string(),
    status: zod_1.z.enum(['queued', 'processing', 'completed', 'failed', 'paused']),
    progress: zod_1.z.number().min(0).max(100),
    total: zod_1.z.number(),
    completed: zod_1.z.number(),
    failed: zod_1.z.number().default(0),
    skipped: zod_1.z.number().default(0),
    startedAt: zod_1.z.string(),
    completedAt: zod_1.z.string().optional(),
    pausedAt: zod_1.z.string().optional(),
    errors: zod_1.z.array(zod_1.z.object({
        url: zod_1.z.string(),
        error: zod_1.z.string(),
        timestamp: zod_1.z.string(),
    })).optional(),
    memoryStats: zod_1.z.object({
        heapUsed: zod_1.z.number(),
        heapTotal: zod_1.z.number(),
        percentUsed: zod_1.z.number(),
    }).optional(),
    config: zod_1.z.any().optional(), // Store config used for this crawl
});
// Get job manager instance
const jobManager = (0, redis_enhanced_1.getMemoryAwareJobManager)();
// Get memory monitor instance
const memoryMonitor = crawler_config_1.MemoryMonitor.getInstance();
// Get AI optimization monitor instance
const aiOptimizationMonitor = crawler_config_1.AIOptimizationMonitor.getInstance();
// Initialize performance optimizers
const urlDeduplicator = new url_deduplicator_1.URLDeduplicator(10000);
const requestInterceptor = new smart_request_interceptor_1.SmartRequestInterceptor(smart_request_interceptor_1.SmartRequestInterceptor.createConfig('balanced'));
const browserPool = new browser_context_pool_1.BrowserContextPool();
// Initialize own-site detector
own_site_detector_1.OwnSiteDetector.loadFromEnvironment();
// Scrape a single page with configurable timeouts and AI optimization
async function scrapePage(url, config) {
    const scrapeStartTime = Date.now();
    console.log(`[SCRAPER] Starting single page scrape for: ${url}`);
    console.log(`[SCRAPER] Config options:`, {
        turboMode: config?.turboMode !== false,
        ecommerceMode: config?.ecommerceMode,
        useNewConfig: config?.useNewConfig,
        configPreset: config?.configPreset,
        aiOptimizationEnabled: config?.aiOptimization?.enabled
    });
    // In serverless/edge environments, use Redis queue instead of direct crawling
    if (!PlaywrightCrawler || process.env.VERCEL || process.env.NETLIFY) {
        console.log(`[SCRAPER] Serverless environment detected - using Redis queue for scraping`);
        // Create a job ID
        const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        // Queue the job in Redis
        const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
        const jobData = {
            jobId,
            url,
            domain: new URL(url).hostname,
            maxPages: config?.maxPages || 50,
            options: {
                turboMode: config?.turboMode || false,
                configPreset: config?.configPreset,
                useNewConfig: config?.useNewConfig
            },
            createdAt: new Date().toISOString()
        };
        // Add to queue
        await redis.lpush('scrape:queue', JSON.stringify(jobData));
        // Store job status
        await redis.hset(`crawl:${jobId}`, {
            status: 'queued',
            url,
            maxPages: jobData.maxPages,
            createdAt: jobData.createdAt
        });
        // Set expiry for job data (7 days)
        await redis.expire(`crawl:${jobId}`, 604800);
        await redis.quit();
        console.log(`[SCRAPER] Job ${jobId} queued successfully`);
        return {
            url,
            title: '',
            content: '',
            jobId,
            status: 'queued',
            message: 'Scraping job queued. A worker will process it soon.',
            checkStatusUrl: `/api/scrape/status?jobId=${jobId}`
        };
    }
    // Use new configuration system if requested or by default in production
    let finalConfig;
    if (config?.useNewConfig !== false && process.env.NODE_ENV === 'production') {
        console.log(`[SCRAPER] Using new configuration system`);
        // Apply preset if specified
        if (config?.configPreset) {
            console.log(`[SCRAPER] Applying config preset: ${config.configPreset}`);
            (0, scraper_config_1.applyConfigPreset)(config.configPreset);
        }
        // Get configuration from new system
        const scraperConfig = scraper_config_1.configManager.getEffectiveConfig(url);
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
    }
    else {
        console.log(`[SCRAPER] Using legacy configuration system`);
        // Use old configuration system
        const crawlerConfig = (0, crawler_config_1.getCrawlerConfig)();
        finalConfig = { ...crawlerConfig, ...config };
    }
    console.log(`[SCRAPER] Final config timeouts:`, finalConfig.timeouts);
    const turboMode = config?.turboMode !== false; // Default to true
    console.log(`[SCRAPER] Turbo mode: ${turboMode ? 'ENABLED' : 'DISABLED'}`);
    return new Promise(async (resolve, reject) => {
        let result = null;
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
                    async ({ page }) => {
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
                                await page.route('**/*', (route) => {
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
                                    }
                                    else {
                                        route.continue();
                                    }
                                });
                                console.log(`[SCRAPER] Turbo mode blocking configured for: images, media, fonts, stylesheets, tracking domains`);
                            }
                            else if (finalConfig.browser.blockResources.length > 0) {
                                // Legacy mode: Block configured resources
                                console.log(`[SCRAPER] Setting up legacy resource blocking for:`, finalConfig.browser.blockResources);
                                await page.route('**/*', (route) => {
                                    const resourceType = route.request().resourceType();
                                    if (finalConfig.browser.blockResources.includes(resourceType)) {
                                        route.abort();
                                    }
                                    else {
                                        route.continue();
                                    }
                                });
                            }
                            else {
                                console.log(`[SCRAPER] No resource blocking configured`);
                            }
                            console.log(`[SCRAPER] Pre-navigation hook completed successfully`);
                        }
                        catch (preNavError) {
                            console.error(`[SCRAPER] Error in pre-navigation hook:`, preNavError);
                            throw preNavError;
                        }
                    },
                ],
                requestHandler: async ({ page, request }) => {
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
                            }
                            catch (selectorError) {
                                console.warn(`[SCRAPER] Custom selector not found within ${finalConfig.timeouts.resourceLoad}ms: ${finalConfig.advanced.waitForSelector}`);
                                console.warn(`[SCRAPER] Continuing without custom selector...`);
                            }
                        }
                        else {
                            // Try to wait for common content selectors
                            console.log(`[SCRAPER] Waiting for common content selectors...`);
                            try {
                                await page.waitForSelector('main, article, [role="main"], .content', {
                                    timeout: finalConfig.timeouts.resourceLoad
                                });
                                console.log(`[SCRAPER] Common content selector found`);
                            }
                            catch (contentSelectorError) {
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
                        let extracted;
                        if (config?.ecommerceMode !== false) {
                            console.log(`[SCRAPER] Attempting e-commerce extraction...`);
                            // Try e-commerce extraction first
                            extracted = await ecommerce_extractor_1.EcommerceExtractor.extractEcommerce(html, request.url);
                            // If no e-commerce platform detected, fall back to regular extraction
                            if (!extracted.platform) {
                                console.log(`[SCRAPER] No e-commerce platform detected, falling back to regular extraction`);
                                extracted = content_extractor_1.ContentExtractor.extractWithReadability(html, request.url);
                            }
                            else {
                                console.log(`[SCRAPER] E-commerce platform detected: ${extracted.platform}`);
                            }
                        }
                        else {
                            console.log(`[SCRAPER] Using regular content extraction`);
                            // Use regular extraction
                            extracted = content_extractor_1.ContentExtractor.extractWithReadability(html, request.url);
                        }
                        console.log(`[SCRAPER] Content extracted:`, {
                            wordCount: extracted.wordCount,
                            title: extracted.title,
                            hasImages: extracted.images?.length > 0,
                            imageCount: extracted.images?.length || 0,
                            contentLength: extracted.content?.length || 0
                        });
                        // Check if content meets minimum requirements (skip for product pages)
                        const isProductPage = extracted.pageType === 'product';
                        console.log(`[SCRAPER] Page type: ${isProductPage ? 'PRODUCT' : 'REGULAR'}`);
                        if (!isProductPage && extracted.wordCount < finalConfig.content.minWordCount) {
                            const error = `Insufficient content: ${extracted.wordCount} words < ${finalConfig.content.minWordCount} minimum`;
                            console.error(`[SCRAPER] ${error}`);
                            throw new Error(error);
                        }
                        // Check if content is valid
                        if (!isProductPage && !content_extractor_1.ContentExtractor.isValidContent(extracted)) {
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
                        const ecommerceData = extracted;
                        // Apply AI optimization if enabled
                        const aiOptimization = config?.aiOptimization;
                        let aiOptimizedData = null;
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
                                const aiResult = await AIContentExtractor.optimizeContent(extracted.content, aiOptimization);
                                originalTokens = aiResult.metrics.originalTokens;
                                optimizedTokens = aiResult.metrics.optimizedTokens;
                                // Run deduplication if enabled
                                let deduplicationResult = null;
                                if (aiOptimization.deduplicationEnabled) {
                                    deduplicationResult = await DeduplicationService.analyzeContent(extracted.content, request.url);
                                    wasDeduplicated = deduplicationResult.isDuplicate;
                                }
                                aiOptimizedData = {
                                    aiOptimized: true,
                                    optimization: {
                                        originalTokens: aiResult.metrics.originalTokens,
                                        optimizedTokens: aiResult.metrics.optimizedTokens,
                                        reductionPercent: Math.round(((aiResult.metrics.originalTokens - aiResult.metrics.optimizedTokens) /
                                            aiResult.metrics.originalTokens) * 100),
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
                            }
                            catch (error) {
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
                            }
                            finally {
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
                        };
                        console.log(`[SCRAPER] Successfully created result object for: ${request.url}`);
                        console.log(`[SCRAPER] Result summary:`, {
                            url: result.url,
                            title: result.title,
                            wordCount: result.wordCount,
                            hasAIOptimization: 'aiOptimized' in result,
                            totalProcessingTime: `${Date.now() - scrapeStartTime}ms`
                        });
                    }
                    catch (error) {
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
                failedRequestHandler: ({ request, error }, crawlingContext) => {
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
                    }
                    else if (errorMessage.includes('net::') || errorMessage.includes('NS_ERROR')) {
                        const networkError = `Network error scraping ${url}: ${errorMessage}`;
                        console.error(`[SCRAPER] Identified as NETWORK error`);
                        reject(new Error(networkError));
                    }
                    else {
                        console.error(`[SCRAPER] Identified as GENERAL error`);
                        reject(new Error(`Failed to scrape ${url}: ${errorMessage}`));
                    }
                },
            });
            console.log(`[SCRAPER] Crawler instance created successfully`);
            console.log(`[SCRAPER] Starting crawler.run() for URL: ${url}`);
            await crawler.run([url]);
            console.log(`[SCRAPER] Crawler.run() completed`);
            if (result) {
                console.log(`[SCRAPER] SUCCESS: Scraping completed for ${url}`);
                console.log(`[SCRAPER] Total scraping time: ${Date.now() - scrapeStartTime}ms`);
                resolve(result);
            }
            else {
                const noResultError = `Failed to scrape ${url}: No result was produced`;
                console.error(`[SCRAPER] ERROR: ${noResultError}`);
                reject(new Error(noResultError));
            }
        }
        catch (crawlerError) {
            const errorMessage = crawlerError instanceof Error ? crawlerError.message : String(crawlerError);
            console.error(`[SCRAPER] FATAL ERROR during crawler initialization or execution:`, errorMessage);
            console.error(`[SCRAPER] Full error:`, crawlerError);
            reject(new Error(`Crawler initialization/execution failed: ${errorMessage}`));
        }
    });
}
// Crawl an entire website with enhanced memory management and AI optimization
async function crawlWebsite(url, options) {
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startUrl = new URL(url);
    const maxPages = options?.maxPages ?? -1; // Default to unlimited for production
    const crawlEntireSite = options?.maxPages === -1;
    console.log(`[CRAWLER] Starting website crawl with job ID: ${jobId}`);
    console.log(`[CRAWLER] Target URL: ${url}`);
    console.log(`[CRAWLER] Max pages: ${crawlEntireSite ? 'UNLIMITED (entire site)' : maxPages}`);
    console.log(`[CRAWLER] Options:`, {
        includePaths: options?.includePaths,
        excludePaths: options?.excludePaths,
        configPreset: options?.configPreset,
        turboMode: options?.turboMode !== false,
        ownSite: options?.ownSite,
        customerId: options?.customerId,
        useNewConfig: options?.useNewConfig,
        newConfigPreset: options?.newConfigPreset,
        aiOptimizationEnabled: options?.aiOptimization?.enabled
    });
    // Load customer's owned domains if customerId provided
    if (options?.customerId) {
        console.log(`[CRAWLER] Loading customer configuration for ID: ${options.customerId}`);
        try {
            await customer_config_loader_1.CustomerConfigLoader.initializeForScraping(options.customerId);
            console.log(`[CRAWLER] Customer owned domains loaded successfully`);
        }
        catch (customerLoadError) {
            console.error(`[CRAWLER] Failed to load customer configuration:`, customerLoadError);
        }
        // Load customer-specific configuration from database if using new config
        if (options?.useNewConfig) {
            console.log(`[CRAWLER] Loading customer-specific scraper configuration from database`);
            try {
                await (0, scraper_config_1.loadCustomerConfig)(options.customerId);
                console.log(`[CRAWLER] Customer scraper configuration loaded successfully`);
            }
            catch (configLoadError) {
                console.error(`[CRAWLER] Failed to load customer scraper configuration:`, configLoadError);
            }
        }
    }
    // Get configuration
    let crawlerConfig;
    console.log(`[CRAWLER] Determining configuration approach...`);
    // Use new configuration system if requested
    if (options?.useNewConfig) {
        // Apply preset if specified
        if (options?.newConfigPreset) {
            (0, scraper_config_1.applyConfigPreset)(options.newConfigPreset);
        }
        // Get configuration from new system
        const scraperConfig = scraper_config_1.configManager.getEffectiveConfig(url);
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
    }
    else {
        // Use old configuration system
        crawlerConfig = (0, crawler_config_1.getCrawlerConfig)(options?.configPreset);
    }
    // Auto-detect if this is an owned site
    console.log(`[CRAWLER] Checking if URL is an owned site...`);
    const isOwnSite = options?.ownSite || await own_site_detector_1.OwnSiteDetector.isOwnSite(url);
    console.log(`[CRAWLER] Own-site detection result: ${isOwnSite ? 'YES (owned)' : 'NO (external)'}`);
    // Apply own-site optimizations if enabled or detected
    if (isOwnSite) {
        console.log(`[CRAWLER] Applying own-site optimizations...`);
        // Enable higher limits in job limiter
        job_limiter_1.jobLimiter.enableOwnSiteMode();
        console.log(`[CRAWLER] Job limiter set to own-site mode (higher limits)`);
        // Import and apply own-site config
        try {
            const { ownSiteConfig } = await Promise.resolve().then(() => __importStar(require('./scraper-config-own-site')));
            crawlerConfig = { ...crawlerConfig, ...ownSiteConfig };
            console.log(`[${jobId}] Own-site mode ${options?.ownSite ? 'explicitly enabled' : 'auto-detected'} with optimized configuration`);
            console.log(`[CRAWLER] Own-site config applied successfully`);
        }
        catch (ownSiteConfigError) {
            console.error(`[CRAWLER] Failed to apply own-site configuration:`, ownSiteConfigError);
        }
    }
    const finalConfig = { ...crawlerConfig, ...options?.config };
    const turboMode = options?.turboMode !== false; // Default to true
    console.log(`[CRAWLER] Final configuration prepared`);
    console.log(`[CRAWLER] Turbo mode: ${turboMode ? 'ENABLED' : 'DISABLED'}`);
    // Check if we can start a new job
    // Temporarily disabled for testing - normally prevents high memory usage
    // console.log(`[CRAWLER] Checking job limiter...`);
    // const { allowed, reason } = await jobLimiter.canStartNewJob();
    // if (!allowed) {
    //   console.error(`[CRAWLER] Job limiter prevented new job: ${reason}`);
    //   throw new Error(`Cannot start new job: ${reason}`);
    // }
    // console.log(`[CRAWLER] Job limiter check passed`);
    // Initialize job in Redis
    console.log(`[CRAWLER] Creating job in Redis/memory store...`);
    const initialJob = {
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
    try {
        await jobManager.createJob(jobId, initialJob);
        console.log(`[CRAWLER] Job created successfully with ID: ${jobId}`);
    }
    catch (jobCreateError) {
        console.error(`[CRAWLER] Failed to create job in store:`, jobCreateError);
        throw jobCreateError;
    }
    // Start memory monitoring
    console.log(`[CRAWLER] Starting memory monitoring for job ${jobId}`);
    memoryMonitor.startMonitoring(async (stats) => {
        // Log memory status periodically (only when significant change)
        if (Math.random() < 0.1) { // Log 10% of memory updates to avoid spam
            console.log(`[CRAWLER] Memory update - Heap: ${(stats.heapUsed / 1024 / 1024).toFixed(2)}MB / ${(stats.heapTotal / 1024 / 1024).toFixed(2)}MB (${(stats.percentUsed * 100).toFixed(1)}% used)`);
        }
        await jobManager.updateJob(jobId, { memoryStats: stats });
        // Pause crawl if memory pressure is too high
        if (stats.percentUsed > 0.9) {
            console.warn(`[CRAWLER] CRITICAL: Memory pressure at ${(stats.percentUsed * 100).toFixed(1)}%, pausing crawl...`);
            await jobManager.updateJob(jobId, {
                status: 'paused',
                pausedAt: new Date().toISOString(),
            });
        }
    });
    // Try to discover URLs from sitemap first
    let sitemapUrls = [];
    try {
        console.log(`[${jobId}] Checking for sitemap at ${startUrl.origin}/sitemap.xml`);
        const parser = new sitemap_parser_1.SitemapParser();
        const sitemapEntries = await parser.parseSitemapFromUrl(`${startUrl.origin}/sitemap.xml`);
        if (sitemapEntries && sitemapEntries.length > 0) {
            console.log(`[${jobId}] Found ${sitemapEntries.length} URLs in sitemap!`);
            sitemapUrls = sitemapEntries.map(entry => entry.loc);
            // Update job with discovered URLs count
            await jobManager.updateJob(jobId, {
                total: Math.min(sitemapEntries.length, maxPages === -1 ? sitemapEntries.length : maxPages),
                sitemapDetected: true,
                sitemapUrlCount: sitemapEntries.length
            });
        }
    }
    catch (sitemapError) {
        console.log(`[${jobId}] No sitemap found or error parsing: ${sitemapError instanceof Error ? sitemapError.message : String(sitemapError)}`);
        // Continue with regular crawling
    }
    // Start crawling in background using child process
    console.log(`[${jobId}] Preparing to spawn crawler worker process...`);
    // Use the scraper worker process from lib directory
    const crawlerPath = (0, path_1.join)(process.cwd(), 'lib', 'scraper-worker.js');
    console.log(`[${jobId}] Worker script path: ${crawlerPath}`);
    // Check if worker file exists
    const fs = require('fs');
    if (!fs.existsSync(crawlerPath)) {
        console.error(`[${jobId}] ERROR: Worker script not found at ${crawlerPath}`);
        throw new Error(`Worker script not found at ${crawlerPath}`);
    }
    const workerArgs = [
        crawlerPath,
        jobId,
        url,
        maxPages.toString(),
        turboMode.toString(),
        options?.configPreset || 'memoryEfficient', // Better default for large sites
        isOwnSite ? 'true' : 'false', // Pass own-site flag (detected or explicit)
        JSON.stringify(sitemapUrls.slice(0, maxPages === -1 ? undefined : maxPages)), // Pass sitemap URLs if found
        (options?.forceRescrape ? 'true' : 'false')
    ];
    console.log(`[${jobId}] Spawning worker with arguments:`, workerArgs);
    console.log(`[${jobId}] Worker environment: NODE_ENV=${process.env.NODE_ENV}`);
    try {
        const child = (0, child_process_1.spawn)('node', workerArgs, {
            cwd: process.cwd(),
            env: { ...process.env },
            stdio: 'inherit'
        });
        console.log(`[${jobId}] Worker process spawned with PID: ${child.pid}`);
        child.on('error', (error) => {
            console.error(`[${jobId}] ERROR: Failed to spawn crawler worker:`);
            console.error(`[${jobId}] Error message: ${error.message}`);
            console.error(`[${jobId}] Error stack:`, error.stack);
            console.error(`[${jobId}] Error details:`, error);
            jobManager.updateJob(jobId, {
                status: 'failed',
                completedAt: new Date().toISOString(),
                errors: [{
                        url: url,
                        error: `Failed to spawn worker: ${error.message}`,
                        timestamp: new Date().toISOString(),
                    }],
            }).catch((updateError) => {
                console.error(`[${jobId}] Failed to update job status after spawn error:`, updateError);
            });
        });
        child.on('exit', async (code, signal) => {
            console.log(`[${jobId}] Worker process exited with code: ${code}, signal: ${signal}`);
            if (code !== 0) {
                console.error(`[${jobId}] WARNING: Crawler worker exited with non-zero code ${code}`);
                if (signal) {
                    console.error(`[${jobId}] Worker was terminated by signal: ${signal}`);
                }
                // Check Redis for the actual error message from the worker
                try {
                    const job = await jobManager.getJob(jobId);
                    if (job && job.status === 'failed' && job.error) {
                        console.error(`[${jobId}] ========================================`);
                        console.error(`[${jobId}] WORKER REPORTED ERROR: ${job.error}`);
                        console.error(`[${jobId}] ========================================`);
                        // Check if it's an environment variable error
                        if (job.error.includes('environment variable') || job.error.includes('Missing')) {
                            console.error(`[${jobId}] ACTION REQUIRED: Please configure the required environment variables:`);
                            console.error(`[${jobId}]   - NEXT_PUBLIC_SUPABASE_URL`);
                            console.error(`[${jobId}]   - SUPABASE_SERVICE_ROLE_KEY`);
                            console.error(`[${jobId}]   - OPENAI_API_KEY`);
                            console.error(`[${jobId}] See .env.example for more details`);
                        }
                    }
                    else if (code === 1 && (!job || job.status !== 'failed')) {
                        // Worker exited with error but no specific error in Redis
                        console.error(`[${jobId}] Worker process failed without reporting specific error`);
                        await jobManager.updateJob(jobId, {
                            status: 'failed',
                            completedAt: new Date().toISOString(),
                            error: 'Worker process failed to initialize. Check environment variables and logs.',
                        });
                    }
                }
                catch (error) {
                    console.error(`[${jobId}] Failed to check worker status in Redis:`, error);
                }
            }
            else {
                console.log(`[${jobId}] Crawler worker completed successfully`);
            }
            console.log(`[${jobId}] Stopping memory monitoring`);
            memoryMonitor.stopMonitoring();
        });
        child.on('close', (code, signal) => {
            console.log(`[${jobId}] Worker process closed with code: ${code}, signal: ${signal}`);
        });
    }
    catch (spawnError) {
        console.error(`[${jobId}] FATAL ERROR: Failed to spawn worker process:`, spawnError);
        throw spawnError;
    }
    // The rest of the crawling logic is now in crawler-worker.ts
    return jobId;
}
// Check crawl job status with pagination support
async function checkCrawlStatus(jobId, options) {
    console.log(`[STATUS] Checking status for job: ${jobId}`);
    console.log(`[STATUS] Options:`, {
        includeResults: options?.includeResults,
        offset: options?.offset,
        limit: options?.limit
    });
    try {
        const job = await jobManager.getJob(jobId);
        if (!job) {
            const error = `Job ${jobId} not found`;
            console.error(`[STATUS] ERROR: ${error}`);
            throw new Error(error);
        }
        console.log(`[STATUS] Job found:`, {
            jobId: job.jobId,
            status: job.status,
            progress: job.progress,
            total: job.total,
            completed: job.completed,
            failed: job.failed
        });
        // Get total result count
        const resultCount = await jobManager.getResultCount(jobId);
        console.log(`[STATUS] Total results in storage: ${resultCount}`);
        // If completed and results requested, include paginated results
        if (job.status === 'completed' && options?.includeResults) {
            console.log(`[STATUS] Fetching results: offset=${options.offset || 0}, limit=${options.limit || 100}`);
            try {
                const results = await jobManager.getJobResults(jobId, options.offset || 0, options.limit || 100);
                console.log(`[STATUS] Retrieved ${results.length} results from storage`);
                return { ...job, data: results, resultCount };
            }
            catch (resultsError) {
                console.error(`[STATUS] Failed to fetch results:`, resultsError);
                throw resultsError;
            }
        }
        return { ...job, resultCount };
    }
    catch (statusError) {
        console.error(`[STATUS] Error checking job status:`, statusError);
        throw statusError;
    }
}
// Stream results for very large crawls
async function* streamCrawlResults(jobId) {
    console.log(`[STREAM] Starting to stream results for job: ${jobId}`);
    try {
        let count = 0;
        for await (const result of jobManager.streamJobResults(jobId)) {
            count++;
            if (count % 10 === 0) { // Log every 10th result to avoid spam
                console.log(`[STREAM] Streamed ${count} results so far`);
            }
            yield result;
        }
        console.log(`[STREAM] Finished streaming ${count} total results`);
    }
    catch (streamError) {
        console.error(`[STREAM] Error streaming results:`, streamError);
        throw streamError;
    }
}
// Utility functions for AI optimization
function createAIOptimizationConfig(overrides) {
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
function isAIOptimizedResult(result) {
    return 'aiOptimized' in result;
}
function convertToStandardResult(result) {
    if (isAIOptimizedResult(result)) {
        const { aiOptimized, optimization, semanticChunks, aiMetadata, deduplication, ...standardResult } = result;
        return standardResult;
    }
    return result;
}
function getOptimizationMetrics(result) {
    if (isAIOptimizedResult(result) && result.aiOptimized) {
        return {
            isOptimized: true,
            ...result.optimization
        };
    }
    return { isOptimized: false };
}
// Clear AI service caches
function clearAIOptimizationCache() {
    DeduplicationService.clearCache();
    console.log('AI optimization caches cleared');
}
// Utility function to apply AI optimization preset to config
function applyAIOptimizationPreset(preset, overrides) {
    const baseConfig = (0, crawler_config_1.getAIOptimizationConfig)(preset);
    return { ...baseConfig, ...overrides };
}
// Resume a paused crawl
async function resumeCrawl(jobId) {
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
    const resumeOptions = {
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
        }
        else if (job.config?.mode === 'sitemap') {
            // Resume sitemap crawl
            // crawlFromSitemap function not implemented yet
            console.log('Sitemap crawl resume not yet implemented');
            throw new Error('crawlFromSitemap function not implemented');
        }
        else {
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
    }
    catch (error) {
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
async function getHealthStatus() {
    console.log(`[HEALTH] Checking system health status...`);
    try {
        const redisHealth = await jobManager.getHealthStatus();
        console.log(`[HEALTH] Redis status:`, {
            connected: redisHealth.redis,
            fallbackActive: redisHealth.fallbackActive
        });
        const memoryStats = memoryMonitor.getMemoryStats();
        console.log(`[HEALTH] Memory stats:`, {
            heapUsed: `${(memoryStats.heapUsed / 1024 / 1024).toFixed(2)}MB`,
            heapTotal: `${(memoryStats.heapTotal / 1024 / 1024).toFixed(2)}MB`,
            percentUsed: `${(memoryStats.percentUsed * 100).toFixed(1)}%`
        });
        const aiMetrics = aiOptimizationMonitor.getMetrics();
        console.log(`[HEALTH] AI optimization metrics:`, {
            totalProcessed: aiMetrics.totalProcessed,
            totalOptimized: aiMetrics.totalOptimized,
            cacheHitRate: aiMetrics.cacheHitRate,
            averageCompressionRatio: aiMetrics.averageCompressionRatio
        });
        const healthStatus = {
            redis: redisHealth.redis,
            memory: memoryStats,
            fallbackActive: redisHealth.fallbackActive,
            crawlerReady: true,
            aiOptimization: {
                metrics: aiMetrics,
                insights: aiOptimizationMonitor.getInsights()
            }
        };
        console.log(`[HEALTH] Health check complete`);
        return healthStatus;
    }
    catch (healthError) {
        console.error(`[HEALTH] Error checking health status:`, healthError);
        throw healthError;
    }
}
// Get detailed AI optimization metrics
function getAIOptimizationMetrics() {
    return aiOptimizationMonitor.getMetrics();
}
// Reset AI optimization metrics
function resetAIOptimizationMetrics() {
    aiOptimizationMonitor.reset();
}
// Clean up old jobs
async function cleanupOldJobs(olderThanHours = 24) {
    // This would be implemented with Redis SCAN command
    // For now, return 0
    console.log(`Cleanup not yet implemented for jobs older than ${olderThanHours} hours`);
    return 0;
}
var crawler_config_2 = require("./crawler-config");
Object.defineProperty(exports, "crawlerPresets", { enumerable: true, get: function () { return crawler_config_2.crawlerPresets; } });
// Configure owned domains
function configureOwnedDomains(domains) {
    domains.forEach(domain => own_site_detector_1.OwnSiteDetector.addOwnedDomain(domain));
}
// Check if a URL is an owned site
async function isOwnedSite(url) {
    return own_site_detector_1.OwnSiteDetector.isOwnSite(url);
}
// AI optimization types are already exported above
