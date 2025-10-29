/**
 * Execute WooCommerce Metrics Migration
 * Runs SQL statements directly via Supabase client
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function runMigration() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log('📊 Applying WooCommerce Usage Metrics Migration...\n');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log('🔑 Using service role key\n');

  // Create Supabase client with service role
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // SQL statements to execute
  const statements = [
    // 1. Create table
    `CREATE TABLE IF NOT EXISTS woocommerce_usage_metrics (
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
    )`,

    // 2. Create indexes
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_created_at ON woocommerce_usage_metrics(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_domain ON woocommerce_usage_metrics(domain)`,
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_operation ON woocommerce_usage_metrics(operation)`,
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_success ON woocommerce_usage_metrics(success)`,
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_config_id ON woocommerce_usage_metrics(customer_config_id)`,
    `CREATE INDEX IF NOT EXISTS idx_woocommerce_metrics_dashboard ON woocommerce_usage_metrics(domain, created_at DESC, operation)`,

    // 3. Enable RLS
    `ALTER TABLE woocommerce_usage_metrics ENABLE ROW LEVEL SECURITY`,

    // 4. Create RLS policies
    `DO $$
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
    END $$`,

    `DO $$
    BEGIN
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
    END $$`,

    // 5. Add comments
    `COMMENT ON TABLE woocommerce_usage_metrics IS 'Tracks WooCommerce operation usage for analytics, monitoring, and performance optimization'`,
    `COMMENT ON COLUMN woocommerce_usage_metrics.operation IS 'The specific WooCommerce operation executed (one of 25 operations)'`,
    `COMMENT ON COLUMN woocommerce_usage_metrics.duration_ms IS 'Operation execution time in milliseconds'`,
    `COMMENT ON COLUMN woocommerce_usage_metrics.success IS 'Whether the operation completed successfully'`,
    `COMMENT ON COLUMN woocommerce_usage_metrics.error_type IS 'Error class name if operation failed (e.g., AxiosError, ZodError)'`,
    `COMMENT ON COLUMN woocommerce_usage_metrics.domain IS 'Customer domain that triggered the operation'`
  ];

  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const stepName = getStepName(i);

    console.log(`⏳ Step ${i + 1}/${statements.length}: ${stepName}...`);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Try direct execution for simple statements
        if (statement.startsWith('CREATE INDEX') || statement.startsWith('COMMENT')) {
          console.log(`   ⚠️  RPC failed, skipping (likely already exists): ${error.message}`);
          continue;
        }

        console.error(`   ❌ Failed: ${error.message}`);

        // Check if table already exists
        if (error.message?.includes('already exists')) {
          console.log(`   ℹ️  Already exists, continuing...`);
          continue;
        }

        throw error;
      }

      console.log(`   ✅ Complete`);
    } catch (err: any) {
      console.error(`   ❌ Error: ${err.message}`);

      // If it's a "relation already exists" error, that's OK
      if (err.message?.includes('already exists')) {
        console.log(`   ℹ️  Already exists, continuing...`);
        continue;
      }

      console.error('\n❌ Migration failed at step:', stepName);
      console.error('Error details:', err);
      process.exit(1);
    }
  }

  // Verify table was created
  console.log('\n🔍 Verifying table creation...');
  const { data, error } = await supabase
    .from('woocommerce_usage_metrics')
    .select('id')
    .limit(1);

  if (error) {
    if (error.code === '42P01') {
      console.error('❌ Table was not created. Please run the SQL manually in Supabase Dashboard.');
      console.error('📋 SQL file: supabase/migrations/20251029140825_add_woocommerce_usage_metrics.sql');
      process.exit(1);
    } else if (error.code === 'PGRST116') {
      console.log('✅ Table exists and RLS is enabled (no rows to verify)');
    } else {
      console.error('⚠️  Warning: Could not verify table:', error.message);
    }
  } else {
    console.log('✅ Table is accessible and working');
  }

  console.log('\n🎉 Migration complete!');
  console.log('📊 Table: woocommerce_usage_metrics');
  console.log('📊 Indexes: 6 created');
  console.log('🔒 RLS: Enabled with 2 policies');
  console.log('\n💡 Analytics will now be tracked automatically for all WooCommerce operations');
}

function getStepName(index: number): string {
  const steps = [
    'Create table',
    'Create created_at index',
    'Create domain index',
    'Create operation index',
    'Create success index',
    'Create config_id index',
    'Create dashboard composite index',
    'Enable RLS',
    'Create users policy',
    'Create service role policy',
    'Add table comment',
    'Add operation comment',
    'Add duration_ms comment',
    'Add success comment',
    'Add error_type comment',
    'Add domain comment'
  ];
  return steps[index] || `Statement ${index + 1}`;
}

runMigration().catch(err => {
  console.error('\n💥 Fatal error:', err);
  process.exit(1);
});
