-- Add Shopify integration support to customer_configs
-- This migration adds Shopify fields similar to the existing WooCommerce integration

-- Add Shopify configuration fields to customer_configs table
ALTER TABLE customer_configs
ADD COLUMN IF NOT EXISTS shopify_shop TEXT,
ADD COLUMN IF NOT EXISTS shopify_access_token TEXT;

-- Add index for Shopify-enabled customers (for performance)
CREATE INDEX IF NOT EXISTS idx_customer_configs_shopify_enabled
ON customer_configs(domain)
WHERE shopify_shop IS NOT NULL AND shopify_access_token IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN customer_configs.shopify_shop IS 'Shopify store domain (e.g., mystore.myshopify.com) - stored in plain text';
COMMENT ON COLUMN customer_configs.shopify_access_token IS 'Encrypted Shopify Admin API access token (AES-256-GCM encrypted)';

-- Performance index for composite lookups
COMMENT ON INDEX idx_customer_configs_shopify_enabled IS 'Performance: Quick lookup for Shopify-enabled customers';
