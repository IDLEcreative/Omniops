-- Add WooCommerce Usage Metrics Table
-- Tracks operation usage, performance, and errors for analytics and monitoring

CREATE TABLE IF NOT EXISTS woocommerce_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Operation details
  operation TEXT NOT NULL CHECK (operation IN (
    'check_stock', 'get_stock_quantity', 'get_product_details', 'check_order',
    'get_shipping_info', 'get_shipping_methods', 'check_price', 'get_product_variations',
    'get_product_categories', 'get_product_reviews', 'validate_coupon', 'check_refund_status',
    'get_customer_orders', 'get_order_notes', 'get_payment_methods', 'get_customer_insights',
    'get_low_stock_products', 'get_sales_report', 'search_products', 'cancel_order',
    'add_to_cart', 'get_cart', 'remove_from_cart', 'update_cart_quantity', 'apply_coupon_to_cart'
  )),

  -- Performance metrics
  duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
  success BOOLEAN NOT NULL DEFAULT false,
  error_type TEXT,
  error_message TEXT,

  -- Context
  domain TEXT NOT NULL,
  customer_config_id UUID REFERENCES customer_configs(id) ON DELETE CASCADE,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_woocommerce_metrics_created_at ON woocommerce_usage_metrics(created_at DESC);
CREATE INDEX idx_woocommerce_metrics_domain ON woocommerce_usage_metrics(domain);
CREATE INDEX idx_woocommerce_metrics_operation ON woocommerce_usage_metrics(operation);
CREATE INDEX idx_woocommerce_metrics_success ON woocommerce_usage_metrics(success);
CREATE INDEX idx_woocommerce_metrics_config_id ON woocommerce_usage_metrics(customer_config_id);

-- Composite index for dashboard queries (domain + date range + operation)
CREATE INDEX idx_woocommerce_metrics_dashboard ON woocommerce_usage_metrics(
  domain, created_at DESC, operation
);

-- Enable Row Level Security
ALTER TABLE woocommerce_usage_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see metrics for their own domains
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

-- RLS Policy: Service role can insert metrics (for tracking from API)
CREATE POLICY "Service role can insert metrics"
  ON woocommerce_usage_metrics
  FOR INSERT
  WITH CHECK (true); -- Service role only, enforced at application level

-- Add helpful comment
COMMENT ON TABLE woocommerce_usage_metrics IS 'Tracks WooCommerce operation usage for analytics, monitoring, and performance optimization';
COMMENT ON COLUMN woocommerce_usage_metrics.operation IS 'The specific WooCommerce operation executed (one of 25 operations)';
COMMENT ON COLUMN woocommerce_usage_metrics.duration_ms IS 'Operation execution time in milliseconds';
COMMENT ON COLUMN woocommerce_usage_metrics.success IS 'Whether the operation completed successfully';
COMMENT ON COLUMN woocommerce_usage_metrics.error_type IS 'Error class name if operation failed (e.g., AxiosError, ZodError)';
COMMENT ON COLUMN woocommerce_usage_metrics.domain IS 'Customer domain that triggered the operation';
