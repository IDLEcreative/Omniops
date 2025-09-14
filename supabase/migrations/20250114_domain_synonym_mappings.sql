-- Create domain-specific synonym mappings table
CREATE TABLE IF NOT EXISTS domain_synonym_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID NOT NULL REFERENCES customer_configs(id) ON DELETE CASCADE,
  term VARCHAR(255) NOT NULL,
  synonyms JSONB NOT NULL DEFAULT '[]',
  is_bidirectional BOOLEAN DEFAULT true,
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique term per domain
  UNIQUE(domain_id, term)
);

-- Create index for fast lookups
CREATE INDEX idx_domain_synonyms_lookup ON domain_synonym_mappings(domain_id, term);
CREATE INDEX idx_domain_synonyms_reverse ON domain_synonym_mappings USING gin(synonyms);

-- Create global synonyms table for generic terms
CREATE TABLE IF NOT EXISTS global_synonym_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term VARCHAR(255) NOT NULL UNIQUE,
  synonyms JSONB NOT NULL DEFAULT '[]',
  category VARCHAR(100), -- 'generic', 'technical', 'action', etc.
  is_safe_for_all BOOLEAN DEFAULT true, -- false for industry-specific
  weight FLOAT DEFAULT 0.8, -- Lower weight than domain-specific
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for global synonyms
CREATE INDEX idx_global_synonyms_term ON global_synonym_mappings(term);
CREATE INDEX idx_global_synonyms_category ON global_synonym_mappings(category);

-- Insert ONLY safe, generic synonyms that work across all domains
INSERT INTO global_synonym_mappings (term, synonyms, category, is_safe_for_all) VALUES
  -- Generic action words
  ('buy', '["purchase", "order", "get", "acquire"]', 'action', true),
  ('need', '["require", "want", "looking for"]', 'action', true),
  ('find', '["search", "locate", "looking for"]', 'action', true),
  ('compatible', '["fits", "works with", "suitable for"]', 'compatibility', true),
  
  -- Generic conditions
  ('new', '["brand new", "unused", "factory new"]', 'condition', true),
  ('used', '["second hand", "pre-owned", "refurbished"]', 'condition', true),
  ('broken', '["damaged", "faulty", "defective", "not working"]', 'condition', true),
  
  -- Generic size terms
  ('small', '["little", "compact", "mini"]', 'size', true),
  ('large', '["big", "huge", "oversized"]', 'size', true),
  ('size', '["dimension", "measurement", "spec"]', 'specification', true),
  
  -- Generic queries
  ('price', '["cost", "how much", "pricing"]', 'query', true),
  ('available', '["in stock", "availability", "ready"]', 'query', true),
  ('warranty', '["guarantee", "coverage", "protection"]', 'query', true),
  ('shipping', '["delivery", "freight", "postage"]', 'query', true),
  ('return', '["refund", "exchange", "send back"]', 'query', true),
  
  -- Generic replacements  
  ('replace', '["change", "swap", "substitute", "renew"]', 'action', true),
  ('repair', '["fix", "mend", "restore", "service"]', 'action', true),
  ('install', '["setup", "mount", "fit", "attach"]', 'action', true)
ON CONFLICT (term) DO NOTHING;

-- Function to get combined synonyms for a domain
CREATE OR REPLACE FUNCTION get_domain_synonyms(
  p_domain_id UUID,
  p_term VARCHAR(255)
)
RETURNS JSONB AS $$
DECLARE
  domain_synonyms JSONB;
  global_synonyms JSONB;
  combined JSONB;
BEGIN
  -- Get domain-specific synonyms
  SELECT synonyms INTO domain_synonyms
  FROM domain_synonym_mappings
  WHERE domain_id = p_domain_id 
    AND LOWER(term) = LOWER(p_term);
  
  -- Get global synonyms if safe for all
  SELECT synonyms INTO global_synonyms
  FROM global_synonym_mappings
  WHERE LOWER(term) = LOWER(p_term)
    AND is_safe_for_all = true;
  
  -- Combine both, with domain-specific taking precedence
  IF domain_synonyms IS NOT NULL AND global_synonyms IS NOT NULL THEN
    combined := domain_synonyms || global_synonyms;
  ELSIF domain_synonyms IS NOT NULL THEN
    combined := domain_synonyms;
  ELSIF global_synonyms IS NOT NULL THEN
    combined := global_synonyms;
  ELSE
    combined := '[]'::jsonb;
  END IF;
  
  RETURN combined;
END;
$$ LANGUAGE plpgsql;

-- Function to learn synonyms from successful queries
CREATE OR REPLACE FUNCTION learn_domain_synonym(
  p_domain_id UUID,
  p_original_term VARCHAR(255),
  p_matched_term VARCHAR(255),
  p_confidence FLOAT DEFAULT 0.5
)
RETURNS VOID AS $$
BEGIN
  -- Add to domain-specific synonyms if confidence is high enough
  IF p_confidence >= 0.7 THEN
    INSERT INTO domain_synonym_mappings (domain_id, term, synonyms, weight)
    VALUES (p_domain_id, p_original_term, jsonb_build_array(p_matched_term), p_confidence)
    ON CONFLICT (domain_id, term) DO UPDATE
    SET synonyms = CASE
      WHEN NOT domain_synonym_mappings.synonyms @> jsonb_build_array(p_matched_term)
      THEN domain_synonym_mappings.synonyms || jsonb_build_array(p_matched_term)
      ELSE domain_synonym_mappings.synonyms
    END,
    updated_at = NOW();
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE domain_synonym_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_synonym_mappings ENABLE ROW LEVEL SECURITY;

-- Service role can manage all synonyms
CREATE POLICY "Service role full access to domain synonyms" ON domain_synonym_mappings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role full access to global synonyms" ON global_synonym_mappings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Regular users can read global synonyms
CREATE POLICY "Anyone can read safe global synonyms" ON global_synonym_mappings
  FOR SELECT USING (is_safe_for_all = true);

COMMENT ON TABLE domain_synonym_mappings IS 'Domain-specific synonym mappings for query expansion';
COMMENT ON TABLE global_synonym_mappings IS 'Safe, generic synonyms that apply across all domains';
COMMENT ON FUNCTION get_domain_synonyms IS 'Get combined domain and global synonyms for a term';
COMMENT ON FUNCTION learn_domain_synonym IS 'Learn new synonyms from successful query matches';