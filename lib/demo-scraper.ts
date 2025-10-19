import { XMLParser } from 'fast-xml-parser';
import OpenAI from 'openai';

export interface ScrapedPage {
  url: string;
  title: string;
  content: string;
  contentLength: number;
}

export interface QuickScrapeOptions {
  maxPages: number;
  timeout: number;
  useSitemap: boolean;
}

export interface QuickScrapeResult {
  pages: ScrapedPage[];
  totalPages: number;
  scrapeDuration: number;
  error?: string;
}

/**
 * Quickly scrapes a website's landing page and optionally 2-3 key pages from sitemap
 * Used for instant demo - no database storage
 */
export async function quickScrape(
  url: string,
  options: QuickScrapeOptions = { maxPages: 3, timeout: 8000, useSitemap: true }
): Promise<QuickScrapeResult> {
  const startTime = Date.now();
  const results: ScrapedPage[] = [];

  try {
    // 1. Scrape landing page first
    const landingPage = await scrapePage(url, options.timeout);
    if (landingPage) {
      results.push(landingPage);
    }

    // 2. Try sitemap if enabled and we have budget for more pages
    if (options.useSitemap && results.length < options.maxPages) {
      const sitemapUrls = await parseSitemap(url, options.timeout);
      const priorityPages = scoreSitemapPages(sitemapUrls, url);

      // Scrape top priority pages
      const remainingSlots = options.maxPages - results.length;
      const pagesToScrape = priorityPages.slice(0, remainingSlots);

      for (const pageUrl of pagesToScrape) {
        const remainingTime = options.timeout - (Date.now() - startTime);
        if (remainingTime <= 1000) break; // Need at least 1s per page

        const page = await scrapePage(pageUrl, Math.min(remainingTime, 3000));
        if (page) {
          results.push(page);
        }
      }
    }

    const scrapeDuration = Date.now() - startTime;

    return {
      pages: results,
      totalPages: results.length,
      scrapeDuration
    };

  } catch (error) {
    const scrapeDuration = Date.now() - startTime;
    return {
      pages: results,
      totalPages: results.length,
      scrapeDuration,
      error: error instanceof Error ? error.message : 'Scraping failed'
    };
  }
}

/**
 * Scrapes a single page using Mozilla Readability
 */
async function scrapePage(url: string, timeout: number): Promise<ScrapedPage | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OmniopsBot/1.0; +https://omniops.com)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const html = await response.text();

    // Use Readability to extract clean content
    const { JSDOM } = await import('jsdom');
    const { Readability } = await import('@mozilla/readability');

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      return null;
    }

    // Clean and truncate content
    const cleanContent = (article.textContent || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000); // Max 50KB per page

    return {
      url,
      title: article.title || 'Untitled',
      content: cleanContent,
      contentLength: cleanContent.length
    };

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Fetches and parses sitemap.xml
 */
async function parseSitemap(baseUrl: string, timeout: number): Promise<string[]> {
  try {
    const sitemapUrl = new URL('/sitemap.xml', baseUrl).toString();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OmniopsBot/1.0; +https://omniops.com)'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const xml = await response.text();
    const parser = new XMLParser();
    const parsed = parser.parse(xml);

    // Handle different sitemap structures
    const urlset = parsed.urlset || parsed.sitemapindex;
    if (!urlset) {
      return [];
    }

    // Extract URLs
    const urls: string[] = [];
    if (urlset.url) {
      const urlEntries = Array.isArray(urlset.url) ? urlset.url : [urlset.url];
      for (const entry of urlEntries) {
        if (entry.loc) {
          urls.push(entry.loc);
        }
      }
    }

    return urls;

  } catch (error) {
    console.error('Failed to parse sitemap:', error);
    return [];
  }
}

/**
 * Scores sitemap pages by relevance for demo
 * Prioritizes: About, Contact, Services, Products
 */
function scoreSitemapPages(urls: string[], baseUrl: string): string[] {
  const baseDomain = new URL(baseUrl).origin;

  return urls
    .filter(url => {
      // Only same domain
      try {
        return new URL(url).origin === baseDomain;
      } catch {
        return false;
      }
    })
    .map(url => {
      const lowerUrl = url.toLowerCase();
      let score = 0;

      // High priority pages
      if (lowerUrl.includes('/about')) score += 100;
      if (lowerUrl.includes('/contact')) score += 90;
      if (lowerUrl.includes('/services')) score += 85;
      if (lowerUrl.includes('/products')) score += 80;
      if (lowerUrl.includes('/faq')) score += 75;

      // Prefer shorter URLs (likely more important)
      if (url.length < 50) score += 20;
      if (url.length < 30) score += 10;

      // Penalize blog posts, news, dates
      if (lowerUrl.includes('/blog/')) score -= 50;
      if (lowerUrl.includes('/news/')) score -= 50;
      if (/\d{4}\/\d{2}\/\d{2}/.test(lowerUrl)) score -= 40; // Date patterns

      // Avoid landing page (already scraped)
      if (url === baseUrl || url === baseUrl + '/') score = -100;

      return { url, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.url);
}

/**
 * Generates embeddings for demo content (in-memory only)
 */
export async function generateDemoEmbeddings(pages: ScrapedPage[]) {
  const chunks: string[] = [];
  const chunkMetadata: Array<{ url: string; title: string; chunkIndex: number }> = [];

  // Chunk each page's content
  for (const page of pages) {
    const pageChunks = chunkText(page.content, 500); // 500 char chunks
    pageChunks.forEach((chunk, index) => {
      chunks.push(chunk);
      chunkMetadata.push({
        url: page.url,
        title: page.title,
        chunkIndex: index
      });
    });
  }

  // Generate embeddings using OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: chunks
  });

  const embeddings = response.data.map((item: { embedding: number[] }) => item.embedding);

  return {
    chunks,
    embeddings,
    metadata: chunkMetadata
  };
}

/**
 * Chunks text into smaller pieces for embeddings
 */
function chunkText(text: string, chunkSize: number): string[] {
  const chunks: string[] = [];
  const words = text.split(' ');
  let currentChunk = '';

  for (const word of words) {
    if (currentChunk.length + word.length + 1 > chunkSize) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = word;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + word;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
