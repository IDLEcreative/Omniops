import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { AIContentExtractor, SemanticChunk, AIOptimizedContent } from '@/lib/ai-content-extractor';
import { PatternLearner, DomainPatterns } from '@/lib/pattern-learner';
import { EnhancedRateLimiter, RateLimiterPresets } from '@/lib/rate-limiter-enhanced';
import { ContentDeduplicator } from '@/lib/content-deduplicator';
import { getCrawlerConfig, getAIOptimizationConfig } from '@/lib/crawler-config';
import { EcommerceExtractor } from '@/lib/ecommerce-extractor';
import { TestDataGenerator, MockUtilities, TestHelpers, PerformanceMonitor, MemoryTracker } from './test-utils';

describe('Enhanced Scraper System - Basic Tests', () => {
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

  describe('1. E-commerce Scraping with AI Optimization', () => {
    it('should complete full e-commerce extraction pipeline', async () => {
      performanceMonitor.start();

      const testHTML = TestDataGenerator.generateEcommerceHTML(3);
      const testURL = 'https://teststore.com/products';

      performanceMonitor.checkpoint('html-generated');

      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);

      TestHelpers.validateAIOptimizedContent(optimizedContent);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);
      expect(optimizedContent.chunks.length).toBeGreaterThan(0);

      performanceMonitor.checkpoint('ai-optimization-complete');

      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });

      expect(products.length).toBe(3);
      products.forEach(TestHelpers.validateNormalizedProduct);

      performanceMonitor.checkpoint('ecommerce-extraction-complete');

      const contentHash = await deduplicator.processContent(
        optimizedContent.content,
        testURL,
        {
          similarityThreshold: 0.8,
          enableCompression: true,
          batchSize: 100,
          useRedis: false,
          detectTemplates: true
        }
      );

      expect(contentHash).toBeTruthy();
      expect(typeof contentHash).toBe('string');

      performanceMonitor.checkpoint('deduplication-complete');

      await PatternLearner.learnFromExtraction(testURL, products, {
        platform: 'custom',
        selectors: {
          name: '.product-title',
          price: '.price',
          sku: '.sku'
        },
        extractionMethod: 'dom'
      });

      performanceMonitor.checkpoint('pattern-learning-complete');

      const results = performanceMonitor.getResults();
      const memoryUsage = memoryTracker.getCurrentUsage();

      expect(results.totalTime).toBeLessThan(30000);
      expect(memoryUsage.heapUsedDelta).toBeLessThan(100);

      console.log('E-commerce pipeline performance:', {
        totalTime: results.totalTime,
        checkpoints: results.checkpoints,
        memoryUsage: memoryUsage,
        compressionRatio: optimizedContent.compressionRatio,
        productsExtracted: products.length
      });
    });

    it('should handle token reduction effectively', async () => {
      const testHTML = TestDataGenerator.generateLargeContentHTML();
      const testURL = 'https://large-content.com/page';

      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);

      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.3);
      expect(optimizedContent.optimizedTokens).toBeLessThan(optimizedContent.originalTokens);
      expect(optimizedContent.processingStats.removedElements).toBeGreaterThan(0);

      TestHelpers.validateSemanticChunks(optimizedContent.chunks);
      expect(optimizedContent.chunks.some(c => c.type === 'main')).toBe(true);

      expect(optimizedContent.summary.length).toBeGreaterThan(10);
      expect(optimizedContent.keyFacts.length).toBeGreaterThanOrEqual(0);
      expect(optimizedContent.topicTags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('2. Pattern Learning Flow', () => {
    it('should learn and apply patterns effectively', async () => {
      const testURL = 'https://pattern-test.com/product';
      const testHTML = TestDataGenerator.generateEcommerceHTML(1);

      supabaseMock.single.mockResolvedValueOnce({ data: null, error: null });
      supabaseMock.insert.mockResolvedValue({ data: {}, error: null });

      const extractor = new EcommerceExtractor();
      const firstProducts = await extractor.extractProducts(testHTML, { url: testURL });

      await PatternLearner.learnFromExtraction(testURL, firstProducts, {
        platform: 'test-platform',
        selectors: { name: '.product-title', price: '.price' },
        extractionMethod: 'dom'
      });

      expect(supabaseMock.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: 'pattern-test.com',
          platform: 'test-platform',
          patterns: expect.arrayContaining([
            expect.objectContaining({
              fieldType: 'name',
              confidence: expect.any(Number)
            })
          ])
        })
      );

      const mockPatterns: DomainPatterns = {
        domain: 'pattern-test.com',
        platform: 'test-platform',
        patterns: [
          {
            selector: '.product-title',
            fieldType: 'name',
            confidence: 0.95,
            extractionMethod: 'dom'
          },
          {
            selector: '.price',
            fieldType: 'price',
            confidence: 0.90,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.95,
        totalExtractions: 5
      };

      supabaseMock.single.mockResolvedValue({ data: mockPatterns, error: null });

      const patterns = await PatternLearner.getPatterns(testURL);
      expect(patterns).toEqual(mockPatterns);
      expect(patterns!.successRate).toBe(0.95);
      expect(patterns!.patterns.length).toBe(2);

      expect(patterns!.patterns.every(p => p.confidence >= 0.9)).toBe(true);
    });
  });

  describe('3. Configuration Management', () => {
    it('should load different presets correctly', async () => {
      const fastConfig = getCrawlerConfig('fast');
      const carefulConfig = getCrawlerConfig('careful');
      const ecommerceConfig = getCrawlerConfig('ecommerce');

      expect(fastConfig.maxConcurrency).toBeGreaterThan(carefulConfig.maxConcurrency);
      expect(fastConfig.timeouts.request).toBeLessThan(carefulConfig.timeouts.request);

      expect(ecommerceConfig.content.extractImages).toBe(true);
      expect(ecommerceConfig.content.minWordCount).toBeLessThan(fastConfig.content.minWordCount);
    });

    it('should apply runtime overrides correctly', async () => {
      const originalConcurrency = process.env.CRAWLER_MAX_CONCURRENCY;
      process.env.CRAWLER_MAX_CONCURRENCY = '15';

      const config = getCrawlerConfig('fast');
      expect(config.maxConcurrency).toBe(15);

      if (originalConcurrency !== undefined) {
        process.env.CRAWLER_MAX_CONCURRENCY = originalConcurrency;
      } else {
        delete process.env.CRAWLER_MAX_CONCURRENCY;
      }
    });

    it('should provide AI optimization configurations', async () => {
      const standardConfig = getAIOptimizationConfig('standard');
      const qualityConfig = getAIOptimizationConfig('quality');

      expect(standardConfig.enabled).toBe(true);
      expect(standardConfig.level).toBe('standard');
      expect(standardConfig.tokenTarget).toBe(2000);

      expect(qualityConfig.tokenTarget).toBeGreaterThan(standardConfig.tokenTarget);
      expect(qualityConfig.preserveContent.length).toBeGreaterThan(standardConfig.preserveContent.length);
    });
  });
});
