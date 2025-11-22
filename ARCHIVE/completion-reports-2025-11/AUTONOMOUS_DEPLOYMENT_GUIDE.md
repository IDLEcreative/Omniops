# 🚀 Autonomous Agents - Deployment Guide

**Date:** 2025-11-10
**Status:** Ready for Deployment
**Prerequisites:** Phases 1 & 2 Complete

---

## 📋 Pre-Flight Checklist

Before deploying the autonomous agent system, ensure:

- [ ] Supabase project is running
- [ ] `ANTHROPIC_API_KEY` environment variable set
- [ ] `ENCRYPTION_KEY` environment variable set (32-byte base64)
- [ ] Playwright installed (`npx playwright install`)
- [ ] All dependencies installed (`npm install`)

---

## 🗄️ Step 1: Apply Database Migration

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Paste contents of `supabase/migrations/20251110000000_autonomous_operations_system.sql`
3. Click "Run"
4. Verify output shows "Migration completed successfully"

### Option B: Via Supabase CLI

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref birugqyuqhiahxvxeyqg

# Push migration
npx supabase db push
```

### Option C: Via Management API

```bash
# Set access token
export SUPABASE_ACCESS_TOKEN="sbp_..."

# Run migration script
npx tsx scripts/database/apply-autonomous-migration.ts
```

### Verify Migration

Run this SQL in Supabase Dashboard:

```sql
-- Check tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_name IN (
  'autonomous_operations',
  'autonomous_operations_audit',
  'autonomous_credentials',
  'autonomous_consent'
);

-- Should return 4 rows
```

---

## 🔐 Step 2: Set Up Environment Variables

Verify these are in `.env.local`:

```bash
# OpenAI API (already configured - used for AI vision)
OPENAI_API_KEY=sk-proj-...

# Encryption (already configured)
ENCRYPTION_KEY=your-32-byte-base64-key-here

# Consent tracking (optional)
CONSENT_VERSION=1.0

# Optional: Key rotation tracking
ENCRYPTION_KEY_VERSION=v1
```

**Note:** The system now uses your existing OpenAI API key instead of requiring a separate Anthropic key!

---

## 📦 Step 3: Create Supabase Storage Bucket

### Via Supabase Dashboard:

1. Go to Storage → Create Bucket
2. Name: `autonomous-screenshots`
3. Public bucket: **Yes** (screenshots need to be viewable)
4. File size limit: 5MB
5. Allowed MIME types: `image/png`, `image/jpeg`

### Via SQL:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('autonomous-screenshots', 'autonomous-screenshots', true);

-- Set up RLS policy
CREATE POLICY "Authenticated users can upload screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'autonomous-screenshots');

CREATE POLICY "Screenshots are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'autonomous-screenshots');
```

---

## ✅ Step 4: Verify Installation

### Run Integration Tests

```bash
# Test database schema
npx tsx scripts/tests/test-autonomous-agent.ts

# Expected output:
# ✅ All database tables exist
# ✅ Credential vault working correctly
# ✅ Consent manager working correctly
# ✅ Audit logger working correctly
# ✅ Operation service working correctly
# ✅ Workflow registry working correctly
# 🎉 All tests passed!
```

### Test API Endpoints

```bash
# Start dev server
npm run dev

# In another terminal:

# 1. Grant consent
curl -X POST http://localhost:3000/api/autonomous/consent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grant",
    "service": "woocommerce",
    "operation": "api_key_generation",
    "permissions": ["read_products", "create_api_keys"]
  }'

# 2. Initiate operation
curl -X POST http://localhost:3000/api/autonomous/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "service": "woocommerce",
    "operation": "api_key_generation",
    "metadata": {
      "storeUrl": "https://shop.example.com"
    }
  }'

# Save the operationId from response

# 3. Check status
curl http://localhost:3000/api/autonomous/status/OPERATION_ID
```

---

## 🧪 Step 5: Test Autonomous Agent (Manual)

### Create Test Script

Create `test-woocommerce-agent.ts`:

```typescript
import { createWooCommerceSetupAgent } from '@/lib/autonomous/agents/woocommerce-setup-agent';
import { storeCredential } from '@/lib/autonomous/security/credential-vault';
import { grantConsent } from '@/lib/autonomous/security/consent-manager';

const TEST_CUSTOMER_ID = 'your-customer-id';
const TEST_USER_ID = 'your-user-id';

async function test() {
  // 1. Store WooCommerce credentials
  await storeCredential(TEST_CUSTOMER_ID, 'woocommerce', 'admin_username', {
    value: 'admin'
  });

  await storeCredential(TEST_CUSTOMER_ID, 'woocommerce', 'admin_password', {
    value: 'your-admin-password'
  });

  // 2. Grant consent
  await grantConsent(TEST_CUSTOMER_ID, TEST_USER_ID, {
    service: 'woocommerce',
    operation: 'api_key_generation',
    permissions: ['read_products', 'create_api_keys']
  });

  // 3. Create agent
  const agent = createWooCommerceSetupAgent('https://your-shop.com');

  // 4. Execute (with visible browser)
  const result = await agent.execute({
    operationId: 'test-' + Date.now(),
    customerId: TEST_CUSTOMER_ID,
    service: 'woocommerce',
    operation: 'api_key_generation',
    headless: false, // Watch it work!
    slowMo: 1000     // Slow down for visibility
  });

  console.log('Result:', result);

  if (result.success) {
    console.log('✅ API Key:', result.data.apiKey);
    console.log('✅ Product Count:', result.data.productCount);
  } else {
    console.error('❌ Error:', result.error);
  }
}

test().catch(console.error);
```

Run:
```bash
npx tsx test-woocommerce-agent.ts
```

---

## 📊 Step 6: Monitor Operations

### View Audit Logs

```sql
-- See all operations
SELECT
  id,
  service,
  operation,
  status,
  created_at,
  started_at,
  completed_at
FROM autonomous_operations
ORDER BY created_at DESC
LIMIT 10;

-- See operation steps
SELECT
  step_number,
  intent,
  action,
  success,
  duration_ms,
  screenshot_url
FROM autonomous_operations_audit
WHERE operation_id = 'your-operation-id'
ORDER BY step_number;

-- See consent records
SELECT
  service,
  operation,
  permissions,
  granted_at,
  is_active
FROM autonomous_consent
WHERE customer_id = 'your-customer-id';
```

### Check Operation Statistics

```typescript
import { getAuditLogger } from '@/lib/autonomous/security/audit-logger';

const stats = await getAuditLogger().getStatistics('customer-id');

console.log('Total Operations:', stats.totalOperations);
console.log('Success Rate:', stats.successRate + '%');
console.log('Avg Duration:', stats.avgDurationMs + 'ms');
console.log('Failure Reasons:', stats.failureReasons);
```

---

## 🔧 Troubleshooting

### Issue: "OPENAI_API_KEY environment variable required"

**Solution:**
```bash
# Verify your OpenAI key is set
echo $OPENAI_API_KEY

# Should show: sk-proj-...
# If not set, add to .env.local
```

### Issue: "ENCRYPTION_KEY environment variable required"

**Solution:**
```bash
# Generate encryption key
openssl rand -base64 32

# Add to .env.local
ENCRYPTION_KEY=your-generated-key-here
```

### Issue: "Consent required"

**Solution:**
```bash
# Grant consent via API
curl -X POST http://localhost:3000/api/autonomous/consent \
  -H "Content-Type: application/json" \
  -d '{
    "action": "grant",
    "service": "woocommerce",
    "operation": "api_key_generation",
    "permissions": ["read_products", "create_api_keys"]
  }'
```

### Issue: "Failed to store credential"

**Solution:**
```sql
-- Verify RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'autonomous_credentials';

-- Ensure service role has access
```

### Issue: "Workflow not found"

**Solution:**
```bash
# Regenerate E2E knowledge base
npm run agent:regenerate

# Verify workflow exists
npx tsx -e "
import { WorkflowRegistry } from '@/lib/autonomous/core/workflow-registry';
console.log(WorkflowRegistry.list().filter(w => w.id.includes('woocommerce')));
"
```

### Issue: "Screenshot upload failed"

**Solution:**
```sql
-- Create storage bucket if missing
INSERT INTO storage.buckets (id, name, public)
VALUES ('autonomous-screenshots', 'autonomous-screenshots', true);
```

---

## 🚀 Production Deployment

### Pre-Production Checklist

- [ ] All integration tests passing
- [ ] E2E tests passing
- [ ] Security audit complete
- [ ] Encryption keys rotated
- [ ] Storage bucket configured
- [ ] RLS policies verified
- [ ] Rate limiting configured
- [ ] Monitoring dashboards set up
- [ ] Beta customers identified (5-10)

### Environment-Specific Configuration

```bash
# Development
ANTHROPIC_API_KEY=sk-ant-...
ENCRYPTION_KEY=dev-key-...
CONSENT_VERSION=1.0-dev

# Staging
ANTHROPIC_API_KEY=sk-ant-...
ENCRYPTION_KEY=staging-key-...
CONSENT_VERSION=1.0-staging

# Production
ANTHROPIC_API_KEY=sk-ant-...
ENCRYPTION_KEY=prod-key-... # DIFFERENT from dev/staging!
CONSENT_VERSION=1.0
ENCRYPTION_KEY_VERSION=v1
```

### Gradual Rollout

1. **Beta (Week 1)**
   - Enable for 5 customers
   - Monitor closely
   - Collect feedback

2. **Limited Release (Week 2)**
   - Enable for 50 customers
   - Monitor error rates
   - Fix issues

3. **General Availability (Week 3)**
   - Enable for all customers
   - Announce feature
   - Monitor adoption

---

## 📈 Success Metrics

### Technical Metrics

- **Success Rate:** >95% of autonomous operations complete successfully
- **Execution Time:** <5 minutes average per operation
- **Error Rate:** <5% failure rate
- **Credential Vault:** 100% encryption, 0% plaintext
- **Audit Coverage:** 100% of operations logged

### Business Metrics

- **Time Savings:** 98% reduction (2 hours → 2 minutes)
- **Support Tickets:** 80% reduction for integration setup
- **Customer Satisfaction:** NPS +40 points
- **Adoption Rate:** 30% of customers use autonomous features

### Monitor These Queries

```sql
-- Success rate
SELECT
  COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / COUNT(*) as success_rate
FROM autonomous_operations
WHERE created_at > NOW() - INTERVAL '7 days';

-- Average duration
SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_seconds
FROM autonomous_operations
WHERE status = 'completed';

-- Failure reasons
SELECT result->>'error' as error, COUNT(*)
FROM autonomous_operations
WHERE status = 'failed'
GROUP BY result->>'error'
ORDER BY COUNT(*) DESC;
```

---

## 🎉 You're Ready!

Your autonomous agent system is now deployed and operational.

**Next Steps:**
1. Apply database migration ✓
2. Configure environment variables ✓
3. Create storage bucket ✓
4. Run integration tests ✓
5. Test with real WooCommerce store
6. Invite beta customers
7. Monitor and iterate

**Need Help?**
- See [lib/autonomous/README.md](lib/autonomous/README.md) for detailed documentation
- Check [AUTONOMOUS_AGENTS_PHASE2_COMPLETE.md](AUTONOMOUS_AGENTS_PHASE2_COMPLETE.md) for implementation details
- Review [docs/10-ANALYSIS/ROADMAP_AUTONOMOUS_AGENTS.md](docs/10-ANALYSIS/ROADMAP_AUTONOMOUS_AGENTS.md) for roadmap

---

**Status:** ✅ Ready for Deployment
**Estimated Setup Time:** 30-60 minutes
**First Autonomous Operation:** 2 minutes after setup!
