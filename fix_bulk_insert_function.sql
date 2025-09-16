-- FIX FOR CRITICAL BUG: bulk_insert_embeddings storing strings instead of vectors
-- The original function used ->> which returns TEXT, causing embeddings to be stored as JSON strings
-- This fix uses proper JSONB array handling to store embeddings as vectors

-- Drop the broken function
DROP FUNCTION IF EXISTS bulk_insert_embeddings(jsonb);

-- Create the corrected function
CREATE OR REPLACE FUNCTION bulk_insert_embeddings(
    embeddings jsonb
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    inserted_count integer;
    embedding_array numeric[];
    embedding_record jsonb;
BEGIN
    WITH inserted AS (
        INSERT INTO page_embeddings (
            page_id, chunk_text, embedding, metadata
        )
        SELECT 
            (e->>'page_id')::uuid,
            (e->>'chunk_text')::text,
            -- CRITICAL FIX: Properly convert JSONB array to vector
            -- The embedding field is a JSONB array, we need to:
            -- 1. Extract it as JSONB (not text)
            -- 2. Convert JSONB array to PostgreSQL array
            -- 3. Cast the array to vector type
            CASE 
                WHEN jsonb_typeof(e->'embedding') = 'array' THEN
                    -- Convert JSONB array to numeric array then to vector
                    (SELECT array_agg(value::numeric)::vector(1536) 
                     FROM jsonb_array_elements_text(e->'embedding'))
                ELSE
                    -- Handle case where embedding might be a string (for backward compatibility)
                    (e->>'embedding')::vector(1536)
            END,
            COALESCE((e->'metadata')::jsonb, '{}'::jsonb)
        FROM jsonb_array_elements(embeddings) AS e
        ON CONFLICT DO NOTHING
        RETURNING 1
    )
    SELECT COUNT(*) INTO inserted_count FROM inserted;
    
    RETURN inserted_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION bulk_insert_embeddings TO service_role;

-- Test the function with sample data to verify it works
DO $$
DECLARE
    test_embedding numeric[];
    test_result integer;
BEGIN
    -- Create a test embedding array
    test_embedding := ARRAY(SELECT 0.1 FROM generate_series(1, 1536));
    
    -- Test the function (will fail due to foreign key, but that's ok)
    BEGIN
        test_result := bulk_insert_embeddings(
            jsonb_build_array(
                jsonb_build_object(
                    'page_id', '00000000-0000-0000-0000-000000000000',
                    'chunk_text', 'test',
                    'embedding', to_jsonb(test_embedding),
                    'metadata', '{}'::jsonb
                )
            )
        );
    EXCEPTION WHEN foreign_key_violation THEN
        RAISE NOTICE 'Function syntax is valid (foreign key error expected for test)';
    END;
END;
$$;

-- Now fix existing string embeddings to proper vector format
-- This converts JSON string embeddings back to proper vectors
UPDATE page_embeddings 
SET embedding = (
    SELECT array_agg(value::numeric)::vector(1536)
    FROM jsonb_array_elements_text(embedding::text::jsonb)
)
WHERE pg_typeof(embedding) = 'text'::regtype
   OR embedding::text LIKE '[%]';  -- JSON array string pattern

-- Verify the fix
SELECT 
    'Fixed embeddings' as status,
    COUNT(*) as count,
    pg_typeof(embedding) as type
FROM page_embeddings
GROUP BY pg_typeof(embedding);