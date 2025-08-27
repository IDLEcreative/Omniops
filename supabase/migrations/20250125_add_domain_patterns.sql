-- Create table for storing learned extraction patterns per domain
CREATE TABLE IF NOT EXISTS domain_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  domain TEXT NOT NULL UNIQUE,
  platform TEXT, -- e.g., 'woocommerce', 'shopify', 'magento'
  patterns JSONB DEFAULT '[]'::jsonb, -- Array of ExtractedPattern objects
  product_list_selectors TEXT[], -- Selectors that identify product listings
  pagination_selectors JSONB, -- Selectors for pagination elements
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success_rate REAL DEFAULT 1.0, -- Success rate of extractions (0-1)
  total_extractions INTEGER DEFAULT 0, -- Number of times patterns were used
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_domain_patterns_domain ON domain_patterns(domain);
CREATE INDEX idx_domain_patterns_platform ON domain_patterns(platform);
CREATE INDEX idx_domain_patterns_success_rate ON domain_patterns(success_rate DESC);

-- Add RLS policies
ALTER TABLE domain_patterns ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read patterns (for learning)
CREATE POLICY "Allow authenticated read" ON domain_patterns
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage patterns
CREATE POLICY "Allow service role all" ON domain_patterns
  FOR ALL USING (auth.role() = 'service_role');

-- Add trigger to update last_updated
CREATE OR REPLACE FUNCTION update_domain_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_domain_patterns_updated_at
  BEFORE UPDATE ON domain_patterns
  FOR EACH ROW
  EXECUTE FUNCTION update_domain_patterns_updated_at();

-- Insert some initial patterns for common platforms
INSERT INTO domain_patterns (domain, platform, patterns, success_rate, total_extractions)
VALUES
  -- WooCommerce pattern template
  ('woocommerce.template', 'woocommerce', '[
    {"selector": ".price .woocommerce-Price-amount", "fieldType": "price", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": "h1.product_title", "fieldType": "name", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": ".sku_wrapper .sku", "fieldType": "sku", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".woocommerce-product-gallery__image img", "attribute": "src", "fieldType": "image", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".stock", "fieldType": "availability", "confidence": 0.85, "extractionMethod": "dom"}
  ]'::jsonb, 0.9, 100),
  
  -- Shopify pattern template
  ('shopify.template', 'shopify', '[
    {"selector": ".product__price", "fieldType": "price", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": "h1.product__title", "fieldType": "name", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": ".product__sku", "fieldType": "sku", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".product__main-photos img", "attribute": "src", "fieldType": "image", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".product__inventory", "fieldType": "availability", "confidence": 0.85, "extractionMethod": "dom"}
  ]'::jsonb, 0.9, 100),
  
  -- Magento pattern template
  ('magento.template', 'magento', '[
    {"selector": ".price-box .price", "fieldType": "price", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": "h1.page-title", "fieldType": "name", "confidence": 0.95, "extractionMethod": "dom"},
    {"selector": ".product-info-sku .value", "fieldType": "sku", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".product-image-main img", "attribute": "src", "fieldType": "image", "confidence": 0.9, "extractionMethod": "dom"},
    {"selector": ".product-info-stock-sku .stock", "fieldType": "availability", "confidence": 0.85, "extractionMethod": "dom"}
  ]'::jsonb, 0.9, 100)
ON CONFLICT (domain) DO NOTHING;