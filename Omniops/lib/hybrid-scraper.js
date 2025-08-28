/**
 * Hybrid Scraping System - Automatically detects and uses the fastest method
 * 
 * This system tries multiple strategies in order:
 * 1. Direct API access (fastest)
 * 2. Sitemap parsing (fast)
 * 3. Search exploitation (medium)
 * 4. Full crawling (slowest but most reliable)
 */

class HybridScraper {
  constructor(url) {
    this.baseUrl = url;
    this.domain = new URL(url).hostname;
  }

  /**
   * Main entry point - automatically selects best strategy
   */
  async scrape(options = {}) {
    console.log(`🎯 Analyzing ${this.baseUrl} for optimal scraping strategy...`);
    
    // Step 1: Detect CMS type
    const cmsType = await this.detectCMS();
    console.log(`  CMS detected: ${cmsType || 'Unknown'}`);
    
    // Step 2: Try strategies in order of speed
    const strategies = this.getStrategiesForCMS(cmsType);
    
    for (const strategy of strategies) {
      console.log(`  Trying strategy: ${strategy.name}...`);
      try {
        const result = await strategy.execute();
        if (result && result.products.length > 0) {
          console.log(`  ✅ Success! Found ${result.products.length} products in ${result.time}`);
          return result;
        }
      } catch (error) {
        console.log(`  ❌ ${strategy.name} failed: ${error.message}`);
      }
    }
    
    // Fallback to standard crawling
    console.log('  Falling back to standard crawling...');
    return this.standardCrawl();
  }

  /**
   * Detect what CMS/platform the site uses
   */
  async detectCMS() {
    const response = await fetch(this.baseUrl);
    const html = await response.text();
    const headers = response.headers;
    
    // WordPress detection
    if (html.includes('wp-content') || html.includes('wordpress') || 
        headers.get('x-powered-by')?.includes('WordPress')) {
      
      // Check if WooCommerce is active
      if (html.includes('woocommerce')) {
        return 'woocommerce';
      }
      return 'wordpress';
    }
    
    // Shopify detection
    if (html.includes('cdn.shopify.com') || headers.get('x-shopify-stage')) {
      return 'shopify';
    }
    
    // Magento detection
    if (html.includes('/static/version') || html.includes('Magento')) {
      return 'magento';
    }
    
    // PrestaShop detection
    if (html.includes('prestashop') || html.includes('PrestaShop')) {
      return 'prestashop';
    }
    
    return null;
  }

  /**
   * Get strategies based on detected CMS
   */
  getStrategiesForCMS(cmsType) {
    const strategies = [];
    
    switch (cmsType) {
      case 'woocommerce':
        strategies.push({
          name: 'WooCommerce REST API',
          execute: () => this.wooCommerceAPI()
        });
        strategies.push({
          name: 'WordPress REST API',
          execute: () => this.wordPressAPI()
        });
        break;
        
      case 'shopify':
        strategies.push({
          name: 'Shopify Products.json',
          execute: () => this.shopifyJSON()
        });
        strategies.push({
          name: 'Shopify Sitemap',
          execute: () => this.shopifySitemap()
        });
        break;
        
      case 'magento':
        strategies.push({
          name: 'Magento REST API',
          execute: () => this.magentoAPI()
        });
        break;
    }
    
    // Universal strategies for any site
    strategies.push({
      name: 'Sitemap.xml parsing',
      execute: () => this.parseSitemap()
    });
    
    strategies.push({
      name: 'Search with wildcards',
      execute: () => this.exploitSearch()
    });
    
    return strategies;
  }

  /**
   * WordPress/WooCommerce API strategy
   */
  async wordPressAPI() {
    const products = [];
    const startTime = Date.now();
    
    // First, get total count
    const response = await fetch(`${this.baseUrl}/wp-json/wp/v2/product?per_page=1`);
    const total = parseInt(response.headers.get('x-wp-total') || '0');
    
    if (total === 0) {
      throw new Error('No products found in WordPress API');
    }
    
    const pages = Math.ceil(total / 100);
    console.log(`    Found ${total} products across ${pages} API pages`);
    
    // Fetch all pages in parallel (batches of 5 to avoid rate limits)
    for (let i = 0; i < pages; i += 5) {
      const batch = [];
      for (let j = i; j < Math.min(i + 5, pages); j++) {
        batch.push(
          fetch(`${this.baseUrl}/wp-json/wp/v2/product?per_page=100&page=${j + 1}`)
            .then(r => r.json())
        );
      }
      
      const results = await Promise.all(batch);
      results.forEach(pageProducts => {
        products.push(...pageProducts.map(p => ({
          id: p.id,
          title: p.title?.rendered,
          url: p.link,
          description: p.content?.rendered,
          excerpt: p.excerpt?.rendered,
          price: p.meta?.price || p.acf?.price,
          sku: p.meta?.sku || p.acf?.sku,
          categories: p.product_cat,
          images: p.images || [],
          inStock: p.meta?.stock_status !== 'outofstock'
        })));
      });
      
      console.log(`    Progress: ${products.length}/${total} products`);
    }
    
    return {
      products,
      time: `${(Date.now() - startTime) / 1000}s`,
      method: 'WordPress REST API'
    };
  }

  /**
   * WooCommerce specific API (requires authentication)
   */
  async wooCommerceAPI() {
    // This would need consumer_key and consumer_secret
    // For now, throw to move to next strategy
    throw new Error('WooCommerce API requires authentication');
  }

  /**
   * Shopify JSON endpoint
   */
  async shopifyJSON() {
    const products = [];
    let page = 1;
    const startTime = Date.now();
    
    while (true) {
      const response = await fetch(`${this.baseUrl}/products.json?limit=250&page=${page}`);
      const data = await response.json();
      
      if (!data.products || data.products.length === 0) break;
      
      products.push(...data.products.map(p => ({
        id: p.id,
        title: p.title,
        url: `${this.baseUrl}/products/${p.handle}`,
        description: p.body_html,
        price: p.variants[0]?.price,
        sku: p.variants[0]?.sku,
        images: p.images?.map(i => i.src) || [],
        inStock: p.variants.some(v => v.available)
      })));
      
      console.log(`    Page ${page}: ${data.products.length} products (total: ${products.length})`);
      page++;
      
      // Shopify limits to 1000 products via JSON
      if (products.length >= 1000) break;
    }
    
    return {
      products,
      time: `${(Date.now() - startTime) / 1000}s`,
      method: 'Shopify Products.json'
    };
  }

  /**
   * Parse sitemap.xml for product URLs
   */
  async parseSitemap() {
    const startTime = Date.now();
    const productUrls = [];
    
    // Try common sitemap locations
    const sitemapUrls = [
      `${this.baseUrl}/sitemap.xml`,
      `${this.baseUrl}/sitemap_index.xml`,
      `${this.baseUrl}/product-sitemap.xml`,
      `${this.baseUrl}/sitemap/products.xml`
    ];
    
    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const text = await response.text();
          
          // Extract all URLs containing '/product/'
          const urls = text.match(/<loc>([^<]+\/product\/[^<]+)<\/loc>/g);
          if (urls) {
            productUrls.push(...urls.map(u => u.replace(/<\/?loc>/g, '')));
            console.log(`    Found ${productUrls.length} product URLs in sitemap`);
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    if (productUrls.length === 0) {
      throw new Error('No product URLs found in sitemap');
    }
    
    // Now we have URLs but need to fetch product data
    // This is where you'd integrate with your existing crawler
    // For demonstration, returning just the URLs
    
    return {
      products: productUrls.map(url => ({ url })),
      time: `${(Date.now() - startTime) / 1000}s`,
      method: 'Sitemap parsing',
      note: 'URLs found - needs crawling for full data'
    };
  }

  /**
   * Try to exploit the search to get all products
   */
  async exploitSearch() {
    const searches = ['*', '', 'a', 'e', 'i', 'o', 'u']; // Common letters
    const products = new Set();
    
    for (const term of searches) {
      try {
        const response = await fetch(`${this.baseUrl}/?s=${term}&post_type=product`);
        const html = await response.text();
        
        // Extract product URLs from search results
        const urls = html.match(/href="([^"]+\/product\/[^"]+)"/g);
        if (urls) {
          urls.forEach(url => products.add(url.replace(/href="|"/g, '')));
        }
      } catch (error) {
        continue;
      }
    }
    
    if (products.size === 0) {
      throw new Error('Search exploitation failed');
    }
    
    return {
      products: Array.from(products).map(url => ({ url })),
      method: 'Search exploitation',
      note: 'URLs found - needs crawling for full data'
    };
  }

  /**
   * Fallback to standard Playwright crawling
   */
  async standardCrawl() {
    // This would integrate with your existing crawler
    console.log('    Using standard Playwright crawler...');
    
    // Import your existing scraper
    const { crawlWebsite } = require('./scraper-api');
    
    return crawlWebsite(this.baseUrl, {
      maxPages: 1000,
      turboMode: true
    });
  }
}

// Export for use in your application
module.exports = { HybridScraper };

// Example usage:
/*
const scraper = new HybridScraper('https://www.thompsonseparts.co.uk');
const results = await scraper.scrape();
console.log(`Scraped ${results.products.length} products using ${results.method}`);
*/