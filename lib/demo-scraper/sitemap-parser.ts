/**
 * Demo Scraper - Sitemap Parsing Module
 * Handles sitemap.xml parsing and page scoring
 */

import { XMLParser } from 'fast-xml-parser';

/**
 * Fetches and parses sitemap.xml
 */
export async function parseSitemap(baseUrl: string, timeout: number): Promise<string[]> {
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
export function scoreSitemapPages(urls: string[], baseUrl: string): string[] {
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
