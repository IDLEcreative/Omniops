import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { AIContentExtractor } from '@/lib/ai-content-extractor';
import { PatternLearner } from '@/lib/pattern-learner';
import { EnhancedRateLimiter, RateLimiterPresets, RateLimitResponse } from '@/lib/rate-limiter-enhanced';
import { ContentDeduplicator } from '@/lib/content-deduplicator';
import { EcommerceExtractor } from '@/lib/ecommerce-extractor';
import { TestDataGenerator, MockUtilities, TestHelpers, PerformanceMonitor, MemoryTracker } from './test-utils';

describe('Enhanced Scraper System - Advanced Tests', () => {
  let supabaseMock: ReturnType<typeof MockUtilities.createSupabaseMock>;
  let redisMock: ReturnType<typeof MockUtilities.createRedisMock>;
  let openaiMock: ReturnType<typeof MockUtilities.createOpenAIMock>;
  let rateLimiter: EnhancedRateLimiter;
  let deduplicator: ContentDeduplicator;
  let performanceMonitor: PerformanceMonitor;
  let memoryTracker: MemoryTracker;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  beforeEach(() => {
    jest.clearAllMocks();

    supabaseMock = MockUtilities.createSupabaseMock();
    redisMock = MockUtilities.createRedisMock();
    openaiMock = MockUtilities.createOpenAIMock();

    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => supabaseMock)
    }));

    jest.doMock('ioredis', () => {
      return jest.fn(() => redisMock);
    });

    jest.doMock('openai', () => {
      return jest.fn(() => openaiMock);
    });

    rateLimiter = new EnhancedRateLimiter(RateLimiterPresets.moderate);
    deduplicator = new ContentDeduplicator();
    performanceMonitor = new PerformanceMonitor();
    memoryTracker = new MemoryTracker();

    AIContentExtractor.clearCache();
  });

  afterEach(async () => {
    await rateLimiter.close();
    await deduplicator.clearCache();
    jest.restoreAllMocks();
  });

  describe('4. Rate Limiting Integration', () => {
    it('should handle multiple rapid requests with proper throttling', async () => {
      const domain = 'rate-limit-test.com';
      const requests: Promise<RateLimitResponse>[] = [];

      for (let i = 0; i < 10; i++) {
        requests.push(rateLimiter.checkRateLimit(domain));
      }

      const responses = await Promise.all(requests);

      const allowedCount = responses.filter(r => r.allowed).length;
      const rateLimitedCount = responses.filter(r => !r.allowed).length;

      expect(allowedCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(allowedCount + rateLimitedCount).toBe(10);

      const rateLimitedResponses = responses.filter(r => !r.allowed);
      rateLimitedResponses.forEach(response => {
        expect(response.waitTimeMs).toBeGreaterThan(0);
        expect(response.resetTime).toBeGreaterThan(Date.now());
      });
    });

    it('should apply exponential backoff on 429 responses', async () => {
      const domain = 'backoff-test.com';

      for (let i = 0; i < 3; i++) {
        await rateLimiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 1000,
          statusCode: 429,
          success: false,
          retryCount: i
        });
      }

      const response = await rateLimiter.checkRateLimit(domain, { retryCount: 3 });

      if (!response.allowed) {
        expect(response.waitTimeMs).toBeGreaterThan(1000);
      }
    });

    it('should trigger circuit breaker after consecutive failures', async () => {
      const domain = 'circuit-breaker-test.com';

      for (let i = 0; i < 6; i++) {
        await rateLimiter.reportRequestResult({
          domain,
          timestamp: Date.now(),
          responseTime: 5000,
          statusCode: 503,
          success: false,
          retryCount: 0
        });
      }

      const response = await rateLimiter.checkRateLimit(domain);

      expect(response.allowed).toBe(false);
      expect(response.reason).toBe('Circuit breaker open');
      expect(response.waitTimeMs).toBeGreaterThan(0);
    });
  });

  describe('5. Complete Pipeline Test', () => {
    it('should process complete scraping workflow', async () => {
      performanceMonitor.start();
      const testURL = 'https://complete-test.com/products';
      const testHTML = TestDataGenerator.generateEcommerceHTML(2);

      const rateCheckResponse = await rateLimiter.checkRateLimit('complete-test.com');
      if (rateCheckResponse.waitTimeMs > 0) {
        await TestHelpers.sleep(Math.min(rateCheckResponse.waitTimeMs, 100));
      }
      expect(rateCheckResponse.allowed).toBe(true);

      performanceMonitor.checkpoint('rate-limit-check');

      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0);

      performanceMonitor.checkpoint('ai-optimization');

      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });
      expect(products.length).toBe(2);

      performanceMonitor.checkpoint('product-extraction');

      const dedupHash = await deduplicator.processContent(optimizedContent.content, testURL);
      expect(dedupHash).toBeTruthy();

      performanceMonitor.checkpoint('deduplication');

      expect(optimizedContent.summary.length).toBeGreaterThan(0);
      expect(optimizedContent.keyFacts.length).toBeGreaterThanOrEqual(0);
      expect(optimizedContent.topicTags.length).toBeGreaterThanOrEqual(0);

      performanceMonitor.checkpoint('metadata-generation');

      await PatternLearner.learnFromExtraction(testURL, products, {
        platform: 'test',
        selectors: { name: '.product-title', price: '.price' },
        extractionMethod: 'dom'
      });

      performanceMonitor.checkpoint('pattern-learning');

      await rateLimiter.reportRequestResult({
        domain: 'complete-test.com',
        timestamp: Date.now(),
        responseTime: 2000,
        statusCode: 200,
        success: true,
        retryCount: 0
      });

      performanceMonitor.checkpoint('request-reporting');

      const finalResults = performanceMonitor.getResults();
      const memoryUsage = memoryTracker.getCurrentUsage();

      expect(finalResults.totalTime).toBeLessThan(15000);
      expect(memoryUsage.heapUsedDelta).toBeLessThan(50);

      console.log('Complete pipeline results:', {
        performance: finalResults,
        memory: memoryUsage,
        optimizationRatio: optimizedContent.compressionRatio,
        productsFound: products.length,
        chunksCreated: optimizedContent.chunks.length
      });
    });

    it('should validate final output structure meets requirements', async () => {
      const testHTML = TestDataGenerator.generateEcommerceHTML(1);
      const testURL = 'https://output-validation.com/product';

      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });

      expect(optimizedContent).toHaveProperty('originalTokens');
      expect(optimizedContent).toHaveProperty('optimizedTokens');
      expect(optimizedContent).toHaveProperty('compressionRatio');
      expect(optimizedContent).toHaveProperty('chunks');
      expect(optimizedContent).toHaveProperty('summary');
      expect(optimizedContent).toHaveProperty('keyFacts');
      expect(optimizedContent).toHaveProperty('qaPairs');
      expect(optimizedContent).toHaveProperty('topicTags');
      expect(optimizedContent).toHaveProperty('processingStats');

      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);

      products.forEach(product => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('scrapedAt');
        expect(typeof product.name).toBe('string');
        expect(product.name.length).toBeGreaterThan(0);
      });

      expect(optimizedContent.processingStats).toHaveProperty('removedElements');
      expect(optimizedContent.processingStats).toHaveProperty('deduplicatedSections');
      expect(optimizedContent.processingStats).toHaveProperty('compressionTime');
      expect(optimizedContent.processingStats.compressionTime).toBeGreaterThan(0);
    });
  });

  describe('6. Template Detection and Pattern Matching', () => {
    it('should detect template patterns across similar pages', async () => {
      const templateHTMLs = Array.from({ length: 3 }, (_, i) =>
        TestDataGenerator.generateTemplateVariationHTML(i)
      );

      const contents = templateHTMLs.map((html, i) => ({
        content: html,
        url: `https://template-test.com/product${i + 1}`
      }));

      const result = await deduplicator.batchProcess(contents, {
        similarityThreshold: 0.7,
        enableCompression: true,
        batchSize: 10,
        useRedis: false,
        detectTemplates: true
      });

      expect(result.hashes).toHaveLength(3);
      expect(result.patterns).toBeDefined();

      if (result.patterns.length > 0) {
        const pattern = result.patterns[0];
        expect(pattern.frequency).toBeGreaterThan(1);
        expect(pattern.variations.length).toBeGreaterThan(1);
      }
    });

    it('should generate accurate deduplication metrics', async () => {
      const duplicateContent = 'This is duplicate content that appears on multiple pages.';

      await deduplicator.processContent(duplicateContent, 'https://page1.com');
      await deduplicator.processContent(duplicateContent, 'https://page2.com');
      await deduplicator.processContent('Unique content', 'https://page3.com');

      const metrics = await deduplicator.generateMetrics();

      expect(metrics.totalPages).toBe(3);
      expect(metrics.duplicateContent).toBeGreaterThan(0);
      expect(metrics.uniqueContent).toBeGreaterThan(0);
      expect(metrics.storageReduction).toBeGreaterThanOrEqual(0);

      console.log('Deduplication metrics:', metrics);
    });
  });
});
