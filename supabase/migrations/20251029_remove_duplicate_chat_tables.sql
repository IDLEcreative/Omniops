-- Migration: Remove Duplicate Chat Tables (Issue #11)
-- Date: 2025-10-29
-- Purpose: Remove chat_sessions and chat_messages tables that were replaced by conversations/messages
--
-- These tables are duplicates of:
-- - chat_sessions → conversations
-- - chat_messages → messages
--
-- Verification:
-- - Code search: 0 references to chat_sessions, 0 references to chat_messages (verified 2025-10-29)
-- - Current implementation uses conversations/messages with proper organization isolation
-- - Safe to remove with CASCADE delete of any indexes/triggers
--
-- Impact:
-- - Reduces schema complexity
-- - Eliminates maintenance burden
-- - No application code uses these tables
-- - Conversations/messages tables fully functional with 5k+ records

-- Drop triggers that reference these tables (if they exist)
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;

-- Drop tables with CASCADE to remove constraints and indexes
-- CASCADE will remove:
-- - All indexes on these tables
-- - All foreign key constraints
-- - All RLS policies
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;

-- Verify removal
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_sessions'
  ) THEN
    RAISE NOTICE 'Successfully dropped chat_sessions table';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'chat_messages'
  ) THEN
    RAISE NOTICE 'Successfully dropped chat_messages table';
  END IF;
END $$;

-- Post-removal verification
DO $$
DECLARE
  remaining_tables INT;
BEGIN
  SELECT COUNT(*) INTO remaining_tables
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('conversations', 'messages');

  IF remaining_tables = 2 THEN
    RAISE NOTICE 'Verification: conversations and messages tables still intact';
  ELSE
    RAISE EXCEPTION 'ERROR: conversations or messages table missing!';
  END IF;
END $$;
