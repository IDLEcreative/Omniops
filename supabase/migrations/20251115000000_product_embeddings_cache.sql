-- Product Embeddings Cache
-- Purpose: Cache product embeddings to avoid re-generating them on every search
-- Performance: Reduces search time from ~500-1000ms to <50ms for cached products

-- Create product_embeddings table
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Product identification
  domain TEXT NOT NULL,
  product_id TEXT NOT NULL, -- WooCommerce/Shopify product ID
  product_sku TEXT, -- Optional SKU for additional lookup

  -- Product content (for cache validation)
  product_text TEXT NOT NULL, -- Combined name + description
  product_text_hash TEXT NOT NULL, -- Hash to detect changes

  -- Embedding data
  embedding VECTOR(1536) NOT NULL, -- OpenAI text-embedding-3-small dimension

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  access_count INTEGER NOT NULL DEFAULT 1,

  -- Composite unique constraint (one cache entry per product per domain)
  CONSTRAINT product_embeddings_domain_product_unique UNIQUE (domain, product_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_product_embeddings_domain
  ON product_embeddings(domain);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_domain_product_id
  ON product_embeddings(domain, product_id);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_product_sku
  ON product_embeddings(domain, product_sku)
  WHERE product_sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_embeddings_last_accessed
  ON product_embeddings(last_accessed_at);

-- Create vector similarity index for product recommendations
CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector
  ON product_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_embeddings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS product_embeddings_updated_at_trigger ON product_embeddings;
CREATE TRIGGER product_embeddings_updated_at_trigger
  BEFORE UPDATE ON product_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_embeddings_updated_at();

-- Create function to clean old cache entries (data retention)
CREATE OR REPLACE FUNCTION clean_old_product_embeddings(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM product_embeddings
  WHERE last_accessed_at < NOW() - (days_old || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for multi-tenant security
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access embeddings for their domain
CREATE POLICY product_embeddings_domain_isolation ON product_embeddings
  FOR ALL
  USING (
    domain IN (
      SELECT domain FROM customer_configs
      WHERE id = auth.uid()
    )
  );

-- Policy: Service role has full access (for background jobs)
CREATE POLICY product_embeddings_service_role ON product_embeddings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment documentation
COMMENT ON TABLE product_embeddings IS
  'Cache for product embeddings to improve search performance. ' ||
  'Stores vector embeddings for WooCommerce/Shopify products to avoid re-generation. ' ||
  'Includes cache invalidation via product_text_hash comparison.';

COMMENT ON COLUMN product_embeddings.product_text_hash IS
  'MD5 hash of product_text for cache invalidation. ' ||
  'If product name/description changes, hash will differ and cache will be regenerated.';

COMMENT ON COLUMN product_embeddings.access_count IS
  'Track how often cached embeddings are used for cache eviction strategy.';
