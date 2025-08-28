/**
 * URL Deduplicator
 * Prevents duplicate URL processing and maintains a cache of processed URLs
 */

export class URLDeduplicator {
  private processedUrls: Set<string> = new Set();
  private urlPatterns: Map<string, RegExp> = new Map();
  private maxCacheSize: number;
  
  constructor(maxCacheSize: number = 10000) {
    this.maxCacheSize = maxCacheSize;
  }
  
  /**
   * Check if URL has already been processed
   */
  hasProcessed(url: string): boolean {
    const normalizedUrl = this.normalizeUrl(url);
    return this.processedUrls.has(normalizedUrl);
  }
  
  /**
   * Mark URL as processed
   */
  markProcessed(url: string): void {
    const normalizedUrl = this.normalizeUrl(url);
    
    // Manage cache size
    if (this.processedUrls.size >= this.maxCacheSize) {
      // Remove oldest 20% of entries
      const toRemove = Math.floor(this.maxCacheSize * 0.2);
      const urls = Array.from(this.processedUrls);
      for (let i = 0; i < toRemove; i++) {
        const url = urls[i];
        if (url !== undefined) {
          this.processedUrls.delete(url);
        }
      }
    }
    
    this.processedUrls.add(normalizedUrl);
  }
  
  /**
   * Check if URL matches any excluded patterns
   */
  isExcluded(url: string, excludePatterns: string[] = []): boolean {
    for (const pattern of excludePatterns) {
      let regex = this.urlPatterns.get(pattern);
      if (!regex) {
        regex = new RegExp(pattern, 'i');
        this.urlPatterns.set(pattern, regex);
      }
      
      if (regex.test(url)) {
        return true;
      }
    }
    return false;
  }
  
  /**
   * Normalize URL for consistent comparison
   */
  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Remove fragment
      urlObj.hash = '';
      
      // Sort query parameters for consistency
      const params = Array.from(urlObj.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b));
      
      urlObj.search = '';
      for (const [key, value] of params) {
        urlObj.searchParams.append(key, value);
      }
      
      // Remove trailing slash if it's just the path
      if (urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.toString().toLowerCase();
    } catch {
      // If URL parsing fails, return original
      return url.toLowerCase();
    }
  }
  
  /**
   * Filter array of URLs to remove duplicates and excluded patterns
   */
  filterUrls(urls: string[], excludePatterns: string[] = []): string[] {
    return urls.filter(url => 
      !this.hasProcessed(url) && 
      !this.isExcluded(url, excludePatterns)
    );
  }
  
  /**
   * Get statistics about processed URLs
   */
  getStats(): {
    processedCount: number;
    cacheSize: number;
    maxCacheSize: number;
  } {
    return {
      processedCount: this.processedUrls.size,
      cacheSize: this.processedUrls.size,
      maxCacheSize: this.maxCacheSize,
    };
  }
  
  /**
   * Clear the cache
   */
  clear(): void {
    this.processedUrls.clear();
    this.urlPatterns.clear();
  }
  
  /**
   * Check for similar URLs that might be duplicates
   */
  findSimilarUrls(url: string, threshold: number = 0.8): string[] {
    const normalizedTarget = this.normalizeUrl(url);
    const similar: string[] = [];
    
    for (const processedUrl of this.processedUrls) {
      const similarity = this.calculateUrlSimilarity(normalizedTarget, processedUrl);
      if (similarity >= threshold && similarity < 1.0) {
        similar.push(processedUrl);
      }
    }
    
    return similar;
  }
  
  /**
   * Calculate similarity between two URLs (0-1 scale)
   */
  private calculateUrlSimilarity(url1: string, url2: string): number {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      
      // Different domains are not similar
      if (u1.hostname !== u2.hostname) {
        return 0;
      }
      
      // Calculate path similarity using Levenshtein distance
      const pathSimilarity = 1 - this.levenshteinDistance(u1.pathname, u2.pathname) / 
        Math.max(u1.pathname.length, u2.pathname.length);
      
      // Calculate query parameter similarity
      const params1 = new Set(u1.searchParams.keys());
      const params2 = new Set(u2.searchParams.keys());
      const intersection = new Set([...params1].filter(x => params2.has(x)));
      const union = new Set([...params1, ...params2]);
      const paramSimilarity = union.size === 0 ? 1 : intersection.size / union.size;
      
      // Weighted average (path is more important)
      return pathSimilarity * 0.7 + paramSimilarity * 0.3;
    } catch {
      // If URL parsing fails, use string similarity
      return 1 - this.levenshteinDistance(url1, url2) / Math.max(url1.length, url2.length);
    }
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    const firstRow = matrix[0];
    if (firstRow !== undefined) {
      for (let j = 0; j <= str1.length; j++) {
        firstRow[j] = j;
      }
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        const currentRow = matrix[i];
        const prevRow = matrix[i - 1];
        if (currentRow !== undefined && prevRow !== undefined) {
          if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
            currentRow[j] = prevRow[j - 1] ?? 0;
          } else {
            currentRow[j] = Math.min(
              (prevRow[j - 1] ?? 0) + 1, // substitution
              (currentRow[j - 1] ?? 0) + 1,     // insertion
              (prevRow[j] ?? 0) + 1      // deletion
            );
          }
        }
      }
    }
    
    const lastRow = matrix[str2.length];
    return lastRow ? (lastRow[str1.length] ?? 0) : 0;
  }
}