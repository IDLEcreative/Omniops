/**
 * Simple in-memory response cache for common queries
 * Reduces load on OpenAI API and improves response times for frequent questions
 */

interface CacheEntry {
  query: string;
  normalizedQuery: string;
  response: string;
  timestamp: number;
  hits: number;
  domain?: string;
}

export class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly maxAge: number = 60 * 60 * 1000; // 1 hour
  private readonly maxSize: number = 100;
  
  // Common query patterns that should be cached
  private readonly cacheablePatterns = [
    /^(hi|hello|hey)$/i,
    /business hours?/i,
    /shipping (cost|rate|price)/i,
    /return policy/i,
    /contact (info|information|us)/i,
    /payment (method|option)s?/i,
    /delivery time/i,
    /track.*order/i,
    /cancel.*order/i,
    /refund/i,
  ];

  // Predefined responses for very common queries
  private readonly staticResponses: Record<string, string> = {
    'hello': 'Hello! How can I assist you today?',
    'hi': 'Hi there! How can I help you?',
    'hey': 'Hey! What can I do for you today?',
    'thanks': "You're welcome! Is there anything else I can help you with?",
    'thank you': "You're very welcome! Let me know if you need anything else.",
    'bye': 'Goodbye! Have a great day!',
    'goodbye': 'Goodbye! Thank you for contacting us.',
  };

  /**
   * Normalize query for better cache hits
   */
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' '); // Normalize spaces
  }

  /**
   * Check if a query should be cached
   */
  private isCacheable(query: string): boolean {
    // Check length
    if (query.length > 100) return false;
    
    // Check against patterns
    return this.cacheablePatterns.some(pattern => pattern.test(query));
  }

  /**
   * Get cached response if available
   */
  get(query: string, domain?: string): string | null {
    const normalizedQuery = this.normalizeQuery(query);
    
    // Check static responses first
    const staticResponse = this.staticResponses[normalizedQuery];
    if (staticResponse) {
      console.log(`[Cache] Static hit for: "${query}"`);
      return staticResponse;
    }
    
    // Build cache key
    const cacheKey = domain ? `${domain}:${normalizedQuery}` : normalizedQuery;
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(cacheKey);
      console.log(`[Cache] Expired entry for: "${query}"`);
      return null;
    }
    
    // Update hit count
    entry.hits++;
    console.log(`[Cache] Hit for: "${query}" (${entry.hits} hits)`);
    
    return entry.response;
  }

  /**
   * Store response in cache
   */
  set(query: string, response: string, domain?: string): void {
    // Check if cacheable
    if (!this.isCacheable(query)) {
      return;
    }
    
    const normalizedQuery = this.normalizeQuery(query);
    const cacheKey = domain ? `${domain}:${normalizedQuery}` : normalizedQuery;
    
    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove oldest entry
      const oldestKey = this.findOldestEntry();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        console.log(`[Cache] Evicted oldest entry to make room`);
      }
    }
    
    // Store entry
    this.cache.set(cacheKey, {
      query,
      normalizedQuery,
      response,
      timestamp: Date.now(),
      hits: 0,
      domain
    });
    
    console.log(`[Cache] Stored response for: "${query}"`);
  }

  /**
   * Find oldest cache entry
   */
  private findOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }
    
    return oldestKey;
  }

  /**
   * Clear expired entries
   */
  cleanupExpired(): number {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
    
    return cleaned;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hits: number;
    mostUsed: string[];
    oldestEntry: number;
  } {
    let totalHits = 0;
    let oldestTime = Date.now();
    const entries = Array.from(this.cache.values());
    
    for (const entry of entries) {
      totalHits += entry.hits;
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
      }
    }
    
    // Get most used queries
    const mostUsed = entries
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 5)
      .map(e => `${e.query} (${e.hits} hits)`);
    
    return {
      size: this.cache.size,
      hits: totalHits,
      mostUsed,
      oldestEntry: Date.now() - oldestTime
    };
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    console.log('[Cache] Cleared all entries');
  }
}

// Singleton instance
let cacheInstance: ResponseCache | null = null;

export function getResponseCache(): ResponseCache {
  if (!cacheInstance) {
    cacheInstance = new ResponseCache();
    
    // Set up periodic cleanup
    setInterval(() => {
      cacheInstance?.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }
  
  return cacheInstance;
}