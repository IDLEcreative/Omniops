#!/usr/bin/env node

/**
 * Scraper Worker Process
 * Handles the actual crawling in a separate process to avoid blocking the main app
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PlaywrightCrawler } = require('@crawlee/playwright');
const { createClient } = require('@supabase/supabase-js');
const { getResilientRedisClient } = require('./redis-enhanced');
const OpenAI = require('openai');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { EmbeddingDeduplicator } = require('./embedding-deduplicator');
const { MetadataExtractor } = require('./metadata-extractor'); // JavaScript version
const { DatabaseOptimizer } = require('./database-optimizer');
const { EcommerceExtractor } = require('./ecommerce-extractor');
const { ContentEnricher } = require('./content-enricher');
const { sanitizeForLogging } = require('./log-sanitizer');
const { performAdaptiveExtraction } = require('./scraper-integration-hook');

// Initialize the global deduplicator
const deduplicator = new EmbeddingDeduplicator();

// Cache for chunk deduplication
const chunkHashCache = new Map();
const embeddingCache = new Map();

// Progressive concurrency manager
class ConcurrencyManager {
  constructor(initialConcurrency = 5, maxConcurrency = 15) {
    this.current = initialConcurrency;
    this.max = maxConcurrency;
    this.min = 2;
    this.successCount = 0;
    this.errorCount = 0;
    this.lastAdjustment = Date.now();
    this.memoryThreshold = 1500; // MB
  }

  shouldIncrease() {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const timeSinceLastAdjustment = Date.now() - this.lastAdjustment;
    
    // Increase if: memory is OK, good success rate, and enough time has passed
    return memoryMB < this.memoryThreshold && 
           this.current < this.max && 
           this.getSuccessRate() > 0.9 &&
           timeSinceLastAdjustment > 30000; // 30 seconds
  }

  shouldDecrease() {
    const memoryUsage = process.memoryUsage();
    const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    
    // Decrease if: memory is high or error rate is high
    return (memoryMB > this.memoryThreshold || this.getSuccessRate() < 0.7) && 
           this.current > this.min;
  }

  getSuccessRate() {
    const total = this.successCount + this.errorCount;
    return total > 0 ? this.successCount / total : 1;
  }

  adjust() {
    if (this.shouldIncrease()) {
      this.current = Math.min(this.current + 1, this.max);
      this.lastAdjustment = Date.now();
      console.log(`[ConcurrencyManager] Increased concurrency to ${this.current}`);
      return this.current;
    } else if (this.shouldDecrease()) {
      this.current = Math.max(this.current - 1, this.min);
      this.lastAdjustment = Date.now();
      console.log(`[ConcurrencyManager] Decreased concurrency to ${this.current}`);
      return this.current;
    }
    return this.current;
  }

  recordSuccess() {
    this.successCount++;
    // Periodically check for adjustment
    if ((this.successCount + this.errorCount) % 10 === 0) {
      this.adjust();
    }
  }

  recordError() {
    this.errorCount++;
    // Check for adjustment on errors
    this.adjust();
  }

  getCurrent() {
    return this.current;
  }
}

// Common page elements to filter out before chunking
const COMMON_SELECTORS_TO_REMOVE = [
  'nav', 'navigation', '.nav', '#nav',
  'header', '.header', '#header', '.site-header',
  'footer', '.footer', '#footer', '.site-footer',
  'aside', '.sidebar', '#sidebar',
  '.cookie-banner', '.cookie-notice', '.cookie-consent',
  '.social-share', '.social-links', '.social-media',
  '.newsletter', '.subscribe',
  '.ads', '.advertisement', '.ad-container',
  '.comments', '#comments', '.comment-section',
  '.related-posts', '.related-articles',
  '.breadcrumb', '.breadcrumbs',
  '.pagination', '.page-numbers'
];

// Get command line arguments
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite, sitemapUrlsJson, forceRescrapeArg] = process.argv;
const FORCE_RESCRAPE = (forceRescrapeArg === 'true') || (String(process.env.SCRAPER_FORCE_RESCRAPE_ALL || '').toLowerCase() === 'true');

// Early validation of arguments
if (!jobId || !url) {
  console.error('Error: Missing required arguments (jobId, url)');
  process.exit(1);
}

// Parse sitemap URLs if provided
let sitemapUrls = [];
try {
  if (sitemapUrlsJson && sitemapUrlsJson !== '[]') {
    sitemapUrls = JSON.parse(sitemapUrlsJson);
    console.log(`[Worker ${jobId}] Received ${sitemapUrls.length} URLs from sitemap`);
  }
} catch (e) {
  console.log(`[Worker ${jobId}] No sitemap URLs provided or error parsing`);
}

console.log(`[Worker ${jobId}] Starting crawl worker...`);
console.log(`[Worker ${jobId}] URL: ${url}`);
console.log(`[Worker ${jobId}] Max pages: ${maxPages}`);
console.log(`[Worker ${jobId}] Turbo mode: ${turboMode}`);
console.log(`[Worker ${jobId}] Config preset: ${configPreset}`);
console.log(`[Worker ${jobId}] Own site: ${isOwnSite}`);

// Initialize resilient Redis client with automatic reconnection and keepalive
const redisClient = getResilientRedisClient();

// Wait for Redis to be ready
async function waitForRedis() {
  let attempts = 0;
  while (!redisClient.isAvailable() && attempts < 10) {
    console.log(`[Worker ${jobId}] Waiting for Redis connection... (attempt ${attempts + 1})`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }
  if (!redisClient.isAvailable()) {
    throw new Error('Failed to connect to Redis after 10 attempts');
  }
}

// Get the actual Redis client after ensuring connection
let redis;

// Setup keepalive interval to prevent connection timeout during long operations
const redisKeepaliveInterval = setInterval(async () => {
  try {
    if (redis && redisClient.isAvailable()) {
      await redis.ping();
      console.log(`[Worker ${jobId}] Redis keepalive ping successful`);
    }
  } catch (error) {
    console.warn(`[Worker ${jobId}] Redis keepalive failed:`, error.message);
    // The resilient client will handle reconnection automatically
  }
}, 30000); // Ping every 30 seconds

// Function to report initialization errors with resilient Redis operations
async function reportInitError(error) {
  try {
    await redisClient.safeOperation(async () => {
      await redis.hset(`crawl:${jobId}`, {
        status: 'failed',
        error: error,
        completedAt: new Date().toISOString(),
      });
      await redis.expire(`crawl:${jobId}`, 300); // Keep error for 5 minutes
    });
  } catch (redisError) {
    console.error(`[Worker ${jobId}] Failed to report error to Redis (will use fallback):`, redisError);
    // Store in fallback storage if Redis is unavailable
    redisClient.fallbackStorage.set(`crawl:${jobId}`, {
      status: 'failed',
      error: error,
      completedAt: new Date().toISOString(),
    });
  }
}

// Check required environment variables with better error reporting
async function checkEnvironmentVariables() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const errorMsg = 'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(errorMsg);
    clearInterval(redisKeepaliveInterval);
    await redisClient.cleanup();
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    const errorMsg = 'Missing OPENAI_API_KEY environment variable';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(errorMsg);
    clearInterval(redisKeepaliveInterval);
    await redisClient.cleanup();
    process.exit(1);
  }
}

// Initialize services with error handling
let supabase;
let openai;

async function initializeServices() {
  // Check environment variables first
  await checkEnvironmentVariables();
  
  try {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Initialize the database optimizer for bulk operations
    global.dbOptimizer = new DatabaseOptimizer(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log(`[Worker ${jobId}] Supabase client initialized`);
  } catch (error) {
    const errorMsg = `Failed to initialize Supabase client: ${error.message}`;
    console.error(`[Worker ${jobId}] ${errorMsg}`);
    await reportInitError(errorMsg);
    clearInterval(redisKeepaliveInterval);
    await redisClient.cleanup();
    process.exit(1);
  }

  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log(`[Worker ${jobId}] OpenAI client initialized`);
  } catch (error) {
    const errorMsg = `Failed to initialize OpenAI client: ${error.message}`;
    console.error(`[Worker ${jobId}] ${errorMsg}`);
    await reportInitError(errorMsg);
    clearInterval(redisKeepaliveInterval);
    await redisClient.cleanup();
    process.exit(1);
  }
}

// Smart content extraction with business info preservation
function extractBusinessInfo(html) {
  const $ = cheerio.load(html);
  
  // Phone patterns
  const phonePatterns = [
    /(\+?[\d\s()-]{10,20})/g,
    /(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/g,
    /(0[1-9]\d{9,10})/g,
  ];
  
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
  
  const phones = new Set();
  const emails = new Set();
  const addresses = new Set();
  
  $('a[href^="tel:"]').each((_, el) => {
    const phone = $(el).attr('href')?.replace('tel:', '').trim();
    if (phone) phones.add(phone);
  });
  
  $('a[href^="mailto:"]').each((_, el) => {
    const email = $(el).attr('href')?.replace('mailto:', '').trim();
    if (email) emails.add(email);
  });
  
  const bodyText = $('body').text();
  if (phones.size === 0) {
    phonePatterns.forEach(pattern => {
      const matches = bodyText.match(pattern);
      matches?.forEach(match => {
        const cleaned = match.trim();
        if (cleaned.length >= 10) phones.add(cleaned);
      });
    });
  }
  
  if (emails.size === 0) {
    const emailMatches = bodyText.match(emailPattern);
    emailMatches?.forEach(email => emails.add(email));
  }
  
  $('address, .address, .location, [itemtype*="PostalAddress"]').each((_, el) => {
    const addr = $(el).text().trim();
    if (addr.length > 10) addresses.add(addr);
  });
  
  const businessHours = [];
  const hoursSelectors = ['.hours', '.business-hours', '.opening-hours', '.store-hours'];
  hoursSelectors.forEach(selector => {
    $(selector).each((_, el) => {
      const hours = $(el).text().trim();
      if (hours && hours.length < 500) businessHours.push(hours);
    });
  });
  
  return {
    contactInfo: {
      phones: Array.from(phones).slice(0, 5),
      emails: Array.from(emails).slice(0, 5),
      addresses: Array.from(addresses).slice(0, 3),
    },
    businessHours,
  };
}

function htmlToText(html) {
  const $ = cheerio.load(html);
  
  // Selective stripping that preserves business info
  
  // Remove pure navigation menus
  $('.mega-menu, .dropdown-menu, .nav-menu, .mobile-menu').remove();
  $('nav ul, nav ol').each((_, el) => {
    const $el = $(el);
    const linkCount = $el.find('a').length;
    const textLength = $el.text().length;
    if (linkCount > 5 && textLength / linkCount < 20) {
      $el.remove();
    }
  });
  
  // Remove social sharing widgets (not social links)
  $('.share-buttons, .social-share, .addthis, .sharethis').remove();
  
  // Remove promotional banners and popups
  $('.popup, .modal, .overlay, .banner:not(.info-banner)').remove();
  $('.promo, .advertisement, .ads, [class*="popup"]').remove();
  
  // Remove cookie notices
  $('.cookie, .gdpr, [class*="cookie"], [id*="cookie"]').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    if (text.includes('cookie') || text.includes('gdpr')) {
      $el.remove();
    }
  });
  
  // Smart header/footer removal - only if they don't contain important info
  $('header, footer, .header, .footer').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    
    const hasImportantInfo = 
      text.includes('phone') ||
      text.includes('email') ||
      text.includes('address') ||
      text.includes('hours') ||
      text.includes('contact') ||
      $el.find('address, .contact, .phone, .email, .hours').length > 0;
    
    const linkCount = $el.find('a').length;
    const wordCount = $el.text().split(/\s+/).length;
    const isMainlyNav = linkCount > 10 && wordCount < linkCount * 3;
    
    if (isMainlyNav && !hasImportantInfo) {
      $el.remove();
    }
  });
  
  // Remove sidebar if mainly navigation
  $('.sidebar, aside').each((_, el) => {
    const $el = $(el);
    const text = $el.text().toLowerCase();
    
    if (text.includes('contact') || text.includes('hours') || text.includes('location')) {
      return; // Keep this sidebar
    }
    
    const linkCount = $el.find('a').length;
    const wordCount = $el.text().split(/\s+/).length;
    if (linkCount > 5 && wordCount < linkCount * 5) {
      $el.remove();
    }
  });
  
  // Remove related posts but keep related products
  $('.related, .recommended, [class*="related"]').each((_, el) => {
    const $el = $(el);
    if (!$el.hasClass('products')) {
      $el.remove();
    }
  });
  
  // Remove breadcrumbs and comments
  $('.breadcrumb, .breadcrumbs, [aria-label="breadcrumb"]').remove();
  $('.comments, #comments, .disqus, #disqus_thread').remove();
  
  // Also remove script/style tags
  $('script, style, noscript').remove();
  
  // Preserve some structure
  $('p, div, section, article').append('\n\n');
  $('br').replaceWith('\n');
  $('li').prepend('• ');
  
  // Get text content
  return $.text()
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function extractWithReadability(html, url) {
  // Create virtual DOM
  const dom = new JSDOM(html, { url });
  const document = dom.window.document;
  
  // Extract metadata before processing
  const metadata = extractMetadata(document);
  const images = extractImages(document);
  const links = extractLinks(document, url);
  
  // Use our fallback extraction method directly (since we don't have @mozilla/readability)
  const extracted = fallbackExtraction(document);
  let content = extracted.content;
  let textContent = extracted.textContent;
  let title = extracted.title || metadata.title || '';
  let excerpt = metadata.description || '';
  
  // If fallback didn't get much content, try a simpler approach
  if (!textContent || textContent.length < 100) {
    const $ = cheerio.load(html);
    // Remove unwanted elements
    $('script, style, noscript, iframe, nav, header, footer').remove();
    
    // Get body text
    textContent = $('body').text() || '';
    content = textContent;
  }
  
  // Clean up content
  content = cleanContent(content);
  textContent = textContent.trim();
  
  // Calculate metrics
  const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // Average reading speed
  
  // Generate content hash for deduplication
  const contentHash = generateContentHash(textContent);
  
  return {
    title,
    content,
    textContent,
    excerpt,
    author: metadata.author,
    publishedDate: metadata.publishedDate,
    modifiedDate: metadata.modifiedDate,
    lang: document.documentElement.lang || 'en',
    images,
    links,
    metadata,
    contentHash,
    wordCount,
    readingTime,
  };
}

function fallbackExtraction(document) {
  const $ = cheerio.load(document.documentElement.outerHTML);
  
  // Remove unwanted elements - expanded list for better deduplication
  $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();
  
  // Remove all common selectors that appear on every page
  COMMON_SELECTORS_TO_REMOVE.forEach(selector => {
    $(selector).remove();
  });
  
  // Also remove elements with common class/id patterns
  $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
  $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();
  $('[class*="cookie"], [class*="banner"], [class*="modal"], [class*="popup"]').remove();
  
  // Try to find main content using various selectors
  const contentSelectors = [
    'main',
    'article',
    '[role="main"]',
    '.main-content',
    '#main-content',
    '.post-content',
    '.entry-content',
    '.content-area',
    '.article-body',
    '.story-body',
    '.c-entry-content',
    '.Post-body',
    '#content',
    '.content',
    'body',
  ];
  
  let mainContent = '';
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      mainContent = element.html() || '';
      break;
    }
  }
  
  // Get title
  const title = $('title').text() || 
                $('h1').first().text() || 
                $('meta[property="og:title"]').attr('content') || 
                '';
  
  // Convert to text
  const content = htmlToText(mainContent);
  const textContent = $(mainContent).text();
  
  return { content, textContent, title: title.trim() };
}

function extractMetadata(document) {
  const getMeta = (name) => {
    const element = document.querySelector(
      `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
    );
    return element ? element.getAttribute('content') : null;
  };
  
  // Extract JSON-LD structured data
  let structuredData = {};
  const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '{}');
      structuredData = { ...structuredData, ...data };
    } catch (e) {
      // Ignore parsing errors
    }
  });
  
  // Extract e-commerce specific data  
  const extractProductData = () => {
    const productData = {};
    
    // Helper function to get meta tags - defined inside extractProductData
    const getMetaInner = (name) => {
      const element = document.querySelector(
        `meta[name="${name}"], meta[property="${name}"], meta[property="og:${name}"], meta[property="article:${name}"]`
      );
      return element ? element.getAttribute('content') : null;
    };
    
    // Try to extract price
    const priceSelectors = [
      '.price', '.product-price', '.woocommerce-Price-amount', 
      '[itemprop="price"]', '.regular-price', '.sale-price',
      'span.amount', '.price-box', '.product-price-value'
    ];
    
    for (const selector of priceSelectors) {
      const priceElement = document.querySelector(selector);
      if (priceElement) {
        productData.price = priceElement.textContent?.trim();
        break;
      }
    }
    
    // Try to extract availability/stock
    const stockSelectors = [
      '.stock', '.in-stock', '.out-of-stock', '.availability',
      '[itemprop="availability"]', '.stock-status', '.product-stock'
    ];
    
    for (const selector of stockSelectors) {
      const stockElement = document.querySelector(selector);
      if (stockElement) {
        productData.availability = stockElement.textContent?.trim();
        productData.inStock = !stockElement.textContent?.toLowerCase().includes('out of stock');
        break;
      }
    }
    
    // Try to extract SKU
    const skuSelectors = [
      '.sku', '[itemprop="sku"]', '.product-sku', '.sku-number'
    ];
    
    for (const selector of skuSelectors) {
      const skuElement = document.querySelector(selector);
      if (skuElement) {
        productData.sku = skuElement.textContent?.trim();
        break;
      }
    }
    
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
      const titleElement = document.querySelector('h1, .product-title, .product-name, .entry-title');
      if (titleElement) {
        const titleText = titleElement.textContent?.trim();
        if (titleText) {
          // Remove common suffixes first
          const cleanTitle = titleText
            .replace(/\s*[-–—]\s*Thompsons?\s+E\s+Parts?\s*$/i, '')
            .replace(/\s*[-–—]\s*Page not found\s*$/i, '')
            .trim();
          
          // Pattern 1: All caps word(s) at the beginning (CIFA, PARKER, BAWER, TS)
          const allCapsMatch = cleanTitle.match(/^([A-Z]{2,}(?:[A-Z0-9-]*)?(?:\s+[A-Z]{2,})?)/);
          if (allCapsMatch && allCapsMatch[1].length <= 30) {
            const brand = allCapsMatch[1].trim();
            // Filter out generic terms
            if (!brand.match(/^(ONLY|NOT|INC|MK\d+|DC|AC)$/)) {
              return brand;
            }
          }
          
          // Pattern 2: Brand/Brand format (Binotto/OMFB)
          const slashMatch = cleanTitle.match(/^([A-Z][A-Za-z]+\/[A-Z][A-Za-z]+)/);
          if (slashMatch) {
            return slashMatch[1];
          }
          
          // Pattern 3: Capitalized word(s) at the beginning before product descriptors
          const leadingBrandMatch = cleanTitle.match(/^([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)?)\s+/);
          if (leadingBrandMatch) {
            const potentialBrand = leadingBrandMatch[1];
            // Check if the next word suggests this is a brand (not a description)
            const afterBrand = cleanTitle.substring(leadingBrandMatch[0].length);
            // If followed by model numbers or certain patterns, it's likely a brand
            if (afterBrand.match(/^[A-Z0-9]{2,}/)) { // Model numbers often follow brands
              return potentialBrand;
            }
          }
          
          // Pattern 4: Two capitalized words at start (likely brand + model/series)
          const twoCapWordsMatch = cleanTitle.match(/^([A-Z][A-Za-z]+)\s+([A-Z][A-Za-z]+)/);
          if (twoCapWordsMatch) {
            const firstWord = twoCapWordsMatch[1];
            const secondWord = twoCapWordsMatch[2];
            
            // If second word starts with uppercase and is short, might be model
            // If second word is all lowercase after first letter, likely a product type
            // Return first word as brand
            if (secondWord.match(/^[A-Z][A-Z0-9]{1,4}$/) || // Short uppercase codes
                secondWord.match(/^[A-Z][a-z]+$/)) { // Capitalized words
              return firstWord;
            }
          }
          
          // Pattern 5: Extract from "for Brand" or "to fit Brand" patterns
          const fitMatch = cleanTitle.match(/(?:for|to\s+fit|suit|suits?)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][a-z]+)?)/i);
          if (fitMatch) {
            const brand = fitMatch[1].trim();
            // Only return if it starts with capital letter (proper noun/brand name)
            if (brand.match(/^[A-Z]/)) {
              return brand;
            }
          }
          
          // Pattern 6: Dash pattern but more flexible
          const dashMatch = cleanTitle.match(/^([A-Z][A-Za-z0-9\s&\/.-]+?)\s*[-–—]\s*/);
          if (dashMatch && dashMatch[1].length < 40) {
            const potentialBrand = dashMatch[1].trim();
            // Only return if it starts with a capital letter and isn't just numbers
            if (potentialBrand.match(/^[A-Z]/) && !potentialBrand.match(/^\d+$/)) {
              // Check if it's likely a brand (short, capitalized properly)
              if (potentialBrand.length <= 25) {
                return potentialBrand;
              }
            }
          }
        }
      }
      
      // Try metadata attributes
      const metaBrand = getMetaInner('brand') || getMetaInner('manufacturer') || getMetaInner('product:brand');
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
      const metaCategory = getMetaInner('category') || getMetaInner('product:category') || getMetaInner('article:section');
      if (metaCategory) {
        return metaCategory;
      }
      
      return null;
    };
    
    // Extract brand and category
    productData.brand = extractBrand();
    productData.category = extractCategory();
    
    // Add timestamp for when this was last checked (use different name to avoid conflict)
    productData.extractedAt = new Date().toISOString();
    
    return productData;
  };
  
  const productData = extractProductData();
  
  // Remove product-related fields from structuredData to avoid duplication
  const { price, sku, productID, brand, manufacturer, category, availability, offers, ...cleanStructuredData } = structuredData;
  
  // Don't spread raw productData to avoid legacy field names
  const { 
    price: prodPrice, 
    sku: prodSku, 
    inStock, 
    categories, 
    availability: prodAvailability, 
    brand: prodBrand,
    category: prodCategory,
    extractedAt, 
    ...otherProductData 
  } = productData;
  
  return {
    title: getMeta('title') || document.title,
    description: getMeta('description'),
    author: getMeta('author') || getMeta('article:author'),
    publishedDate: getMeta('published_time') || getMeta('datePublished'),
    modifiedDate: getMeta('modified_time') || getMeta('dateModified'),
    keywords: getMeta('keywords'),
    type: getMeta('type'),
    image: getMeta('image'),
    site_name: getMeta('site_name'),
    ...cleanStructuredData, // Spread non-product structured data
    // ONLY use consolidated field names with priority: extracted > structured > metadata
    productSku: prodSku || sku || productID,
    productPrice: prodPrice || price || offers?.price,
    productInStock: inStock !== undefined ? inStock : 
                    (availability === 'InStock' || 
                     offers?.availability === 'https://schema.org/InStock'),
    productBrand: prodBrand || brand?.name || brand || manufacturer,
    productCategory: prodCategory || categories || category,
    // Add timestamp
    lastChecked: new Date().toISOString()
  };
}

function extractImages(document) {
  const images = [];
  const imgElements = document.querySelectorAll('img');
  
  imgElements.forEach(img => {
    const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (src && !src.includes('data:image')) { // Skip base64 images
      images.push({
        src: src,
        alt: img.alt || img.getAttribute('title') || 'Image',
      });
    }
  });
  
  return images;
}

function extractLinks(document, baseUrl) {
  const links = [];
  const linkElements = document.querySelectorAll('a[href]');
  const baseUrlObj = new URL(baseUrl);
  
  linkElements.forEach(link => {
    try {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const absoluteUrl = new URL(href, baseUrl).href;
        const linkUrl = new URL(absoluteUrl);
        
        // Only include same-domain links
        if (linkUrl.hostname === baseUrlObj.hostname) {
          links.push({
            href: absoluteUrl,
            text: link.textContent?.trim() || '',
          });
        }
      }
    } catch (e) {
      // Ignore invalid URLs
    }
  });
  
  // Remove duplicates
  const uniqueLinks = Array.from(
    new Map(links.map(link => [link.href, link])).values()
  );
  
  return uniqueLinks;
}

function cleanContent(content) {
  return content
    .replace(/\n{3,}/g, '\n\n') // Remove excessive newlines
    .replace(/\s+$/gm, '') // Remove trailing spaces
    .replace(/^\s+/gm, '') // Remove leading spaces
    .replace(/\[(.+?)\]\(\)/g, '$1') // Remove empty links
    .replace(/!\[(.+?)\]\(\)/g, '') // Remove broken images
    .trim();
}

function generateContentHash(content) {
  // Normalize content for hashing
  const normalized = content
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
  
  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex')
    .substring(0, 16); // Use first 16 chars for efficiency
}

// Helper function to generate SHA-256 hash for content
function generateChunkHash(text) {
  // Normalize text for consistent hashing
  const normalized = text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .trim();
  
  return crypto.createHash('sha256')
    .update(normalized)
    .digest('hex');
}

// Helper function to check if chunk is duplicate
function isDuplicateChunk(chunkText, pageUrl) {
  const chunkHash = generateChunkHash(chunkText);
  
  // Check if we've seen this exact chunk before
  if (chunkHashCache.has(chunkHash)) {
    const existingUrl = chunkHashCache.get(chunkHash);
    // If it's from a different page, it's likely a common element
    if (existingUrl !== pageUrl) {
      console.log(`[Worker ${jobId}] Duplicate chunk detected (seen on ${existingUrl})`);
      return true;
    }
  }
  
  // Mark this chunk as seen
  chunkHashCache.set(chunkHash, pageUrl);
  return false;
}

// Fallback SemanticChunker class (simplified version)
class SemanticChunker {
  static smartChunk(text, options = {}) {
    const maxChunkSize = options.maxChunkSize || 1500;
    const overlap = options.overlap || 200;
    const chunks = [];
    
    // Simple sentence-aware chunking
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        // Add overlap from the end of the previous chunk
        currentChunk = currentChunk.slice(-overlap) + sentence;
      } else {
        currentChunk += sentence;
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [text];
  }
}

// Helper function to split text into chunks with global deduplication
async function splitIntoChunks(text, maxChunkSize = 1000, pageUrl = '', htmlContent = null) {
  let allChunks = [];
  
  // Try semantic chunking first if we have enough content
  if (text.length > 500 && htmlContent) {
    try {
      console.log(`[Worker ${jobId}] Using semantic chunking for ${pageUrl}`);
      const semanticChunks = SemanticChunker.smartChunk(text, { maxChunkSize: maxChunkSize });
      
      // SemanticChunker.smartChunk returns an array of strings
      allChunks = semanticChunks;
      
      console.log(`[Worker ${jobId}] Created ${allChunks.length} semantic chunks (avg size: ${Math.round(text.length / allChunks.length)} chars)`);
    } catch (error) {
      console.error(`[Worker ${jobId}] Semantic chunking failed, falling back to simple chunking:`, error);
      // Fall back to simple chunking
      allChunks = simpleChunking(text, maxChunkSize);
    }
  } else {
    // Use simple chunking for short content or when no HTML available
    allChunks = simpleChunking(text, maxChunkSize);
  }
  
  // Filter out boilerplate chunks (always filter navigation/boilerplate even during force rescrape)
  const nonBoilerplateChunks = allChunks.filter(chunk => !isDuplicateChunk(chunk, pageUrl));
  
  // Skip global cross-page deduplication when force rescraping (but keep local navigation filtering)
  if (FORCE_RESCRAPE) {
    console.log(`[Worker ${jobId}] Force rescrape enabled - using local deduplication only for ${pageUrl}`);
    // Still filter out duplicate chunks within this page
    const seen = new Set();
    const uniqueChunks = nonBoilerplateChunks.filter(chunk => {
      const chunkHash = generateChunkHash(chunk);
      if (seen.has(chunkHash)) {
        return false;
      }
      seen.add(chunkHash);
      return true;
    });
    return uniqueChunks;
  }
  
  // Now use the global deduplicator to filter out already-seen chunks across all pages
  const { unique, duplicates } = await deduplicator.filterDuplicates(nonBoilerplateChunks, pageUrl);
  
  if (duplicates.length > 0) {
    console.log(`[Worker ${jobId}] Global deduplicator filtered ${duplicates.length} duplicate chunks for ${pageUrl}`);
  }

  return unique;
}

// Simple chunking fallback function
function simpleChunking(text, maxChunkSize) {
  const sentences = text.split(/[.!?]+/);
  const chunks = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// Helper function to generate embeddings with global deduplication and optimized batching
async function generateEmbeddings(chunks) {
  // Use the global deduplicator for smart caching and deduplication
  return await deduplicator.processChunksForEmbeddings(chunks, async (chunksToEmbed) => {
    console.log(`[Worker ${jobId}] Generating embeddings for ${chunksToEmbed.length} new chunks via OpenAI API`);
    
    const embeddings = [];
    // Increased batch size for better API efficiency (OpenAI supports up to 2048)
    const batchSize = 50; // Increased from 20 to 50 for better throughput
    
    // Process chunks in larger batches
    const promises = [];
    for (let i = 0; i < chunksToEmbed.length; i += batchSize) {
      const batch = chunksToEmbed.slice(i, i + batchSize);
      
      // Add small delay between batches to avoid rate limiting
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const promise = openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: batch,
      }).then(response => response.data.map(d => d.embedding));
      
      promises.push(promise);
      
      // Process up to 3 requests in parallel for better throughput
      if (promises.length >= 3 || i + batchSize >= chunksToEmbed.length) {
        const results = await Promise.all(promises);
        results.forEach(result => embeddings.push(...result));
        promises.length = 0;
      }
    }
    
    return embeddings;
  });
}

// Helper function to get cache statistics
function getCacheStats() {
  return {
    chunkHashes: chunkHashCache.size,
    embeddings: embeddingCache.size,
    estimatedMemoryMB: (chunkHashCache.size * 100 + embeddingCache.size * 6000) / 1024 / 1024
  };
}

// Main crawl function
async function runCrawl() {
  try {
    // Validate Playwright is available
    if (!PlaywrightCrawler) {
      throw new Error('PlaywrightCrawler not available - missing @crawlee/playwright dependency');
    }

    // Update job status to processing
    await redis.hset(`crawl:${jobId}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
      workerPid: process.pid,
      workerVersion: '1.0.1', // Track worker version for debugging
    });

    console.log(`[Worker ${jobId}] Starting crawl with PID ${process.pid}...`);

    const results = [];
    const visited = new Set();
    const maxPagesToScrape = maxPages === undefined ? -1 : parseInt(maxPages); // Default to unlimited if not specified
    
    // Initialize concurrency manager
    const concurrencyManager = new ConcurrencyManager(
      turboMode === 'true' ? 5 : 3, // Initial concurrency
      turboMode === 'true' ? 12 : 8  // Max concurrency
    );
    
    // Create the crawler with enhanced error handling and performance optimizations
    console.log(`[Worker ${jobId}] Initializing PlaywrightCrawler with optimizations...`);
    
    // Dynamic concurrency using the concurrency manager
    const initialConcurrency = concurrencyManager.getCurrent();
    
    // Calculate the max requests value
    const maxRequests = maxPagesToScrape === -1 ? 1000000 : maxPagesToScrape;
    console.log(`[Worker ${jobId}] maxPagesToScrape: ${maxPagesToScrape}, maxRequests: ${maxRequests}, type: ${typeof maxRequests}`);
    
    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: maxRequests, // Use calculated value
      requestHandlerTimeoutSecs: 20, // Reduced from 30 to 20 seconds
      navigationTimeoutSecs: 20, // Added navigation timeout
      maxConcurrency: initialConcurrency,
      
      // Add browser launch options for better performance
      launchContext: {
        launchOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Overcome limited resource problems
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--disable-blink-features=AutomationControlled',
            '--disable-gpu', // Disable GPU for better performance in headless
            '--no-first-run',
            '--no-default-browser-check',
          ],
        },
      },
      
      async requestHandler({ request, page, enqueueLinks }) {
        const pageUrl = request.url;
        
        // Skip if already visited
        if (visited.has(pageUrl)) {
          console.log(`[Worker ${jobId}] Skipping duplicate: ${pageUrl}`);
          return;
        }
        visited.add(pageUrl);
        
        // Check if we have this page cached and if it's still fresh (unless forced)
        if (!FORCE_RESCRAPE) {
          let existingPage = null;
          try {
            const { data } = await supabase
              .from('scraped_pages')
              .select('scraped_at, metadata')
              .eq('url', pageUrl)
              .single();
            existingPage = data;
          } catch (error) {
            existingPage = null; // Missing is fine
          }
          
          if (existingPage && existingPage.scraped_at) {
            const lastScraped = new Date(existingPage.scraped_at);
            const hoursSinceLastScrape = (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60);
            
            // Skip if scraped recently (within 24 hours for non-critical pages)
            if (hoursSinceLastScrape < 24) {
              console.log(`[Worker ${jobId}] Skipping recently scraped page (${hoursSinceLastScrape.toFixed(1)}h ago): ${pageUrl}`);
              concurrencyManager.recordSuccess(); // Count as success
              return;
            }
          }
        } else {
          console.log(`[Worker ${jobId}] Force re-scrape enabled; bypassing recency checks for ${pageUrl}`);
        }
        
        console.log(`[Worker ${jobId}] Scraping: ${pageUrl}`);
        
        try {
          // Set up request interception to block unnecessary resources
          await page.route('**/*', (route) => {
            const request = route.request();
            const resourceType = request.resourceType();
            const url = request.url();
            
            // Block resource-heavy content
            const blockedResources = ['image', 'media', 'font', 'stylesheet'];
            const blockedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', 
                                     '.woff', '.woff2', '.ttf', '.eot',
                                     '.mp4', '.webm', '.mp3', '.wav'];
            const blockedDomains = ['google-analytics.com', 'googletagmanager.com', 'facebook.com',
                                  'doubleclick.net', 'twitter.com', 'linkedin.com', 'pinterest.com'];
            
            // Check if should block
            const shouldBlock = blockedResources.includes(resourceType) ||
                              blockedExtensions.some(ext => url.toLowerCase().endsWith(ext)) ||
                              blockedDomains.some(domain => url.includes(domain));
            
            if (shouldBlock) {
              route.abort();
            } else {
              route.continue();
            }
          });
          
          // Wait for content to load with shorter timeout
          await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
          
          // Get page content
          const html = await page.content();
          const title = await page.title();
          
          // Extract business info first
          const businessInfo = extractBusinessInfo(html);
          
          // Try e-commerce extraction for product data
          let ecommerceData = null;
          try {
            console.log(`[Worker ${jobId}] Attempting e-commerce extraction for ${pageUrl}`);
            const ecommerceExtracted = await EcommerceExtractor.extractEcommerce(html, pageUrl);
            if (ecommerceExtracted?.products?.length > 0) {
              ecommerceData = ecommerceExtracted;
              console.log(`[Worker ${jobId}] Extracted ${ecommerceData.products.length} products from ${pageUrl}`);
              // Always log first product for verification (not just force rescrape)
              const firstProduct = ecommerceData.products[0];
              console.log(`[Worker ${jobId}] Product:`, sanitizeForLogging({
                name: firstProduct.name,
                sku: firstProduct.sku,
                price: firstProduct.price?.formatted || firstProduct.price?.raw || firstProduct.price,
                availability: firstProduct.availability?.inStock
              }));
            } else {
              console.log(`[Worker ${jobId}] No products extracted from ${pageUrl}`);
            }
          } catch (ecomError) {
            console.log(`[Worker ${jobId}] E-commerce extraction failed:`, ecomError.message);
            console.error(`[Worker ${jobId}] E-commerce extraction error details:`, ecomError);
          }
          
          // ALWAYS extract content with Readability for the base structure
          const extracted = extractWithReadability(html, pageUrl);
          
          // Add business info to extracted data
          extracted.businessInfo = businessInfo;
          
          // Add e-commerce data if available
          if (ecommerceData) {
            extracted.ecommerceData = {
              platform: ecommerceData.platform,
              pageType: ecommerceData.pageType,
              products: ecommerceData.products,
              pagination: ecommerceData.pagination,
              breadcrumbs: ecommerceData.breadcrumbs
            };
          }
          
          // Prepare page data
          const pageData = {
            url: pageUrl,
            title: title || extracted.title,
            content: extracted.content,  // HTML content
            textContent: extracted.textContent,  // Clean text content
            metadata: {
              ...extracted.metadata,
              wordCount: extracted.wordCount,
              images: extracted.images,
              links: extracted.links
            },
            businessInfo: extracted.businessInfo,
            ecommerceData: extracted.ecommerceData
          };
          
          // Save to database immediately
          try {
            // Get or create domain
            let domainId = null;
            const domainMatch = pageUrl.match(/https?:\/\/([^\/]+)/);
            if (domainMatch) {
              const domain = domainMatch[1].replace('www.', '');
              
              const { data: domainData } = await supabase
                .from('domains')
                .select('id')
                .eq('domain', domain)
                .single();
              
              if (domainData) {
                domainId = domainData.id;
              }
            }
            
            // Prepare database record with consolidated metadata
            // The metadata already contains productSku, productPrice, etc. from extractMeta()
            // We should prioritize ecommerceData if available as it's more detailed
            const dbRecord = {
              url: pageData.url,
              title: pageData.title,
              content: pageData.content,  // HTML content for display
              text_content: pageData.textContent,  // Clean text for embeddings
              metadata: {
                ...(pageData.metadata || {}),
                businessInfo: pageData.businessInfo || {},
                ecommerceData: pageData.ecommerceData || null,
                extractedAt: new Date().toISOString(),
                // Override with ecommerceData if available (more detailed/accurate)
                ...(pageData.ecommerceData?.products?.[0] && {
                  productName: pageData.ecommerceData.products[0].name,
                  productSku: pageData.ecommerceData.products[0].sku || pageData.metadata?.productSku,
                  productPrice: pageData.ecommerceData.products[0].price?.formatted || 
                               pageData.ecommerceData.products[0].price?.raw || 
                               pageData.ecommerceData.products[0].price ||
                               pageData.metadata?.productPrice,
                  productInStock: pageData.ecommerceData.products[0].availability?.inStock ?? 
                                 pageData.metadata?.productInStock,
                  productBrand: pageData.ecommerceData.products[0].brand || pageData.metadata?.productBrand,
                  productCategory: pageData.ecommerceData.products[0].category || pageData.metadata?.productCategory
                })
              },
              status: 'completed',
              scraped_at: new Date().toISOString(),
              last_scraped_at: new Date().toISOString()
            };
            
            if (domainId) {
              dbRecord.domain_id = domainId;
            }
            
            // Save page to database
            const { data: savedPage, error: pageError } = await supabase
              .from('scraped_pages')
              .upsert(dbRecord, {
                onConflict: 'url',
                ignoreDuplicates: false
              })
              .select()
              .single();
            
            if (pageError) {
              console.error(`[Worker ${jobId}] Error saving page ${pageUrl}:`, pageError);
            } else {
              console.log(`[Worker ${jobId}] Saved page to database: ${pageUrl}`);
              
              // Perform adaptive entity extraction (domain-agnostic)
              if (savedPage && domainId) {
                try {
                  const adaptiveResult = await performAdaptiveExtraction(
                    { 
                      id: savedPage.id,
                      url: pageUrl,
                      title: savedPage.title,
                      content: savedPage.content
                    },
                    domainId,
                    supabase
                  );
                  
                  if (adaptiveResult.success) {
                    console.log(`[Worker ${jobId}] Adaptive extraction complete:`, {
                      businessType: adaptiveResult.businessType,
                      extracted: adaptiveResult.extracted
                    });
                  }
                } catch (adaptiveError) {
                  console.error(`[Worker ${jobId}] Adaptive extraction failed:`, adaptiveError.message);
                }
              }
              
              // Always log enhanced metadata for visibility (with sanitization)
              if (dbRecord.metadata?.productSku || dbRecord.metadata?.productPrice) {
                const metadataToLog = {
                  productSku: dbRecord.metadata?.productSku,
                  productPrice: dbRecord.metadata?.productPrice,
                  productInStock: dbRecord.metadata?.productInStock,
                  productBrand: dbRecord.metadata?.productBrand,
                  productCategory: dbRecord.metadata?.productCategory,
                  lastChecked: dbRecord.metadata?.extractedAt,
                  mode: FORCE_RESCRAPE ? 'force-rescrape' : 'normal'
                };
                console.log(`[Worker ${jobId}] Enhanced metadata extracted for ${pageUrl}:`, 
                  sanitizeForLogging(metadataToLog));
              }
              
              // Generate embeddings for the content
              if (pageData.textContent && pageData.textContent.length > 0) {
                // Check if embeddings already exist
                const { data: existingEmbeddings } = await supabase
                  .from('page_embeddings')
                  .select('id')
                  .eq('page_id', savedPage.id)
                  .limit(1);
                
                // Generate embeddings if they don't exist OR if force rescrape is enabled
                if (!existingEmbeddings || existingEmbeddings.length === 0 || FORCE_RESCRAPE) {
                  // Enrich content with metadata for better embeddings
                  let enrichedContent = pageData.textContent;  // Use clean text, not HTML
                  if (pageData.metadata) {
                    enrichedContent = ContentEnricher.enrichContent(
                      pageData.textContent,  // Use clean text, not HTML
                      pageData.metadata, 
                      pageUrl, 
                      pageData.title || ''
                    );
                    console.log(`[Worker ${jobId}] Content enriched with metadata for ${pageUrl}`);
                  }
                  
                  // Split into chunks with semantic understanding or fallback to simple
                  // PERFORMANCE: Larger chunks = fewer embeddings = faster processing
                  const chunks = await splitIntoChunks(enrichedContent, 3000, pageUrl, html);
                  
                  if (chunks.length > 0) {
                    console.log(`[Worker ${jobId}] Generating ${chunks.length} embeddings for ${pageUrl}`);
                    const embeddings = await generateEmbeddings(chunks);
                    
                    // Delete any old embeddings first (already optimized by index)
                    if (FORCE_RESCRAPE && existingEmbeddings?.length > 0) {
                      console.log(`[Worker ${jobId}] Force rescrape - deleting ${existingEmbeddings.length} old embeddings for ${pageUrl}`);
                    }
                    const deleteStart = Date.now();
                    await supabase
                      .from('page_embeddings')
                      .delete()
                      .eq('page_id', savedPage.id);
                    console.log(`[Worker ${jobId}] Deleted old embeddings in ${Date.now() - deleteStart}ms`);
                    
                    // PERFORMANCE OPTIMIZATION: Extract metadata ONCE for the entire page
                    // This reduces processing time from 9 hours to ~1.5 hours
                    const pageMetadata = await MetadataExtractor.extractEnhancedMetadata(
                      pageData.content, // Full content for better extraction
                      pageData.content,
                      pageUrl,
                      pageData.title || '',
                      0,
                      chunks.length,
                      html // Pass the HTML content for better extraction
                    );
                    
                    // Apply the same metadata to all chunks (much faster!)
                    const embeddingRecords = chunks.map((chunk, index) => ({
                      page_id: savedPage.id,
                      chunk_text: chunk,
                      // Format embedding for pgvector: convert array to string format
                      embedding: `[${embeddings[index].join(',')}]`,
                      metadata: {
                        ...pageMetadata, // Use the page-level metadata
                        chunk_index: index, // Add chunk-specific fields
                        total_chunks: chunks.length,
                        chunk_position: index / chunks.length, // Relative position
                        url: pageUrl,
                        title: pageData.title
                      }
                    }));
                    
                    // Use bulk insert with database optimizer
                    if (global.dbOptimizer) {
                      const result = await global.dbOptimizer.bulkInsertEmbeddings(embeddingRecords);
                      if (result.success) {
                        console.log(`[Worker ${jobId}] Bulk inserted ${result.inserted} embeddings for ${pageUrl} (avg ${Math.round(result.avgDuration)}ms per batch)`);
                      } else {
                        console.error(`[Worker ${jobId}] Bulk insert failed, falling back to regular insert`);
                        // Fallback to regular insert
                        const { error: embError } = await supabase
                          .from('page_embeddings')
                          .insert(embeddingRecords);
                        if (embError) {
                          console.error(`[Worker ${jobId}] Error saving embeddings:`, embError);
                        }
                      }
                    } else {
                      // Fallback if optimizer not available
                      const { error: embError } = await supabase
                        .from('page_embeddings')
                        .insert(embeddingRecords);
                      
                      if (embError) {
                        console.error(`[Worker ${jobId}] Error saving embeddings:`, embError);
                      } else {
                        console.log(`[Worker ${jobId}] Created ${chunks.length} embeddings for ${pageUrl}`);
                      }
                    }
                  }
                }
              }
            }
          } catch (saveError) {
            console.error(`[Worker ${jobId}] Failed to save page ${pageUrl}:`, saveError);
          }
          
          // Still track in results for progress counting
          results.push(pageData);
          
          // Update progress with performance metrics
          const memoryUsage = process.memoryUsage();
          const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
          
          await redis.hset(`crawl:${jobId}`, {
            'stats.scraped': results.length,
            'stats.total': maxPagesToScrape,
            'stats.errors': 0,
            'stats.memoryMB': memoryMB,
            'stats.concurrency': concurrencyManager.getCurrent(),
            'stats.successRate': (concurrencyManager.getSuccessRate() * 100).toFixed(1) + '%',
          });
          
          console.log(`[Worker ${jobId}] Progress: ${results.length}/${maxPagesToScrape} pages (Memory: ${memoryMB}MB, Concurrency: ${concurrencyManager.getCurrent()})`);
          
          // Record success and potentially adjust concurrency
          concurrencyManager.recordSuccess();
          
          // Apply new concurrency if changed
          const newConcurrency = concurrencyManager.getCurrent();
          if (crawler.autoscaledPool && newConcurrency !== initialConcurrency) {
            try {
              // Try to set concurrency if method exists
              if (typeof crawler.autoscaledPool.setDesiredConcurrency === 'function') {
                await crawler.autoscaledPool.setDesiredConcurrency(newConcurrency);
              } else if (typeof crawler.autoscaledPool.setMaxConcurrency === 'function') {
                // Fallback to setMaxConcurrency if available
                crawler.autoscaledPool.setMaxConcurrency(newConcurrency);
              } else {
                // If neither method exists, just log
                console.log(`[Worker ${jobId}] Cannot dynamically update concurrency - method not available`);
              }
            } catch (err) {
              console.error(`[Worker ${jobId}] Error updating concurrency:`, err.message);
            }
          }
          
          // Enqueue more links if we haven't reached the limit
          if (maxPagesToScrape === -1 || results.length < maxPagesToScrape) {
            await enqueueLinks({
              strategy: 'same-domain',
              limit: maxPagesToScrape === -1 ? 100 : Math.min(100, maxPagesToScrape - results.length), // Enqueue up to 100 links per page
            });
          }
        } catch (error) {
          console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);
          concurrencyManager.recordError();
        }
      },
      
      failedRequestHandler({ request, error }) {
        console.error(`[Worker ${jobId}] Failed to process ${request.url}: ${error.message}`);
        concurrencyManager.recordError();
      },
    });
    
    console.log(`[Worker ${jobId}] Crawler initialized, starting crawl of ${url}...`);
    
    // Start the crawl with error handling
    try {
      // If we have sitemap URLs, use them; otherwise crawl normally
      if (sitemapUrls.length > 0) {
        console.log(`[Worker ${jobId}] Using ${sitemapUrls.length} URLs from sitemap`);
        await crawler.run(sitemapUrls);
      } else {
        console.log(`[Worker ${jobId}] No sitemap found, using standard crawling`);
        await crawler.run([url]);
      }
    } catch (crawlError) {
      console.error(`[Worker ${jobId}] Crawl error:`, crawlError);
      throw new Error(`Crawl failed: ${crawlError.message}`);
    }

    console.log(`[Worker ${jobId}] Crawl completed! Successfully processed ${results.length} pages.`);
    
    // Update job as completed
    await redis.hset(`crawl:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      'stats.scraped': results.length,
      'stats.errors': 0,
      'stats.total': results.length,
    });
    
    // Store results summary in Redis for retrieval
    await redis.set(
      `crawl:${jobId}:results`,
      JSON.stringify({ count: results.length, urls: results.map(r => r.url) }),
      'EX',
      3600 // Expire after 1 hour
    );
    
    // Final statistics
    const finalCacheStats = getCacheStats();
    const globalStats = deduplicator.getStats();
    
    console.log(`[Worker ${jobId}] ========== Crawl Complete ==========`);
    console.log(`[Worker ${jobId}] Pages processed: ${results.length}`);
    console.log(`[Worker ${jobId}] Deduplication Statistics:`);
    console.log(`[Worker ${jobId}]   - Cache hits: ${globalStats.hits}`);
    console.log(`[Worker ${jobId}]   - API calls saved: ${globalStats.apiCallsSaved}`);
    console.log(`[Worker ${jobId}]   - Cost savings: ${globalStats.estimatedCostSavings}`);
    console.log(`[Worker ${jobId}] ====================================`);
    
    return results.length;
  } catch (error) {
    console.error(`[Worker ${jobId}] Fatal error:`, error);
    console.error(`[Worker ${jobId}] Stack trace:`, error.stack);

    // Update job as failed with detailed error information
    try {
      await redis.hset(`crawl:${jobId}`, {
        status: 'failed',
        error: error.message,
        errorStack: error.stack,
        completedAt: new Date().toISOString(),
      });
      await redis.expire(`crawl:${jobId}`, 300); // Keep failed job for 5 minutes
    } catch (redisError) {
      console.error(`[Worker ${jobId}] Failed to update Redis:`, redisError);
    }

    clearInterval(redisKeepaliveInterval);
    await redisClient.cleanup();
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error(`[Worker ${jobId}] Uncaught exception:`, error);
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: `Uncaught exception: ${error.message}`,
      completedAt: new Date().toISOString(),
    });
    await redis.quit();
  } catch {}
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error(`[Worker ${jobId}] Unhandled rejection at:`, promise, 'reason:', reason);
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: `Unhandled rejection: ${reason}`,
      completedAt: new Date().toISOString(),
    });
    await redis.quit();
  } catch {}
  process.exit(1);
});

// Main execution function
async function main() {
  console.log(`[Worker ${jobId}] Initializing services...`);
  
  try {
    // Ensure Redis is connected first
    await waitForRedis();
    redis = redisClient.redis;
    console.log(`[Worker ${jobId}] Redis connection established`);
    
    // Initialize all services first
    await initializeServices();
    console.log(`[Worker ${jobId}] All services initialized successfully`);
    
    // Now run the crawl
    console.log(`[Worker ${jobId}] Invoking runCrawl()...`);
    await runCrawl();
  } catch (error) {
    console.error(`[Worker ${jobId}] Main execution failed:`, error);
    try {
      if (redis) {
        await redis.hset(`crawl:${jobId}`, {
          status: 'failed',
          error: `Worker initialization failed: ${error.message}`,
          completedAt: new Date().toISOString(),
        });
      }
      clearInterval(redisKeepaliveInterval);
      await redisClient.cleanup();
    } catch {}
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error(`[Worker ${jobId}] Fatal error in main:`, error);
  process.exit(1);
});
