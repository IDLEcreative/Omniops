#!/usr/bin/env tsx

/**
 * Scraper Worker Process
 * Handles the actual crawling in a separate process to avoid blocking the main app
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '.env') });

import { PlaywrightCrawler } from '@crawlee/playwright';
import { createClient } from '@supabase/supabase-js';
import { getResilientRedisClient } from './redis-enhanced';
import OpenAI from 'openai';
import { JSDOM } from 'jsdom';
import cheerio from 'cheerio';
import crypto from 'crypto';
import { ContentDeduplicator } from './content-deduplicator';
import { MetadataExtractor } from './metadata-extractor';
import { DatabaseOptimizer } from './db-optimization';

// Initialize the global deduplicator
const deduplicator = new ContentDeduplicator();

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

console.log(`[Worker ${jobId}] 🔍 forceRescrape Validation:`);
console.log(`[Worker ${jobId}]   - Arg received: "${forceRescrapeArg}" (type: ${typeof forceRescrapeArg})`);
console.log(`[Worker ${jobId}]   - Env var: "${process.env.SCRAPER_FORCE_RESCRAPE_ALL}"`);
console.log(`[Worker ${jobId}]   - Final FORCE_RESCRAPE: ${FORCE_RESCRAPE}`);
console.log(`[Worker ${jobId}]   - Will ${FORCE_RESCRAPE ? 'FORCE' : 'SKIP'} re-scraping recently scraped pages`);

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
    await redisClient.disconnect();
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    const errorMsg = 'Missing OPENAI_API_KEY environment variable';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(errorMsg);
    clearInterval(redisKeepaliveInterval);
    await redisClient.disconnect();
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
    await redisClient.disconnect();
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
    await redisClient.disconnect();
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
    ...structuredData,
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
  
  // Filter out boilerplate chunks
  const nonBoilerplateChunks = allChunks.filter(chunk => !isDuplicateChunk(chunk, pageUrl));
  
  // Now use the global deduplicator to filter out already-seen chunks
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
          
          // Extract content with selective stripping
          const extracted = extractWithReadability(html, pageUrl);
          
          // Add business info to extracted data
          extracted.businessInfo = businessInfo;
          
          // Prepare page data
          const pageData = {
            url: pageUrl,
            title: title || extracted.title,
            content: extracted.textContent || extracted.content,
            metadata: {
              ...extracted.metadata,
              wordCount: extracted.wordCount,
              images: extracted.images,
              links: extracted.links
            }
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
            
            // Prepare database record
            const dbRecord = {
              url: pageData.url,
              title: pageData.title,
              content: pageData.content,
              metadata: {
                ...(pageData.metadata || {}),
                businessInfo: pageData.businessInfo || {}
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
              
              // Generate embeddings for the content
              if (pageData.content && pageData.content.length > 0) {
                // Check if embeddings already exist
                const { data: existingEmbeddings } = await supabase
                  .from('page_embeddings')
                  .select('id')
                  .eq('page_id', savedPage.id)
                  .limit(1);
                
                // Generate embeddings if they don't exist OR if force rescrape is enabled
                if (!existingEmbeddings || existingEmbeddings.length === 0 || FORCE_RESCRAPE) {
                  const reason = !existingEmbeddings
                    ? 'no existing embeddings'
                    : existingEmbeddings.length === 0
                    ? 'zero embeddings found'
                    : 'FORCE_RESCRAPE=true';

                  console.log(`[Worker ${jobId}] 📝 Generating embeddings for ${pageUrl} (reason: ${reason})`);

                  // Split into chunks with semantic understanding or fallback to simple
                  // PERFORMANCE: Larger chunks = fewer embeddings = faster processing
                  const chunks = await splitIntoChunks(pageData.content, 3000, pageUrl, html);
                  
                  if (chunks.length > 0) {
                    console.log(`[Worker ${jobId}] Generating ${chunks.length} embeddings for ${pageUrl}`);
                    const embeddings = await generateEmbeddings(chunks);
                    
                    // Delete any old embeddings first (with retry logic)
                    const deleteStart = Date.now();
                    let deleteAttempts = 0;
                    let deleteSuccess = false;

                    while (deleteAttempts < 3 && !deleteSuccess) {
                      deleteAttempts++;

                      try {
                        const { error: deleteError, count } = await supabase
                          .from('page_embeddings')
                          .delete()
                          .eq('page_id', savedPage.id);

                        if (deleteError) {
                          console.error(`[Worker ${jobId}] ❌ Deletion attempt ${deleteAttempts}/3 failed:`, deleteError);

                          if (deleteAttempts < 3) {
                            const backoffMs = 1000 * deleteAttempts; // Exponential backoff: 1s, 2s, 3s
                            console.log(`[Worker ${jobId}]   Retrying in ${backoffMs}ms...`);
                            await new Promise(r => setTimeout(r, backoffMs));
                          } else {
                            // Final attempt failed - ABORT page processing
                            throw new Error(
                              `FATAL: Failed to delete old embeddings after ${deleteAttempts} attempts. ` +
                              `Cannot proceed to prevent duplicates. Error: ${deleteError.message}`
                            );
                          }
                        } else {
                          deleteSuccess = true;
                          console.log(`[Worker ${jobId}] ✅ Deleted old embeddings in ${Date.now() - deleteStart}ms (attempt ${deleteAttempts})`);
                          if (count !== undefined) {
                            console.log(`[Worker ${jobId}]   Removed ${count} old embedding(s)`);
                          }
                        }
                      } catch (deleteException) {
                        if (deleteAttempts >= 3) {
                          throw deleteException; // Re-throw on final attempt
                        }
                        console.error(`[Worker ${jobId}] ⚠️ Deletion exception on attempt ${deleteAttempts}:`, deleteException);
                      }
                    }
                    
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
                      embedding: embeddings[index],
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
            const errorMessage = saveError.message || String(saveError);

            // Check if this was a fatal deletion error
            const isFatalDeletionError = errorMessage.includes('FATAL: Failed to delete old embeddings');

            if (isFatalDeletionError) {
              console.error(`[Worker ${jobId}] 🚨 FATAL DELETION ERROR for ${pageUrl}`);
              console.error(`[Worker ${jobId}]   This page will be marked as failed to prevent duplicate embeddings`);

              // Mark page as failed (not deleted)
              try {
                await supabase
                  .from('scraped_pages')
                  .upsert({
                    domain_id: domainId,
                    url: pageUrl,
                    status: 'failed',
                    error_message: 'Embedding deletion failed - preventing duplicates',
                    last_scraped_at: new Date().toISOString(),
                  });
              } catch (upsertError) {
                console.error(`[Worker ${jobId}]   Failed to mark page as failed:`, upsertError);
              }
            } else {
              console.error(`[Worker ${jobId}] Failed to save page ${pageUrl}:`, saveError);
            }
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
          const errorMessage = error.message || String(error);

          // Enhanced 404 detection
          const is404 =
            errorMessage.includes('404') ||
            errorMessage.includes('Not Found') ||
            errorMessage.includes('PAGE_NOT_FOUND') ||
            error.statusCode === 404 ||
            error.response?.status === 404;

          const isDeleted =
            errorMessage.includes('410') ||
            errorMessage.includes('Gone') ||
            error.statusCode === 410;

          const status = (is404 || isDeleted) ? 'deleted' : 'failed';

          console.log(`[Worker ${jobId}] ${is404 || isDeleted ? '🗑️' : '❌'} Page ${status}: ${pageUrl}`);
          if (is404 || isDeleted) {
            console.log(`[Worker ${jobId}]   Reason: HTTP ${error.statusCode || '404/410'}`);
          }

          // Get domain_id for the page
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

          // Mark page as deleted/failed
          if (domainId) {
            const { error: updateError } = await supabase
              .from('scraped_pages')
              .upsert({
                domain_id: domainId,
                url: pageUrl,
                status: status,
                error_message: errorMessage,
                last_scraped_at: new Date().toISOString(),
              });

            if (updateError) {
              console.error(`[Worker ${jobId}] Error marking page as ${status}:`, updateError);
            }

            // Delete embeddings for deleted pages immediately
            if (is404 || isDeleted) {
              console.log(`[Worker ${jobId}]   Deleting embeddings for deleted page`);

              const { data: pageData } = await supabase
                .from('scraped_pages')
                .select('id')
                .eq('url', pageUrl)
                .eq('domain_id', domainId)
                .single();

              if (pageData?.id) {
                const { error: deleteEmbError } = await supabase
                  .from('page_embeddings')
                  .delete()
                  .eq('page_id', pageData.id);

                if (!deleteEmbError) {
                  console.log(`[Worker ${jobId}]   ✅ Embeddings deleted for 404 page`);
                } else {
                  console.error(`[Worker ${jobId}]   Error deleting embeddings:`, deleteEmbError);
                }
              }
            }
          }

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
    const globalStats = deduplicator.getStorageStats();
    
    console.log(`[Worker ${jobId}] ========== Crawl Complete ==========`);
    console.log(`[Worker ${jobId}] Pages processed: ${results.length}`);
    console.log(`[Worker ${jobId}] Deduplication Statistics:`);
    console.log(`[Worker ${jobId}]   - Unique content: ${globalStats.uniqueContent}`);
    console.log(`[Worker ${jobId}]   - Common elements: ${globalStats.commonElements}`);
    console.log(`[Worker ${jobId}]   - Processed pages: ${globalStats.processedPages}`);
    console.log(`[Worker ${jobId}]   - Cache size: ${globalStats.cacheSize}`);
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
    await redisClient.disconnect();
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
      await redisClient.disconnect();
    } catch {}
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error(`[Worker ${jobId}] Fatal error in main:`, error);
  process.exit(1);
});
