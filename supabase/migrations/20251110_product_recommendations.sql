-- =====================================================
-- Product Recommendations Migration
-- =====================================================
-- Adds product embeddings, recommendation tracking, and algorithms

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Product embeddings table for vector similarity
CREATE TABLE IF NOT EXISTS product_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_product
  ON product_embeddings(product_id, domain_id);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_domain
  ON product_embeddings(domain_id);

CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector
  ON product_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Recommendation events for tracking and analytics
CREATE TABLE IF NOT EXISTS recommendation_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  algorithm_used TEXT CHECK (algorithm_used IN ('collaborative', 'content_based', 'hybrid', 'vector_similarity')),
  score FLOAT NOT NULL,
  shown BOOLEAN DEFAULT TRUE,
  clicked BOOLEAN DEFAULT FALSE,
  purchased BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_session
  ON recommendation_events(session_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_conversation
  ON recommendation_events(conversation_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_product
  ON recommendation_events(product_id);

CREATE INDEX IF NOT EXISTS idx_recommendation_events_created
  ON recommendation_events(created_at DESC);

-- Index for click-through rate analysis
CREATE INDEX IF NOT EXISTS idx_recommendation_events_clicks
  ON recommendation_events(shown, clicked, purchased);

-- Enable Row Level Security
ALTER TABLE product_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_events ENABLE ROW LEVEL SECURITY;

-- RLS: Service role has full access
CREATE POLICY "product_embeddings_service" ON product_embeddings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "recommendation_events_service" ON recommendation_events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Function to get recommendation metrics
CREATE OR REPLACE FUNCTION get_recommendation_metrics(
  p_domain_id UUID DEFAULT NULL,
  p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
  algorithm TEXT,
  total_shown BIGINT,
  total_clicked BIGINT,
  total_purchased BIGINT,
  click_through_rate FLOAT,
  conversion_rate FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    algorithm_used AS algorithm,
    COUNT(*) AS total_shown,
    COUNT(*) FILTER (WHERE clicked = TRUE) AS total_clicked,
    COUNT(*) FILTER (WHERE purchased = TRUE) AS total_purchased,
    ROUND((COUNT(*) FILTER (WHERE clicked = TRUE)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 2)::FLOAT AS click_through_rate,
    ROUND((COUNT(*) FILTER (WHERE purchased = TRUE)::FLOAT / NULLIF(COUNT(*), 0) * 100)::NUMERIC, 2)::FLOAT AS conversion_rate
  FROM recommendation_events re
  LEFT JOIN conversations c ON re.conversation_id = c.id
  WHERE
    re.created_at > NOW() - (p_hours || ' hours')::INTERVAL
    AND (p_domain_id IS NULL OR c.domain_id = p_domain_id)
  GROUP BY algorithm_used
  ORDER BY total_shown DESC;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE product_embeddings IS 'Vector embeddings for product similarity search';
COMMENT ON TABLE recommendation_events IS 'Tracks recommendation impressions, clicks, and purchases';
COMMENT ON COLUMN recommendation_events.algorithm_used IS 'Algorithm that generated this recommendation';
COMMENT ON COLUMN recommendation_events.score IS 'Recommendation score (0-1)';
