import { jest } from '@jest/globals';
import { SemanticChunk, AIOptimizedContent } from '@/lib/ai-content-extractor';
import { NormalizedProduct } from '@/lib/product-normalizer';
import { ContentHash, DeduplicationMetrics } from '@/lib/content-deduplicator';
import { RateLimitResponse } from '@/lib/rate-limiter-enhanced';

/**
 * Integration Test Helpers
 * Utilities for creating test data, mocks, and validation functions
 * for enhanced scraper system integration tests
 */

// Test Data Generation Utilities
export class TestDataFactory {
  /**
   * Generate realistic e-commerce product HTML with structured data
   */
  static createEcommerceProductHTML(config: {
    productCount?: number;
    includeStructuredData?: boolean;
    includePagination?: boolean;
    includeReviews?: boolean;
    platform?: 'woocommerce' | 'shopify' | 'magento' | 'custom';
  } = {}): string {
    const {
      productCount = 1,
      includeStructuredData = true,
      includePagination = false,
      includeReviews = false,
      platform = 'custom'
    } = config;

    const products = Array.from({ length: productCount }, (_, i) => {
      const product = {
        name: `Premium Product ${i + 1}`,
        price: (49.99 + i * 25).toFixed(2),
        sku: `PREM-${String(i + 1).padStart(3, '0')}`,
        description: `High-quality premium product with advanced features. Perfect for ${i % 2 === 0 ? 'professionals' : 'everyday users'}. Includes warranty and support.`,
        availability: i % 3 === 0 ? 'OutOfStock' : 'InStock',
        category: ['Electronics', 'Computers', 'Accessories'][i % 3],
        brand: ['TechBrand', 'ProMaker', 'QualityFirst'][i % 3],
        rating: (4.0 + Math.random() * 1).toFixed(1),
        reviewCount: Math.floor(Math.random() * 200) + 50
      };

      const structuredData = includeStructuredData ? `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": "${product.name}",
          "image": "/images/product${i + 1}.jpg",
          "description": "${product.description}",
          "sku": "${product.sku}",
          "brand": {
            "@type": "Brand",
            "name": "${product.brand}"
          },
          "offers": {
            "@type": "Offer",
            "url": "/product/${product.sku.toLowerCase()}",
            "priceCurrency": "GBP",
            "price": "${product.price}",
            "availability": "https://schema.org/${product.availability}"
          }
        }
        </script>
      ` : '';

      const reviews = includeReviews ? `
        <div class="reviews-section">
          <h3>Customer Reviews (${product.reviewCount})</h3>
          <div class="rating-summary">
            <span class="average-rating">${product.rating}</span>
            <span class="rating-stars">★★★★★</span>
          </div>
          <div class="review">
            <h4>Excellent product!</h4>
            <p>Really happy with this purchase. Great quality and fast delivery.</p>
            <span class="reviewer">By John D.</span>
          </div>
        </div>
      ` : '';

      return `
        <article class="product product-item" data-product-id="${i + 1}" itemscope itemtype="https://schema.org/Product">
          ${structuredData}
          
          <div class="product-image">
            <img src="/images/product${i + 1}.jpg" alt="${product.name}" itemprop="image" class="product-photo" />
          </div>
          
          <div class="product-info">
            <h2 class="product-title product-name" itemprop="name">${product.name}</h2>
            
            <div class="product-price-container">
              <span class="price current-price" itemprop="price" content="${product.price}">£${product.price}</span>
              <meta itemprop="priceCurrency" content="GBP" />
            </div>
            
            <div class="product-meta">
              <span class="sku product-sku" itemprop="sku">SKU: ${product.sku}</span>
              <span class="brand" itemprop="brand">${product.brand}</span>
              <span class="category">${product.category}</span>
            </div>
            
            <div class="product-description" itemprop="description">
              <p>${product.description}</p>
            </div>
            
            <div class="availability-info">
              <span class="stock-status ${product.availability.toLowerCase()}" itemprop="availability" content="https://schema.org/${product.availability}">
                ${product.availability === 'InStock' ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
            
            <div class="product-actions">
              <button class="add-to-cart btn-primary" data-product-id="${i + 1}">Add to Cart</button>
              <button class="wishlist-btn" data-product-id="${i + 1}">♡ Wishlist</button>
            </div>
          </div>
          
          ${reviews}
        </article>
      `;
    }).join('\n');

    const pagination = includePagination ? `
      <nav class="pagination-nav" aria-label="Product pages">
        <ul class="pagination">
          <li><a href="?page=1" class="page-link current">1</a></li>
          <li><a href="?page=2" class="page-link">2</a></li>
          <li><a href="?page=3" class="page-link">3</a></li>
          <li><a href="?page=2" class="next-page">Next →</a></li>
        </ul>
      </nav>
    ` : '';

    const platformClasses = {
      woocommerce: 'woocommerce woocommerce-page',
      shopify: 'shopify-theme',
      magento: 'catalog-category-view',
      custom: 'custom-ecommerce'
    };

    return `
      <!DOCTYPE html>
      <html lang="en" class="${platformClasses[platform]}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Premium Products - Test Store</title>
        <meta name="description" content="Shop our premium product collection with fast delivery and excellent customer service." />
        <meta name="keywords" content="products, premium, electronics, quality, ${platform}" />
      </head>
      <body>
        <header class="site-header main-header">
          <div class="header-container">
            <div class="logo">
              <img src="/logo.png" alt="Test Store" />
              <h1>Test Store</h1>
            </div>
            <nav class="main-navigation primary-nav">
              <ul class="nav-menu">
                <li><a href="/">Home</a></li>
                <li><a href="/products" class="current">Products</a></li>
                <li><a href="/categories">Categories</a></li>
                <li><a href="/brands">Brands</a></li>
                <li><a href="/sale">Sale</a></li>
                <li><a href="/about">About</a></li>
                <li><a href="/contact">Contact</a></li>
              </ul>
            </nav>
            <div class="header-actions">
              <div class="search-box">
                <input type="search" placeholder="Search products..." />
                <button type="submit">Search</button>
              </div>
              <div class="user-actions">
                <a href="/account">Account</a>
                <a href="/cart" class="cart-link">Cart (0)</a>
              </div>
            </div>
          </div>
        </header>

        <main class="main-content products-page" role="main">
          <div class="breadcrumbs">
            <nav aria-label="Breadcrumb">
              <ol>
                <li><a href="/">Home</a></li>
                <li><a href="/products">Products</a></li>
                <li aria-current="page">Premium Collection</li>
              </ol>
            </nav>
          </div>

          <div class="page-header">
            <h1>Premium Product Collection</h1>
            <p class="category-description">Discover our carefully curated selection of premium products.</p>
          </div>

          <div class="products-container">
            <aside class="sidebar filters-sidebar">
              <h3>Filter Products</h3>
              <div class="filter-group">
                <h4>Price Range</h4>
                <input type="range" min="0" max="500" />
                <span>£0 - £500</span>
              </div>
              <div class="filter-group">
                <h4>Brand</h4>
                <label><input type="checkbox" /> TechBrand</label>
                <label><input type="checkbox" /> ProMaker</label>
                <label><input type="checkbox" /> QualityFirst</label>
              </div>
              <div class="filter-group">
                <h4>Availability</h4>
                <label><input type="checkbox" /> In Stock</label>
                <label><input type="checkbox" /> Out of Stock</label>
              </div>
            </aside>

            <div class="products-main">
              <div class="products-toolbar">
                <div class="results-count">
                  Showing ${productCount} product${productCount !== 1 ? 's' : ''}
                </div>
                <div class="sort-options">
                  <select name="sort" id="sort-select">
                    <option value="name">Sort by Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                  </select>
                </div>
              </div>

              <div class="products-grid products-list" data-product-count="${productCount}">
                ${products}
              </div>

              ${pagination}
            </div>
          </div>
        </main>

        <footer class="site-footer main-footer">
          <div class="footer-content">
            <div class="footer-section">
              <h4>Customer Service</h4>
              <ul>
                <li><a href="/help">Help Center</a></li>
                <li><a href="/contact">Contact Us</a></li>
                <li><a href="/returns">Returns & Exchanges</a></li>
                <li><a href="/shipping">Shipping Information</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Company</h4>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/careers">Careers</a></li>
                <li><a href="/press">Press</a></li>
                <li><a href="/investors">Investors</a></li>
              </ul>
            </div>
            <div class="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><a href="/privacy">Privacy Policy</a></li>
                <li><a href="/terms">Terms of Service</a></li>
                <li><a href="/cookies">Cookie Policy</a></li>
                <li><a href="/accessibility">Accessibility</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 Test Store. All rights reserved.</p>
            <p>Contact: support@teststore.com | +44 20 1234 5678</p>
          </div>
        </footer>

        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "Test Store",
          "url": "https://teststore.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://teststore.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        }
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Generate content with template variations for pattern detection
   */
  static createTemplateVariations(templateCount: number): Array<{ content: string; url: string }> {
    const templates = [
      {
        pattern: 'Product listing: {{name}} - Price: {{price}} - Stock: {{stock}}',
        variations: [
          { name: 'Laptop Pro', price: '£1299', stock: 'In Stock' },
          { name: 'Smartphone X', price: '£899', stock: 'Limited Stock' },
          { name: 'Tablet Ultra', price: '£649', stock: 'In Stock' },
          { name: 'Headphones Elite', price: '£299', stock: 'Out of Stock' },
          { name: 'Camera Pro', price: '£1899', stock: 'In Stock' }
        ]
      },
      {
        pattern: 'Service: {{service}} | Duration: {{duration}} | Price: {{cost}}',
        variations: [
          { service: 'Web Development', duration: '4-6 weeks', cost: '£2500' },
          { service: 'SEO Optimization', duration: '3 months', cost: '£800' },
          { service: 'Logo Design', duration: '1-2 weeks', cost: '£450' },
          { service: 'Content Writing', duration: '2 weeks', cost: '£600' },
          { service: 'Social Media', duration: 'Ongoing', cost: '£300/month' }
        ]
      }
    ];

    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    return Array.from({ length: templateCount }, (_, i) => {
      const variation = selectedTemplate.variations[i % selectedTemplate.variations.length];
      let content = selectedTemplate.pattern;
      
      Object.entries(variation).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      return {
        content: `<html><body><div class="template-content">${content}</div></body></html>`,
        url: `https://template-test.com/item${i + 1}`
      };
    });
  }

  /**
   * Generate large content for performance testing
   */
  static createLargeContentHTML(sectionCount: number = 100): string {
    const sections = Array.from({ length: sectionCount }, (_, i) => `
      <section class="content-section section-${i + 1}">
        <h2>Section ${i + 1}: ${['Overview', 'Details', 'Specifications', 'Features', 'Benefits'][i % 5]}</h2>
        <div class="section-content">
          <p>This is section ${i + 1} with comprehensive information about our products and services. 
             ${Array.from({ length: 50 }, () => 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.').join(' ')}</p>
          
          <ul class="feature-list">
            <li>Advanced feature ${i * 3 + 1} with detailed explanation and benefits</li>
            <li>Enhanced capability ${i * 3 + 2} for improved performance</li>
            <li>Premium service ${i * 3 + 3} with customer support</li>
          </ul>
          
          <div class="technical-details">
            <h3>Technical Specifications</h3>
            <table>
              <tr><td>Specification A:</td><td>Value ${i * 2 + 1}</td></tr>
              <tr><td>Specification B:</td><td>Value ${i * 2 + 2}</td></tr>
              <tr><td>Specification C:</td><td>Configuration ${i + 1}</td></tr>
            </table>
          </div>
        </div>
      </section>
    `).join('\n');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Large Content Document</title>
        <meta name="description" content="Comprehensive documentation with detailed information" />
      </head>
      <body>
        <header class="document-header">
          <h1>Comprehensive Product Documentation</h1>
          <nav class="toc">
            <h2>Table of Contents</h2>
            <ul>
              ${Array.from({ length: sectionCount }, (_, i) => 
                `<li><a href="#section-${i + 1}">Section ${i + 1}</a></li>`
              ).join('\n              ')}
            </ul>
          </nav>
        </header>
        
        <main class="document-content">
          ${sections}
        </main>
        
        <footer class="document-footer">
          <p>Generated test document with ${sectionCount} sections</p>
          <p>Total content size: Large (for performance testing)</p>
        </footer>
      </body>
      </html>
    `;
  }
}

// Mock Factories
export class MockFactory {
  /**
   * Create comprehensive Supabase client mock
   */
  static createSupabaseMock(): any {
    const mockResponse = { data: null, error: null };
    
    return {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockResolvedValue(mockResponse),
      update: jest.fn().mockResolvedValue(mockResponse),
      upsert: jest.fn().mockResolvedValue(mockResponse),
      delete: jest.fn().mockResolvedValue(mockResponse),
      eq: jest.fn().mockReturnThis(),
      neq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      like: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue(mockResponse),
      maybeSingle: jest.fn().mockResolvedValue(mockResponse),
      limit: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      count: jest.fn().mockReturnThis(),
    };
  }

  /**
   * Create Redis client mock with full functionality
   */
  static createRedisMock(): any {
    const storage = new Map<string, string>();
    const hashes = new Map<string, Map<string, string>>();
    const sets = new Map<string, Set<string>>();
    const sortedSets = new Map<string, Map<string, number>>();
    const expirations = new Map<string, number>();

    return {
      // String operations
      get: jest.fn((key: string) => {
        const expiry = expirations.get(key);
        if (expiry && Date.now() > expiry) {
          storage.delete(key);
          expirations.delete(key);
          return Promise.resolve(null);
        }
        return Promise.resolve(storage.get(key) || null);
      }),
      
      set: jest.fn((key: string, value: string, ...args: any[]) => {
        storage.set(key, value);
        return Promise.resolve('OK');
      }),
      
      setex: jest.fn((key: string, ttl: number, value: string) => {
        storage.set(key, value);
        expirations.set(key, Date.now() + ttl * 1000);
        return Promise.resolve('OK');
      }),
      
      del: jest.fn((key: string | string[]) => {
        const keys = Array.isArray(key) ? key : [key];
        let deleted = 0;
        keys.forEach(k => {
          if (storage.delete(k)) deleted++;
          if (hashes.delete(k)) deleted++;
          if (sets.delete(k)) deleted++;
          if (sortedSets.delete(k)) deleted++;
          expirations.delete(k);
        });
        return Promise.resolve(deleted);
      }),
      
      exists: jest.fn((key: string | string[]) => {
        const keys = Array.isArray(key) ? key : [key];
        let count = 0;
        keys.forEach(k => {
          if (storage.has(k) || hashes.has(k) || sets.has(k) || sortedSets.has(k)) {
            count++;
          }
        });
        return Promise.resolve(count);
      }),

      // Hash operations
      hmget: jest.fn((key: string, ...fields: string[]) => {
        const hash = hashes.get(key);
        if (!hash) return Promise.resolve(fields.map(() => null));
        return Promise.resolve(fields.map(field => hash.get(field) || null));
      }),
      
      hmset: jest.fn((key: string, ...args: string[]) => {
        if (!hashes.has(key)) hashes.set(key, new Map());
        const hash = hashes.get(key)!;
        for (let i = 0; i < args.length; i += 2) {
          hash.set(args[i], args[i + 1]);
        }
        return Promise.resolve('OK');
      }),
      
      hincrby: jest.fn((key: string, field: string, increment: number) => {
        if (!hashes.has(key)) hashes.set(key, new Map());
        const hash = hashes.get(key)!;
        const current = parseInt(hash.get(field) || '0');
        const newValue = current + increment;
        hash.set(field, newValue.toString());
        return Promise.resolve(newValue);
      }),

      // Set operations
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

      // Utility operations
      expire: jest.fn((key: string, ttl: number) => {
        if (storage.has(key) || hashes.has(key) || sets.has(key)) {
          expirations.set(key, Date.now() + ttl * 1000);
          return Promise.resolve(1);
        }
        return Promise.resolve(0);
      }),
      
      ttl: jest.fn((key: string) => {
        const expiry = expirations.get(key);
        if (!expiry) return Promise.resolve(-1);
        const remaining = Math.ceil((expiry - Date.now()) / 1000);
        return Promise.resolve(remaining > 0 ? remaining : -2);
      }),
      
      flushall: jest.fn(() => {
        storage.clear();
        hashes.clear();
        sets.clear();
        sortedSets.clear();
        expirations.clear();
        return Promise.resolve('OK');
      }),

      // Lua scripting
      eval: jest.fn((script: string, numKeys: number, ...args: any[]) => {
        // Mock token bucket script response
        if (script.includes('rate') && script.includes('capacity')) {
          return Promise.resolve(1); // Allow request
        }
        return Promise.resolve(null);
      }),

      // Connection management
      on: jest.fn((event: string, handler: Function) => {
        // Mock event handlers
      }),
      
      quit: jest.fn(() => Promise.resolve('OK')),
      disconnect: jest.fn(),
      
      // Pipeline support
      pipeline: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve([]))
      })),

      // Transaction support
      multi: jest.fn(() => ({
        exec: jest.fn(() => Promise.resolve([]))
      }))
    };
  }

  /**
   * Create OpenAI API mock
   */
  static createOpenAIMock(): any {
    return {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            id: 'chatcmpl-test',
            object: 'chat.completion',
            created: Date.now(),
            model: 'gpt-4',
            choices: [
              {
                index: 0,
                message: {
                  role: 'assistant',
                  content: JSON.stringify({
                    summary: 'AI-generated summary of the content with key insights and main points.',
                    keyFacts: [
                      'Key fact 1 extracted from content',
                      'Important data point 2',
                      'Significant insight 3'
                    ],
                    topicTags: ['technology', 'ecommerce', 'products', 'business'],
                    qaPairs: [
                      {
                        question: 'What is this product about?',
                        answer: 'This is a premium product with advanced features.'
                      }
                    ]
                  })
                }
              }
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 150,
              total_tokens: 250
            }
          })
        }
      },
      
      embeddings: {
        create: jest.fn().mockResolvedValue({
          object: 'list',
          data: [
            {
              object: 'embedding',
              index: 0,
              embedding: Array.from({ length: 1536 }, () => Math.random() * 0.1)
            }
          ],
          model: 'text-embedding-ada-002',
          usage: {
            prompt_tokens: 50,
            total_tokens: 50
          }
        })
      }
    };
  }
}

// Validation Utilities
export class ValidationHelpers {
  /**
   * Validate AI optimized content structure and values
   */
  static validateAIOptimizedContent(content: AIOptimizedContent): void {
    expect(content).toHaveProperty('originalTokens');
    expect(content).toHaveProperty('optimizedTokens');
    expect(content).toHaveProperty('compressionRatio');
    expect(content).toHaveProperty('chunks');
    expect(content).toHaveProperty('summary');
    expect(content).toHaveProperty('keyFacts');
    expect(content).toHaveProperty('qaPairs');
    expect(content).toHaveProperty('topicTags');
    expect(content).toHaveProperty('processingStats');

    expect(typeof content.originalTokens).toBe('number');
    expect(typeof content.optimizedTokens).toBe('number');
    expect(typeof content.compressionRatio).toBe('number');
    expect(Array.isArray(content.chunks)).toBe(true);
    expect(Array.isArray(content.keyFacts)).toBe(true);
    expect(Array.isArray(content.qaPairs)).toBe(true);
    expect(Array.isArray(content.topicTags)).toBe(true);

    expect(content.originalTokens).toBeGreaterThanOrEqual(0);
    expect(content.optimizedTokens).toBeGreaterThanOrEqual(0);
    expect(content.compressionRatio).toBeGreaterThanOrEqual(0);

    if (content.originalTokens > 0) {
      expect(content.optimizedTokens).toBeLessThanOrEqual(content.originalTokens);
    }

    expect(content.processingStats).toHaveProperty('removedElements');
    expect(content.processingStats).toHaveProperty('deduplicatedSections');
    expect(content.processingStats).toHaveProperty('compressionTime');
    expect(content.processingStats.compressionTime).toBeGreaterThan(0);
  }

  /**
   * Validate semantic chunks structure and content
   */
  static validateSemanticChunks(chunks: SemanticChunk[]): void {
    expect(Array.isArray(chunks)).toBe(true);

    chunks.forEach((chunk, index) => {
      expect(chunk).toHaveProperty('id');
      expect(chunk).toHaveProperty('type');
      expect(chunk).toHaveProperty('content');
      expect(chunk).toHaveProperty('tokens');
      expect(chunk).toHaveProperty('relevanceScore');
      expect(chunk).toHaveProperty('metadata');

      expect(typeof chunk.id).toBe('string');
      expect(chunk.id.length).toBeGreaterThan(0);
      
      expect(['main', 'faq', 'features', 'specs', 'support', 'legal']).toContain(chunk.type);
      
      expect(typeof chunk.content).toBe('string');
      expect(chunk.content.length).toBeGreaterThan(0);
      
      expect(typeof chunk.tokens).toBe('number');
      expect(chunk.tokens).toBeGreaterThan(0);
      
      expect(typeof chunk.relevanceScore).toBe('number');
      expect(chunk.relevanceScore).toBeGreaterThanOrEqual(0);
      expect(chunk.relevanceScore).toBeLessThanOrEqual(1);

      expect(chunk.metadata).toHaveProperty('headings');
      expect(chunk.metadata).toHaveProperty('keywords');
      expect(chunk.metadata).toHaveProperty('entities');
      expect(Array.isArray(chunk.metadata.headings)).toBe(true);
      expect(Array.isArray(chunk.metadata.keywords)).toBe(true);
      expect(Array.isArray(chunk.metadata.entities)).toBe(true);
    });
  }

  /**
   * Validate normalized product structure
   */
  static validateNormalizedProduct(product: NormalizedProduct): void {
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('scrapedAt');
    
    expect(typeof product.name).toBe('string');
    expect(product.name.length).toBeGreaterThan(0);
    
    expect(typeof product.scrapedAt).toBe('string');
    expect(new Date(product.scrapedAt).toISOString()).toBe(product.scrapedAt);

    if (product.price) {
      expect(product.price).toHaveProperty('amount');
      expect(product.price).toHaveProperty('currency');
      expect(product.price).toHaveProperty('formatted');
      
      expect(typeof product.price.amount).toBe('number');
      expect(product.price.amount).toBeGreaterThan(0);
      
      expect(typeof product.price.currency).toBe('string');
      expect(product.price.currency.length).toBeGreaterThanOrEqual(3);
      
      expect(typeof product.price.formatted).toBe('string');
      expect(product.price.formatted).toContain(product.price.amount.toString());
    }

    if (product.sku) {
      expect(typeof product.sku).toBe('string');
      expect(product.sku.length).toBeGreaterThan(0);
    }

    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        expect(image).toHaveProperty('url');
        expect(image).toHaveProperty('isMain');
        expect(image).toHaveProperty('position');
        
        expect(typeof image.url).toBe('string');
        expect(image.url.length).toBeGreaterThan(0);
        expect(typeof image.isMain).toBe('boolean');
        expect(typeof image.position).toBe('number');
        expect(image.position).toBeGreaterThanOrEqual(0);
      });
    }
  }

  /**
   * Validate rate limit response
   */
  static validateRateLimitResponse(response: RateLimitResponse): void {
    expect(response).toHaveProperty('allowed');
    expect(response).toHaveProperty('waitTimeMs');
    expect(response).toHaveProperty('tokensRemaining');
    expect(response).toHaveProperty('resetTime');

    expect(typeof response.allowed).toBe('boolean');
    expect(typeof response.waitTimeMs).toBe('number');
    expect(typeof response.tokensRemaining).toBe('number');
    expect(typeof response.resetTime).toBe('number');

    expect(response.waitTimeMs).toBeGreaterThanOrEqual(0);
    expect(response.tokensRemaining).toBeGreaterThanOrEqual(0);
    expect(response.resetTime).toBeGreaterThan(Date.now() - 1000); // Allow for clock skew

    if (!response.allowed) {
      expect(response.waitTimeMs).toBeGreaterThan(0);
      expect(response).toHaveProperty('reason');
      expect(typeof response.reason).toBe('string');
    }
  }

  /**
   * Validate deduplication metrics
   */
  static validateDeduplicationMetrics(metrics: DeduplicationMetrics): void {
    expect(metrics).toHaveProperty('totalPages');
    expect(metrics).toHaveProperty('uniqueContent');
    expect(metrics).toHaveProperty('duplicateContent');
    expect(metrics).toHaveProperty('storageReduction');
    expect(metrics).toHaveProperty('compressionRatio');
    expect(metrics).toHaveProperty('processingTime');

    expect(typeof metrics.totalPages).toBe('number');
    expect(typeof metrics.uniqueContent).toBe('number');
    expect(typeof metrics.duplicateContent).toBe('number');
    expect(typeof metrics.storageReduction).toBe('number');
    expect(typeof metrics.compressionRatio).toBe('number');
    expect(typeof metrics.processingTime).toBe('number');

    expect(metrics.totalPages).toBeGreaterThanOrEqual(0);
    expect(metrics.uniqueContent).toBeGreaterThanOrEqual(0);
    expect(metrics.duplicateContent).toBeGreaterThanOrEqual(0);
    expect(metrics.storageReduction).toBeGreaterThanOrEqual(0);
    expect(metrics.compressionRatio).toBeGreaterThanOrEqual(1);
    expect(metrics.processingTime).toBeGreaterThan(0);

    expect(metrics.uniqueContent + metrics.duplicateContent).toBeGreaterThanOrEqual(0);
  }

  /**
   * Validate content hash structure
   */
  static validateContentHash(hash: ContentHash): void {
    expect(hash).toHaveProperty('hash');
    expect(hash).toHaveProperty('content');
    expect(hash).toHaveProperty('type');
    expect(hash).toHaveProperty('frequency');
    expect(hash).toHaveProperty('pages');
    expect(hash).toHaveProperty('size');

    expect(typeof hash.hash).toBe('string');
    expect(hash.hash.length).toBeGreaterThan(0);
    
    expect(typeof hash.content).toBe('string');
    expect(hash.content.length).toBeGreaterThan(0);
    
    expect(['navigation', 'footer', 'sidebar', 'header', 'unique']).toContain(hash.type);
    
    expect(typeof hash.frequency).toBe('number');
    expect(hash.frequency).toBeGreaterThan(0);
    
    expect(Array.isArray(hash.pages)).toBe(true);
    expect(hash.pages.length).toBeGreaterThan(0);
    
    expect(typeof hash.size).toBe('number');
    expect(hash.size).toBeGreaterThan(0);

    hash.pages.forEach(page => {
      expect(typeof page).toBe('string');
      expect(page.length).toBeGreaterThan(0);
    });
  }
}

// Performance Measurement Utilities
export class PerformanceHelpers {
  private static timers: Map<string, number> = new Map();
  private static measurements: Map<string, number[]> = new Map();

  /**
   * Start timing an operation
   */
  static startTimer(name: string): void {
    this.timers.set(name, Date.now());
  }

  /**
   * End timing and record measurement
   */
  static endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }

    const duration = Date.now() - startTime;
    this.timers.delete(name);

    if (!this.measurements.has(name)) {
      this.measurements.set(name, []);
    }
    this.measurements.get(name)!.push(duration);

    return duration;
  }

  /**
   * Get performance statistics for an operation
   */
  static getStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    total: number;
  } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    return {
      count: measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      avg: measurements.reduce((sum, m) => sum + m, 0) / measurements.length,
      total: measurements.reduce((sum, m) => sum + m, 0)
    };
  }

  /**
   * Clear all measurements
   */
  static reset(): void {
    this.timers.clear();
    this.measurements.clear();
  }

  /**
   * Get current memory usage
   */
  static getMemoryUsage(): {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
  } {
    const usage = process.memoryUsage();
    return {
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024)
    };
  }

  /**
   * Measure async operation performance
   */
  static async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<{
    result: T;
    duration: number;
    memoryBefore: ReturnType<typeof PerformanceHelpers.getMemoryUsage>;
    memoryAfter: ReturnType<typeof PerformanceHelpers.getMemoryUsage>;
  }> {
    const memoryBefore = this.getMemoryUsage();
    this.startTimer(name);
    
    try {
      const result = await operation();
      const duration = this.endTimer(name);
      const memoryAfter = this.getMemoryUsage();
      
      return {
        result,
        duration,
        memoryBefore,
        memoryAfter
      };
    } catch {
      this.timers.delete(name); // Clean up timer on error
      throw error;
    }
  }
}

// Test Utilities
export class TestUtilities {
  /**
   * Wait for a specified amount of time
   */
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry an operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch {
        lastError = error as Error;
        
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Generate random test data
   */
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate random test URL
   */
  static generateTestURL(domain?: string): string {
    const testDomain = domain || `test-${this.generateRandomString(8)}.com`;
    const path = this.generateRandomString(12);
    return `https://${testDomain}/${path}`;
  }

  /**
   * Create test product data
   */
  static createTestProduct(overrides: Partial<NormalizedProduct> = {}): NormalizedProduct {
    return {
      name: `Test Product ${this.generateRandomString(6)}`,
      scrapedAt: new Date().toISOString(),
      price: {
        amount: Math.floor(Math.random() * 1000) + 10,
        currency: 'GBP',
        formatted: '£' + (Math.floor(Math.random() * 1000) + 10).toFixed(2)
      },
      sku: `TEST-${this.generateRandomString(6).toUpperCase()}`,
      description: `Test product description with ${this.generateRandomString(20)} details`,
      ...overrides
    };
  }

  /**
   * Assert that a value is within a range
   */
  static assertWithinRange(value: number, min: number, max: number, message?: string): void {
    const errorMessage = message || `Expected ${value} to be between ${min} and ${max}`;
    expect(value).toBeGreaterThanOrEqual(min);
    expect(value).toBeLessThanOrEqual(max);
  }

  /**
   * Assert that processing time is reasonable
   */
  static assertReasonableProcessingTime(duration: number, maxMs: number = 5000): void {
    expect(duration).toBeGreaterThan(0);
    expect(duration).toBeLessThan(maxMs);
  }

  /**
   * Assert that compression ratio is effective
   */
  static assertEffectiveCompression(ratio: number, minRatio: number = 0.1): void {
    expect(ratio).toBeGreaterThan(minRatio);
    expect(ratio).toBeLessThan(1);
  }
}

// Export all utilities as a combined object for easy importing
export const IntegrationTestHelpers = {
  TestDataFactory,
  MockFactory,
  ValidationHelpers,
  PerformanceHelpers,
  TestUtilities
};