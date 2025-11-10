-- =====================================================
-- Conversation Search Migration
-- =====================================================
-- Adds full-text search, vector embeddings, and analytics for conversations

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Add full-text search to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english', COALESCE(content, ''))
) STORED;

-- Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_messages_search
ON messages USING GIN(search_vector);

-- Add message embeddings for semantic search
CREATE TABLE IF NOT EXISTS message_embeddings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_embeddings_message_id
ON message_embeddings(message_id);

CREATE INDEX IF NOT EXISTS idx_message_embeddings_vector
ON message_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Search analytics table
CREATE TABLE IF NOT EXISTS search_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query TEXT NOT NULL,
  search_type TEXT CHECK (search_type IN ('full_text', 'semantic', 'hybrid')) DEFAULT 'hybrid',
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  user_id UUID,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_queries_created
ON search_queries(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_search_queries_user_id
ON search_queries(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_search_queries_domain_id
ON search_queries(domain_id) WHERE domain_id IS NOT NULL;

-- Add sentiment analysis to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral')),
ADD COLUMN IF NOT EXISTS sentiment_score FLOAT,
ADD COLUMN IF NOT EXISTS entities JSONB DEFAULT '{}';

-- Index for sentiment filtering
CREATE INDEX IF NOT EXISTS idx_messages_sentiment
ON messages(sentiment) WHERE sentiment IS NOT NULL;

-- Index for conversation_id with created_at for efficient filtering
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created
ON messages(conversation_id, created_at DESC);

-- Add product mentions tracking
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS product_mentions TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_messages_product_mentions
ON messages USING GIN(product_mentions) WHERE array_length(product_mentions, 1) > 0;

-- Function to search conversations with hybrid approach
CREATE OR REPLACE FUNCTION search_conversations(
  p_query TEXT,
  p_domain_id UUID DEFAULT NULL,
  p_date_from TIMESTAMPTZ DEFAULT NULL,
  p_date_to TIMESTAMPTZ DEFAULT NULL,
  p_sentiment TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  conversation_id UUID,
  message_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  sentiment TEXT,
  relevance_score FLOAT,
  highlight TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH fts_results AS (
    SELECT
      m.conversation_id,
      m.id AS message_id,
      m.content,
      m.role,
      m.created_at,
      m.sentiment,
      ts_rank(m.search_vector, plainto_tsquery('english', p_query)) AS fts_score,
      ts_headline('english', m.content, plainto_tsquery('english', p_query),
        'StartSel=<mark>, StopSel=</mark>, MaxWords=30, MinWords=15') AS highlight
    FROM messages m
    INNER JOIN conversations c ON m.conversation_id = c.id
    WHERE
      m.search_vector @@ plainto_tsquery('english', p_query)
      AND (p_domain_id IS NULL OR c.domain_id = p_domain_id)
      AND (p_date_from IS NULL OR m.created_at >= p_date_from)
      AND (p_date_to IS NULL OR m.created_at <= p_date_to)
      AND (p_sentiment IS NULL OR m.sentiment = p_sentiment)
  )
  SELECT
    conversation_id,
    message_id,
    content,
    role,
    created_at,
    sentiment,
    fts_score AS relevance_score,
    highlight
  FROM fts_results
  ORDER BY fts_score DESC, created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get conversation context around a message
CREATE OR REPLACE FUNCTION get_conversation_context(
  p_message_id UUID,
  p_context_size INTEGER DEFAULT 2
)
RETURNS TABLE (
  message_id UUID,
  content TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  is_match BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_conversation_id UUID;
  v_created_at TIMESTAMPTZ;
BEGIN
  -- Get conversation_id and created_at for the target message
  SELECT conversation_id, created_at
  INTO v_conversation_id, v_created_at
  FROM messages
  WHERE id = p_message_id;

  RETURN QUERY
  (
    -- Messages before the target
    SELECT
      m.id AS message_id,
      m.content,
      m.role,
      m.created_at,
      FALSE AS is_match
    FROM messages m
    WHERE m.conversation_id = v_conversation_id
      AND m.created_at < v_created_at
    ORDER BY m.created_at DESC
    LIMIT p_context_size
  )
  UNION ALL
  (
    -- The target message
    SELECT
      m.id AS message_id,
      m.content,
      m.role,
      m.created_at,
      TRUE AS is_match
    FROM messages m
    WHERE m.id = p_message_id
  )
  UNION ALL
  (
    -- Messages after the target
    SELECT
      m.id AS message_id,
      m.content,
      m.role,
      m.created_at,
      FALSE AS is_match
    FROM messages m
    WHERE m.conversation_id = v_conversation_id
      AND m.created_at > v_created_at
    ORDER BY m.created_at ASC
    LIMIT p_context_size
  )
  ORDER BY created_at;
END;
$$;

-- Popular search terms aggregation
CREATE MATERIALIZED VIEW IF NOT EXISTS popular_search_terms AS
SELECT
  lower(query) AS search_term,
  COUNT(*) AS search_count,
  AVG(results_count) AS avg_results,
  AVG(execution_time_ms) AS avg_execution_time
FROM search_queries
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY lower(query)
HAVING COUNT(*) > 1
ORDER BY search_count DESC
LIMIT 100;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_popular_search_terms_term
ON popular_search_terms(search_term);

-- Function to refresh popular search terms
CREATE OR REPLACE FUNCTION refresh_popular_search_terms()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY popular_search_terms;
END;
$$;

-- RLS policies for new tables
ALTER TABLE message_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_queries ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read message embeddings
CREATE POLICY "message_embeddings_read" ON message_embeddings
  FOR SELECT
  USING (true);

-- Allow service role to manage message embeddings
CREATE POLICY "message_embeddings_manage" ON message_embeddings
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Allow users to see their own search queries
CREATE POLICY "search_queries_own" ON search_queries
  FOR SELECT
  USING (user_id = auth.uid() OR auth.jwt()->>'role' = 'service_role');

-- Allow all authenticated users to insert search queries
CREATE POLICY "search_queries_insert" ON search_queries
  FOR INSERT
  WITH CHECK (true);