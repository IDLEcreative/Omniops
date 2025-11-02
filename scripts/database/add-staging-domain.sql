-- Add Thompson's Staging Domain to Their Account
--
-- Purpose: Enable multi-domain support by adding epartstaging.wpengine.com
-- to Thompson's account. This allows the same widget embed code to work
-- on both production and staging sites.
--
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: Find Thompson's production config (for reference)
SELECT
  id,
  domain,
  organization_id,
  business_name,
  app_id,
  primary_color,
  welcome_message,
  active
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk';

-- Step 2: Insert staging domain with same organization_id
-- This creates a separate customer_configs entry for staging that inherits
-- Thompson's organization settings
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
  created_at,
  updated_at
)
SELECT
  'epartstaging.wpengine.com' as domain,  -- Staging domain
  organization_id,                         -- Same organization as production
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,                   -- Share credentials with production
  rate_limit,
  allowed_origins,
  true as active,                          -- Activate staging domain
  NOW() as created_at,
  NOW() as updated_at
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk'
ON CONFLICT (domain) DO NOTHING;          -- Skip if staging already exists

-- Step 3: Verify both domains are registered
SELECT
  domain,
  organization_id,
  business_name,
  app_id,
  active
FROM customer_configs
WHERE organization_id = (
  SELECT organization_id
  FROM customer_configs
  WHERE domain = 'thompsonseparts.co.uk'
)
ORDER BY domain;

-- Expected Result: You should see two rows:
-- 1. epartstaging.wpengine.com (staging)
-- 2. thompsonseparts.co.uk (production)
-- Both with the same organization_id
