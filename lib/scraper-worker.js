#!/usr/bin/env node

/**
 * Scraper Worker Process
 * Handles the actual crawling in a separate process to avoid blocking the main app
 */

const { PlaywrightCrawler } = require('@crawlee/playwright');
const { createClient } = require('@supabase/supabase-js');
const Redis = require('ioredis');
const OpenAI = require('openai');
const { JSDOM } = require('jsdom');
const cheerio = require('cheerio');
const crypto = require('crypto');

// Get command line arguments
const [,, jobId, url, maxPages, turboMode, configPreset, isOwnSite] = process.argv;

console.log(`[Worker ${jobId}] Starting crawl worker...`);
console.log(`[Worker ${jobId}] URL: ${url}`);
console.log(`[Worker ${jobId}] Max pages: ${maxPages}`);
console.log(`[Worker ${jobId}] Turbo mode: ${turboMode}`);
console.log(`[Worker ${jobId}] Config preset: ${configPreset}`);
console.log(`[Worker ${jobId}] Own site: ${isOwnSite}`);

// Check required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(`[Worker ${jobId}] Error: Missing Supabase environment variables`);
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error(`[Worker ${jobId}] Error: Missing OPENAI_API_KEY environment variable`);
  process.exit(1);
}

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
  
  // Remove unwanted elements
  $('script, style, nav, header, footer, aside, form, iframe, object, embed').remove();
  $('.nav, .header, .footer, .sidebar, .advertisement, .ads, .social-share, .comments').remove();
  $('[class*="sidebar"], [class*="header"], [class*="footer"], [class*="nav"]').remove();
  $('[id*="sidebar"], [id*="header"], [id*="footer"], [id*="nav"]').remove();
  
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

// Helper function to split text into chunks
function splitIntoChunks(text, maxChunkSize = 1000) {
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

// Helper function to generate embeddings
async function generateEmbeddings(chunks) {
  const embeddings = [];
  
  // Process in batches to avoid rate limits
  const batchSize = 20;
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: batch,
    });
    
    embeddings.push(...response.data.map(d => d.embedding));
  }
  
  return embeddings;
}

// Main crawl function
async function runCrawl() {
  try {
    // Update job status to processing
    await redis.hset(`crawl:${jobId}`, {
      status: 'processing',
      startedAt: new Date().toISOString(),
    });

    console.log(`[Worker ${jobId}] Starting crawl...`);

    const results = [];
    const visited = new Set();
    const maxPagesToScrape = parseInt(maxPages) || 50;
    
    // Create the crawler
    const crawler = new PlaywrightCrawler({
      maxRequestsPerCrawl: maxPagesToScrape,
      requestHandlerTimeoutSecs: 30,
      maxConcurrency: turboMode === 'true' ? 5 : 2,
      
      async requestHandler({ request, page, enqueueLinks }) {
        const pageUrl = request.url;
        
        // Skip if already visited
        if (visited.has(pageUrl)) {
          console.log(`[Worker ${jobId}] Skipping duplicate: ${pageUrl}`);
          return;
        }
        visited.add(pageUrl);
        
        console.log(`[Worker ${jobId}] Scraping: ${pageUrl}`);
        
        try {
          // Wait for content to load
          await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
          
          // Get page content
          const html = await page.content();
          const title = await page.title();
          
          // Extract content
          const extracted = extractWithReadability(html, pageUrl);
          
          // Store result
          results.push({
            url: pageUrl,
            title: title || extracted.title,
            content: extracted.textContent || extracted.content,
            metadata: {
              ...extracted.metadata,
              wordCount: extracted.wordCount,
              images: extracted.images,
              links: extracted.links
            }
          });
          
          // Update progress
          await redis.hset(`crawl:${jobId}`, {
            'stats.scraped': results.length,
            'stats.total': maxPagesToScrape,
            'stats.errors': 0,
          });
          
          console.log(`[Worker ${jobId}] Progress: ${results.length}/${maxPagesToScrape} pages`);
          
          // Enqueue more links if we haven't reached the limit
          if (results.length < maxPagesToScrape) {
            await enqueueLinks({
              strategy: 'same-domain',
              limit: Math.min(100, maxPagesToScrape - results.length), // Enqueue up to 100 links per page
            });
          }
        } catch (error) {
          console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);
        }
      },
      
      failedRequestHandler({ request, error }) {
        console.error(`[Worker ${jobId}] Failed to process ${request.url}: ${error.message}`);
      },
    });
    
    // Start the crawl
    await crawler.run([url]);

    console.log(`[Worker ${jobId}] Crawl completed, processing ${results.length} pages...`);

    // Store results in database
    let successCount = 0;
    let errorCount = 0;

    for (const page of results) {
      try {
        // First, check if we need a domain_id
        let domainId = null;
        const domainMatch = page.url.match(/https?:\/\/([^\/]+)/);
        if (domainMatch) {
          const domain = domainMatch[1].replace('www.', '');
          
          // Get or create domain
          const { data: domainData } = await supabase
            .from('domains')
            .select('id')
            .eq('domain', domain)
            .single();
          
          if (domainData) {
            domainId = domainData.id;
          }
        }
        
        // Check if page already exists
        const { data: existingPage } = await supabase
          .from('scraped_pages')
          .select('id')
          .eq('url', page.url)
          .single();
        
        // Use UPSERT with proper conflict handling
        const pageData = {
          url: page.url,
          title: page.title,
          content: page.content,
          metadata: page.metadata || {},
          status: 'completed',
          scraped_at: new Date().toISOString(),
        };
        
        if (domainId) {
          pageData.domain_id = domainId;
        }
        
        const { data: savedPage, error: pageError } = await supabase
          .from('scraped_pages')
          .upsert(pageData, {
            onConflict: 'url',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (pageError) {
          console.error(`[Worker ${jobId}] Error saving page ${page.url}:`, pageError);
          errorCount++;
          continue;
        }

        // Generate embeddings for the content
        if (page.content && page.content.length > 0) {
          // Check if embeddings already exist for this page
          const { data: existingEmbeddings } = await supabase
            .from('page_embeddings')
            .select('id')
            .eq('page_id', savedPage.id)
            .limit(1);
          
          // Only generate embeddings if they don't exist
          if (!existingEmbeddings || existingEmbeddings.length === 0) {
            const chunks = splitIntoChunks(page.content);
            
            if (chunks.length > 0) {
              const embeddings = await generateEmbeddings(chunks);

              // Delete any old embeddings first (in case of partial failure)
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
                  url: page.url 
                },
              }));

              const { error: embError } = await supabase
                .from('page_embeddings')
                .insert(embeddingRecords);

              if (embError) {
                console.error(`[Worker ${jobId}] Error saving embeddings:`, embError);
              } else {
                console.log(`[Worker ${jobId}] Created ${chunks.length} embeddings for ${page.url}`);
              }
            }
          } else {
            console.log(`[Worker ${jobId}] Embeddings already exist for ${page.url}, skipping...`);
          }
        }

        successCount++;
        console.log(`[Worker ${jobId}] Processed page ${successCount}/${results.length}: ${page.url}`);
        
      } catch (error) {
        console.error(`[Worker ${jobId}] Error processing page ${page.url}:`, error);
        errorCount++;
      }
    }

    // Update job as completed
    await redis.hset(`crawl:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      'stats.scraped': successCount,
      'stats.errors': errorCount,
      'stats.total': results.length,
    });

    // Store results in Redis for retrieval
    await redis.set(
      `crawl:${jobId}:results`,
      JSON.stringify(results),
      'EX',
      3600 // Expire after 1 hour
    );

    console.log(`[Worker ${jobId}] Crawl completed successfully!`);
    console.log(`[Worker ${jobId}] Pages processed: ${successCount}`);
    console.log(`[Worker ${jobId}] Errors: ${errorCount}`);

    // Store final results in Redis before exiting
    await redis.hset(`crawl:${jobId}`, {
      status: 'completed',
      completedAt: new Date().toISOString(),
      pagesProcessed: successCount,
      errors: errorCount,
      totalResults: successCount
    });

    // Keep job data available for 5 minutes after completion
    await redis.expire(`crawl:${jobId}`, 300);

    // Give the main process time to read results before exiting
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Clean up
    await redis.quit();
    process.exit(0);

  } catch (error) {
    console.error(`[Worker ${jobId}] Fatal error:`, error);

    // Update job as failed
    await redis.hset(`crawl:${jobId}`, {
      status: 'failed',
      error: error.message,
      completedAt: new Date().toISOString(),
    });

    await redis.quit();
    process.exit(1);
  }
}

// Run the crawl
runCrawl();