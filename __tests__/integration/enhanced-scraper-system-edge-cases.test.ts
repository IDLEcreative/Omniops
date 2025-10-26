import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { AIContentExtractor } from '@/lib/ai-content-extractor';
import { PatternLearner } from '@/lib/pattern-learner';
import { EnhancedRateLimiter, RateLimiterPresets } from '@/lib/rate-limiter-enhanced';
import { ContentDeduplicator } from '@/lib/content-deduplicator';
import { TestDataGenerator, MockUtilities, MemoryTracker } from './test-utils';

describe('Enhanced Scraper System - Edge Cases and Error Handling', () => {
  let supabaseMock: ReturnType<typeof MockUtilities.createSupabaseMock>;
  let redisMock: ReturnType<typeof MockUtilities.createRedisMock>;
  let openaiMock: ReturnType<typeof MockUtilities.createOpenAIMock>;
  let rateLimiter: EnhancedRateLimiter;
  let deduplicator: ContentDeduplicator;
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
    memoryTracker = new MemoryTracker();

    AIContentExtractor.clearCache();
  });

  afterEach(async () => {
    await rateLimiter.close();
    await deduplicator.clearCache();
    jest.restoreAllMocks();
  });

  describe('7. Error Scenarios and Edge Cases', () => {
    it('should handle malformed HTML gracefully', async () => {
      const malformedHTML = '<html><body><div>Unclosed div<p>Unclosed paragraph</body>';
      const testURL = 'https://malformed-test.com';

      const optimizedContent = await AIContentExtractor.extractOptimized(malformedHTML, testURL);

      expect(optimizedContent).toBeDefined();
      expect(optimizedContent.content).toBeTruthy();
    });

    it('should handle empty content', async () => {
      const emptyHTML = '<html><body></body></html>';
      const testURL = 'https://empty-test.com';

      const optimizedContent = await AIContentExtractor.extractOptimized(emptyHTML, testURL);

      expect(optimizedContent.originalTokens).toBe(0);
      expect(optimizedContent.optimizedTokens).toBe(0);
      expect(optimizedContent.chunks.length).toBe(0);
    });

    it('should handle network timeouts in rate limiter', async () => {
      const domain = 'timeout-test.com';

      await rateLimiter.reportRequestResult({
        domain,
        timestamp: Date.now(),
        responseTime: 30000,
        statusCode: 0,
        success: false,
        retryCount: 0
      });

      const response = await rateLimiter.checkRateLimit(domain);
      expect(response).toBeDefined();
    });

    it('should handle database connection failures', async () => {
      supabaseMock.single.mockRejectedValue(new Error('Database connection failed'));

      const testURL = 'https://db-error-test.com/product';
      const products = [{ name: 'Test Product', scrapedAt: new Date().toISOString() }];

      await expect(PatternLearner.learnFromExtraction(testURL, products, {}))
        .resolves.toBeUndefined();
    });
  });

  describe('8. Performance Benchmarks', () => {
    it('should meet performance benchmarks for large content', async () => {
      const largeHTML = TestDataGenerator.generateLargeContentHTML();
      const testURL = 'https://performance-test.com/large';

      const startTime = Date.now();
      const optimizedContent = await AIContentExtractor.extractOptimized(largeHTML, testURL);
      const processingTime = Date.now() - startTime;

      expect(processingTime).toBeLessThan(10000);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.3);
      expect(optimizedContent.processingStats.compressionTime).toBeLessThan(processingTime);

      console.log('Large content performance:', {
        processingTime,
        compressionRatio: optimizedContent.compressionRatio,
        originalTokens: optimizedContent.originalTokens,
        optimizedTokens: optimizedContent.optimizedTokens
      });
    });

    it('should maintain memory efficiency during processing', async () => {
      const initialMemory = memoryTracker.getCurrentUsage();

      for (let i = 0; i < 5; i++) {
        const html = TestDataGenerator.generateEcommerceHTML(2);
        const url = `https://memory-test-${i}.com/products`;

        await AIContentExtractor.extractOptimized(html, url);
      }

      const finalMemory = memoryTracker.getCurrentUsage();
      const memoryIncrease = finalMemory.heapUsedDelta;

      expect(memoryIncrease).toBeLessThan(100);

      console.log('Memory efficiency test:', {
        initialMemory: initialMemory.heapUsed,
        finalMemory: finalMemory.heapUsed,
        memoryIncrease
      });
    });

    it('should handle concurrent processing efficiently', async () => {
      const concurrentTasks = Array.from({ length: 5 }, (_, i) => {
        const html = TestDataGenerator.generateEcommerceHTML(1);
        const url = `https://concurrent-test-${i}.com/product`;
        return AIContentExtractor.extractOptimized(html, url);
      });

      const startTime = Date.now();
      const results = await Promise.all(concurrentTasks);
      const totalTime = Date.now() - startTime;

      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.compressionRatio).toBeGreaterThan(0);
      });

      expect(totalTime).toBeLessThan(15000);

      console.log('Concurrent processing test:', {
        tasksCount: results.length,
        totalTime,
        averageTime: totalTime / results.length,
        averageCompressionRatio: results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
      });
    });
  });

  describe('9. Integration with External Services', () => {
    it('should mock external API calls correctly', async () => {
      expect(openaiMock.chat.completions.create).toBeDefined();
      expect(supabaseMock.from).toBeDefined();
      expect(supabaseMock.insert).toBeDefined();
      expect(redisMock.get).toBeDefined();
      expect(redisMock.set).toBeDefined();
    });

    it('should handle API failures gracefully', async () => {
      openaiMock.chat.completions.create.mockRejectedValue(new Error('API unavailable'));

      const testHTML = TestDataGenerator.generateEcommerceHTML(1);
      const testURL = 'https://api-failure-test.com';

      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      expect(optimizedContent).toBeDefined();
    });
  });

  describe('10. Migration Tool Test', () => {
    it('should optimize existing scraped data', async () => {
      const existingData = {
        url: 'https://migration-test.com/product',
        content: TestDataGenerator.generateLargeContentHTML(),
        metadata: { title: 'Test Product', description: 'Test Description' }
      };

      const optimizedContent = await AIContentExtractor.extractOptimized(
        existingData.content,
        existingData.url
      );

      expect(optimizedContent.originalTokens).toBeGreaterThan(optimizedContent.optimizedTokens);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);
      expect(optimizedContent.content).toBeTruthy();
      expect(optimizedContent.summary).toBeTruthy();

      const report = {
        originalSize: optimizedContent.originalTokens,
        optimizedSize: optimizedContent.optimizedTokens,
        compressionRatio: optimizedContent.compressionRatio,
        tokensSaved: optimizedContent.originalTokens - optimizedContent.optimizedTokens,
        processingTime: optimizedContent.processingStats.compressionTime
      };

      expect(report.tokensSaved).toBeGreaterThan(0);
      expect(report.compressionRatio).toBeGreaterThan(0);

      console.log('Migration optimization report:', report);
    });

    it('should handle batch optimization of existing data', async () => {
      const existingDataBatch = [
        { url: 'https://batch1.com', content: TestDataGenerator.generateEcommerceHTML(1) },
        { url: 'https://batch2.com', content: TestDataGenerator.generateEcommerceHTML(1) },
        { url: 'https://batch3.com', content: TestDataGenerator.generateEcommerceHTML(1) }
      ];

      const optimizationResults = await Promise.all(
        existingDataBatch.map(async item => {
          const optimized = await AIContentExtractor.extractOptimized(item.content, item.url);
          return {
            url: item.url,
            originalTokens: optimized.originalTokens,
            optimizedTokens: optimized.optimizedTokens,
            compressionRatio: optimized.compressionRatio
          };
        })
      );

      expect(optimizationResults.length).toBe(3);

      optimizationResults.forEach(result => {
        expect(result.compressionRatio).toBeGreaterThan(0);
        expect(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
      });

      const totalTokensSaved = optimizationResults.reduce(
        (sum, result) => sum + (result.originalTokens - result.optimizedTokens),
        0
      );

      const averageCompressionRatio = optimizationResults.reduce(
        (sum, result) => sum + result.compressionRatio,
        0
      ) / optimizationResults.length;

      expect(totalTokensSaved).toBeGreaterThan(0);
      expect(averageCompressionRatio).toBeGreaterThan(0);

      console.log('Batch migration results:', {
        itemsProcessed: optimizationResults.length,
        totalTokensSaved,
        averageCompressionRatio
      });
    });
  });
});
