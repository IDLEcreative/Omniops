-- Check what the search_embeddings function actually looks like
SELECT 
    proname AS function_name,
    pg_get_functiondef(oid) AS function_definition
FROM pg_proc 
WHERE proname = 'search_embeddings';
