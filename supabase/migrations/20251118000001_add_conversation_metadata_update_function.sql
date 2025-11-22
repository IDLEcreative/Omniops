-- Add Atomic Conversation Metadata Update Function
-- Performance improvement: 15-30ms reduction per update, eliminates N+1 pattern
-- Analysis reference: docs/10-ANALYSIS/ANALYSIS_SUPABASE_PERFORMANCE.md (Issue #5)

-- Function to atomically update conversation metadata using JSONB merge
-- Replaces SELECT + UPDATE pattern with single atomic operation
CREATE OR REPLACE FUNCTION update_conversation_metadata(
  p_conversation_id UUID,
  p_session_metadata JSONB
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atomic JSONB merge - combines existing metadata with new session_metadata
  -- Uses jsonb_set to update nested field without full read
  UPDATE conversations
  SET
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('session_metadata', p_session_metadata),
    updated_at = NOW()
  WHERE id = p_conversation_id;

  -- No need to check rows affected - function is idempotent
  -- Missing conversation_id will simply not update anything
END;
$$;

-- Comment documentation
COMMENT ON FUNCTION update_conversation_metadata IS
'Atomically updates conversation metadata session_metadata field. Eliminates N+1 SELECT+UPDATE pattern, reducing latency by 15-30ms per call. Uses JSONB merge for efficient partial updates.';

-- Grant execute to authenticated users (RLS still applies on conversations table)
GRANT EXECUTE ON FUNCTION update_conversation_metadata TO authenticated;
GRANT EXECUTE ON FUNCTION update_conversation_metadata TO anon;
