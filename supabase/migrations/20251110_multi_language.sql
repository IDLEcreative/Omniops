-- Multi-Language Support System Migration
-- Adds internationalization support for 40+ languages with automatic detection and translation

-- Add language columns to messages table
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS detected_language TEXT,
ADD COLUMN IF NOT EXISTS translated_content JSONB DEFAULT '{}';

-- Index for language-based queries
CREATE INDEX IF NOT EXISTS idx_messages_language
  ON messages(detected_language)
  WHERE detected_language IS NOT NULL;

-- Supported languages configuration per domain
CREATE TABLE IF NOT EXISTS supported_languages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (length(language_code) = 2 OR length(language_code) = 5), -- Support both ISO 639-1 and locale codes
  language_name TEXT NOT NULL,
  native_name TEXT, -- Language name in its own language
  is_rtl BOOLEAN DEFAULT FALSE, -- Right-to-left support
  enabled BOOLEAN DEFAULT TRUE,
  auto_translate BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for domain-language pairs
CREATE UNIQUE INDEX IF NOT EXISTS idx_supported_languages_domain_code
  ON supported_languages(domain_id, language_code);

-- Index for enabled languages
CREATE INDEX IF NOT EXISTS idx_supported_languages_enabled
  ON supported_languages(domain_id, enabled)
  WHERE enabled = TRUE;

-- Translation cache for performance
CREATE TABLE IF NOT EXISTS translation_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_text TEXT NOT NULL,
  source_text_hash TEXT NOT NULL, -- MD5 hash for faster lookups
  source_lang TEXT NOT NULL,
  target_lang TEXT NOT NULL,
  translated_text TEXT NOT NULL,
  model_used TEXT DEFAULT 'gpt-4',
  confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
  usage_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index for translation lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_translation_cache_lookup
  ON translation_cache(source_text_hash, source_lang, target_lang);

-- Index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_translation_cache_usage
  ON translation_cache(last_used_at, usage_count);

-- Language preferences per user/session
CREATE TABLE IF NOT EXISTS language_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  preferred_language TEXT NOT NULL,
  auto_detect BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unique constraint for session preferences
CREATE UNIQUE INDEX IF NOT EXISTS idx_language_preferences_session
  ON language_preferences(session_id, domain_id);

-- Enable Row Level Security
ALTER TABLE supported_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE translation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE language_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service role
CREATE POLICY "supported_languages_service" ON supported_languages
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "translation_cache_service" ON translation_cache
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "language_preferences_service" ON language_preferences
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_supported_languages_updated_at BEFORE UPDATE ON supported_languages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_language_preferences_updated_at BEFORE UPDATE ON language_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default supported languages for all existing domains
INSERT INTO supported_languages (domain_id, language_code, language_name, native_name, is_rtl)
SELECT
  d.id,
  lang.code,
  lang.name,
  lang.native_name,
  lang.is_rtl
FROM domains d
CROSS JOIN (VALUES
  ('en', 'English', 'English', false),
  ('es', 'Spanish', 'Español', false),
  ('fr', 'French', 'Français', false),
  ('de', 'German', 'Deutsch', false),
  ('it', 'Italian', 'Italiano', false),
  ('pt', 'Portuguese', 'Português', false),
  ('nl', 'Dutch', 'Nederlands', false),
  ('pl', 'Polish', 'Polski', false),
  ('ru', 'Russian', 'Русский', false),
  ('uk', 'Ukrainian', 'Українська', false),
  ('sv', 'Swedish', 'Svenska', false),
  ('da', 'Danish', 'Dansk', false),
  ('no', 'Norwegian', 'Norsk', false),
  ('fi', 'Finnish', 'Suomi', false),
  ('el', 'Greek', 'Ελληνικά', false),
  ('cs', 'Czech', 'Čeština', false),
  ('ro', 'Romanian', 'Română', false),
  ('hu', 'Hungarian', 'Magyar', false),
  ('zh', 'Chinese (Simplified)', '简体中文', false),
  ('zh-TW', 'Chinese (Traditional)', '繁體中文', false),
  ('ja', 'Japanese', '日本語', false),
  ('ko', 'Korean', '한국어', false),
  ('hi', 'Hindi', 'हिन्दी', false),
  ('th', 'Thai', 'ไทย', false),
  ('vi', 'Vietnamese', 'Tiếng Việt', false),
  ('id', 'Indonesian', 'Bahasa Indonesia', false),
  ('ms', 'Malay', 'Bahasa Melayu', false),
  ('tl', 'Tagalog', 'Tagalog', false),
  ('bn', 'Bengali', 'বাংলা', false),
  ('ta', 'Tamil', 'தமிழ்', false),
  ('te', 'Telugu', 'తెలుగు', false),
  ('mr', 'Marathi', 'मराठी', false),
  ('ar', 'Arabic', 'العربية', true),
  ('he', 'Hebrew', 'עברית', true),
  ('tr', 'Turkish', 'Türkçe', false),
  ('fa', 'Persian (Farsi)', 'فارسی', true),
  ('ur', 'Urdu', 'اردو', true),
  ('sw', 'Swahili', 'Kiswahili', false),
  ('af', 'Afrikaans', 'Afrikaans', false),
  ('pt-BR', 'Portuguese (Brazil)', 'Português (Brasil)', false),
  ('es-MX', 'Spanish (Latin America)', 'Español (Latinoamérica)', false)
) AS lang(code, name, native_name, is_rtl)
ON CONFLICT (domain_id, language_code) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE supported_languages IS 'Multi-language configuration per domain supporting 40+ languages';
COMMENT ON TABLE translation_cache IS 'Cache for translated text to improve performance and reduce API calls';
COMMENT ON TABLE language_preferences IS 'User/session language preferences for personalized experience';