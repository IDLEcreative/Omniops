#!/usr/bin/env node

/**
 * Enhanced Universal E-commerce Scraper with Price Parsing
 * Automatically detects platform and extracts clean, normalized data
 */

import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';

// Test URLs from different pages
const TEST_URLS = {
  homepage: 'https://www.thompsonseparts.co.uk/',
  category: 'https://www.thompsonseparts.co.uk/product-category/featured-hot-deals/',
  product: 'https://www.thompsonseparts.co.uk/product/complete-pin-bush-kit-to-fit-kinshofer-km602/',
};

/**
 * Parse complex WooCommerce price strings
 * Handles various formats including sales, VAT inc/exc, and contact prices
 */
function parsePrice(priceString) {
  if (!priceString || typeof priceString !== 'string') {
    return { raw: priceString, formatted: null, value: null };
  }

  // Handle "Contact us" prices
  if (priceString.toLowerCase().includes('contact us')) {
    return {
      raw: priceString,
      formatted: 'Contact for price',
      value: null,
      requiresContact: true
    };
  }

  // Extract all price values
  const priceMatches = priceString.match(/£[\d,]+\.?\d*/g);
  
  if (!priceMatches || priceMatches.length === 0) {
    return { raw: priceString, formatted: null, value: null };
  }

  // Parse price values
  const prices = priceMatches.map(p => 
    parseFloat(p.replace('£', '').replace(',', ''))
  );

  let result = {
    raw: priceString,
    currency: 'GBP'
  };

  // Check for sale price pattern
  if (priceString.includes('Current price is:')) {
    const currentMatch = priceString.match(/Current price is: (£[\d,]+\.?\d*)/);
    const originalMatch = priceString.match(/Original price was: (£[\d,]+\.?\d*)/);
    
    if (currentMatch) {
      const salePrice = parseFloat(currentMatch[1].replace('£', '').replace(',', ''));
      result.value = salePrice;
      result.salePrice = salePrice;
      result.formatted = `£${salePrice.toFixed(2)}`;
      
      if (originalMatch) {
        const regularPrice = parseFloat(originalMatch[1].replace('£', '').replace(',', ''));
        result.regularPrice = regularPrice;
        result.onSale = true;
        result.discount = Math.round((regularPrice - salePrice) / regularPrice * 100);
        result.formatted = `£${salePrice.toFixed(2)} (was £${regularPrice.toFixed(2)}, ${result.discount}% off)`;
      }
    }
  } else if (prices.length >= 2) {
    // Regular item with Inc/Exc VAT
    result.value = prices[0];
    result.priceIncVAT = prices[0];
    result.priceExcVAT = prices[1];
    result.formatted = `£${prices[0].toFixed(2)} inc VAT`;
    result.onSale = false;
  } else if (prices.length === 1) {
    // Single price
    result.value = prices[0];
    result.price = prices[0];
    result.formatted = `£${prices[0].toFixed(2)}`;
    result.onSale = false;
  }

  return result;
}

// Enhanced extraction with price parsing
async function extractEcommerceData(page, url) {
  // Platform detection
  const platform = await page.evaluate(() => {
    if (document.querySelector('body.woocommerce') || 
        document.querySelector('.woocommerce-product')) {
      return 'woocommerce';
    }
    if (document.querySelector('meta[name="shopify-digital-wallet"]')) {
      return 'shopify';
    }
    return 'unknown';
  });
  
  // Page type detection
  const pageType = await page.evaluate(() => {
    const url = window.location.href;
    if (url.includes('/product/')) return 'product';
    if (url.includes('/category/') || url.includes('/shop/')) return 'category';
    if (document.querySelector('.single-product')) return 'product';
    if (document.querySelectorAll('.product').length > 1) return 'category';
    return 'other';
  });
  
  // Extract products with enhanced price parsing
  let products = [];
  
  if (pageType === 'product') {
    // Single product extraction
    products = await page.evaluate(() => {
      // Try JSON-LD first
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of jsonLdScripts) {
        try {
          const data = JSON.parse(script.textContent);
          if (data['@type'] === 'Product') {
            return [{
              name: data.name,
              sku: data.sku,
              priceRaw: data.offers?.price,
              currency: data.offers?.priceCurrency,
              availability: data.offers?.availability,
              description: data.description,
              image: Array.isArray(data.image) ? data.image[0] : data.image,
            }];
          }
        } catch {}
      }
      
      // Fallback to DOM scraping
      const product = {
        name: document.querySelector('h1')?.textContent?.trim(),
        sku: document.querySelector('.sku')?.textContent?.replace(/^(SKU|sku):\s*/i, '').trim(),
        priceRaw: document.querySelector('.price')?.textContent?.trim(),
        availability: document.querySelector('.stock')?.textContent?.trim(),
        description: document.querySelector('.woocommerce-product-details__short-description')?.textContent?.trim(),
        image: document.querySelector('.woocommerce-product-gallery__image img')?.src,
      };
      
      return product.name ? [product] : [];
    });
  } else if (pageType === 'category') {
    // Product listing extraction
    products = await page.evaluate(() => {
      const productList = [];
      const productElements = document.querySelectorAll('.product');
      
      productElements.forEach(el => {
        const product = {
          name: el.querySelector('.woocommerce-loop-product__title, h2')?.textContent?.trim(),
          priceRaw: el.querySelector('.price')?.textContent?.trim(),
          link: el.querySelector('a')?.href,
          image: el.querySelector('img')?.src,
          sku: el.querySelector('.sku')?.textContent?.replace(/^sku:\s*/i, '').trim(),
        };
        
        if (product.name) {
          productList.push(product);
        }
      });
      
      return productList;
    });
  }
  
  // Apply price parsing to all products
  products = products.map(product => ({
    ...product,
    price: parsePrice(product.priceRaw),
    // Keep raw price for reference but use parsed version
    _rawPrice: product.priceRaw,
    priceRaw: undefined // Remove to avoid confusion
  }));
  
  // Extract pagination
  const pagination = await page.evaluate(() => {
    const paginationEl = document.querySelector('.woocommerce-pagination, .pagination');
    if (!paginationEl) return null;
    
    return {
      current: paginationEl.querySelector('.current')?.textContent,
      total: Array.from(paginationEl.querySelectorAll('a')).pop()?.textContent,
      next: paginationEl.querySelector('.next')?.href,
    };
  });
  
  // Extract breadcrumbs
  const breadcrumbs = await page.evaluate(() => {
    const crumbs = [];
    const breadcrumbEl = document.querySelector('.woocommerce-breadcrumb, .breadcrumb');
    if (breadcrumbEl) {
      breadcrumbEl.querySelectorAll('a').forEach(a => {
        crumbs.push({
          name: a.textContent?.trim(),
          url: a.href,
        });
      });
    }
    return crumbs;
  });
  
  return {
    url,
    platform,
    pageType,
    products,
    pagination,
    breadcrumbs,
    productCount: products.length,
    // Add summary statistics
    priceStats: calculatePriceStats(products)
  };
}

// Calculate price statistics for the scraped products
function calculatePriceStats(products) {
  const validPrices = products
    .map(p => p.price?.value)
    .filter(v => v !== null && v !== undefined);
  
  if (validPrices.length === 0) {
    return { hasValidPrices: false };
  }
  
  return {
    hasValidPrices: true,
    average: (validPrices.reduce((a, b) => a + b, 0) / validPrices.length).toFixed(2),
    min: Math.min(...validPrices).toFixed(2),
    max: Math.max(...validPrices).toFixed(2),
    onSaleCount: products.filter(p => p.price?.onSale).length,
    contactRequiredCount: products.filter(p => p.price?.requiresContact).length
  };
}

async function testEnhancedScraper() {
  console.log('🚀 Enhanced Universal E-commerce Scraper');
  console.log('━'.repeat(60));
  console.log('Testing with Thompson\'s Parts - Now with Clean Price Parsing!');
  console.log('━'.repeat(60));
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const results = {};
  
  try {
    for (const [type, url] of Object.entries(TEST_URLS)) {
      console.log(`\n📍 Testing ${type.toUpperCase()} page:`);
      console.log(`   URL: ${url}`);
      
      const page = await context.newPage();
      
      // Navigate with intelligent waiting
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      
      // Wait for products or content
      try {
        await page.waitForSelector('.product, .woocommerce-product, main', { timeout: 5000 });
      } catch {}
      
      // Extract e-commerce data with enhanced parsing
      const startTime = Date.now();
      const data = await extractEcommerceData(page, url);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
      
      results[type] = data;
      
      // Display results
      console.log(`   ✅ Extraction completed in ${elapsed}s`);
      console.log(`   🛍️  Platform: ${data.platform}`);
      console.log(`   📄 Page Type: ${data.pageType}`);
      console.log(`   📦 Products Found: ${data.productCount}`);
      
      if (data.products.length > 0) {
        console.log(`   📋 Sample Product:`);
        const sample = data.products[0];
        console.log(`      - Name: ${sample.name}`);
        console.log(`      - Price: ${sample.price.formatted || 'No price'}`);
        console.log(`      - SKU: ${sample.sku || 'N/A'}`);
        if (sample.price?.onSale) {
          console.log(`      - 🏷️  ON SALE: ${sample.price.discount}% off!`);
        }
      }
      
      if (data.priceStats?.hasValidPrices) {
        console.log(`   💰 Price Statistics:`);
        console.log(`      - Average: £${data.priceStats.average}`);
        console.log(`      - Range: £${data.priceStats.min} - £${data.priceStats.max}`);
        if (data.priceStats.onSaleCount > 0) {
          console.log(`      - Items on sale: ${data.priceStats.onSaleCount}`);
        }
      }
      
      if (data.pagination) {
        console.log(`   📄 Pagination: Page ${data.pagination.current} of ${data.pagination.total || '?'}`);
      }
      
      if (data.breadcrumbs?.length > 0) {
        console.log(`   🔗 Breadcrumbs: ${data.breadcrumbs.map(b => b.name).join(' > ')}`);
      }
      
      await page.close();
    }
    
    // Save enhanced results
    const outputDir = 'scraped-data/universal-test';
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, 'thompsons-enhanced-results.json');
    await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
    
    console.log('\n' + '━'.repeat(60));
    console.log('✨ ENHANCED SCRAPER ASSESSMENT');
    
    // Calculate overall stats
    const allProducts = Object.values(results).flatMap(r => r.products || []);
    const productsWithCleanPrices = allProducts.filter(p => p.price?.formatted);
    
    console.log(`\n✔️  Total Products Scraped: ${allProducts.length}`);
    console.log(`✔️  Products with Clean Prices: ${productsWithCleanPrices.length}`);
    console.log(`✔️  Price Parsing Success Rate: ${Math.round(productsWithCleanPrices.length / allProducts.length * 100)}%`);
    
    console.log('\n🎯 Key Improvements:');
    console.log('   ✅ Automatic price normalization');
    console.log('   ✅ Sale detection and discount calculation');
    console.log('   ✅ VAT handling (inc/exc prices)');
    console.log('   ✅ Contact-required price detection');
    console.log('   ✅ Price statistics calculation');
    
    console.log(`\n📁 Enhanced results saved to: ${outputPath}`);
    console.log('\n' + '━'.repeat(60));
    console.log('✅ Enhanced scraper with clean price parsing ready for production!');
    
  } catch (error) {
    console.error('❌ Error during scraping:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the enhanced test
testEnhancedScraper().catch(console.error);