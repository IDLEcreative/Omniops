-- Multi-Language Support Migration
-- Supports 40+ languages with translation caching and RTL support

-- Translation cache table for performance
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  source_language TEXT NOT NULL DEFAULT 'en',
  target_language TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_translation_cache_lookup
  ON translation_cache(source_language, target_language, source_text);

CREATE INDEX IF NOT EXISTS idx_translation_cache_target
  ON translation_cache(target_language);

CREATE INDEX IF NOT EXISTS idx_translation_cache_created
  ON translation_cache(created_at DESC);

-- User language preferences
CREATE TABLE IF NOT EXISTS user_language_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  session_id TEXT,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  detected_language TEXT,
  auto_detect BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_user_language UNIQUE (user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_user_lang_user ON user_language_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lang_session ON user_language_preferences(session_id);
CREATE INDEX IF NOT EXISTS idx_user_lang_conversation ON user_language_preferences(conversation_id);

-- Domain language configuration
ALTER TABLE domains
  ADD COLUMN IF NOT EXISTS default_language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS supported_languages TEXT[] DEFAULT ARRAY['en'],
  ADD COLUMN IF NOT EXISTS enable_translation BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS rtl_enabled BOOLEAN DEFAULT false;

-- Translation statistics for analytics
CREATE TABLE IF NOT EXISTS translation_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  source_language TEXT NOT NULL,
  target_language TEXT NOT NULL,
  translation_count INT DEFAULT 1,
  total_characters INT DEFAULT 0,
  cache_hits INT DEFAULT 0,
  cache_misses INT DEFAULT 0,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_translation_stat UNIQUE (domain_id, source_language, target_language, date)
);

CREATE INDEX IF NOT EXISTS idx_translation_stats_domain
  ON translation_statistics(domain_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_translation_stats_langs
  ON translation_statistics(source_language, target_language);

-- Function to get translation from cache or mark as miss
CREATE OR REPLACE FUNCTION get_cached_translation(
  p_source_text TEXT,
  p_source_lang TEXT,
  p_target_lang TEXT
) RETURNS TEXT AS $$
DECLARE
  v_translation TEXT;
BEGIN
  SELECT translated_text INTO v_translation
  FROM translation_cache
  WHERE source_text = p_source_text
    AND source_language = p_source_lang
    AND target_language = p_target_lang
  LIMIT 1;

  RETURN v_translation;
END;
$$ LANGUAGE plpgsql;

-- Function to save translation to cache
CREATE OR REPLACE FUNCTION cache_translation(
  p_source_text TEXT,
  p_source_lang TEXT,
  p_target_lang TEXT,
  p_translated_text TEXT,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO translation_cache (
    source_text,
    source_language,
    target_language,
    translated_text,
    metadata
  ) VALUES (
    p_source_text,
    p_source_lang,
    p_target_lang,
    p_translated_text,
    p_metadata
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT ON translation_cache TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_language_preferences TO authenticated;
GRANT SELECT ON translation_statistics TO authenticated;

-- RLS Policies
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_statistics ENABLE ROW LEVEL SECURITY;

-- Translation cache is public (no sensitive data)
CREATE POLICY translation_cache_select ON translation_cache
  FOR SELECT USING (true);

CREATE POLICY translation_cache_insert ON translation_cache
  FOR INSERT WITH CHECK (true);

-- User preferences scoped to user/session
CREATE POLICY user_lang_select ON user_language_preferences
  FOR SELECT USING (
    user_id = current_setting('app.user_id', true)
    OR session_id = current_setting('app.session_id', true)
  );

CREATE POLICY user_lang_insert ON user_language_preferences
  FOR INSERT WITH CHECK (
    user_id = current_setting('app.user_id', true)
    OR session_id = current_setting('app.session_id', true)
  );

CREATE POLICY user_lang_update ON user_language_preferences
  FOR UPDATE USING (
    user_id = current_setting('app.user_id', true)
    OR session_id = current_setting('app.session_id', true)
  );

-- Translation stats visible to domain owners only
CREATE POLICY translation_stats_select ON translation_statistics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM domains
      WHERE domains.id = translation_statistics.domain_id
        AND domains.customer_id IN (
          SELECT customer_id FROM customer_users
          WHERE user_id = auth.uid()
        )
    )
  );

COMMENT ON TABLE translation_cache IS 'Caches GPT-4 translations for performance';
COMMENT ON TABLE user_language_preferences IS 'Stores user language preferences and auto-detection settings';
COMMENT ON TABLE translation_statistics IS 'Tracks translation usage for analytics and billing';
