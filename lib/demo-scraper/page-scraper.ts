/**
 * Demo Scraper - Page Scraping Module
 * Handles single page scraping with Mozilla Readability
 */

import type { ScrapedPage } from './types';

/**
 * Scrapes a single page using Mozilla Readability with fallback
 */
export async function scrapePage(url: string, timeout: number): Promise<ScrapedPage | null> {
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

    // Use lightweight fallback in production (Vercel serverless has JSDOM issues)
    // Only try JSDOM in development for richer content extraction
    const useJSDOM = process.env.NODE_ENV === 'development';

    if (useJSDOM) {
      try {
        const jsdomModule = await import('jsdom');
        const readabilityModule = await import('@mozilla/readability');

        if (!jsdomModule.JSDOM || !readabilityModule.Readability) {
          throw new Error('JSDOM or Readability not available');
        }

        const JSDOM = jsdomModule.JSDOM;
        const Readability = readabilityModule.Readability;

        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (article) {
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
        }
      } catch (jsdomError) {
        console.warn(`JSDOM failed for ${url}, using fallback:`, jsdomError);
        // Fall through to basic extraction
      }
    }

    // Fallback: Basic HTML parsing without JSDOM (production default)
    const title = extractTitle(html);
    const content = extractTextContent(html);

    return {
      url,
      title: title || 'Untitled',
      content,
      contentLength: content.length
    };

  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Extract title from HTML without DOM parsing
 */
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    return titleMatch[1].trim();
  }

  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  if (ogTitleMatch && ogTitleMatch[1]) {
    return ogTitleMatch[1].trim();
  }

  return '';
}

/**
 * Extract text content from HTML without DOM parsing
 * Simple but effective for demo purposes
 */
function extractTextContent(html: string): string {
  // Remove scripts and styles
  const text = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ') // Remove all HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  // Truncate to max size
  return text.slice(0, 50000);
}
