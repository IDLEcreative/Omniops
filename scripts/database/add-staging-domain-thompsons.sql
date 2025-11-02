-- Add Thompson's E-Parts staging domain to customer_configs
--
-- Purpose: Enable widget functionality on staging.wpengine.com
-- This allows the staging site to use the same widget configuration as production
--
-- Usage: Execute this in Supabase SQL Editor

-- Step 1: Verify production domain exists
SELECT
  id,
  domain,
  organization_id,
  business_name,
  active
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk';

-- Step 2: Add staging domain with same organization_id
-- This inherits all configuration from the production domain
INSERT INTO customer_configs (
  domain,
  organization_id,
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,
  rate_limit,
  allowed_origins,
  active,
  woocommerce_url,
  woocommerce_consumer_key,
  woocommerce_consumer_secret,
  shopify_shop,
  shopify_access_token
)
SELECT
  'epartstaging.wpengine.com' as domain,  -- New staging domain
  organization_id,                         -- Same organization
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,                   -- Share credentials
  rate_limit,
  allowed_origins,
  true as active,
  woocommerce_url,
  woocommerce_consumer_key,
  woocommerce_consumer_secret,
  shopify_shop,
  shopify_access_token
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk'
ON CONFLICT (domain) DO NOTHING;          -- Skip if already exists

-- Step 3: Also add www variant (optional but recommended)
INSERT INTO customer_configs (
  domain,
  organization_id,
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,
  rate_limit,
  allowed_origins,
  active,
  woocommerce_url,
  woocommerce_consumer_key,
  woocommerce_consumer_secret,
  shopify_shop,
  shopify_access_token
)
SELECT
  'www.epartstaging.wpengine.com' as domain,
  organization_id,
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,
  rate_limit,
  allowed_origins,
  true as active,
  woocommerce_url,
  woocommerce_consumer_key,
  woocommerce_consumer_secret,
  shopify_shop,
  shopify_access_token
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk'
ON CONFLICT (domain) DO NOTHING;

-- Step 4: Add to domains table (for lookupDomain function)
INSERT INTO domains (
  domain,
  name,
  description,
  organization_id,
  active
)
SELECT
  'epartstaging.wpengine.com' as domain,
  'Thompson''s E-Parts Staging' as name,
  'Staging environment for Thompson''s E-Parts' as description,
  organization_id,
  true as active
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk'
ON CONFLICT (domain) DO NOTHING;

-- Step 5: Verify all domains for Thompson's
SELECT
  domain,
  organization_id,
  business_name,
  active,
  created_at
FROM customer_configs
WHERE organization_id = (
  SELECT organization_id
  FROM customer_configs
  WHERE domain = 'thompsonseparts.co.uk'
)
ORDER BY domain;

-- Expected output from customer_configs:
-- epartstaging.wpengine.com     | uuid-123 | Thompson's E-Parts | true | <timestamp>
-- thompsonseparts.co.uk         | uuid-123 | Thompson's E-Parts | true | <timestamp>
-- www.epartstaging.wpengine.com | uuid-123 | Thompson's E-Parts | true | <timestamp>

-- Step 6: Verify domains table
SELECT
  domain,
  name,
  organization_id,
  active
FROM domains
WHERE organization_id = (
  SELECT organization_id
  FROM customer_configs
  WHERE domain = 'thompsonseparts.co.uk'
)
ORDER BY domain;

-- Expected output from domains:
-- epartstaging.wpengine.com | Thompson's E-Parts Staging | uuid-123 | true
-- thompsonseparts.co.uk     | Thompson's E-Parts         | uuid-123 | true
