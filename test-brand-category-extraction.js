/**
 * Test brand and category extraction on Thompson's eParts
 */

const { createClient } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simulate the extractMetadata function from scraper-worker.js
function extractMetadata(document) {
  const getMeta = (name) => {
    const element = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
    );
    return element ? element.getAttribute('content') : null;
  };
  
  // Extract e-commerce specific data
  const extractProductData = () => {
    const productData = {};
    
    // Extract BRAND from multiple sources
    const extractBrand = () => {
      // Try direct brand selectors
      const brandSelectors = [
        '[itemprop="brand"]',
        '[itemprop="manufacturer"]', 
        '.product-brand',
        '.brand',
        '.manufacturer',
        '.product-manufacturer',
        '.brand-name',
        '.product-vendor',
        'span.brand',
        'div.brand'
      ];
      
      for (const selector of brandSelectors) {
        const brandElement = document.querySelector(selector);
        if (brandElement) {
          const brandText = brandElement.textContent?.trim();
          if (brandText && brandText.length > 1 && brandText.length < 100) {
            return brandText;
          }
        }
      }
      
      // Try to extract from product title (common pattern: "Brand - Product Name")
      const titleElement = document.querySelector('h1, .product-title, .product-name');
      if (titleElement) {
        const titleText = titleElement.textContent?.trim();
        if (titleText) {
          // Check for dash pattern
          const dashMatch = titleText.match(/^([A-Z][A-Za-z0-9\s&-]+?)\s*[-–—]\s*/);
          if (dashMatch && dashMatch[1].length < 50) {
            return dashMatch[1].trim();
          }
          
          // Check for known brand patterns in title
          const brandPatterns = [
            /^(Bosch|Makita|DeWalt|Stanley|Black\s*&?\s*Decker|Ryobi|Milwaukee|Festool|Hilti|Metabo)/i,
            /^(Thompson|Draper|Faithfull|Silverline|Sealey|Clarke|Wolf|Einhell)/i
          ];
          
          for (const pattern of brandPatterns) {
            const match = titleText.match(pattern);
            if (match) {
              return match[1].trim();
            }
          }
        }
      }
      
      // Try metadata attributes
      const metaBrand = getMeta('brand') || getMeta('manufacturer') || getMeta('product:brand');
      if (metaBrand) {
        return metaBrand;
      }
      
      return null;
    };
    
    // Extract CATEGORY from multiple sources
    const extractCategory = () => {
      // Try breadcrumbs first (most reliable for categories)
      const breadcrumbSelectors = [
        '.breadcrumb',
        '.breadcrumbs',
        'nav[aria-label*="breadcrumb"]',
        '.woocommerce-breadcrumb',
        '.site-breadcrumbs',
        'ol[itemtype*="BreadcrumbList"]',
        '.navigation-breadcrumbs'
      ];
      
      for (const selector of breadcrumbSelectors) {
        const breadcrumbElement = document.querySelector(selector);
        if (breadcrumbElement) {
          // Get all breadcrumb items
          const items = breadcrumbElement.querySelectorAll('a, span:not(.separator):not(.divider)');
          const categories = [];
          
          items.forEach((item, index) => {
            const text = item.textContent?.trim();
            // Skip home/shop links and the product name (usually last)
            if (text && 
                !text.toLowerCase().match(/^(home|shop|products?)$/i) && 
                index < items.length - 1) {
              categories.push(text);
            }
          });
          
          if (categories.length > 0) {
            // Return as hierarchical path
            return categories.join(' > ');
          }
        }
      }
      
      // Try direct category selectors
      const categorySelectors = [
        '[itemprop="category"]',
        '.product-category',
        '.category',
        '.product-type',
        '.product_cat',
        'span.posted_in a',
        '.product-categories a'
      ];
      
      for (const selector of categorySelectors) {
        const categoryElements = document.querySelectorAll(selector);
        if (categoryElements.length > 0) {
          const categories = [];
          categoryElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 1) {
              categories.push(text);
            }
          });
          
          if (categories.length > 0) {
            return categories.join(', ');
          }
        }
      }
      
      // Try to get from meta tags
      const metaCategory = getMeta('category') || getMeta('product:category') || getMeta('article:section');
      if (metaCategory) {
        return metaCategory;
      }
      
      return null;
    };
    
    productData.brand = extractBrand();
    productData.category = extractCategory();
    
    return productData;
  };
  
  return extractProductData();
}

async function testBrandCategoryExtraction() {
  console.log('🧪 Testing Brand & Category Extraction');
  console.log('=' .repeat(60) + '\n');

  // Test URLs from Thompson's eParts
  const testUrls = [
    'https://www.thompsonseparts.co.uk/product/bosch-gsr-18v-60-c-brushless-drill-driver/',
    'https://www.thompsonseparts.co.uk/product-category/power-tools/',
    'https://www.thompsonseparts.co.uk/'
  ];

  for (const url of testUrls) {
    console.log(`📝 Testing: ${url}`);
    console.log('-'.repeat(40));
    
    try {
      // Fetch the page
      const response = await fetch(url);
      const html = await response.text();
      
      // Parse with JSDOM
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Extract metadata
      const metadata = extractMetadata(document);
      
      console.log('🏷️ Brand:', metadata.brand || '(not found)');
      console.log('📁 Category:', metadata.category || '(not found)');
      
      // Also check the title for context
      const title = document.querySelector('h1')?.textContent?.trim() || 
                   document.title;
      console.log('📄 Title:', title);
      
      // Check breadcrumbs if available
      const breadcrumb = document.querySelector('.woocommerce-breadcrumb, .breadcrumb');
      if (breadcrumb) {
        console.log('🍞 Breadcrumbs:', breadcrumb.textContent?.replace(/\s+/g, ' ').trim());
      }
      
      console.log('');
    } catch (error) {
      console.error('❌ Error testing URL:', error.message);
      console.log('');
    }
  }

  // Check database for recent extractions
  console.log('\n📊 Database Check - Recent Pages with Brand/Category:');
  console.log('=' .repeat(60));
  
  const { data: pages } = await supabase
    .from('scraped_pages')
    .select('url, metadata')
    .like('url', '%thompsonseparts.co.uk%')
    .order('scraped_at', { ascending: false })
    .limit(10);

  if (pages) {
    let withBrand = 0;
    let withCategory = 0;
    
    pages.forEach(page => {
      if (page.metadata?.productBrand) withBrand++;
      if (page.metadata?.productCategory) withCategory++;
    });
    
    console.log(`✅ Pages with brand: ${withBrand}/10`);
    console.log(`✅ Pages with category: ${withCategory}/10`);
    
    // Show example
    const example = pages.find(p => p.metadata?.productBrand || p.metadata?.productCategory);
    if (example) {
      console.log('\nExample metadata:');
      console.log('  URL:', example.url);
      console.log('  Brand:', example.metadata.productBrand || '(none)');
      console.log('  Category:', example.metadata.productCategory || '(none)');
    }
  }
}

// Run the test
testBrandCategoryExtraction().catch(console.error);