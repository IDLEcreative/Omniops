-- Enable pgvector and (re)create vector search function used by the app

-- 1) Extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2) Function (matches app RPC call)
DROP FUNCTION IF EXISTS public.search_embeddings(vector, uuid, float, int);
CREATE OR REPLACE FUNCTION public.search_embeddings(
  query_embedding vector(1536),
  p_domain_id uuid DEFAULT NULL,
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
)
LANGUAGE sql STABLE AS $$
  SELECT 
    pe.chunk_text AS content,
    COALESCE((pe.metadata->>'url')::text, sp.url) AS url,
    COALESCE((pe.metadata->>'title')::text, sp.title) AS title,
    1 - (pe.embedding <-> query_embedding) AS similarity
  FROM page_embeddings pe
  JOIN scraped_pages sp ON sp.id = pe.page_id
  WHERE (p_domain_id IS NULL OR sp.domain_id = p_domain_id)
    AND 1 - (pe.embedding <-> query_embedding) > match_threshold
  ORDER BY pe.embedding <-> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.search_embeddings TO anon, authenticated, service_role;

-- 3) Optional index for speed
-- CREATE INDEX IF NOT EXISTS page_embeddings_embedding_idx
--   ON public.page_embeddings USING ivfflat (embedding vector_l2_ops) WITH (lists = 100);

