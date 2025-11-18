/**
 * Automatic Pagination Crawler
 * Follows pagination links to scrape complete product catalogs
 */

import type { EcommerceExtractedContent } from '@/lib/ecommerce-extractor';
import { NormalizedProduct } from './product-normalizer';

export interface PaginationOptions {
  maxPages?: number;
  delayBetweenPages?: number;
  followPagination?: boolean;
  onPageScraped?: (pageNum: number, products: NormalizedProduct[]) => void;
  onProgress?: (current: number, total: number) => void;
}

export interface CatalogResult {
  products: NormalizedProduct[];
  totalPages: number;
  totalProducts: number;
  platform?: string;
  baseUrl: string;
  scrapedAt: string;
}

export class PaginationCrawler {
  private visitedUrls = new Set<string>();
  private allProducts: NormalizedProduct[] = [];
  private productSkus = new Set<string>(); // For deduplication by SKU
  private productNames = new Set<string>(); // For deduplication by name+price
  
  constructor(private options: PaginationOptions = {}) {
    this.options = {
      maxPages: 50,
      delayBetweenPages: 1000,
      followPagination: true,
      ...options
    };
  }
  
  /**
   * Crawl a category/listing page with automatic pagination
   */
  async crawlCatalog(startUrl: string, page: any): Promise<CatalogResult> {
    // Validate URL early
    try { new URL(startUrl); } catch { return this.buildResult(startUrl, 1, undefined, 0); }
    const startTime = Date.now();
    let currentUrl = startUrl;
    let pageNum = 1;
    let totalPages = 1;
    let platform: string | undefined;
    let totalProductCount = 0;
    
    
    while (currentUrl && pageNum <= (this.options.maxPages || 50)) {
      // Check if we've already visited this URL
      if (this.visitedUrls.has(currentUrl)) {
        break;
      }
      
      this.visitedUrls.add(currentUrl);
      
      try {
        
        // Navigate to the page
        await page.goto(currentUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 30000 
        });
        
        // Wait for products to load
        try {
          await page.waitForSelector('.product, .product-item, [data-product-id]', {
            timeout: 5000
          });
        } catch {
          break;
        }
        
        // Extract HTML and parse with our e-commerce extractor
        const html = await page.content();
        // Dynamic import to work seamlessly with Jest module mocking
        const { EcommerceExtractor } = await import('@/lib/ecommerce-extractor');
        const extracted = await EcommerceExtractor.extractEcommerce(html, currentUrl);
        
        // Store platform info
        if (!platform) platform = extracted.platform;
        
        // Process products
        if (extracted.products && extracted.products.length > 0) {
          const newProducts = this.deduplicateProducts(extracted.products);
          this.allProducts.push(...newProducts);
          
          console.log(`✅ Found ${extracted.products.length} products (${newProducts.length} new)`);
          
          // Callback for progress
          if (this.options.onPageScraped) {
            this.options.onPageScraped(pageNum, newProducts);
          }
        }
        
        // Get total product count if available
        if (extracted.totalProducts) {
          totalProductCount = extracted.totalProducts;
        }
        
        // Check for next page
        if (this.options.followPagination && extracted.pagination) {
          if (extracted.pagination.nextUrl) {
            currentUrl = extracted.pagination.nextUrl;
            
            // Update total pages if available
            if (extracted.pagination.total) {
              totalPages = extracted.pagination.total;
            }
            
            // Progress callback
            if (this.options.onProgress) {
              this.options.onProgress(pageNum, totalPages);
            }
            
            // Delay before next page
            if (this.options.delayBetweenPages) {
              await this.delay(this.options.delayBetweenPages);
            }
            
            pageNum++;
          } else {
            break;
          }
        } else {
          // Try to find pagination manually if not detected
          const nextPageUrl = await this.findNextPageUrl(page, currentUrl);
          if (nextPageUrl) {
            // If load more returns same URL, allow revisiting
            if (nextPageUrl === currentUrl) {
              this.visitedUrls.delete(currentUrl);
            }
            currentUrl = nextPageUrl;
            pageNum++;
            if (this.options.delayBetweenPages) {
              await this.delay(this.options.delayBetweenPages);
            }
          } else {
            break;
          }
        }
        
      } catch (error) {
        console.error(`❌ Error scraping page ${pageNum}:`, error);
        break;
      }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    
    return this.buildResult(startUrl, totalPages, platform, totalProductCount);
  }
  
  private buildResult(startUrl: string, totalPages: number, platform?: string, totalProductCount?: number): CatalogResult {
    return {
      products: this.allProducts,
      totalPages,
      totalProducts: totalProductCount || this.allProducts.length,
      platform,
      baseUrl: startUrl,
      scrapedAt: new Date().toISOString(),
    };
  }
  
  /**
   * Find next page URL using common pagination patterns
   */
  private async findNextPageUrl(page: any, currentUrl: string): Promise<string | null> {
    // Try to find next page link
    const nextPageSelectors = [
      'a.next',
      'a[rel="next"]',
      '.pagination .next a',
      '.page-numbers .next',
      'a[aria-label*="next"]',
      'a[title*="next"]',
      '.pagination a:contains("→")',
      '.pagination a:contains("»")',
    ];
    
    for (const selector of nextPageSelectors) {
      try {
        const nextUrl = await page.$eval(selector, (el: any) => el.href);
        if (nextUrl && nextUrl !== currentUrl) {
          return nextUrl;
        }
      } catch {
        // Selector not found, try next
      }
    }
    
    // Try to find numbered pagination and get next number
    try {
      const currentPageNum = await page.$eval('.pagination .current, .pagination .active', 
        (el: any) => parseInt(el.textContent));
      
      if (currentPageNum) {
        const nextPageNum = currentPageNum + 1;
        const nextPageLink = await page.$eval(
          `.pagination a:contains("${nextPageNum}")`,
          (el: any) => el.href
        );
        
        if (nextPageLink) {
          return nextPageLink;
        }
      }
    } catch {
      // Numbered pagination not found
    }
    
    // Check for infinite scroll or load more button
    const loadMoreSelectors = [
      'button.load-more',
      'a.load-more',
      'button[class*="load-more"]',
      'button:contains("Load More")',
      'button:contains("Show More")',
    ];
    
    for (const selector of loadMoreSelectors) {
      try {
        const hasLoadMore = await page.$(selector);
        if (hasLoadMore) {
          // Click load more and return same URL to continue on same page
          await page.click(selector);
          await this.delay(2000); // Wait for products to load
          return currentUrl; // Stay on same URL but with more products
        }
      } catch {
        // Load more not found
      }
    }
    
    return null;
  }
  
  /**
   * Deduplicate products based on SKU or name
   */
  private deduplicateProducts(products: NormalizedProduct[]): NormalizedProduct[] {
    const newProducts: NormalizedProduct[] = [];
    
    for (const product of products) {
      const nameKey = `${product.name || ''}_${product.price?.amount ?? ''}`;
      if (product.sku) {
        if (this.productSkus.has(product.sku) || this.productNames.has(nameKey)) continue;
        this.productSkus.add(product.sku);
        this.productNames.add(nameKey);
        newProducts.push(product);
      } else {
        if (this.productNames.has(nameKey)) continue;
        this.productNames.add(nameKey);
        newProducts.push(product);
      }
    }
    
    return newProducts;
  }
  
  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Reset crawler state for new crawl
   */
  reset(): void {
    this.visitedUrls.clear();
    this.allProducts = [];
    this.productSkus.clear();
  }
}
