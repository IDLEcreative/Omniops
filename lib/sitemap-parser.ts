import { z } from 'zod';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';

// Schema for sitemap entries
export const SitemapEntrySchema = z.object({
  loc: z.string().url(),
  lastmod: z.string().optional(),
  changefreq: z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']).optional(),
  priority: z.number().min(0).max(1).optional(),
});

export type SitemapEntry = z.infer<typeof SitemapEntrySchema>;

// Schema for sitemap index (for large sites)
export const SitemapIndexEntrySchema = z.object({
  loc: z.string().url(),
  lastmod: z.string().optional(),
});

export type SitemapIndexEntry = z.infer<typeof SitemapIndexEntrySchema>;

export class SitemapParser {
  private xmlParser: XMLParser;
  private readonly userAgent: string;
  private readonly timeout: number;

  constructor(options?: { userAgent?: string; timeout?: number }) {
    this.userAgent = options?.userAgent || 'Mozilla/5.0 (compatible; CustomerServiceBot/1.0)';
    this.timeout = options?.timeout || 30000;
    
    this.xmlParser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
    });
  }

  /**
   * Fetch and parse a sitemap from a URL
   */
  async parseSitemapFromUrl(url: string): Promise<SitemapEntry[]> {
    try {
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/xml, text/xml, */*',
        },
        timeout: this.timeout,
        responseType: 'text',
      });

      const parsed = this.xmlParser.parse(response.data);
      
      // Check if it's a sitemap index and handle it automatically
      if (parsed.sitemapindex?.sitemap) {
        return this.parseSitemapIndex(url);
      }
      
      // Otherwise parse as regular sitemap
      return this.parseSitemapXml(response.data);
    } catch (error) {
      console.error(`Failed to fetch sitemap from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Parse sitemap XML content
   */
  parseSitemapXml(xmlContent: string): SitemapEntry[] {
    try {
      const parsed = this.xmlParser.parse(xmlContent);
      
      // This method should only handle regular sitemaps
      if (parsed.sitemapindex?.sitemap) {
        throw new Error('This is a sitemap index. Use parseSitemapFromUrl() or parseSitemapIndex() instead.');
      }

      // Extract URL entries
      const urlset = parsed.urlset;
      if (!urlset || !urlset.url) {
        return [];
      }

      // Ensure urls is always an array
      const urls = Array.isArray(urlset.url) ? urlset.url : [urlset.url];

      return urls.map((url: any) => ({
        loc: url.loc,
        lastmod: url.lastmod,
        changefreq: url.changefreq,
        priority: typeof url.priority === 'string' ? parseFloat(url.priority) : url.priority,
      })).filter((entry: any) => {
        try {
          SitemapEntrySchema.parse(entry);
          return true;
        } catch {
          console.warn(`Invalid sitemap entry: ${JSON.stringify(entry)}`);
          return false;
        }
      });
    } catch (error) {
      console.error('Failed to parse sitemap XML:', error);
      throw error;
    }
  }

  /**
   * Parse a sitemap index (for large sites with multiple sitemaps)
   */
  async parseSitemapIndex(url: string): Promise<SitemapEntry[]> {
    try {
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/xml, text/xml, */*',
        },
        timeout: this.timeout,
        responseType: 'text',
      });

      const parsed = this.xmlParser.parse(response.data);
      
      if (!parsed.sitemapindex?.sitemap) {
        // Not a sitemap index, try parsing as regular sitemap
        return this.parseSitemapXml(response.data);
      }

      // Extract sitemap URLs from index
      const sitemaps = Array.isArray(parsed.sitemapindex.sitemap) 
        ? parsed.sitemapindex.sitemap 
        : [parsed.sitemapindex.sitemap];

      const allEntries: SitemapEntry[] = [];

      // Fetch and parse each sitemap
      for (const sitemap of sitemaps) {
        try {
          const entries = await this.parseSitemapFromUrl(sitemap.loc);
          allEntries.push(...entries);
        } catch (error) {
          console.error(`Failed to parse sitemap ${sitemap.loc}:`, error);
        }
      }

      return allEntries;
    } catch (error) {
      console.error(`Failed to fetch sitemap index from ${url}:`, error);
      throw error;
    }
  }

  /**
   * Try to find and parse sitemap from common locations
   */
  async findAndParseSitemap(baseUrl: string): Promise<SitemapEntry[]> {
    const url = new URL(baseUrl);
    const origin = url.origin;

    // Common sitemap locations to try
    const possibleLocations = [
      `${origin}/sitemap.xml`,
      `${origin}/sitemap_index.xml`,
      `${origin}/sitemap-index.xml`,
      `${origin}/sitemaps/sitemap.xml`,
      `${origin}/sitemap1.xml`,
      `${origin}/sitemap.xml.gz`, // Some sites use gzipped sitemaps
    ];

    // Try robots.txt first to find sitemap location
    try {
      const robotsUrl = `${origin}/robots.txt`;
      const robotsResponse = await axios.get(robotsUrl, {
        headers: { 'User-Agent': this.userAgent },
        timeout: 10000,
        responseType: 'text',
      });

      // Extract sitemap URLs from robots.txt
      const sitemapMatches = robotsResponse.data.match(/^Sitemap:\s*(.+)$/gmi);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const sitemapUrl = match.replace(/^Sitemap:\s*/i, '').trim();
          possibleLocations.unshift(sitemapUrl); // Add to beginning of array
        }
      }
    } catch (error) {
    }

    // Try each possible location
    for (const location of possibleLocations) {
      try {
        
        // Check if it's a sitemap index or regular sitemap
        if (location.includes('index') || location.includes('_index')) {
          return await this.parseSitemapIndex(location);
        } else {
          return await this.parseSitemapFromUrl(location);
        }
      } catch (error) {
        // Continue to next location
        continue;
      }
    }

    return [];
  }

  /**
   * Filter sitemap entries by various criteria
   */
  filterEntries(
    entries: SitemapEntry[],
    options?: {
      modifiedAfter?: Date;
      priority?: number;
      includePaths?: string[];
      excludePaths?: string[];
    }
  ): SitemapEntry[] {
    return entries.filter(entry => {
      // Filter by modification date
      if (options?.modifiedAfter && entry.lastmod) {
        const modDate = new Date(entry.lastmod);
        if (modDate <= options.modifiedAfter) {
          return false;
        }
      }

      // Filter by priority
      if (options?.priority !== undefined && entry.priority !== undefined) {
        if (entry.priority < options.priority) {
          return false;
        }
      }

      // Filter by path patterns
      const url = new URL(entry.loc);
      const path = url.pathname;

      if (options?.excludePaths) {
        for (const excludePath of options.excludePaths) {
          if (path.includes(excludePath)) {
            return false;
          }
        }
      }

      if (options?.includePaths && options.includePaths.length > 0) {
        let included = false;
        for (const includePath of options.includePaths) {
          if (path.includes(includePath)) {
            included = true;
            break;
          }
        }
        if (!included) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Sort entries by priority and modification date
   */
  sortEntries(entries: SitemapEntry[]): SitemapEntry[] {
    return entries.sort((a, b) => {
      // Sort by priority first (higher priority first)
      if (a.priority !== undefined && b.priority !== undefined) {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
      }

      // Then by modification date (newer first)
      if (a.lastmod && b.lastmod) {
        return new Date(b.lastmod).getTime() - new Date(a.lastmod).getTime();
      }

      return 0;
    });
  }
}

// Export singleton instance
export const sitemapParser = new SitemapParser();