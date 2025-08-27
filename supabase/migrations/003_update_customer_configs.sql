-- Add customer_id to customer_configs table
ALTER TABLE customer_configs 
ADD COLUMN customer_id UUID REFERENCES customers(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_customer_configs_customer_id ON customer_configs(customer_id);

-- Create unique constraint on customer_id instead of domain
ALTER TABLE customer_configs DROP CONSTRAINT IF EXISTS customer_configs_domain_key;
ALTER TABLE customer_configs ADD CONSTRAINT customer_configs_customer_id_key UNIQUE (customer_id);

-- Enable RLS on customer_configs
ALTER TABLE customer_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for customer_configs
CREATE POLICY "Users can view own config" ON customer_configs
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own config" ON customer_configs
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own config" ON customer_configs
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own config" ON customer_configs
  FOR DELETE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );

-- Remove user_id column if it exists (we're using customer_id instead)
ALTER TABLE customer_configs DROP COLUMN IF EXISTS user_id;