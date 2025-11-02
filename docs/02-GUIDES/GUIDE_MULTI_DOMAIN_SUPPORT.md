# Multi-Domain Account Support Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-02
**Verified For:** v0.1.0
**Dependencies:**
- [Database Schema](../09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Widget V2 Migration](./GUIDE_WIDGET_V2_MIGRATION.md)

## Purpose
Explains how to configure multiple domains (production, staging, dev) for a single customer account, enabling the same widget embed code to work across all environments.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Adding Additional Domains](#adding-additional-domains)
- [How It Works](#how-it-works)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

---

## Overview

**The Proper SaaS Model:**

Customers should be able to register multiple domains under their account:
- Production domain: `example.com`
- Staging domain: `staging.example.com`
- Development domain: `dev.example.com`

**Key Benefits:**
1. Same embed code works everywhere
2. No code changes when deploying to different environments
3. Widget auto-detects domain and loads matching configuration
4. Centralized management through dashboard

**❌ Wrong Approach (Anti-Pattern):**
```javascript
// DON'T DO THIS - Hardcoded domain aliases in code
const DOMAIN_ALIASES = {
  'staging.example.com': 'example.com'  // Workaround
};
```

**✅ Correct Approach:**
```sql
-- Add staging domain to customer's account in database
INSERT INTO customer_configs (domain, organization_id, ...)
SELECT 'staging.example.com', organization_id, ...
FROM customer_configs WHERE domain = 'example.com';
```

---

## Architecture

### Database Structure

**customer_configs table:**
- Each domain gets its own row
- All domains for one customer share the same `organization_id`
- Configuration can be shared or customized per domain

**Relationships:**
```
organizations (1)
  └── customer_configs (many domains)
      ├── example.com (production)
      ├── staging.example.com (staging)
      └── dev.example.com (development)
```

### Widget Behavior

**Auto-Detection Flow:**
1. Widget loads on a page
2. Detects current domain from `window.location.hostname`
3. Calls `/api/widget/config?domain={detected_domain}`
4. Server looks up domain in `customer_configs` table
5. Returns configuration for that specific domain
6. Widget renders with appropriate settings

---

## Adding Additional Domains

### Step 1: Prepare SQL Script

Use the provided template in [`scripts/database/add-staging-domain.sql`](../../scripts/database/add-staging-domain.sql) or create your own:

```sql
-- Add staging domain to customer account
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
  active
)
SELECT
  'staging.example.com' as domain,    -- New staging domain
  organization_id,                    -- Same organization
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,              -- Share credentials
  rate_limit,
  allowed_origins,
  true as active
FROM customer_configs
WHERE domain = 'example.com'          -- Copy from production
ON CONFLICT (domain) DO NOTHING;
```

### Step 2: Execute in Supabase Dashboard

1. Go to Supabase Dashboard → SQL Editor
2. Paste the SQL script
3. Review the query carefully
4. Click "Run"

### Step 3: Verify

```sql
-- Check all domains for the customer
SELECT
  domain,
  organization_id,
  business_name,
  active
FROM customer_configs
WHERE organization_id = (
  SELECT organization_id
  FROM customer_configs
  WHERE domain = 'example.com'
)
ORDER BY domain;
```

**Expected Output:**
```
domain                  | organization_id | business_name | active
-----------------------+-----------------+--------------+--------
dev.example.com        | uuid-123        | Acme Corp    | true
example.com            | uuid-123        | Acme Corp    | true
staging.example.com    | uuid-123        | Acme Corp    | true
```

### Step 4: Test Widget

1. Deploy embed code to staging site (if not already done)
2. Hard refresh the page (`Cmd+Shift+R` or `Ctrl+Shift+F5`)
3. Open browser console and check for:
   ```
   [Omniops Widget] Fetching config from: https://omniops.co.uk/api/widget/config?domain=staging.example.com
   [Omniops Widget] Config loaded successfully
   ```
4. Click chat button to verify full functionality

---

## How It Works

### Example: Thompson's E-Parts

**Before (Using Workaround):**
```typescript
// In app/api/widget/config/route.ts
const DOMAIN_ALIASES = {
  'epartstaging.wpengine.com': 'thompsonseparts.co.uk',  // Hacky mapping
};
```

**After (Proper Solution):**
```sql
-- Database has both domains:
thompsonseparts.co.uk         (production)
epartstaging.wpengine.com     (staging)

-- Both share organization_id, so they inherit same config
```

**Widget Integration (Same Code Everywhere):**
```html
<!-- Production: thompsonseparts.co.uk -->
<script src="https://omniops.co.uk/embed.js"></script>

<!-- Staging: epartstaging.wpengine.com -->
<script src="https://omniops.co.uk/embed.js"></script>

<!-- Same code, auto-detects domain! -->
```

---

## Examples

### Example 1: Adding Dev Domain

```sql
INSERT INTO customer_configs (
  domain,
  organization_id,
  business_name,
  active
)
SELECT
  'dev.example.com',
  organization_id,
  business_name,
  true
FROM customer_configs
WHERE domain = 'example.com';
```

### Example 2: Adding Multiple Staging Domains

```sql
-- Add staging domains for different testing environments
INSERT INTO customer_configs (
  domain, organization_id, business_name, active
)
SELECT
  unnest(ARRAY[
    'staging.example.com',
    'qa.example.com',
    'uat.example.com'
  ]) as domain,
  organization_id,
  business_name,
  true
FROM customer_configs
WHERE domain = 'example.com';
```

### Example 3: Custom Config Per Environment

```sql
-- Add staging with different welcome message
INSERT INTO customer_configs (
  domain,
  organization_id,
  business_name,
  welcome_message,
  active
)
SELECT
  'staging.example.com',
  organization_id,
  business_name,
  '🚧 Staging Environment - For Testing Only',  -- Different message
  true
FROM customer_configs
WHERE domain = 'example.com';
```

---

## Troubleshooting

### Issue: Widget Not Loading on Staging

**Symptoms:**
- 404 error: `GET /api/widget/config?domain=staging.example.com 404`
- Console error: "Failed to load widget config"

**Solution:**
1. Verify domain is registered in database:
   ```sql
   SELECT * FROM customer_configs
   WHERE domain = 'staging.example.com';
   ```
2. If not found, run the SQL INSERT script above
3. Hard refresh the page

### Issue: Widget Loads Wrong Config

**Symptoms:**
- Widget shows production branding on staging site
- Wrong welcome message or colors

**Possible Causes:**
1. **Domain Alias Still Active** - Remove `DOMAIN_ALIASES` workaround from `app/api/widget/config/route.ts`
2. **Browser Cache** - Hard refresh with `Cmd+Shift+R`
3. **CDN Cache** - Wait 5 minutes or purge CDN cache

**Debug:**
```javascript
// In browser console on staging site
console.log(window.location.hostname);  // Should show staging domain
console.log(window.ChatWidgetConfig);   // Check serverUrl
```

### Issue: Different Credentials Needed Per Environment

**Use Case:** Production uses live WooCommerce, staging uses test WooCommerce

**Solution:**
```sql
-- Update staging domain with different credentials
UPDATE customer_configs
SET encrypted_credentials = jsonb_build_object(
  'woocommerce', jsonb_build_object(
    'url', 'https://staging-shop.example.com',
    'consumerKey', 'ck_test_xxx',
    'consumerSecret', 'cs_test_yyy'
  )
)
WHERE domain = 'staging.example.com';
```

---

## Migration from Domain Alias Workaround

If you previously used domain aliases in code, follow these steps to migrate:

### Step 1: Add Staging Domain to Database
Run the SQL INSERT script (see [Adding Additional Domains](#adding-additional-domains))

### Step 2: Remove Domain Alias Code

**In `app/api/widget/config/route.ts`:**

```diff
- // Domain alias mapping for staging/test environments
- const DOMAIN_ALIASES: Record<string, string> = {
-   'epartstaging.wpengine.com': 'thompsonseparts.co.uk',
-   'www.epartstaging.wpengine.com': 'thompsonseparts.co.uk',
- };

- // Apply domain alias if exists
- if (domain && DOMAIN_ALIASES[domain]) {
-   console.log(`[Widget Config API] Domain alias: ${domain} → ${DOMAIN_ALIASES[domain]}`);
-   domain = DOMAIN_ALIASES[domain];
- }
```

### Step 3: Deploy and Verify

```bash
git add app/api/widget/config/route.ts
git commit -m "refactor: remove domain alias workaround, use proper multi-domain support"
git push
```

Test on all environments to ensure widget still works.

---

## Best Practices

### 1. Consistent Organization Structure
```
organization_id: abc-123
  ├── example.com (production)
  ├── staging.example.com (staging)
  ├── dev.example.com (development)
  └── qa.example.com (QA testing)
```

### 2. Naming Conventions
- Production: `example.com`
- Staging: `staging.example.com` or `example-staging.wpengine.com`
- Development: `dev.example.com` or `localhost:3000`
- QA: `qa.example.com`

### 3. Security Considerations
- Don't expose production API keys on staging/dev
- Use separate `encrypted_credentials` per environment
- Mark test domains with clear labels in welcome message

### 4. Dashboard UI (Future Enhancement)
```
┌─────────────────────────────────────────┐
│ Account Domains                          │
├─────────────────────────────────────────┤
│ ✓ example.com (production)               │
│ ✓ staging.example.com (staging)          │
│ ✓ dev.example.com (development)          │
│                                          │
│ [+ Add Domain]                           │
└─────────────────────────────────────────┘
```

---

## Summary

**The Proper SaaS Architecture:**
- ✅ Customers register all domains in their account (dashboard UI)
- ✅ Widget uses same embed code everywhere
- ✅ Auto-detects domain and loads matching config
- ✅ No code changes needed when deploying to different environments

**What This Eliminates:**
- ❌ Domain alias workarounds in code
- ❌ Different embed codes per environment
- ❌ Manual configuration changes when deploying
- ❌ Hard-coded domain mappings

**Key Takeaway:** Multi-domain support is a database architecture pattern, not a code workaround. Add domains to the database, and the widget automatically works everywhere.
