-- Migration: Add RLS policies for demo_sessions table
-- Created: 2025-01-08
-- Purpose: Protect demo session data (public demo mode, no auth required)

-- Enable RLS on demo_sessions table
ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

-- Service role has full access (bypasses RLS for admin operations)
CREATE POLICY "Service role has full access to demo_sessions"
ON demo_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Demo sessions are accessible to public (no authentication required)
-- Security Note: Demo sessions are designed for unauthenticated users testing the widget
-- Application logic handles session_id validation and rate limiting
-- Sessions auto-expire via expires_at timestamp
CREATE POLICY "Public can access demo sessions"
ON demo_sessions
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Additional security enforced at application level:
-- 1. Session expiry checked via expires_at
-- 2. Message limits enforced via max_messages
-- 3. Rate limiting on demo session creation
-- 4. No sensitive data stored in demo sessions
