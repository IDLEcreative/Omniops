-- Register Thompson's staging domain for widget testing
-- This allows the staging site to use the chat widget

-- Check if staging domain exists
DO $$
BEGIN
  -- Only insert if the staging domain doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM customer_configs
    WHERE domain = 'epartstaging.wpengine.com'
  ) THEN
    -- Copy configuration from production domain
    INSERT INTO customer_configs (
      domain,
      organization_id,
      credentials,
      features,
      woocommerce_api_url,
      woocommerce_enabled,
      created_at,
      updated_at,
      branding,
      website_url,
      max_pages_to_scrape,
      chat_settings,
      wordpress_site_url,
      wordpress_enabled,
      ai_settings
    )
    SELECT
      'epartstaging.wpengine.com' as domain,  -- Staging domain
      organization_id,
      credentials,
      features,
      woocommerce_api_url,
      woocommerce_enabled,
      NOW() as created_at,
      NOW() as updated_at,
      branding,
      'https://epartstaging.wpengine.com' as website_url,  -- Staging URL
      max_pages_to_scrape,
      chat_settings,
      'https://epartstaging.wpengine.com' as wordpress_site_url,  -- Staging URL
      wordpress_enabled,
      ai_settings
    FROM customer_configs
    WHERE domain IN ('thompsonseparts.co.uk', 'www.thompsonseparts.co.uk')
    LIMIT 1;

    RAISE NOTICE 'Thompson staging domain registered successfully';
  ELSE
    RAISE NOTICE 'Thompson staging domain already exists';
  END IF;
END $$;

-- Verify the registration
SELECT
  id,
  domain,
  website_url,
  woocommerce_enabled,
  created_at
FROM customer_configs
WHERE domain = 'epartstaging.wpengine.com';