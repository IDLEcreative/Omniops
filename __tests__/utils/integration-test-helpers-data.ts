import { NormalizedProduct } from '@/lib/product-normalizer';
import { HTMLGenerators } from './integration-test-helpers-html-generators';

/**
 * Test Data Generation Utilities
 * Factory functions for creating realistic test data for integration tests
 */

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

    const products = Array.from({ length: productCount }, (_, i) =>
      HTMLGenerators.generateProduct(i, { includeStructuredData, includeReviews })
    ).join('\n');

    const pagination = includePagination ? HTMLGenerators.generatePagination() : '';

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
        ${HTMLGenerators.generateHeader()}
        ${HTMLGenerators.generateMainContent(products, productCount, pagination)}
        ${HTMLGenerators.generateFooter()}
        ${HTMLGenerators.generateWebsiteStructuredData()}
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

/**
 * Test Utilities
 * Helper functions for generating test data and common operations
 */
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
      } catch (error) {
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
    if (message) {
      // Use the custom message in test output if provided
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    } else {
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThanOrEqual(max);
    }
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
