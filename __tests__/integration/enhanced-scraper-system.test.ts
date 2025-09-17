import { describe, it, expect, jest, beforeEach, afterEach, beforeAll } from '@jest/globals';
import { AIContentExtractor, SemanticChunk, AIOptimizedContent } from '@/lib/ai-content-extractor';
import { PatternLearner, DomainPatterns } from '@/lib/pattern-learner';
import { EnhancedRateLimiter, RateLimiterPresets, RateLimitResponse } from '@/lib/rate-limiter-enhanced';
import { ContentDeduplicator } from '@/lib/content-deduplicator';
import { getCrawlerConfig, getAIOptimizationConfig } from '@/lib/crawler-config';
import { EcommerceExtractor } from '@/lib/ecommerce-extractor';

// Test Data Generators and Fixtures
class TestDataGenerator {
  static generateEcommerceHTML(productCount: number = 1): string {
    const products = Array.from({ length: productCount }, (_, i) => `
      <div class="product" itemscope itemtype="https://schema.org/Product">
        <h1 itemprop="name" class="product-title">Amazing Product ${i + 1}</h1>
        <div class="price-container">
          <span class="price" itemprop="price">£${(29.99 + i * 10).toFixed(2)}</span>
          <meta itemprop="priceCurrency" content="GBP" />
        </div>
        <div class="sku" itemprop="sku">PROD-${String(i + 1).padStart(3, '0')}</div>
        <div class="description" itemprop="description">
          This is an amazing product with great features. 
          It offers excellent value for money and comes with a warranty.
          Perfect for customers who want quality and reliability.
        </div>
        <div class="availability" itemprop="availability" content="https://schema.org/InStock">
          In Stock
        </div>
        <img src="/images/product${i + 1}.jpg" alt="Product ${i + 1}" itemprop="image" />
      </div>
    `).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>E-commerce Test Store</title>
        <meta name="description" content="Test store with amazing products" />
      </head>
      <body>
        <header class="site-header">
          <nav class="navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/products">Products</a></li>
              <li><a href="/about">About</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>
        </header>
        
        <main class="main-content">
          <h1>Our Products</h1>
          <div class="products-grid">
            ${products}
          </div>
        </main>
        
        <footer class="site-footer">
          <p>&copy; 2024 Test Store. All rights reserved.</p>
          <p>Contact us: info@teststore.com | Phone: +44 123 456 7890</p>
          <div class="footer-links">
            <a href="/privacy">Privacy Policy</a>
            <a href="/terms">Terms of Service</a>
            <a href="/shipping">Shipping Info</a>
          </div>
        </footer>
      </body>
      </html>
    `;
  }

  static generateTemplateVariationHTML(variation: number): string {
    const productNames = ['Laptop', 'Smartphone', 'Tablet', 'Headphones', 'Camera'];
    const prices = [999, 599, 399, 199, 1299];
    const skus = ['LAP-001', 'PHN-002', 'TAB-003', 'HDP-004', 'CAM-005'];

    return `
      <div class="product-card">
        <h2>${productNames[variation]}</h2>
        <div class="price-info">
          <span class="current-price">£${prices[variation]}</span>
          <span class="currency">GBP</span>
        </div>
        <div class="product-code">${skus[variation]}</div>
        <div class="stock-status">Available</div>
        <p class="product-summary">
          High-quality ${productNames[variation].toLowerCase()} with premium features.
          Excellent build quality and customer satisfaction guaranteed.
          Perfect for ${variation % 2 === 0 ? 'professionals' : 'consumers'}.
        </p>
      </div>
    `;
  }

  static generateLargeContentHTML(): string {
    const sections = Array.from({ length: 50 }, (_, i) => `
      <section class="content-section">
        <h2>Section ${i + 1}</h2>
        <p>This is a large content section with lots of text. ${Array.from({ length: 100 }, () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ')}</p>
      </section>
    `).join('\n');

    return `
      <html>
        <body>
          <div class="large-content">
            ${sections}
          </div>
        </body>
      </html>
    `;
  }
}

// Mock Utilities
class MockUtilities {
  static createSupabaseMock() {
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    };
  }

  static createRedisMock() {
    const storage = new Map<string, string>();
    const sets = new Map<string, Set<string>>();

    return {
      get: jest.fn((key: string) => Promise.resolve(storage.get(key) || null)),
      set: jest.fn((key: string, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      setex: jest.fn((key: string, ttl: number, value: string) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      del: jest.fn((key: string) => {
        const existed = storage.has(key);
        storage.delete(key);
        return Promise.resolve(existed ? 1 : 0);
      }),
      sadd: jest.fn((key: string, ...values: string[]) => {
        if (!sets.has(key)) sets.set(key, new Set());
        const set = sets.get(key)!;
        let added = 0;
        values.forEach(value => {
          if (!set.has(value)) {
            set.add(value);
            added++;
          }
        });
        return Promise.resolve(added);
      }),
      smembers: jest.fn((key: string) => {
        const set = sets.get(key);
        return Promise.resolve(set ? Array.from(set) : []);
      }),
      srem: jest.fn((key: string, ...values: string[]) => {
        const set = sets.get(key);
        if (!set) return Promise.resolve(0);
        let removed = 0;
        values.forEach(value => {
          if (set.delete(value)) removed++;
        });
        return Promise.resolve(removed);
      }),
      flushall: jest.fn(() => {
        storage.clear();
        sets.clear();
        return Promise.resolve('OK');
      }),
      eval: jest.fn(),
      hmget: jest.fn(),
      hmset: jest.fn(),
      hincrby: jest.fn(),
      expire: jest.fn(),
      quit: jest.fn(() => Promise.resolve()),
      on: jest.fn(),
    };
  }

  static createOpenAIMock() {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    summary: "Test AI-generated summary",
                    keyFacts: ["Fact 1", "Fact 2", "Fact 3"],
                    topicTags: ["tag1", "tag2", "tag3"]
                  })
                }
              }
            ]
          })
        }
      },
      embeddings: {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: Array(1536).fill(0.1) }]
        })
      }
    };
  }
}

// Performance Monitoring Utilities
class PerformanceMonitor {
  private startTime: number = 0;
  private checkpoints: Map<string, number> = new Map();

  start(): void {
    this.startTime = Date.now();
    this.checkpoints.clear();
  }

  checkpoint(name: string): number {
    const now = Date.now();
    const elapsed = now - this.startTime;
    this.checkpoints.set(name, elapsed);
    return elapsed;
  }

  getResults(): { totalTime: number; checkpoints: Record<string, number> } {
    const totalTime = Date.now() - this.startTime;
    const checkpoints: Record<string, number> = {};
    
    for (const [name, time] of this.checkpoints.entries()) {
      checkpoints[name] = time;
    }

    return { totalTime, checkpoints };
  }
}

// Memory Usage Utilities
class MemoryTracker {
  private initialMemory: NodeJS.MemoryUsage;

  constructor() {
    this.initialMemory = process.memoryUsage();
  }

  getCurrentUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedDelta: number;
  } {
    const current = process.memoryUsage();
    return {
      heapUsed: Math.round(current.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(current.heapTotal / 1024 / 1024), // MB
      external: Math.round(current.external / 1024 / 1024), // MB
      rss: Math.round(current.rss / 1024 / 1024), // MB
      heapUsedDelta: Math.round((current.heapUsed - this.initialMemory.heapUsed) / 1024 / 1024), // MB
    };
  }
}

// Test Helper Functions
const TestHelpers = {
  async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  validateSemanticChunks(chunks: SemanticChunk[]): void {
    expect(chunks).toBeDefined();
    expect(Array.isArray(chunks)).toBe(true);
    
    chunks.forEach(chunk => {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('type');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('tokens');
      expect(chunk).toHaveProperty('relevanceScore');
      expect(chunk).toHaveProperty('metadata');
      expect(chunk.tokens).toBeGreaterThan(0);
      expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(chunk.relevanceScore).toBeLessThanOrEqual(1);
    });
  },

  validateAIOptimizedContent(content: AIOptimizedContent): void {
    expect(content).toHaveProperty('originalTokens');
    expect(content).toHaveProperty('optimizedTokens');
    expect(content).toHaveProperty('compressionRatio');
    expect(content).toHaveProperty('chunks');
    expect(content).toHaveProperty('summary');
    expect(content).toHaveProperty('keyFacts');
    expect(content).toHaveProperty('qaPairs');
    expect(content).toHaveProperty('topicTags');
    expect(content).toHaveProperty('processingStats');
    
    expect(content.originalTokens).toBeGreaterThanOrEqual(content.optimizedTokens);
    expect(content.compressionRatio).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(content.chunks)).toBe(true);
    expect(Array.isArray(content.keyFacts)).toBe(true);
    expect(Array.isArray(content.qaPairs)).toBe(true);
    expect(Array.isArray(content.topicTags)).toBe(true);
  },

  validateNormalizedProduct(product: NormalizedProduct): void {
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('scrapedAt');
    expect(typeof product.name).toBe('string');
    expect(product.name.length).toBeGreaterThan(0);
    
    if (product.price) {
      expect(product.price).toHaveProperty('amount');
      expect(product.price).toHaveProperty('currency');
      expect(product.price).toHaveProperty('formatted');
      expect(typeof product.price.amount).toBe('number');
      expect(product.price.amount).toBeGreaterThan(0);
    }
  }
};

// Main Integration Tests
describe('Enhanced Scraper System Integration Tests', () => {
  let supabaseMock: ReturnType<typeof MockUtilities.createSupabaseMock>;
  let redisMock: ReturnType<typeof MockUtilities.createRedisMock>;
  let openaiMock: ReturnType<typeof MockUtilities.createOpenAIMock>;
  let rateLimiter: EnhancedRateLimiter;
  let deduplicator: ContentDeduplicator;
  let performanceMonitor: PerformanceMonitor;
  let memoryTracker: MemoryTracker;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    process.env.REDIS_URL = 'redis://localhost:6379';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Initialize mocks
    supabaseMock = MockUtilities.createSupabaseMock();
    redisMock = MockUtilities.createRedisMock();
    openaiMock = MockUtilities.createOpenAIMock();

    // Mock external libraries
    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => supabaseMock)
    }));

    jest.doMock('ioredis', () => {
      return jest.fn(() => redisMock);
    });

    jest.doMock('openai', () => {
      return jest.fn(() => openaiMock);
    });

    // Initialize system components
    rateLimiter = new EnhancedRateLimiter(RateLimiterPresets.moderate);
    deduplicator = new ContentDeduplicator();
    performanceMonitor = new PerformanceMonitor();
    memoryTracker = new MemoryTracker();

    // Clear AI content extractor cache
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

      // Generate test e-commerce HTML
      const testHTML = TestDataGenerator.generateEcommerceHTML(3);
      const testURL = 'https://teststore.com/products';

      performanceMonitor.checkpoint('html-generated');

      // Step 1: AI Content Optimization
      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      
      TestHelpers.validateAIOptimizedContent(optimizedContent);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);
      expect(optimizedContent.chunks.length).toBeGreaterThan(0);

      performanceMonitor.checkpoint('ai-optimization-complete');

      // Step 2: E-commerce Extraction
      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });
      
      expect(products.length).toBe(3);
      products.forEach(TestHelpers.validateNormalizedProduct);

      performanceMonitor.checkpoint('ecommerce-extraction-complete');

      // Step 3: Content Deduplication
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

      // Step 4: Pattern Learning
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

      // Validate final results
      const results = performanceMonitor.getResults();
      const memoryUsage = memoryTracker.getCurrentUsage();

      expect(results.totalTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(memoryUsage.heapUsedDelta).toBeLessThan(100); // Should not use more than 100MB extra

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

      // Verify significant token reduction
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.3);
      expect(optimizedContent.optimizedTokens).toBeLessThan(optimizedContent.originalTokens);
      expect(optimizedContent.processingStats.removedElements).toBeGreaterThan(0);

      // Verify semantic chunks are created
      TestHelpers.validateSemanticChunks(optimizedContent.chunks);
      expect(optimizedContent.chunks.some(c => c.type === 'main')).toBe(true);

      // Verify metadata generation
      expect(optimizedContent.summary.length).toBeGreaterThan(10);
      expect(optimizedContent.keyFacts.length).toBeGreaterThanOrEqual(0);
      expect(optimizedContent.topicTags.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('2. Pattern Learning Flow', () => {
    it('should learn and apply patterns effectively', async () => {
      const testURL = 'https://pattern-test.com/product';
      const testHTML = TestDataGenerator.generateEcommerceHTML(1);

      // Mock existing patterns
      supabaseMock.single.mockResolvedValueOnce({ data: null, error: null });
      supabaseMock.insert.mockResolvedValue({ data: {}, error: null });

      // Step 1: First scrape learns patterns
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

      // Step 2: Second scrape uses learned patterns
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

      // Step 3: Verify performance improvement
      expect(patterns!.patterns.every(p => p.confidence >= 0.9)).toBe(true);
    });

    it('should update pattern confidence over time', async () => {
      const testURL = 'https://confidence-test.com/product';
      
      const existingPatterns: DomainPatterns = {
        domain: 'confidence-test.com',
        patterns: [
          {
            selector: '.product-name',
            fieldType: 'name',
            confidence: 0.7,
            extractionMethod: 'dom'
          }
        ],
        lastUpdated: new Date().toISOString(),
        successRate: 0.8,
        totalExtractions: 10
      };

      supabaseMock.single.mockResolvedValue({ data: existingPatterns, error: null });
      supabaseMock.update.mockResolvedValue({ data: {}, error: null });

      // Simulate successful pattern usage
      await PatternLearner.updatePatternSuccess(testURL, true, ['name:.product-name']);

      expect(supabaseMock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          totalExtractions: 11,
          successRate: expect.any(Number)
        })
      );
    });
  });

  describe('3. Rate Limiting Integration', () => {
    it('should handle multiple rapid requests with proper throttling', async () => {
      const domain = 'rate-limit-test.com';
      const requests: Promise<RateLimitResponse>[] = [];

      // Create 10 rapid requests
      for (let i = 0; i < 10; i++) {
        requests.push(rateLimiter.checkRateLimit(domain));
      }

      const responses = await Promise.all(requests);
      
      // Some requests should be allowed, others should be rate limited
      const allowedCount = responses.filter(r => r.allowed).length;
      const rateLimitedCount = responses.filter(r => !r.allowed).length;

      expect(allowedCount).toBeGreaterThan(0);
      expect(rateLimitedCount).toBeGreaterThan(0);
      expect(allowedCount + rateLimitedCount).toBe(10);

      // Wait time should be provided for rate-limited requests
      const rateLimitedResponses = responses.filter(r => !r.allowed);
      rateLimitedResponses.forEach(response => {
        expect(response.waitTimeMs).toBeGreaterThan(0);
        expect(response.resetTime).toBeGreaterThan(Date.now());
      });
    });

    it('should apply exponential backoff on 429 responses', async () => {
      const domain = 'backoff-test.com';
      
      // Simulate 429 responses
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

      // Check rate limit after failures
      const response = await rateLimiter.checkRateLimit(domain, { retryCount: 3 });
      
      if (!response.allowed) {
        // Should have increased wait time due to backoff
        expect(response.waitTimeMs).toBeGreaterThan(1000);
      }
    });

    it('should trigger circuit breaker after consecutive failures', async () => {
      const domain = 'circuit-breaker-test.com';
      
      // Simulate multiple failures to trigger circuit breaker
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

      // Circuit breaker should now be open
      const response = await rateLimiter.checkRateLimit(domain);
      
      expect(response.allowed).toBe(false);
      expect(response.reason).toBe('Circuit breaker open');
      expect(response.waitTimeMs).toBeGreaterThan(0);
    });
  });

  describe('4. Configuration Management', () => {
    it('should load different presets correctly', async () => {
      const fastConfig = getCrawlerConfig('fast');
      const carefulConfig = getCrawlerConfig('careful');
      const ecommerceConfig = getCrawlerConfig('ecommerce');

      // Verify different concurrency settings
      expect(fastConfig.maxConcurrency).toBeGreaterThan(carefulConfig.maxConcurrency);
      expect(fastConfig.timeouts.request).toBeLessThan(carefulConfig.timeouts.request);

      // Verify e-commerce specific settings
      expect(ecommerceConfig.content.extractImages).toBe(true);
      expect(ecommerceConfig.content.minWordCount).toBeLessThan(fastConfig.content.minWordCount);
    });

    it('should apply runtime overrides correctly', async () => {
      // Test environment variable overrides
      const originalConcurrency = process.env.CRAWLER_MAX_CONCURRENCY;
      process.env.CRAWLER_MAX_CONCURRENCY = '15';

      const config = getCrawlerConfig('fast');
      expect(config.maxConcurrency).toBe(15);

      // Restore original value
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

  describe('5. Complete Pipeline Test', () => {
    it('should process complete scraping workflow', async () => {
      performanceMonitor.start();
      const testURL = 'https://complete-test.com/products';
      const testHTML = TestDataGenerator.generateEcommerceHTML(2);

      // Step 1: Rate limiting check
      const rateCheckResponse = await rateLimiter.checkRateLimit('complete-test.com');
      if (rateCheckResponse.waitTimeMs > 0) {
        await TestHelpers.sleep(Math.min(rateCheckResponse.waitTimeMs, 100));
      }
      expect(rateCheckResponse.allowed).toBe(true);

      performanceMonitor.checkpoint('rate-limit-check');

      // Step 2: AI Content Optimization
      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0);

      performanceMonitor.checkpoint('ai-optimization');

      // Step 3: E-commerce Product Extraction
      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });
      expect(products.length).toBe(2);

      performanceMonitor.checkpoint('product-extraction');

      // Step 4: Content Deduplication
      const dedupHash = await deduplicator.processContent(optimizedContent.content, testURL);
      expect(dedupHash).toBeTruthy();

      performanceMonitor.checkpoint('deduplication');

      // Step 5: Metadata Generation
      expect(optimizedContent.summary.length).toBeGreaterThan(0);
      expect(optimizedContent.keyFacts.length).toBeGreaterThanOrEqual(0);
      expect(optimizedContent.topicTags.length).toBeGreaterThanOrEqual(0);

      performanceMonitor.checkpoint('metadata-generation');

      // Step 6: Pattern Learning
      await PatternLearner.learnFromExtraction(testURL, products, {
        platform: 'test',
        selectors: { name: '.product-title', price: '.price' },
        extractionMethod: 'dom'
      });

      performanceMonitor.checkpoint('pattern-learning');

      // Step 7: Report request success
      await rateLimiter.reportRequestResult({
        domain: 'complete-test.com',
        timestamp: Date.now(),
        responseTime: 2000,
        statusCode: 200,
        success: true,
        retryCount: 0
      });

      performanceMonitor.checkpoint('request-reporting');

      // Validate final pipeline output
      const finalResults = performanceMonitor.getResults();
      const memoryUsage = memoryTracker.getCurrentUsage();

      expect(finalResults.totalTime).toBeLessThan(15000); // Complete within 15 seconds
      expect(memoryUsage.heapUsedDelta).toBeLessThan(50); // Memory efficient

      console.log('Complete pipeline results:', {
        performance: finalResults,
        memory: memoryUsage,
        optimizationRatio: optimizedContent.compressionRatio,
        productsFound: products.length,
        chunksCreated: optimizedContent.chunks.length
      });
    });

    it('should handle data flow between components correctly', async () => {
      const testURL = 'https://dataflow-test.com/product';
      const testHTML = TestDataGenerator.generateEcommerceHTML(1);

      // Extract product data
      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });
      const product = products[0];

      // Verify product data structure
      TestHelpers.validateNormalizedProduct(product);

      // Extract optimized content
      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      
      // Verify content contains product information
      expect(optimizedContent.content.toLowerCase()).toContain(product.name.toLowerCase());
      
      if (product.price) {
        expect(optimizedContent.content).toContain(product.price.formatted);
      }

      // Verify chunk types are appropriate
      const chunkTypes = new Set(optimizedContent.chunks.map(c => c.type));
      expect(chunkTypes.has('main')).toBe(true);

      // Deduplicate content
      const hash = await deduplicator.processContent(optimizedContent.content, testURL);
      const retrievedContent = await deduplicator.getContent(hash);
      
      expect(retrievedContent).toBeTruthy();
      expect(retrievedContent).toContain(product.name);
    });

    it('should validate final output structure meets requirements', async () => {
      const testHTML = TestDataGenerator.generateEcommerceHTML(1);
      const testURL = 'https://output-validation.com/product';

      // Complete processing
      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      const extractor = new EcommerceExtractor();
      const products = await extractor.extractProducts(testHTML, { url: testURL });

      // Validate AI optimized content structure
      expect(optimizedContent).toHaveProperty('originalTokens');
      expect(optimizedContent).toHaveProperty('optimizedTokens');
      expect(optimizedContent).toHaveProperty('compressionRatio');
      expect(optimizedContent).toHaveProperty('chunks');
      expect(optimizedContent).toHaveProperty('summary');
      expect(optimizedContent).toHaveProperty('keyFacts');
      expect(optimizedContent).toHaveProperty('qaPairs');
      expect(optimizedContent).toHaveProperty('topicTags');
      expect(optimizedContent).toHaveProperty('processingStats');

      // Validate product structure
      expect(products).toBeInstanceOf(Array);
      expect(products.length).toBeGreaterThan(0);
      
      products.forEach(product => {
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('scrapedAt');
        expect(typeof product.name).toBe('string');
        expect(product.name.length).toBeGreaterThan(0);
      });

      // Validate processing stats
      expect(optimizedContent.processingStats).toHaveProperty('removedElements');
      expect(optimizedContent.processingStats).toHaveProperty('deduplicatedSections');
      expect(optimizedContent.processingStats).toHaveProperty('compressionTime');
      expect(optimizedContent.processingStats.compressionTime).toBeGreaterThan(0);
    });
  });

  describe('6. Migration Tool Test', () => {
    it('should optimize existing scraped data', async () => {
      // Mock existing unoptimized data
      const existingData = {
        url: 'https://migration-test.com/product',
        content: TestDataGenerator.generateLargeContentHTML(),
        metadata: { title: 'Test Product', description: 'Test Description' }
      };

      // Run optimization migration
      const optimizedContent = await AIContentExtractor.extractOptimized(
        existingData.content,
        existingData.url
      );

      // Verify optimization occurred
      expect(optimizedContent.originalTokens).toBeGreaterThan(optimizedContent.optimizedTokens);
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.1);

      // Verify content preserved
      expect(optimizedContent.content).toBeTruthy();
      expect(optimizedContent.summary).toBeTruthy();

      // Generate migration report
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

      // Verify all items were optimized
      expect(optimizationResults.length).toBe(3);
      
      optimizationResults.forEach(result => {
        expect(result.compressionRatio).toBeGreaterThan(0);
        expect(result.optimizedTokens).toBeLessThanOrEqual(result.originalTokens);
      });

      // Calculate batch statistics
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

  describe('7. Error Scenarios and Edge Cases', () => {
    it('should handle malformed HTML gracefully', async () => {
      const malformedHTML = '<html><body><div>Unclosed div<p>Unclosed paragraph</body>';
      const testURL = 'https://malformed-test.com';

      // Should not throw errors
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
      
      // Simulate network timeout
      await rateLimiter.reportRequestResult({
        domain,
        timestamp: Date.now(),
        responseTime: 30000, // 30 second timeout
        statusCode: 0, // Network error
        success: false,
        retryCount: 0
      });

      const response = await rateLimiter.checkRateLimit(domain);
      expect(response).toBeDefined();
    });

    it('should handle database connection failures', async () => {
      // Mock database error
      supabaseMock.single.mockRejectedValue(new Error('Database connection failed'));

      const testURL = 'https://db-error-test.com/product';
      const products = [{ name: 'Test Product', scrapedAt: new Date().toISOString() }];

      // Should not throw error
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

      // Performance benchmarks
      expect(processingTime).toBeLessThan(10000); // Under 10 seconds
      expect(optimizedContent.compressionRatio).toBeGreaterThan(0.3); // At least 30% reduction
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
      
      // Process multiple items
      for (let i = 0; i < 5; i++) {
        const html = TestDataGenerator.generateEcommerceHTML(2);
        const url = `https://memory-test-${i}.com/products`;
        
        await AIContentExtractor.extractOptimized(html, url);
      }

      const finalMemory = memoryTracker.getCurrentUsage();
      const memoryIncrease = finalMemory.heapUsedDelta;

      // Memory should not increase dramatically
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase

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

      // Verify all tasks completed successfully
      expect(results.length).toBe(5);
      results.forEach(result => {
        expect(result.compressionRatio).toBeGreaterThan(0);
      });

      // Concurrent processing should be efficient
      expect(totalTime).toBeLessThan(15000); // Under 15 seconds for 5 concurrent tasks

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
      // Verify OpenAI mock is working
      expect(openaiMock.chat.completions.create).toBeDefined();
      
      // Verify Supabase mock is working
      expect(supabaseMock.from).toBeDefined();
      expect(supabaseMock.insert).toBeDefined();
      
      // Verify Redis mock is working
      expect(redisMock.get).toBeDefined();
      expect(redisMock.set).toBeDefined();
    });

    it('should handle API failures gracefully', async () => {
      // Mock API failure
      openaiMock.chat.completions.create.mockRejectedValue(new Error('API unavailable'));

      const testHTML = TestDataGenerator.generateEcommerceHTML(1);
      const testURL = 'https://api-failure-test.com';

      // Should still work without API
      const optimizedContent = await AIContentExtractor.extractOptimized(testHTML, testURL);
      expect(optimizedContent).toBeDefined();
    });
  });

  describe('10. Template Detection and Pattern Matching', () => {
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
      // Add some duplicate content
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