-- Cart Analytics Tracking
-- Tracks all cart operations for monitoring and optimization

-- Cart operations log table
CREATE TABLE IF NOT EXISTS cart_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id TEXT,
  operation_type TEXT NOT NULL CHECK (operation_type IN (
    'add_to_cart',
    'remove_from_cart',
    'update_quantity',
    'apply_coupon',
    'get_cart',
    'lookup_order'
  )),
  platform TEXT NOT NULL CHECK (platform IN ('woocommerce', 'shopify')),
  product_id TEXT,
  quantity INTEGER,
  cart_value DECIMAL(10, 2),
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes for analytics queries
  INDEX idx_cart_ops_domain (domain),
  INDEX idx_cart_ops_created_at (created_at),
  INDEX idx_cart_ops_session (session_id),
  INDEX idx_cart_ops_platform (platform),
  INDEX idx_cart_ops_type (operation_type)
);

-- Cart session metrics (aggregated)
CREATE TABLE IF NOT EXISTS cart_session_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  first_operation_at TIMESTAMPTZ NOT NULL,
  last_operation_at TIMESTAMPTZ NOT NULL,
  total_operations INTEGER NOT NULL DEFAULT 0,
  items_added INTEGER NOT NULL DEFAULT 0,
  items_removed INTEGER NOT NULL DEFAULT 0,
  final_cart_value DECIMAL(10, 2),
  converted BOOLEAN DEFAULT false,
  conversion_value DECIMAL(10, 2),
  session_duration_seconds INTEGER,

  -- Indexes
  INDEX idx_session_metrics_domain (domain),
  INDEX idx_session_metrics_created (first_operation_at),
  INDEX idx_session_metrics_converted (converted)
);

-- Cart abandonment tracking
CREATE TABLE IF NOT EXISTS cart_abandonments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  session_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  cart_value DECIMAL(10, 2) NOT NULL,
  items_count INTEGER NOT NULL,
  last_activity_at TIMESTAMPTZ NOT NULL,
  abandoned_at TIMESTAMPTZ NOT NULL,
  recovered BOOLEAN DEFAULT false,
  recovered_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Indexes
  INDEX idx_abandonments_domain (domain),
  INDEX idx_abandonments_date (abandoned_at),
  INDEX idx_abandonments_recovered (recovered)
);

-- Daily cart analytics aggregation
CREATE TABLE IF NOT EXISTS cart_analytics_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  platform TEXT NOT NULL,
  date DATE NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_operations INTEGER NOT NULL DEFAULT 0,
  add_to_cart_count INTEGER NOT NULL DEFAULT 0,
  remove_from_cart_count INTEGER NOT NULL DEFAULT 0,
  total_cart_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
  avg_cart_value DECIMAL(10, 2),
  conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate DECIMAL(5, 2),
  abandonment_count INTEGER NOT NULL DEFAULT 0,
  abandonment_rate DECIMAL(5, 2),

  -- Unique constraint on domain/platform/date
  UNIQUE(domain, platform, date),

  -- Indexes
  INDEX idx_analytics_daily_domain (domain),
  INDEX idx_analytics_daily_date (date),
  INDEX idx_analytics_daily_platform (platform)
);

-- Function to update session metrics
CREATE OR REPLACE FUNCTION update_cart_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO cart_session_metrics (
    domain,
    session_id,
    platform,
    first_operation_at,
    last_operation_at,
    total_operations,
    items_added,
    items_removed,
    final_cart_value
  ) VALUES (
    NEW.domain,
    NEW.session_id,
    NEW.platform,
    NEW.created_at,
    NEW.created_at,
    1,
    CASE WHEN NEW.operation_type = 'add_to_cart' THEN 1 ELSE 0 END,
    CASE WHEN NEW.operation_type = 'remove_from_cart' THEN 1 ELSE 0 END,
    COALESCE(NEW.cart_value, 0)
  )
  ON CONFLICT (session_id) DO UPDATE SET
    last_operation_at = NEW.created_at,
    total_operations = cart_session_metrics.total_operations + 1,
    items_added = cart_session_metrics.items_added +
      CASE WHEN NEW.operation_type = 'add_to_cart' THEN 1 ELSE 0 END,
    items_removed = cart_session_metrics.items_removed +
      CASE WHEN NEW.operation_type = 'remove_from_cart' THEN 1 ELSE 0 END,
    final_cart_value = COALESCE(NEW.cart_value, cart_session_metrics.final_cart_value),
    session_duration_seconds = EXTRACT(EPOCH FROM (NEW.created_at - cart_session_metrics.first_operation_at))::INTEGER;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update session metrics
CREATE TRIGGER cart_operations_update_metrics
AFTER INSERT ON cart_operations
FOR EACH ROW
EXECUTE FUNCTION update_cart_session_metrics();

-- RLS policies (Row Level Security)
ALTER TABLE cart_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_session_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_abandonments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_analytics_daily ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role has full access to cart_operations"
  ON cart_operations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to cart_session_metrics"
  ON cart_session_metrics FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to cart_abandonments"
  ON cart_abandonments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role has full access to cart_analytics_daily"
  ON cart_analytics_daily FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant permissions
GRANT ALL ON cart_operations TO service_role;
GRANT ALL ON cart_session_metrics TO service_role;
GRANT ALL ON cart_abandonments TO service_role;
GRANT ALL ON cart_analytics_daily TO service_role;