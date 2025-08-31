/**
 * Global Embedding Deduplication Service
 * Manages a persistent cache of chunk hashes and embeddings across all crawl sessions
 */

const Redis = require('ioredis');
const crypto = require('crypto');

class EmbeddingDeduplicator {
  constructor(redisUrl) {
    this.redis = new Redis(redisUrl || process.env.REDIS_URL || 'redis://localhost:6379');
    this.localCache = new Map(); // Local in-memory cache for performance
    this.stats = {
      hits: 0,
      misses: 0,
      saved: 0,
      apiCallsSaved: 0
    };
  }

  /**
   * Generate a normalized hash for content deduplication
   */
  generateHash(text) {
    const normalized = text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    return crypto.createHash('sha256')
      .update(normalized)
      .digest('hex');
  }

  /**
   * Check if we've seen this chunk before across any crawl
   */
  async hasChunk(chunkText) {
    const hash = this.generateHash(chunkText);
    
    // Check local cache first
    if (this.localCache.has(hash)) {
      this.stats.hits++;
      return true;
    }
    
    // Check Redis
    try {
      const exists = await this.redis.exists(`chunk:${hash}`);
      if (exists) {
        this.stats.hits++;
        this.localCache.set(hash, true); // Cache locally
        return true;
      }
    } catch (error) {
      console.error('Redis error checking chunk:', error);
    }
    
    this.stats.misses++;
    return false;
  }

  /**
   * Mark a chunk as seen and optionally store its embedding
   */
  async addChunk(chunkText, embedding = null) {
    const hash = this.generateHash(chunkText);
    
    // Store in local cache
    this.localCache.set(hash, true);
    
    // Store in Redis with TTL (30 days)
    try {
      const key = `chunk:${hash}`;
      await this.redis.set(key, JSON.stringify({
        firstSeen: new Date().toISOString(),
        contentLength: chunkText.length,
        hasEmbedding: !!embedding
      }), 'EX', 30 * 24 * 60 * 60); // 30 days TTL
      
      // Store embedding if provided
      if (embedding) {
        await this.redis.set(
          `embedding:${hash}`,
          JSON.stringify(embedding),
          'EX', 30 * 24 * 60 * 60
        );
      }
      
      this.stats.saved++;
    } catch (error) {
      console.error('Redis error storing chunk:', error);
    }
  }

  /**
   * Get cached embedding for a chunk if it exists
   */
  async getCachedEmbedding(chunkText) {
    const hash = this.generateHash(chunkText);
    
    try {
      const embeddingJson = await this.redis.get(`embedding:${hash}`);
      if (embeddingJson) {
        this.stats.apiCallsSaved++;
        return JSON.parse(embeddingJson);
      }
    } catch (error) {
      console.error('Redis error fetching embedding:', error);
    }
    
    return null;
  }

  /**
   * Filter out duplicate chunks from an array
   */
  async filterDuplicates(chunks, pageUrl = '') {
    const unique = [];
    const duplicates = [];
    
    for (const chunk of chunks) {
      const isDuplicate = await this.hasChunk(chunk);
      
      if (!isDuplicate) {
        unique.push(chunk);
        await this.addChunk(chunk);
      } else {
        duplicates.push(chunk);
      }
    }
    
    if (duplicates.length > 0) {
      console.log(`[Deduplicator] Filtered ${duplicates.length} duplicate chunks for ${pageUrl}`);
    }
    
    return { unique, duplicates };
  }

  /**
   * Process chunks with smart batching and caching
   */
  async processChunksForEmbeddings(chunks, generateEmbeddingsFn) {
    const embeddings = [];
    const chunksNeedingEmbeddings = [];
    const chunkIndices = [];
    
    // Check cache for existing embeddings
    for (let i = 0; i < chunks.length; i++) {
      const cachedEmbedding = await this.getCachedEmbedding(chunks[i]);
      
      if (cachedEmbedding) {
        embeddings[i] = cachedEmbedding;
      } else {
        chunksNeedingEmbeddings.push(chunks[i]);
        chunkIndices.push(i);
      }
    }
    
    // Generate new embeddings only for chunks not in cache
    if (chunksNeedingEmbeddings.length > 0) {
      console.log(`[Deduplicator] Generating ${chunksNeedingEmbeddings.length} new embeddings (${chunks.length - chunksNeedingEmbeddings.length} from cache)`);
      
      const newEmbeddings = await generateEmbeddingsFn(chunksNeedingEmbeddings);
      
      // Store new embeddings in cache and results
      for (let i = 0; i < chunksNeedingEmbeddings.length; i++) {
        const embedding = newEmbeddings[i];
        const chunk = chunksNeedingEmbeddings[i];
        const resultIndex = chunkIndices[i];
        
        // Cache the embedding
        await this.addChunk(chunk, embedding);
        
        // Place in results
        embeddings[resultIndex] = embedding;
      }
    }
    
    return embeddings;
  }

  /**
   * Get deduplication statistics
   */
  getStats() {
    const hitRate = this.stats.hits > 0 
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;
    
    const estimatedCostSavings = (this.stats.apiCallsSaved * 0.00002).toFixed(4);
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      localCacheSize: this.localCache.size,
      estimatedCostSavings: `$${estimatedCostSavings}`
    };
  }

  /**
   * Clear local cache (keeps Redis cache)
   */
  clearLocalCache() {
    this.localCache.clear();
    console.log('[Deduplicator] Local cache cleared');
  }

  /**
   * Clear all caches (both local and Redis)
   */
  async clearAllCaches() {
    this.localCache.clear();
    
    try {
      // Clear all chunk and embedding keys from Redis
      const chunkKeys = await this.redis.keys('chunk:*');
      const embeddingKeys = await this.redis.keys('embedding:*');
      
      if (chunkKeys.length > 0) {
        await this.redis.del(...chunkKeys);
      }
      
      if (embeddingKeys.length > 0) {
        await this.redis.del(...embeddingKeys);
      }
      
      console.log(`[Deduplicator] Cleared ${chunkKeys.length} chunks and ${embeddingKeys.length} embeddings from Redis`);
    } catch (error) {
      console.error('Error clearing Redis cache:', error);
    }
    
    // Reset stats
    this.stats = {
      hits: 0,
      misses: 0,
      saved: 0,
      apiCallsSaved: 0
    };
  }

  /**
   * Close Redis connection
   */
  async close() {
    await this.redis.quit();
  }
}

// Export singleton instance
let deduplicatorInstance = null;

function getDeduplicator() {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new EmbeddingDeduplicator();
  }
  return deduplicatorInstance;
}

module.exports = {
  EmbeddingDeduplicator,
  getDeduplicator
};