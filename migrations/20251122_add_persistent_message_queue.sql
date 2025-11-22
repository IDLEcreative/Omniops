-- Migration: Add persistent message queue for offline message recovery
-- Created: 2025-11-22
-- Purpose: Store queued messages that couldn't be sent immediately, enabling recovery after page reload/crash

-- Create message_queue table for persistent message storage
CREATE TABLE IF NOT EXISTS public.message_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  message_data JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  processed_at TIMESTAMPTZ
);

-- Add indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_message_queue_customer_id ON public.message_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_session_id ON public.message_queue(session_id);
CREATE INDEX IF NOT EXISTS idx_message_queue_status ON public.message_queue(status) WHERE status IN ('pending', 'processing');
CREATE INDEX IF NOT EXISTS idx_message_queue_expires_at ON public.message_queue(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_message_queue_created_at ON public.message_queue(created_at);

-- Add updated_at trigger
CREATE TRIGGER update_message_queue_updated_at
  BEFORE UPDATE ON public.message_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies for multi-tenant isolation
ALTER TABLE public.message_queue ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own customer's queued messages
CREATE POLICY message_queue_select_policy ON public.message_queue
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE domain = current_setting('app.current_domain', true)
    )
  );

-- Policy: Users can insert their own queued messages
CREATE POLICY message_queue_insert_policy ON public.message_queue
  FOR INSERT
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE domain = current_setting('app.current_domain', true)
    )
  );

-- Policy: Users can update their own queued messages
CREATE POLICY message_queue_update_policy ON public.message_queue
  FOR UPDATE
  USING (
    customer_id IN (
      SELECT id FROM public.customers
      WHERE domain = current_setting('app.current_domain', true)
    )
  );

-- Policy: Service role can manage all queued messages (for cleanup cron)
CREATE POLICY message_queue_service_role_policy ON public.message_queue
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add comment
COMMENT ON TABLE public.message_queue IS 'Persistent storage for chat messages that couldn''t be sent immediately, enabling recovery after page reload or browser crash';

-- Create function to clean up expired messages
CREATE OR REPLACE FUNCTION cleanup_expired_message_queue()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.message_queue
  WHERE expires_at < NOW()
    AND status IN ('completed', 'failed');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_expired_message_queue IS 'Removes expired messages from the queue (completed/failed only)';
