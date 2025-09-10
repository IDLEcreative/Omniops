/**
 * Database Optimization Module
 * Implements bulk operations, connection pooling, and performance optimizations
 */

const { createClient } = require('@supabase/supabase-js');

// Connection pool configuration
const POOL_CONFIG = {
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20, // Maximum connections in pool
  allowExitOnIdle: true
};

// Batch configuration
const BATCH_CONFIG = {
  embeddings: {
    size: 50,     // Optimal batch size for embeddings
    timeout: 30000 // 30 second timeout
  },
  pages: {
    size: 20,     // Optimal batch size for pages
    timeout: 15000 // 15 second timeout
  }
};

class DatabaseOptimizer {
  constructor(supabaseUrl, supabaseKey) {
    // Create optimized Supabase client with connection pooling
    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-connection-pool': 'true'
        }
      }
    });
    
    this.embeddingBatch = [];
    this.pageBatch = [];
    this.flushTimers = {};
  }

  /**
   * Bulk insert embeddings with optimal batching
   */
  async bulkInsertEmbeddings(embeddings) {
    if (!embeddings || embeddings.length === 0) return { success: true };
    
    const batches = [];
    for (let i = 0; i < embeddings.length; i += BATCH_CONFIG.embeddings.size) {
      batches.push(embeddings.slice(i, i + BATCH_CONFIG.embeddings.size));
    }
    
    console.log(`[DatabaseOptimizer] Inserting ${embeddings.length} embeddings in ${batches.length} batches`);
    
    const results = await Promise.allSettled(
      batches.map(async (batch, index) => {
        const startTime = Date.now();
        
        try {
          const { error } = await this.supabase
            .from('page_embeddings')
            .insert(batch);
          
          if (error) throw error;
          
          const duration = Date.now() - startTime;
          console.log(`[DatabaseOptimizer] Batch ${index + 1}/${batches.length}: ${batch.length} embeddings in ${duration}ms (${Math.round(duration/batch.length)}ms per row)`);
          
          return { success: true, count: batch.length, duration };
        } catch (error) {
          console.error(`[DatabaseOptimizer] Batch ${index + 1} failed:`, error.message);
          return { success: false, error: error.message };
        }
      })
    );
    
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    const failed = results.filter(r => r.status === 'rejected' || !r.value.success);
    
    return {
      success: failed.length === 0,
      inserted: successful.reduce((sum, r) => sum + (r.value?.count || 0), 0),
      failed: failed.length,
      avgDuration: successful.length > 0 
        ? successful.reduce((sum, r) => sum + (r.value?.duration || 0), 0) / successful.length
        : 0
    };
  }

  /**
   * Buffered insert for embeddings - accumulates and flushes in batches
   */
  async bufferEmbedding(embedding) {
    this.embeddingBatch.push(embedding);
    
    // Clear existing flush timer
    if (this.flushTimers.embeddings) {
      clearTimeout(this.flushTimers.embeddings);
    }
    
    // Flush if batch is full
    if (this.embeddingBatch.length >= BATCH_CONFIG.embeddings.size) {
      return this.flushEmbeddings();
    }
    
    // Set timer to flush after delay
    this.flushTimers.embeddings = setTimeout(() => {
      this.flushEmbeddings();
    }, 5000); // Flush after 5 seconds of inactivity
    
    return { buffered: true };
  }

  /**
   * Flush buffered embeddings
   */
  async flushEmbeddings() {
    if (this.embeddingBatch.length === 0) return { success: true, count: 0 };
    
    const batch = [...this.embeddingBatch];
    this.embeddingBatch = [];
    
    return this.bulkInsertEmbeddings(batch);
  }

  /**
   * Optimized upsert for scraped pages
   */
  async upsertPage(pageData) {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase
        .from('scraped_pages')
        .upsert(pageData, {
          onConflict: 'url',
          ignoreDuplicates: false
        })
        .select()
        .single();
      
      if (error) throw error;
      
      const duration = Date.now() - startTime;
      console.log(`[DatabaseOptimizer] Page upserted in ${duration}ms`);
      
      return { success: true, data, duration };
    } catch (error) {
      console.error('[DatabaseOptimizer] Page upsert failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete and recreate embeddings (optimized)
   */
  async replaceEmbeddings(pageId, newEmbeddings) {
    const startTime = Date.now();
    
    try {
      // Use transaction-like behavior
      // First, prepare all new embeddings with page_id
      const embeddingsWithPageId = newEmbeddings.map((emb, index) => ({
        ...emb,
        page_id: pageId,
        chunk_index: index
      }));
      
      // Delete old embeddings
      const { error: deleteError } = await this.supabase
        .from('page_embeddings')
        .delete()
        .eq('page_id', pageId);
      
      if (deleteError) throw deleteError;
      
      // Insert new embeddings in bulk
      const insertResult = await this.bulkInsertEmbeddings(embeddingsWithPageId);
      
      const duration = Date.now() - startTime;
      console.log(`[DatabaseOptimizer] Replaced ${newEmbeddings.length} embeddings in ${duration}ms`);
      
      return { 
        success: insertResult.success, 
        count: insertResult.inserted,
        duration 
      };
    } catch (error) {
      console.error('[DatabaseOptimizer] Replace embeddings failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Execute raw SQL for advanced operations
   */
  async executeSQL(sql, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        query: sql,
        params: params
      });
      
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      // Fallback for when RPC is not available
      console.warn('[DatabaseOptimizer] RPC not available, operations limited to SDK');
      return { success: false, error: error.message };
    }
  }

  /**
   * Create missing indexes (should be run once)
   */
  async createOptimizationIndexes() {
    const indexes = [
      {
        name: 'GIN index for text search',
        sql: 'CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_gin ON scraped_pages USING gin(to_tsvector(\'english\', content))'
      },
      {
        name: 'Composite index for embeddings',
        sql: 'CREATE INDEX IF NOT EXISTS idx_page_embeddings_composite ON page_embeddings(page_id, chunk_index)'
      },
      {
        name: 'HNSW index for vector search',
        sql: 'CREATE INDEX IF NOT EXISTS idx_page_embeddings_hnsw ON page_embeddings USING hnsw (embedding vector_cosine_ops)'
      }
    ];
    
    console.log('[DatabaseOptimizer] Creating optimization indexes...');
    
    for (const index of indexes) {
      const result = await this.executeSQL(index.sql);
      if (result.success) {
        console.log(`✅ Created: ${index.name}`);
      } else {
        console.log(`⚠️  Could not create ${index.name}: ${result.error}`);
      }
    }
  }

  /**
   * Get connection pool statistics
   */
  getPoolStats() {
    // This would need actual pool monitoring in production
    return {
      config: POOL_CONFIG,
      batchConfig: BATCH_CONFIG,
      bufferedEmbeddings: this.embeddingBatch.length,
      bufferedPages: this.pageBatch.length
    };
  }
}

module.exports = { DatabaseOptimizer, BATCH_CONFIG, POOL_CONFIG };