#!/usr/bin/env node

/**
 * Scraper Worker Process
 * Handles the actual crawling in a separate process to avoid blocking the main app
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { PlaywrightCrawler } = require('@crawlee/playwright');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
const OpenAI = require('openai');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const crypto = require('crypto');
const { EmbeddingDeduplicator } = require('./embedding-deduplicator');

// Initialize the global deduplicator
const deduplicator = new EmbeddingDeduplicator();

// Cache for chunk deduplication
const chunkHashCache = new Map();
const embeddingCache = new Map();

// Progressive concurrency manager
class ConcurrencyManager {
  constructor(initialConcurrency = 3, maxConcurrency = 10) {
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
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite, sitemapUrlsJson] = process.argv;

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

// Initialize Redis first to report errors
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Function to report initialization errors
async function reportInitError(error) {
  try {
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: error,
      completedAt: new Date().toISOString(),
    });
    await redis.expire(`crawl:${jobId}`, 300); // Keep error for 5 minutes
  } catch (redisError) {
    console.error(`[Worker ${jobId}] Failed to report error to Redis:`, redisError);
  }
}

// Check required environment variables with better error reporting
async function checkEnvironmentVariables() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const errorMsg = 'Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(errorMsg);
    await redis.quit();
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    const errorMsg = 'Missing OPENAI_API_KEY environment variable';
    console.error(`[Worker ${jobId}] Error: ${errorMsg}`);
    await reportInitError(errorMsg);
    await redis.quit();
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
    console.log(`[Worker ${jobId}] Supabase client initialized`);
  } catch (error) {
    const errorMsg = `Failed to initialize Supabase client: ${error.message}`;
    console.error(`[Worker ${jobId}] ${errorMsg}`);
    await reportInitError(errorMsg);
    await redis.quit();
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
    await redis.quit();
    process.exit(1);
  }
}

// Content extraction functions (replaces ContentExtractor import)
function htmlToText(html) {
  const $ = cheerio.load(html);
  
  // Remove script and style elements
  $('script, style, noscript').remove();
  
  // Preserve some structure
  $('p, div, section, article').append('\n\n');
  $('br').replaceWith('\n');
  
  // Get text content
  return $.text()
    .replace(/\n{3,}/g, '\n\n')  // Replace multiple newlines
    .replace(/[ \t]+/g, ' ')  // Replace multiple spaces/tabs
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

// Helper function to split text into chunks with global deduplication
async function splitIntoChunks(text, maxChunkSize = 1000, pageUrl = '') {
  const sentences = text.split(/[.!?]+/);
  const allChunks = [];
  let currentChunk = '';

  // First, create all potential chunks
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize && currentChunk) {
      const trimmedChunk = currentChunk.trim();
      
      // Only add non-boilerplate chunks
      if (!isDuplicateChunk(trimmedChunk, pageUrl)) {
        allChunks.push(trimmedChunk);
      }
      
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    const trimmedChunk = currentChunk.trim();
    if (!isDuplicateChunk(trimmedChunk, pageUrl)) {
      allChunks.push(trimmedChunk);
    }
  }

  // Now use the global deduplicator to filter out already-seen chunks
  const { unique, duplicates } = await deduplicator.filterDuplicates(allChunks, pageUrl);
  
  if (duplicates.length > 0) {
    console.log(`[Worker ${jobId}] Global deduplicator filtered ${duplicates.length} duplicate chunks for ${pageUrl}`);
  }

  return unique;
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
        
        // Check if we have this page cached and if it's still fresh
        let existingPage = null;
        try {
          const { data } = await supabase
            .from('scraped_pages')
            .select('scraped_at, metadata')
            .eq('url', pageUrl)
            .single();
          existingPage = data;
        } catch (error) {
          // Page doesn't exist yet, which is fine
          existingPage = null;
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
          
          // Extract content
          const extracted = extractWithReadability(html, pageUrl);
          
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
              metadata: pageData.metadata || {},
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
                
                // Only generate embeddings if they don't exist
                if (!existingEmbeddings || existingEmbeddings.length === 0) {
                  // Split into chunks with global deduplication
                  const chunks = await splitIntoChunks(pageData.content, 1000, pageUrl);
                  
                  if (chunks.length > 0) {
                    console.log(`[Worker ${jobId}] Generating ${chunks.length} embeddings for ${pageUrl}`);
                    const embeddings = await generateEmbeddings(chunks);
                    
                    // Delete any old embeddings first
                    await supabase
                      .from('page_embeddings')
                      .delete()
                      .eq('page_id', savedPage.id);
                    
                    // Store new embeddings
                    const embeddingRecords = chunks.map((chunk, index) => ({
                      page_id: savedPage.id,
                      chunk_text: chunk,
                      embedding: embeddings[index],
                      metadata: {
                        chunk_index: index,
                        total_chunks: chunks.length,
                        url: pageUrl
                      },
                    }));
                    
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
            await crawler.autoscaledPool.setDesiredConcurrency(newConcurrency);
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

    await redis.quit();
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
    // Initialize all services first
    await initializeServices();
    console.log(`[Worker ${jobId}] All services initialized successfully`);
    
    // Now run the crawl
    console.log(`[Worker ${jobId}] Invoking runCrawl()...`);
    await runCrawl();
  } catch (error) {
    console.error(`[Worker ${jobId}] Main execution failed:`, error);
    try {
      await redis.hset(`crawl:${jobId}`, {
        status: 'failed',
        error: `Worker initialization failed: ${error.message}`,
        completedAt: new Date().toISOString(),
      });
      await redis.quit();
    } catch {}
    process.exit(1);
  }
}

// Start the worker
main().catch((error) => {
  console.error(`[Worker ${jobId}] Fatal error in main:`, error);
  process.exit(1);
});