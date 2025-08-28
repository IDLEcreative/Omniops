-- Add owned_domains field to customer_configs table
-- This allows customers to specify their own domains for optimized scraping

ALTER TABLE customer_configs 
ADD COLUMN owned_domains TEXT[] DEFAULT '{}';

-- Add comment explaining the field
COMMENT ON COLUMN customer_configs.owned_domains IS 'Array of domains owned by the customer for optimized scraping speeds';

-- Example: {'example.com', 'docs.example.com', 'shop.example.com'}