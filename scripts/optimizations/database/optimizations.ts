interface Optimization {
  name: string;
  estimatedImprovement: string;
  query: string;
}

export const optimizations: Optimization[] = [
  {
    name: 'Add GIN index for full-text search on scraped_pages',
    estimatedImprovement: '95% faster text searches',
    query: `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'scraped_pages' 
          AND column_name = 'content_search_vector'
        ) THEN
          ALTER TABLE scraped_pages 
          ADD COLUMN content_search_vector tsvector 
          GENERATED ALWAYS AS (
            to_tsvector('english', 
              coalesce(title, '') || ' ' || 
              coalesce(content, '')
            )
          ) STORED;
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_content_search 
        ON scraped_pages USING GIN (content_search_vector);
        
        CREATE INDEX IF NOT EXISTS idx_scraped_pages_domain_url 
        ON scraped_pages(domain_id, url);
        
        RAISE NOTICE 'Full-text search indexes created successfully';
      END $$;
    `
  },
  {
    name: 'Optimize page_embeddings indexes',
    estimatedImprovement: '80% faster vector searches',
    query: `
      DO $$
      BEGIN
        CREATE INDEX IF NOT EXISTS idx_page_embeddings_page_id 
        ON page_embeddings(page_id);
        
        CREATE INDEX IF NOT EXISTS idx_page_embeddings_domain_lookup
        ON page_embeddings(page_id)
        INCLUDE (embedding)
        WHERE embedding IS NOT NULL;
        
        BEGIN
          CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector_hnsw
          ON page_embeddings 
          USING hnsw (embedding vector_l2_ops)
          WITH (m = 16, ef_construction = 64);
        EXCEPTION WHEN OTHERS THEN
          CREATE INDEX IF NOT EXISTS idx_page_embeddings_vector_ivf
          ON page_embeddings 
          USING ivfflat (embedding vector_l2_ops)
          WITH (lists = 100);
        END;
        
        RAISE NOTICE 'Vector search indexes optimized';
      END $$;
    `
  },
  {
    name: 'Create optimized search function',
    estimatedImprovement: '70% faster hybrid searches',
    query: `
      CREATE OR REPLACE FUNCTION search_content_optimized(
        query_text text,
        query_embedding vector(1536),
        p_domain_id uuid,
        match_count int DEFAULT 10,
        use_hybrid boolean DEFAULT true
      )
      RETURNS TABLE (
        id uuid,
        url text,
        title text,
        content text,
        similarity float,
        rank float
      )
      LANGUAGE plpgsql
      AS $$ ... $$;
    `
  },
  {
    name: 'Add query result caching table',
    estimatedImprovement: '99% faster for repeated queries',
    query: `
      CREATE TABLE IF NOT EXISTS query_cache (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        domain_id uuid NOT NULL,
        query_hash text NOT NULL,
        query_text text,
        results jsonb NOT NULL,
        created_at timestamptz DEFAULT now(),
        expires_at timestamptz DEFAULT now() + interval '1 hour'
      );
      
      CREATE INDEX IF NOT EXISTS idx_query_cache_lookup 
      ON query_cache(domain_id, query_hash, expires_at);
      
      CREATE OR REPLACE FUNCTION cleanup_expired_cache()
      RETURNS void
      LANGUAGE sql
      AS $$
        DELETE FROM query_cache WHERE expires_at < now();
      $$;
    `
  },
  {
    name: 'Add monitoring views',
    estimatedImprovement: 'Better query performance visibility',
    query: `
      CREATE OR REPLACE VIEW query_performance_stats AS
      SELECT 
        query,
        calls,
        total_time,
        mean_time,
        max_time,
        min_time
      FROM pg_stat_statements
      WHERE query NOT LIKE '%pg_%'
        AND query NOT LIKE '%information_schema%'
      ORDER BY mean_time DESC
      LIMIT 20;
      
      CREATE OR REPLACE VIEW index_usage_stats AS
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_scan,
        idx_tup_read,
        idx_tup_fetch,
        pg_size_pretty(pg_relation_size(indexrelid)) as index_size
      FROM pg_stat_user_indexes
      ORDER BY idx_scan DESC;
    `
  },
  {
    name: 'Update table statistics',
    estimatedImprovement: 'Better query planning',
    query: `
      ANALYZE scraped_pages;
      ANALYZE page_embeddings;
      ANALYZE customer_configs;
    `
  }
];
