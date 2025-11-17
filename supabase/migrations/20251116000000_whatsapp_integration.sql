-- WhatsApp Business Integration Schema
-- Last Updated: 2025-11-16
-- Purpose: Add WhatsApp channel support with OAuth-based authentication

-- ============================================================================
-- 1. Extend customer_configs for WhatsApp
-- ============================================================================

ALTER TABLE customer_configs
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_provider TEXT DEFAULT 'meta', -- 'meta' | 'twilio'
  ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_oauth_connected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS whatsapp_oauth_scopes TEXT[];

-- Add WhatsApp credentials to encrypted_credentials JSONB
-- Structure: { whatsapp: { access_token: string, refresh_token?: string } }

COMMENT ON COLUMN customer_configs.whatsapp_phone_number IS
  'WhatsApp phone number in international format (+1234567890)';
COMMENT ON COLUMN customer_configs.whatsapp_phone_number_id IS
  'Meta Cloud API phone number ID';
COMMENT ON COLUMN customer_configs.whatsapp_business_account_id IS
  'WhatsApp Business Account ID (WABA)';
COMMENT ON COLUMN customer_configs.whatsapp_provider IS
  'WhatsApp provider: meta (Cloud API) or twilio';
COMMENT ON COLUMN customer_configs.whatsapp_oauth_connected_at IS
  'Timestamp when customer connected WhatsApp via OAuth';
COMMENT ON COLUMN customer_configs.whatsapp_oauth_scopes IS
  'OAuth scopes granted during connection';

-- ============================================================================
-- 2. Extend conversations for multi-channel support
-- ============================================================================

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'web',
  ADD COLUMN IF NOT EXISTS channel_metadata JSONB,
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- Add constraint for channel types
ALTER TABLE conversations
  ADD CONSTRAINT conversations_channel_check
  CHECK (channel IN ('web', 'whatsapp', 'email', 'sms', 'instagram', 'messenger'));

-- Index for fast channel-based queries
CREATE INDEX IF NOT EXISTS idx_conversations_channel
  ON conversations(channel);

CREATE INDEX IF NOT EXISTS idx_conversations_external_id
  ON conversations(external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN conversations.channel IS
  'Communication channel: web, whatsapp, email, sms, instagram, messenger';
COMMENT ON COLUMN conversations.channel_metadata IS
  'Channel-specific metadata (e.g., { whatsapp: { phone_number: "+123", waba_id: "456" } })';
COMMENT ON COLUMN conversations.external_id IS
  'External conversation ID for mapping (e.g., WhatsApp conversation ID)';

-- ============================================================================
-- 3. Extend messages for delivery tracking and media
-- ============================================================================

ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent',
  ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS media_metadata JSONB;

-- Add constraint for message status
ALTER TABLE messages
  ADD CONSTRAINT messages_status_check
  CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending'));

-- Add constraint for media types
ALTER TABLE messages
  ADD CONSTRAINT messages_media_type_check
  CHECK (media_type IN ('text', 'image', 'document', 'audio', 'video', 'sticker', 'location', 'contact'));

-- Index for status tracking
CREATE INDEX IF NOT EXISTS idx_messages_status
  ON messages(status);

CREATE INDEX IF NOT EXISTS idx_messages_external_id
  ON messages(external_id)
  WHERE external_id IS NOT NULL;

COMMENT ON COLUMN messages.external_id IS
  'External message ID (e.g., WhatsApp WAMID: wamid.ABC123...)';
COMMENT ON COLUMN messages.status IS
  'Message delivery status: sent, delivered, read, failed, pending';
COMMENT ON COLUMN messages.media_type IS
  'Type of message content: text, image, document, audio, video, sticker, location, contact';
COMMENT ON COLUMN messages.media_url IS
  'URL to stored media file (S3/CDN)';
COMMENT ON COLUMN messages.media_metadata IS
  'Media-specific metadata (e.g., { filename: "doc.pdf", size_bytes: 1234, mime_type: "application/pdf" })';

-- ============================================================================
-- 4. Create whatsapp_templates table
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_config_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  template_id TEXT NOT NULL, -- WhatsApp template ID
  category TEXT NOT NULL, -- 'marketing' | 'utility' | 'authentication'
  language TEXT NOT NULL, -- 'en', 'es', 'fr', etc.
  status TEXT NOT NULL, -- 'approved' | 'pending' | 'rejected'
  components JSONB NOT NULL, -- Template structure (header, body, footer, buttons)
  variables TEXT[], -- List of variable names in template
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_config_id, template_name, language)
);

-- Add constraint for template category
ALTER TABLE whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_category_check
  CHECK (category IN ('marketing', 'utility', 'authentication'));

-- Add constraint for template status
ALTER TABLE whatsapp_templates
  ADD CONSTRAINT whatsapp_templates_status_check
  CHECK (status IN ('approved', 'pending', 'rejected', 'paused', 'disabled'));

-- Indexes for template queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_customer
  ON whatsapp_templates(customer_config_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status
  ON whatsapp_templates(status)
  WHERE status = 'approved';

COMMENT ON TABLE whatsapp_templates IS
  'WhatsApp message templates for business-initiated conversations';
COMMENT ON COLUMN whatsapp_templates.template_name IS
  'User-friendly template name (e.g., "order_confirmation")';
COMMENT ON COLUMN whatsapp_templates.template_id IS
  'WhatsApp-assigned template ID';
COMMENT ON COLUMN whatsapp_templates.category IS
  'Template category: marketing, utility, authentication';
COMMENT ON COLUMN whatsapp_templates.components IS
  'Template structure: { header, body, footer, buttons }';
COMMENT ON COLUMN whatsapp_templates.variables IS
  'List of variable placeholders (e.g., ["customer_name", "order_id"])';

-- ============================================================================
-- 5. Create whatsapp_sessions table (24-hour window tracking)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  session_start TIMESTAMPTZ NOT NULL,
  session_expires TIMESTAMPTZ NOT NULL, -- 24 hours from last user message
  last_user_message_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for session queries
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_conversation
  ON whatsapp_sessions(conversation_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_phone
  ON whatsapp_sessions(phone_number);

CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_active
  ON whatsapp_sessions(is_active, session_expires)
  WHERE is_active = TRUE;

COMMENT ON TABLE whatsapp_sessions IS
  'Tracks 24-hour messaging windows for WhatsApp conversations';
COMMENT ON COLUMN whatsapp_sessions.session_expires IS
  '24 hours from last user message - free-form messaging allowed before expiry';
COMMENT ON COLUMN whatsapp_sessions.last_user_message_at IS
  'Timestamp of most recent user message (used to extend session)';

-- ============================================================================
-- 6. Create whatsapp_webhooks table (for debugging and retry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_type TEXT NOT NULL, -- 'message' | 'status' | 'template_status'
  payload JSONB NOT NULL,
  signature TEXT,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for webhook processing
CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_processed
  ON whatsapp_webhooks(processed, created_at);

CREATE INDEX IF NOT EXISTS idx_whatsapp_webhooks_type
  ON whatsapp_webhooks(webhook_type);

COMMENT ON TABLE whatsapp_webhooks IS
  'Stores all incoming WhatsApp webhooks for debugging, retry, and audit';
COMMENT ON COLUMN whatsapp_webhooks.webhook_type IS
  'Type of webhook: message, status, template_status';
COMMENT ON COLUMN whatsapp_webhooks.payload IS
  'Full webhook payload from WhatsApp/Twilio';
COMMENT ON COLUMN whatsapp_webhooks.retry_count IS
  'Number of processing retry attempts';

-- ============================================================================
-- 7. Create whatsapp_oauth_tokens table (OAuth refresh tokens)
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_config_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'meta' | 'twilio'
  access_token_encrypted TEXT NOT NULL, -- Encrypted with AES-256
  refresh_token_encrypted TEXT, -- Encrypted with AES-256
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  token_metadata JSONB, -- Provider-specific metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(customer_config_id, provider)
);

-- Index for token refresh
CREATE INDEX IF NOT EXISTS idx_whatsapp_oauth_tokens_expiry
  ON whatsapp_oauth_tokens(expires_at)
  WHERE expires_at IS NOT NULL;

COMMENT ON TABLE whatsapp_oauth_tokens IS
  'Stores OAuth tokens for WhatsApp providers (encrypted)';
COMMENT ON COLUMN whatsapp_oauth_tokens.access_token_encrypted IS
  'AES-256 encrypted access token';
COMMENT ON COLUMN whatsapp_oauth_tokens.refresh_token_encrypted IS
  'AES-256 encrypted refresh token (for automatic renewal)';

-- ============================================================================
-- 8. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_oauth_tokens ENABLE ROW LEVEL SECURITY;

-- Templates: customers can only access their own templates
CREATE POLICY "Customers can view own templates" ON whatsapp_templates
  FOR SELECT USING (
    customer_config_id IN (
      SELECT id FROM customer_configs WHERE domain_id = auth.uid()
    )
  );

CREATE POLICY "Customers can manage own templates" ON whatsapp_templates
  FOR ALL USING (
    customer_config_id IN (
      SELECT id FROM customer_configs WHERE domain_id = auth.uid()
    )
  );

-- Sessions: customers can only access their own sessions
CREATE POLICY "Customers can view own sessions" ON whatsapp_sessions
  FOR SELECT USING (
    conversation_id IN (
      SELECT c.id FROM conversations c
      JOIN domains d ON c.domain_id = d.id
      WHERE d.id = auth.uid()
    )
  );

-- Webhooks: service role only (internal processing)
CREATE POLICY "Service role can manage webhooks" ON whatsapp_webhooks
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- OAuth tokens: service role only (sensitive data)
CREATE POLICY "Service role can manage oauth tokens" ON whatsapp_oauth_tokens
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 9. Functions for session management
-- ============================================================================

-- Function to check if session is active
CREATE OR REPLACE FUNCTION is_whatsapp_session_active(p_conversation_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM whatsapp_sessions
    WHERE conversation_id = p_conversation_id
      AND is_active = TRUE
      AND session_expires > NOW()
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_whatsapp_session_active IS
  'Check if a WhatsApp conversation has an active 24-hour session';

-- Function to extend session (on user message)
CREATE OR REPLACE FUNCTION extend_whatsapp_session(
  p_conversation_id UUID,
  p_phone_number TEXT
)
RETURNS whatsapp_sessions AS $$
DECLARE
  v_session whatsapp_sessions;
BEGIN
  -- Upsert session: extend if exists, create if not
  INSERT INTO whatsapp_sessions (
    conversation_id,
    phone_number,
    session_start,
    session_expires,
    last_user_message_at,
    is_active
  ) VALUES (
    p_conversation_id,
    p_phone_number,
    NOW(),
    NOW() + INTERVAL '24 hours',
    NOW(),
    TRUE
  )
  ON CONFLICT (conversation_id) DO UPDATE
  SET
    session_expires = NOW() + INTERVAL '24 hours',
    last_user_message_at = NOW(),
    is_active = TRUE,
    updated_at = NOW()
  RETURNING * INTO v_session;

  RETURN v_session;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION extend_whatsapp_session IS
  'Extend or create WhatsApp session when user sends message';

-- ============================================================================
-- 10. Add unique constraint for conversation_id in whatsapp_sessions
-- ============================================================================

-- One session per conversation
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_sessions_conversation_unique
  ON whatsapp_sessions(conversation_id);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON whatsapp_templates TO authenticated;
GRANT SELECT ON whatsapp_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON whatsapp_webhooks TO service_role;
GRANT SELECT, INSERT, UPDATE ON whatsapp_oauth_tokens TO service_role;
