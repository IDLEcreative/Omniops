/**
 * Content Refresh Scheduler
 * Scheduling and job management for content refresh
 */

import type { RefreshConfig, RefreshJob } from './content-refresh-types';

/**
 * Schedule periodic content refresh
 */
export async function scheduleContentRefresh(
  config: RefreshConfig
): Promise<void> {
  const refreshJob: RefreshJob = {
    domainId: config.domainId,
    domain: config.domain,
    type: 'content_refresh',
    schedule: `0 */${config.refreshInterval} * * *`,
    priority: config.priority,
    lastRun: config.lastRefreshedAt,
  };

  console.log('Scheduled content refresh:', refreshJob);
}

/**
 * Generate a hash of content for change detection
 */
export async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a URL is relevant for content scraping
 */
export function isRelevantUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }

    const path = urlObj.pathname.toLowerCase();
    const skipExtensions = [
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.ico',
      '.mp3', '.mp4', '.wav', '.avi', '.mov', '.wmv',
      '.zip', '.rar', '.tar', '.gz',
      '.css', '.js', '.json', '.xml', '.txt'
    ];

    if (skipExtensions.some(ext => path.endsWith(ext))) {
      return false;
    }

    const skipPaths = [
      '/admin', '/wp-admin', '/wp-content', '/wp-includes',
      '/assets', '/static', '/media', '/uploads', '/images',
      '/login', '/register', '/cart', '/checkout',
      '/api/', '/_next/', '/node_modules/'
    ];

    if (skipPaths.some(skipPath => path.includes(skipPath))) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Parse sitemap XML to extract URLs
 */
export async function parseSitemap(sitemapUrl: string): Promise<Array<{
  url: string;
  lastModified?: string;
  priority?: number;
}>> {
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status}`);
    }

    const xmlText = await response.text();
    const urls: Array<{ url: string; lastModified?: string; priority?: number }> = [];

    const urlRegex = /<url>([\s\S]*?)<\/url>/g;
    const locRegex = /<loc>(.*?)<\/loc>/;
    const lastmodRegex = /<lastmod>(.*?)<\/lastmod>/;
    const priorityRegex = /<priority>(.*?)<\/priority>/;

    let match;
    while ((match = urlRegex.exec(xmlText)) !== null) {
      const urlBlock = match[1];
      if (!urlBlock) continue;

      const locMatch = locRegex.exec(urlBlock);
      if (locMatch && locMatch[1]) {
        const urlEntry: Record<string, unknown> = {
          url: locMatch[1].trim()
        };

        const lastmodMatch = lastmodRegex.exec(urlBlock);
        if (lastmodMatch && lastmodMatch[1]) {
          urlEntry.lastModified = lastmodMatch[1].trim();
        }

        const priorityMatch = priorityRegex.exec(urlBlock);
        if (priorityMatch && priorityMatch[1]) {
          urlEntry.priority = parseFloat(priorityMatch[1]);
        }

        urls.push(urlEntry as { url: string; lastModified?: string; priority?: number });
      }
    }

    const sitemapRegex = /<sitemap>([\s\S]*?)<\/sitemap>/g;
    const sitemapLocRegex = /<loc>(.*?)<\/loc>/;

    const sitemapMatches = xmlText.match(sitemapRegex);
    if (sitemapMatches) {
      for (const sitemapBlock of sitemapMatches) {
        const sitemapLocMatch = sitemapLocRegex.exec(sitemapBlock);
        if (sitemapLocMatch && sitemapLocMatch[1]) {
          const childSitemapUrl = sitemapLocMatch[1].trim();
          console.log(`Parsing child sitemap: ${childSitemapUrl}`);
          try {
            const childUrls = await parseSitemap(childSitemapUrl);
            urls.push(...childUrls);
          } catch (err) {
            console.warn(`Failed to parse child sitemap ${childSitemapUrl}:`, err);
          }
        }
      }
    }

    return urls;
  } catch (error) {
    console.error(`Error parsing sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

/**
 * Find sitemap URLs for a domain
 */
export async function findSitemaps(domain: string): Promise<string[]> {
  const sitemapUrls: string[] = [];

  const commonLocations = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://${domain}/sitemap-index.xml`,
    `https://${domain}/sitemaps.xml`,
    `https://${domain}/wp-sitemap.xml`,
    `https://${domain}/sitemap1.xml`,
  ];

  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await fetch(robotsUrl);
    if (response.ok) {
      const robotsText = await response.text();
      const sitemapMatches = robotsText.match(/^sitemap:\s*(.+)$/gim);
      if (sitemapMatches) {
        sitemapMatches.forEach(match => {
          const url = match.replace(/^sitemap:\s*/i, '').trim();
          if (url && !sitemapUrls.includes(url)) {
            sitemapUrls.push(url);
          }
        });
      }
    }
  } catch (error) {
    console.warn(`Error fetching robots.txt for ${domain}:`, error);
  }

  for (const url of commonLocations) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok && !sitemapUrls.includes(url)) {
        sitemapUrls.push(url);
      }
    } catch (error) {
      // Silently ignore errors for non-existent sitemaps
    }
  }

  return sitemapUrls;
}

/**
 * Find URLs referenced in robots.txt
 */
export async function findUrlsInRobots(domain: string): Promise<string[]> {
  const urls: string[] = [];

  try {
    const robotsUrl = `https://${domain}/robots.txt`;
    const response = await fetch(robotsUrl);
    if (!response.ok) return urls;

    const robotsText = await response.text();

    const allowMatches = robotsText.match(/^allow:\s*(.+)$/gim);
    if (allowMatches) {
      allowMatches.forEach(match => {
        const path = match.replace(/^allow:\s*/i, '').trim();
        if (path && path !== '/') {
          if (path.startsWith('/')) {
            urls.push(`https://${domain}${path}`);
          }
        }
      });
    }

    const commentMatches = robotsText.match(/#.*https?:\/\/[^\s]+/gi);
    if (commentMatches) {
      commentMatches.forEach(match => {
        const urlMatch = match.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          urls.push(urlMatch[0]);
        }
      });
    }

  } catch (error) {
    console.warn(`Error parsing robots.txt for ${domain}:`, error);
  }

  return urls;
}
