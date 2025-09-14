-- Create table for storing domain-specific query enhancement configurations
-- This allows each customer/store to have their own learned patterns and synonyms

CREATE TABLE IF NOT EXISTS query_enhancement_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  
  -- Learned synonyms (e.g., {"sneakers": ["trainers", "tennis shoes"], "laptop": ["notebook", "computer"]})
  synonyms JSONB DEFAULT '{}',
  
  -- Problem-to-solution mappings specific to the domain
  -- For electronics: {"screen broken": ["replacement screen", "display panel"]}
  -- For clothing: {"too small": ["size up", "larger size"]}
  problem_solutions JSONB DEFAULT '{}',
  
  -- Common search patterns for this domain
  common_patterns JSONB DEFAULT '{}',
  
  -- Learned brand names from products
  learned_brands TEXT[] DEFAULT '{}',
  
  -- Learned category terms
  learned_categories TEXT[] DEFAULT '{}',
  
  -- Statistics about the learning
  total_products_analyzed INTEGER DEFAULT 0,
  last_learning_run TIMESTAMP WITH TIME ZONE,
  
  -- Configuration settings
  auto_learn_enabled BOOLEAN DEFAULT true,
  min_confidence_threshold DECIMAL(3,2) DEFAULT 0.3,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast domain lookups
CREATE INDEX idx_query_enhancement_domain ON query_enhancement_config(domain);

-- Function to automatically learn from new products
CREATE OR REPLACE FUNCTION update_query_enhancement_on_scrape()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark domain for re-learning when new products are added
  IF NEW.type = 'product' THEN
    UPDATE query_enhancement_config
    SET updated_at = NOW()
    WHERE domain = NEW.domain;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to learn from new scraped content
CREATE TRIGGER trigger_query_enhancement_learning
AFTER INSERT ON scraped_pages
FOR EACH ROW
EXECUTE FUNCTION update_query_enhancement_on_scrape();

-- Example: How different stores would use this
COMMENT ON TABLE query_enhancement_config IS 'Stores domain-specific query enhancement patterns. 
Examples:
- Electronics store: learns "phone" ↔ "mobile", "laptop" ↔ "notebook"
- Clothing store: learns "sneakers" ↔ "trainers", "jumper" ↔ "sweater"  
- Auto parts: learns "motor" ↔ "engine", "windscreen" ↔ "windshield"
Each domain learns from its own product catalog automatically.';