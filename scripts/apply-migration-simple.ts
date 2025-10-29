/**
 * Apply WooCommerce Metrics Migration
 * Executes SQL statements directly via Supabase REST API
 */

import 'dotenv/config';

async function applyMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
  }

  console.log('📊 Applying WooCommerce Usage Metrics Migration...\n');

  const sql = `
-- Create table
CREATE TABLE IF NOT EXISTS woocommerce_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL CHECK (operation IN (
    'check_stock', 'get_stock_quantity', 'get_product_details', 'check_order',
    'get_shipping_info', 'get_shipping_methods', 'check_price', 'get_product_variations',
    'get_product_categories', 'get_product_reviews', 'validate_coupon', 'check_refund_status',
    'get_customer_orders', 'get_order_notes', 'get_payment_methods', 'get_customer_insights',
    'get_low_stock_products', 'get_sales_report', 'search_products', 'cancel_order',
    'add_to_cart', 'get_cart', 'remove_from_cart', 'update_cart_quantity', 'apply_coupon_to_cart'
  )),
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  success BOOLEAN NOT NULL DEFAULT false,
  error_type TEXT,
  error_message TEXT,
  domain TEXT NOT NULL,
  customer_config_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_created_at ON woocommerce_usage_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_domain ON woocommerce_usage_metrics(domain);
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_operation ON woocommerce_usage_metrics(operation);
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_success ON woocommerce_usage_metrics(success);
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_config_id ON woocommerce_usage_metrics(customer_config_id);
CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_dashboard ON woocommerce_usage_metrics(domain, created_at DESC, operation);

-- Enable RLS
ALTER TABLE woocommerce_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'woocommerce_usage_metrics'
    AND policyname = 'Users can view own domain metrics'
  ) THEN
    CREATE POLICY "Users can view own domain metrics"
      ON woocommerce_usage_metrics
      FOR SELECT
      USING (
        domain IN (
          SELECT domain FROM customer_configs
          WHERE customer_configs.id = (
            SELECT customer_config_id FROM user_profiles
            WHERE user_profiles.id = auth.uid()
          )
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'woocommerce_usage_metrics'
    AND policyname = 'Service role can insert metrics'
  ) THEN
    CREATE POLICY "Service role can insert metrics"
      ON woocommerce_usage_metrics
      FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
  `;

  console.log('📋 SQL to execute:');
  console.log('─'.repeat(80));
  console.log(sql);
  console.log('─'.repeat(80));
  console.log('\n⚠️  Supabase client cannot execute DDL statements directly.');
  console.log('📝 Please run this SQL in Supabase Dashboard:\n');
  console.log('1. Go to: Supabase Dashboard → SQL Editor');
  console.log('2. Create new query');
  console.log('3. Paste the SQL above');
  console.log('4. Click "Run"\n');
  console.log('Or copy from: supabase/migrations/20251029140825_add_woocommerce_usage_metrics.sql\n');
}

applyMigration();
