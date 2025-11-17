-- Instagram Messenger Integration
-- Adds OAuth-based Instagram Business account integration

-- Create instagram_credentials table for OAuth credentials
CREATE TABLE IF NOT EXISTS instagram_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,

  -- OAuth credentials (encrypted)
  encrypted_access_token TEXT NOT NULL,
  encrypted_page_id TEXT NOT NULL,
  encrypted_instagram_account_id TEXT NOT NULL,

  -- Instagram account info
  instagram_username TEXT,
  instagram_name TEXT,

  -- Token management
  access_token_expires_at TIMESTAMPTZ,
  refresh_token TEXT, -- For long-lived tokens
  scopes TEXT[], -- Approved permissions

  -- Webhook configuration
  webhook_verify_token TEXT NOT NULL,
  is_webhook_active BOOLEAN DEFAULT false,

  -- Status tracking
  is_active BOOLEAN DEFAULT true,
  last_webhook_at TIMESTAMPTZ,
  last_message_at TIMESTAMPTZ,

  -- OAuth metadata
  oauth_state TEXT, -- CSRF protection
  oauth_completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(customer_id) -- One Instagram account per customer
);

-- Indexes for instagram_credentials
CREATE INDEX idx_instagram_credentials_customer ON instagram_credentials(customer_id);
CREATE INDEX idx_instagram_credentials_active ON instagram_credentials(is_active);
CREATE INDEX idx_instagram_credentials_username ON instagram_credentials(instagram_username);

-- Add multi-channel support to conversations table
DO $$
BEGIN
  -- Add channel column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'channel'
  ) THEN
    ALTER TABLE conversations
    ADD COLUMN channel VARCHAR(50) DEFAULT 'widget'
      CHECK (channel IN ('widget', 'instagram', 'whatsapp', 'facebook'));
  END IF;

  -- Add external_conversation_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'external_conversation_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN external_conversation_id TEXT;
  END IF;

  -- Add external_user_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'external_user_id'
  ) THEN
    ALTER TABLE conversations ADD COLUMN external_user_id TEXT;
  END IF;

  -- Add external_username column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'external_username'
  ) THEN
    ALTER TABLE conversations ADD COLUMN external_username TEXT;
  END IF;
END $$;

-- Indexes for conversations multi-channel support
CREATE INDEX IF NOT EXISTS idx_conversations_channel ON conversations(channel);
CREATE INDEX IF NOT EXISTS idx_conversations_external_id ON conversations(external_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_external_user ON conversations(external_user_id);

-- Add external message tracking to messages table
DO $$
BEGIN
  -- Add external_message_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'external_message_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN external_message_id TEXT;
  END IF;

  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE messages ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Index for external message tracking
CREATE INDEX IF NOT EXISTS idx_messages_external_id ON messages(external_message_id);

-- Enable Row Level Security
ALTER TABLE instagram_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Customers can only access their own Instagram credentials
CREATE POLICY instagram_credentials_customer_isolation ON instagram_credentials
  FOR ALL
  USING (customer_id = current_setting('app.current_customer_id')::uuid);

-- Comments for documentation
COMMENT ON TABLE instagram_credentials IS 'OAuth credentials for Instagram Business accounts';
COMMENT ON COLUMN instagram_credentials.encrypted_access_token IS 'AES-256 encrypted Instagram access token (60-day validity)';
COMMENT ON COLUMN instagram_credentials.oauth_state IS 'CSRF protection token for OAuth flow (cleared after completion)';
COMMENT ON COLUMN instagram_credentials.webhook_verify_token IS 'Token for verifying Instagram webhook requests from Meta';
COMMENT ON COLUMN conversations.channel IS 'Communication channel: widget (default), instagram, whatsapp, facebook';
COMMENT ON COLUMN conversations.external_conversation_id IS 'External platform conversation/thread ID';
COMMENT ON COLUMN conversations.external_user_id IS 'External platform user ID (e.g., Instagram sender ID)';
COMMENT ON COLUMN messages.external_message_id IS 'External platform message ID for tracking';
COMMENT ON COLUMN messages.metadata IS 'Channel-specific metadata (e.g., source: instagram)';
