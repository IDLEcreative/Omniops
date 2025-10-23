# Environment Variables - Commerce Provider Deployment

**Version**: 2.0
**Date**: 2025-10-23

---

## Overview

This document lists all environment variables required for the commerce provider multi-platform support deployment.

---

## Required Environment Variables

### Database & Authentication

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database connection (optional, for direct queries)
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

### AI & Embeddings

```bash
# OpenAI API Key (required for chat & embeddings)
OPENAI_API_KEY=sk-...
```

### Redis (Job Queue & Caching)

```bash
# Redis URL (optional, falls back to in-memory if not provided)
REDIS_URL=redis://localhost:6379

# Or for production with authentication
REDIS_URL=redis://user:password@redis-host:6379
```

---

## Platform-Specific Variables

### WooCommerce Configuration

**Per-Customer Configuration** (stored encrypted in database):
- `woocommerce_url`: Store URL (e.g., https://store.example.com)
- `woocommerce_consumer_key`: WooCommerce API consumer key
- `woocommerce_consumer_secret`: WooCommerce API consumer secret

**Note**: WooCommerce credentials are stored PER customer in the `customer_configs` table, encrypted with AES-256.

### Shopify Configuration

**Per-Customer Configuration** (stored encrypted in database):
- `shopify_shop_domain`: Shop domain (e.g., mystore.myshopify.com)
- `shopify_access_token`: Shopify Admin API access token

**Note**: Shopify credentials are also stored PER customer in the `customer_configs` table, encrypted.

---

## Optional Environment Variables

### Performance & Optimization

```bash
# Cache TTL (default: 60000ms = 60 seconds)
PROVIDER_CACHE_TTL_MS=60000

# Search timeout (default: 10000ms = 10 seconds)
COMMERCE_SEARCH_TIMEOUT_MS=10000

# Max concurrent provider resolutions (default: 5)
MAX_CONCURRENT_PROVIDER_RESOLUTIONS=5
```

### Feature Flags

```bash
# Enable Shopify support globally (default: true)
FEATURE_SHOPIFY_ENABLED=true

# Enable WooCommerce support globally (default: true)
FEATURE_WOOCOMMERCE_ENABLED=true

# Enable provider caching (default: true)
FEATURE_PROVIDER_CACHE_ENABLED=true

# Enable lazy loading of provider modules (default: true)
FEATURE_LAZY_PROVIDER_LOADING=true
```

### Monitoring & Logging

```bash
# Log level (default: info)
LOG_LEVEL=info  # Options: debug, info, warn, error

# Enable performance tracking (default: true in production)
ENABLE_PERFORMANCE_TRACKING=true

# Enable commerce provider metrics (default: true)
ENABLE_COMMERCE_METRICS=true

# Telemetry endpoint (optional)
TELEMETRY_ENDPOINT=https://your-telemetry-service.com/ingest
```

---

## Deployment-Specific Variables

### Staging Environment

```bash
# .env.staging
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<staging-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<staging-service-role-key>
OPENAI_API_KEY=<staging-openai-key>
REDIS_URL=redis://staging-redis:6379

# Feature flags for gradual rollout
FEATURE_SHOPIFY_ENABLED=true
FEATURE_WOOCOMMERCE_ENABLED=true

# More verbose logging in staging
LOG_LEVEL=debug
```

### Production Environment

```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<production-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<production-service-role-key>
OPENAI_API_KEY=<production-openai-key>
REDIS_URL=redis://production-redis:6379

# Feature flags (can disable if issues occur)
FEATURE_SHOPIFY_ENABLED=true
FEATURE_WOOCOMMERCE_ENABLED=true

# Production logging
LOG_LEVEL=info
ENABLE_PERFORMANCE_TRACKING=true
ENABLE_COMMERCE_METRICS=true
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# ❌ DON'T DO THIS
git add .env.local
git commit -m "Add environment variables"

# ✅ DO THIS
# Add .env* to .gitignore (already done)
echo ".env*" >> .gitignore
```

### 2. Use Secret Management

**For Production**:
- Use environment variable management (Vercel Env Vars, AWS Secrets Manager, etc.)
- Rotate API keys quarterly
- Use separate keys for staging/production
- Enable IP whitelisting where possible

**Example: Vercel Deployment**

```bash
# Add secrets via Vercel CLI
vercel env add OPENAI_API_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add REDIS_URL production
```

### 3. Validate Environment Variables on Startup

**File**: `lib/config.ts` (already implemented)

```typescript
// Validates all required environment variables exist
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'OPENAI_API_KEY'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
```

---

## Per-Customer Configuration

### Database Schema

**Table**: `customer_configs`

```sql
CREATE TABLE customer_configs (
  id UUID PRIMARY KEY,
  domain_id UUID REFERENCES domains(id),

  -- WooCommerce credentials (encrypted)
  woocommerce_url TEXT,
  woocommerce_consumer_key_encrypted TEXT,
  woocommerce_consumer_secret_encrypted TEXT,

  -- Shopify credentials (encrypted)
  shopify_shop_domain TEXT,
  shopify_access_token_encrypted TEXT,

  -- Feature flags per customer
  shopify_enabled BOOLEAN DEFAULT false,
  woocommerce_enabled BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Enabling Platforms Per Customer

**Via API** (`app/api/configure/route.ts`):

```typescript
// Enable Shopify for a customer
await supabase
  .from('customer_configs')
  .update({
    shopify_enabled: true,
    shopify_shop_domain: 'mystore.myshopify.com',
    shopify_access_token_encrypted: encryptedToken
  })
  .eq('domain_id', domainId);

// Enable WooCommerce for a customer
await supabase
  .from('customer_configs')
  .update({
    woocommerce_enabled: true,
    woocommerce_url: 'https://store.example.com',
    woocommerce_consumer_key_encrypted: encryptedKey,
    woocommerce_consumer_secret_encrypted: encryptedSecret
  })
  .eq('domain_id', domainId);
```

---

## Environment Variable Template

**File**: `.env.example` (for new developers)

```bash
# ======================
# Supabase Configuration
# ======================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ======================
# OpenAI Configuration
# ======================
OPENAI_API_KEY=sk-your_openai_api_key_here

# ======================
# Redis Configuration
# ======================
# Optional - defaults to in-memory if not provided
REDIS_URL=redis://localhost:6379

# ======================
# Feature Flags
# ======================
FEATURE_SHOPIFY_ENABLED=true
FEATURE_WOOCOMMERCE_ENABLED=true
FEATURE_PROVIDER_CACHE_ENABLED=true

# ======================
# Performance Tuning
# ======================
PROVIDER_CACHE_TTL_MS=60000
COMMERCE_SEARCH_TIMEOUT_MS=10000
MAX_CONCURRENT_PROVIDER_RESOLUTIONS=5

# ======================
# Monitoring & Logging
# ======================
LOG_LEVEL=info
ENABLE_PERFORMANCE_TRACKING=true
ENABLE_COMMERCE_METRICS=true

# ======================
# Database (Optional)
# ======================
DATABASE_URL=postgresql://postgres:password@localhost:5432/postgres
```

---

## Verification Checklist

Before deploying, verify:

- [ ] All required environment variables are set
- [ ] Supabase connection works (`npm run test:db`)
- [ ] OpenAI API key is valid (`npm run test:openai`)
- [ ] Redis connection works (or fallback enabled)
- [ ] Feature flags are configured correctly
- [ ] Secrets are NOT committed to git
- [ ] Production uses different keys than staging
- [ ] Environment validation passes on startup

---

## Troubleshooting

### Issue: "Missing required environment variable"

**Cause**: Required env var not set
**Solution**:
```bash
# Check which variables are missing
npm run check:env

# Add missing variables to .env.local
echo "MISSING_VAR=value" >> .env.local
```

### Issue: "Supabase connection failed"

**Cause**: Invalid Supabase URL or keys
**Solution**:
1. Verify URL format: `https://PROJECT_REF.supabase.co`
2. Regenerate keys in Supabase dashboard if needed
3. Check for trailing whitespace in .env file

### Issue: "Redis connection timeout"

**Cause**: Redis not running or wrong URL
**Solution**:
```bash
# Start Redis locally
docker run -d -p 6379:6379 redis

# Or use in-memory fallback
# Remove REDIS_URL from .env.local
```

---

## Related Documentation

- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- [Monitoring Guide](DEPLOYMENT_MONITORING.md)
- [Rollback Procedure](DEPLOYMENT_CHECKLIST.md#rollback-procedure)

---

**Last Updated**: 2025-10-23
**Maintainer**: Engineering Team
