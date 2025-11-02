# Multi-Domain Support: Proper Solution vs Workaround

**Date:** 2025-11-02
**Status:** Ready to Implement
**Impact:** Eliminates domain alias workaround, implements proper SaaS architecture

---

## Executive Summary

You're absolutely correct about how the SaaS model should work. The current implementation uses a **workaround** (domain alias mapping in code), but the **proper solution** is to register staging domains in the database under the customer's account.

---

## Your Understanding (100% Correct)

> "Don't we just need to allow the staging website in the same way to access Thompson's information from their domain? Just link it to that domain because people are going to be logging in, creating domains and then the chat embed widget just needs to be the one you get from the installation page. That should just be the only embed code that you need and it should just dynamically find which user which organisation is created, what website they've got."

**This is exactly right.** Customers should:
1. Log into dashboard
2. Add their domain(s): production, staging, dev
3. Get one embed code
4. Use same code everywhere
5. Widget auto-detects domain and loads matching config

---

## Current Situation

### Thompson's E-Parts Setup

**Production Domain (Registered):**
- `thompsonseparts.co.uk` ✅ In database

**Staging Domain (Not Registered):**
- `epartstaging.wpengine.com` ❌ NOT in database

**Current Workaround:**
```typescript
// In app/api/widget/config/route.ts (lines 35-41, 62-66)
const DOMAIN_ALIASES: Record<string, string> = {
  'epartstaging.wpengine.com': 'thompsonseparts.co.uk',  // ← Hack
};

// When staging domain detected, pretend it's production
if (domain && DOMAIN_ALIASES[domain]) {
  domain = DOMAIN_ALIASES[domain];  // Overwrite staging → production
}
```

**Why This Is Wrong:**
- ❌ Not scalable - requires code change for every customer's staging site
- ❌ Not maintainable - staging domains hardcoded in source
- ❌ Not SaaS - customers can't self-service add domains
- ❌ Wrong separation of concerns - business data in code, not database

---

## The Proper Solution

### Step 1: Add Staging Domain to Database

**Run this SQL in Supabase Dashboard:**

```sql
-- Add Thompson's staging domain to their account
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
  'epartstaging.wpengine.com' as domain,  -- Staging domain
  organization_id,                         -- Same org as production
  business_name,
  business_description,
  primary_color,
  welcome_message,
  suggested_questions,
  encrypted_credentials,
  rate_limit,
  allowed_origins,
  true as active
FROM customer_configs
WHERE domain = 'thompsonseparts.co.uk'
ON CONFLICT (domain) DO NOTHING;
```

**What This Does:**
- Creates a new `customer_configs` row for staging domain
- Links it to same `organization_id` as production
- Inherits all settings from production (colors, welcome message, credentials)
- Enables auto-detection - widget works immediately on staging

### Step 2: Verify Multi-Domain Setup

```sql
-- Check Thompson's has both domains registered
SELECT
  domain,
  organization_id,
  business_name,
  active
FROM customer_configs
WHERE organization_id = (
  SELECT organization_id
  FROM customer_configs
  WHERE domain = 'thompsonseparts.co.uk'
)
ORDER BY domain;
```

**Expected Output:**
```
domain                      | organization_id | business_name        | active
---------------------------+-----------------+---------------------+--------
epartstaging.wpengine.com  | abc-123-uuid    | Thompson's E-Parts  | true
thompsonseparts.co.uk      | abc-123-uuid    | Thompson's E-Parts  | true
```

### Step 3: Remove Domain Alias Workaround (Optional)

Once staging domain is in database, the workaround is no longer needed:

**File:** `app/api/widget/config/route.ts`

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

**Note:** You can keep the workaround temporarily during transition, but it's no longer needed once domains are in database.

---

## How It Works After Fix

### Widget Behavior (Auto-Detection)

**On Production Site (`thompsonseparts.co.uk`):**
```javascript
// Widget detects: window.location.hostname = "thompsonseparts.co.uk"
// Calls: /api/widget/config?domain=thompsonseparts.co.uk
// Returns: Thompson's config (found in customer_configs table)
// Renders: Widget with Thompson's branding ✓
```

**On Staging Site (`epartstaging.wpengine.com`):**
```javascript
// Widget detects: window.location.hostname = "epartstaging.wpengine.com"
// Calls: /api/widget/config?domain=epartstaging.wpengine.com
// Returns: Thompson's config (found in customer_configs table)
// Renders: Widget with Thompson's branding ✓
```

**Same embed code on both sites:**
```html
<script src="https://omniops.co.uk/embed.js"></script>
```

No configuration needed - widget auto-detects domain!

---

## Architecture Comparison

### Before (Wrong - Domain Alias Workaround)

```
Customer Request: "Add my staging site"
    ↓
Developer edits source code
    ↓
Adds hardcoded domain mapping
    ↓
Commits, pushes, deploys to production
    ↓
Staging site now works
```

**Problems:**
- Requires developer intervention
- Code deployment for configuration change
- Doesn't scale to 100+ customers with staging sites

### After (Correct - Multi-Domain Database)

```
Customer Request: "Add my staging site"
    ↓
Dashboard: Clicks "+ Add Domain"
    ↓
Enters "staging.example.com"
    ↓
Database: INSERT INTO customer_configs
    ↓
Staging site works immediately
```

**Benefits:**
- Self-service (customers manage their own domains)
- No code changes needed
- Scales to unlimited domains per customer
- Proper separation: data in database, logic in code

---

## Implementation Steps

### Immediate (Do Now)

1. **Run SQL Script**
   - File: [`scripts/database/add-staging-domain.sql`](scripts/database/add-staging-domain.sql)
   - Execute in Supabase Dashboard → SQL Editor
   - Adds `epartstaging.wpengine.com` to Thompson's account

2. **Test Staging Site**
   - Hard refresh: `Cmd+Shift+R` or `Ctrl+Shift+F5`
   - Open console, verify: `[Omniops Widget] Config loaded successfully`
   - Click chat button, confirm it works

3. **Verify No Errors**
   - Check console for any 404s or CORS errors
   - Verify chat responses work correctly
   - Test product search if applicable

### Optional Cleanup

4. **Remove Domain Alias Workaround**
   - Edit: `app/api/widget/config/route.ts`
   - Delete lines 35-41 (`DOMAIN_ALIASES` object)
   - Delete lines 62-66 (alias application logic)
   - Commit: `refactor: remove domain alias workaround`

5. **Document for Future Customers**
   - When new customer wants staging support
   - Run SQL to add their staging domain
   - Same organization_id, inherits config

---

## Future Enhancement: Dashboard UI

**Goal:** Let customers self-service add domains

**Mockup:**
```
┌──────────────────────────────────────────────┐
│ 🌐 Registered Domains                        │
├──────────────────────────────────────────────┤
│                                              │
│ ✓ thompsonseparts.co.uk        [Production] │
│   Active • Last updated: 2025-10-15          │
│                                              │
│ ✓ epartstaging.wpengine.com    [Staging]    │
│   Active • Last updated: 2025-11-02          │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ + Add New Domain                       │  │
│ └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Implementation:**
```typescript
// app/api/domains/route.ts
export async function POST(request: Request) {
  const { domain, organization_id } = await request.json();

  // Insert new domain with same org_id
  const { data, error } = await supabase
    .from('customer_configs')
    .insert({
      domain,
      organization_id,
      // Inherit config from primary domain
    });

  return NextResponse.json({ success: true });
}
```

---

## Success Criteria

### ✅ Staging Site Works
- [ ] `epartstaging.wpengine.com` returns Thompson's config from API
- [ ] Widget loads without errors
- [ ] Chat functionality works correctly
- [ ] No 404 errors in console

### ✅ Production Site Still Works
- [ ] `thompsonseparts.co.uk` continues to work
- [ ] No regressions introduced
- [ ] Same embed code on both sites

### ✅ Architecture Improved
- [ ] Domain alias workaround removed (optional)
- [ ] Multi-domain support documented
- [ ] Future customers can follow same pattern

---

## Files Reference

### SQL Script
- **Location:** `scripts/database/add-staging-domain.sql`
- **Purpose:** Add Thompson's staging domain to database
- **Usage:** Copy/paste into Supabase SQL Editor

### Documentation
- **Guide:** `docs/02-GUIDES/GUIDE_MULTI_DOMAIN_SUPPORT.md`
- **Purpose:** Comprehensive multi-domain setup guide
- **Audience:** Developers and customer support

### Code to Remove (Optional)
- **File:** `app/api/widget/config/route.ts`
- **Lines:** 35-41, 62-66
- **Purpose:** Domain alias workaround (no longer needed)

---

## Summary

**What You Said:**
> "All we need to do is allow the staging website in the same way to access Thompson's information from their domain. Just link it to that domain."

**What To Do:**
Run this SQL to link staging domain to Thompson's account:

```sql
INSERT INTO customer_configs (domain, organization_id, ...)
SELECT 'epartstaging.wpengine.com', organization_id, ...
FROM customer_configs WHERE domain = 'thompsonseparts.co.uk';
```

**Result:**
- ✅ Staging site works with same embed code as production
- ✅ Widget auto-detects domain and loads Thompson's config
- ✅ Proper SaaS architecture - data in database, not hardcoded
- ✅ Scalable for all future customers with staging sites

**Grade:** This is the correct SaaS approach. Domain aliases were a temporary workaround - the proper solution is multi-domain database support. 🎯
