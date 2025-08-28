# Supabase Database Setup Instructions

## Your Project Details
- **Project ID**: `birugqyuqhiahxvxeyqg`
- **Dashboard URL**: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg

## Quick Setup (2 Options)

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open SQL Editor**:
   https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql/new

2. **Choose which schema to create**:

   **For Multi-Tenant (Multiple Businesses)**:
   - Copy and paste from: `scripts/create-multi-tenant-tables.sql`
   - This creates tables with `business_id` for complete isolation
   - Use if you plan to support multiple business customers

   **For Single Tenant (Just Your Business)**:
   - Copy and paste from: `scripts/create-customer-tables.sql`
   - This creates simpler tables without multi-tenancy
   - Use if this is just for your own business

3. **Click "Run"** to execute the SQL

### Option 2: Using Supabase CLI (If Installed)

```bash
# Install Supabase CLI if needed
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref birugqyuqhiahxvxeyqg

# Run migration (choose one)
# For multi-tenant:
supabase db push < scripts/create-multi-tenant-tables.sql

# For single tenant:
supabase db push < scripts/create-customer-tables.sql
```

## Which Schema Should You Choose?

### Multi-Tenant Schema (`create-multi-tenant-tables.sql`)
**Use this if:**
- You're building a SaaS platform
- Multiple businesses will use your service
- Each business needs their own isolated data
- You want to charge per business/account

**Tables created:**
- `businesses` - Business accounts
- `business_configs` - Per-business settings
- `business_usage` - Usage tracking for billing
- `conversations` (with business_id)
- `messages` (with business_id)
- `customer_verifications` (with business_id)
- `customer_access_logs` (with business_id)
- `customer_data_cache` (with business_id)
- `content_embeddings` (with business_id)

### Single Tenant Schema (`create-customer-tables.sql`)
**Use this if:**
- This is just for your own business
- You only have one WooCommerce store
- You don't need multi-business isolation
- Simpler architecture is preferred

**Tables created:**
- `conversations`
- `messages`
- `customer_verifications`
- `customer_access_logs`
- `customer_data_cache`
- `customer_configs`

## After Creating Tables

### 1. Verify Tables Were Created

```bash
# Test endpoint
curl http://localhost:3001/api/test-db

# Should show all tables as "EXISTS"
```

### 2. Test Customer Verification

```bash
# Test all systems
curl http://localhost:3001/api/woocommerce/customer-test?test=all
```

### 3. Configure Your Environment

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU3ODcxNjQsImV4cCI6MjA3MTM2MzE2NH0.BcI58O5BqlAWTH3nf-adZIjeehhjDVBZmTODCYU25To
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s
```

## Need Help?

1. Check Supabase logs: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/logs/explorer
2. View table editor: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/editor
3. SQL editor: https://supabase.com/dashboard/project/birugqyuqhiahxvxeyqg/sql

## Important Notes

- The SQL includes Row Level Security (RLS) policies
- Service role key bypasses RLS for backend operations
- All sensitive data (API keys, credentials) should be encrypted
- Consider enabling pgcrypto extension for encryption:
  ```sql
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
  ```

Choose the schema that matches your business model and run it in the Supabase Dashboard!