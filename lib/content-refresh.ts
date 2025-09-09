import { createClient } from '@/lib/supabase-server';
import { scrapePage } from '@/lib/scraper-api';
import { generateEmbeddings } from '@/lib/embeddings';

// Content refresh configuration
export interface RefreshConfig {
  domainId: string;
  domain: string;
  refreshInterval: number; // hours
  priority: 'high' | 'medium' | 'low';
  lastRefreshedAt?: Date;
}

// Refresh a single page's content and embeddings
export async function refreshPageContent(
  url: string,
  domainId: string
): Promise<boolean> {
  const supabase = await createClient();
  
  try {
    // Check if page exists and when it was last scraped
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    const { data: existingPage } = await supabase
      .from('website_content')
      .select('id, scraped_at, content_hash')
      .eq('url', url)
      .eq('domain_id', domainId)
      .single();

    // Scrape the page
    const scrapedPage = await scrapePage(url);
    
    // Generate content hash for comparison
    const contentHash = await generateContentHash(scrapedPage.content);
    
    // Skip if content hasn't changed
    if (existingPage?.content_hash === contentHash) {
      console.log(`Content unchanged for ${url}`);
      return false;
    }

    // Delete old embeddings
    if (existingPage) {
      await supabase
        .from('page_embeddings')
        .delete()
        .eq('page_id', existingPage.id);
    }

    // Update or insert content
    const { data: updatedContent, error: contentError } = await supabase
      .from('website_content')
      .upsert({
        domain_id: domainId,
        url,
        title: scrapedPage.title || '',
        content: scrapedPage.content,
        metadata: scrapedPage.metadata,
        content_hash: contentHash,
        scraped_at: new Date().toISOString(),
      }, {
        onConflict: 'domain_id,url'
      })
      .select()
      .single();

    if (contentError) throw contentError;

    // Generate and store new embeddings
    await generateEmbeddings({
      contentId: updatedContent.id,
      content: scrapedPage.content,
      url,
      title: scrapedPage.title || '',
    });

    console.log(`Successfully refreshed content for ${url}`);
    return true;
  } catch (error) {
    console.error(`Error refreshing ${url}:`, error);
    throw error;
  }
}

// Refresh all content for a domain
export async function refreshDomainContent(
  domainId: string,
  options?: {
    forceRefresh?: boolean;
    maxPages?: number;
  }
): Promise<{
  refreshed: number;
  skipped: number;
  failed: number;
}> {
  const supabase = await createClient();
  const stats = { refreshed: 0, skipped: 0, failed: 0 };
  
  try {
    // Get domain details
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    const { data: domain } = await supabase
      .from('domains')
      .select('domain, settings')
      .eq('id', domainId)
      .single();

    if (!domain) throw new Error('Domain not found');

    // Get all existing pages for this domain
    const { data: existingPages } = await supabase
      .from('website_content')
      .select('url, scraped_at')
      .eq('domain_id', domainId)
      .order('scraped_at', { ascending: true })
      .limit(options?.maxPages || 100);

    // Process pages in parallel batches for better performance
    const BATCH_SIZE = 5; // Process 5 pages concurrently
    const pages = existingPages || [];
    
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      
      // Process batch in parallel using Promise.allSettled
      const batchResults = await Promise.allSettled(
        batch.map(async (page) => {
          try {
            // Skip if recently refreshed (unless forced)
            if (!options?.forceRefresh) {
              const hoursSinceRefresh = 
                (Date.now() - new Date(page.scraped_at).getTime()) / (1000 * 60 * 60);
              
              if (hoursSinceRefresh < 24) {
                return { status: 'skipped', url: page.url };
              }
            }

            const wasRefreshed = await refreshPageContent(page.url, domainId);
            return { 
              status: wasRefreshed ? 'refreshed' : 'skipped', 
              url: page.url 
            };
          } catch (error) {
            console.error(`Failed to refresh ${page.url}:`, error);
            return { status: 'failed', url: page.url, error };
          }
        })
      );
      
      // Process results
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          const { status } = result.value;
          if (status === 'refreshed') stats.refreshed++;
          else if (status === 'skipped') stats.skipped++;
          else if (status === 'failed') stats.failed++;
        } else {
          // Promise rejected
          stats.failed++;
          console.error('Batch processing error:', result.reason);
        }
      });
      
      // Add a small delay between batches to avoid overwhelming the system
      if (i + BATCH_SIZE < pages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Update domain's last refresh time
    await supabase
      .from('domains')
      .update({ 
        last_content_refresh: new Date().toISOString() 
      })
      .eq('id', domainId);

    return stats;
  } catch (error) {
    console.error('Error refreshing domain content:', error);
    throw error;
  }
}

// Discover and add new pages from sitemap
export async function discoverNewPages(
  domainId: string,
  baseUrl: string
): Promise<string[]> {
  const supabase = await createClient();
  const newPages: string[] = [];
  
  try {
    // Extract domain from baseUrl
    const urlObj = new URL(baseUrl);
    const domain = urlObj.hostname;
    
    console.log(`Sitemap discovery for ${baseUrl} - needs implementation`);
    
    // Get existing URLs for this domain
    if (!supabase) {
      throw new Error('Database connection unavailable');
    }
    const { data: existingPages } = await supabase
      .from('website_content')
      .select('url')
      .eq('domain_id', domainId);

    const existingUrls = new Set(existingPages?.map(p => p.url) || []);
    
    // Try to discover new pages through sitemaps
    try {
      const sitemapUrls = await findSitemaps(domain);
      console.log(`Found ${sitemapUrls.length} sitemaps for ${domain}`);
      
      for (const sitemapUrl of sitemapUrls) {
        try {
          // TODO: Implement sitemap parsing
          // This would require adding a sitemap parsing library
          // For now, we'll just log the discovered sitemap URLs
          console.log(`Found sitemap: ${sitemapUrl}`);
          
          // Placeholder for when sitemap parsing is implemented:
          // const sitemapPages = await parseSitemap(sitemapUrl);
          // const newSitemapPages = sitemapPages.filter(page => 
          //   !existingUrls.has(page.url) && 
          //   isRelevantUrl(page.url)
          // );
          // newPages.push(...newSitemapPages.map(page => ({
          //   url: page.url,
          //   priority: page.priority || 0.5,
          //   lastModified: page.lastModified,
          //   discovered_via: `sitemap:${sitemapUrl}`
          // })));
          
        } catch (sitemapError) {
          console.warn(`Error processing sitemap ${sitemapUrl}:`, sitemapError);
        }
      }
    } catch (sitemapDiscoveryError) {
      console.warn(`Error discovering sitemaps for ${domain}:`, sitemapDiscoveryError);
    }
    
    // Try to discover pages through robots.txt
    try {
      const robotsUrls = await findUrlsInRobots(domain);
      const newRobotsUrls = robotsUrls.filter(url => 
        !existingUrls.has(url) && 
        isRelevantUrl(url)
      );
      
      newPages.push(...newRobotsUrls);
      
      console.log(`Added ${newRobotsUrls.length} new pages from robots.txt`);
      
    } catch (robotsError) {
      console.warn(`Error parsing robots.txt for ${domain}:`, robotsError);
    }
    
    return newPages;
  } catch (error) {
    console.error('Error discovering new pages:', error);
    throw error;
  }

  /**
   * Find sitemap URLs for a domain
   */
  async function findSitemaps(domain: string): Promise<string[]> {
    const sitemapUrls: string[] = [];
    
    // Common sitemap locations
    const commonLocations = [
      `https://${domain}/sitemap.xml`,
      `https://${domain}/sitemap_index.xml`,
      `https://${domain}/sitemap-index.xml`,
      `https://${domain}/sitemaps.xml`,
      `https://${domain}/wp-sitemap.xml`, // WordPress
      `https://${domain}/sitemap1.xml`,
    ];
    
    // Check robots.txt for sitemap references
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
    
    // Check common locations
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
  async function findUrlsInRobots(domain: string): Promise<string[]> {
    const urls: string[] = [];
    
    try {
      const robotsUrl = `https://${domain}/robots.txt`;
      const response = await fetch(robotsUrl);
      if (!response.ok) return urls;
      
      const robotsText = await response.text();
      
      // Look for Allow directives that might reveal important URLs
      const allowMatches = robotsText.match(/^allow:\s*(.+)$/gim);
      if (allowMatches) {
        allowMatches.forEach(match => {
          const path = match.replace(/^allow:\s*/i, '').trim();
          if (path && path !== '/') {
            // Convert path to full URL
            if (path.startsWith('/')) {
              urls.push(`https://${domain}${path}`);
            }
          }
        });
      }
      
      // Look for commented URLs or other references
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
  
  /**
   * Check if a URL is relevant for content scraping
   */
  function isRelevantUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // Skip non-http(s) URLs
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }
      
      // Skip file extensions that are not content pages
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
      
      // Skip common non-content paths
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
}

// Generate a hash of content for change detection
async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Schedule periodic content refresh
export async function scheduleContentRefresh(
  config: RefreshConfig
): Promise<void> {
  // This would typically integrate with a job queue like BullMQ or a cron service
  // For now, it's a placeholder for the scheduling logic
  
  const refreshJob = {
    domainId: config.domainId,
    domain: config.domain,
    type: 'content_refresh',
    schedule: `0 */${config.refreshInterval} * * *`, // Every N hours
    priority: config.priority,
    lastRun: config.lastRefreshedAt,
  };

  console.log('Scheduled content refresh:', refreshJob);
  
  // In production, you'd save this to a job queue or cron service
  // await jobQueue.schedule(refreshJob);
}