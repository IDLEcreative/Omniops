# Recommended Fix: `/api/customer/config/current`

**Priority**: P0 (Must fix before production)
**Issue**: Missing null check for `createClient()` result

---

## The Issue

Current implementation (Lines 37-46):
```typescript
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    // ❌ CRASH HERE if supabase is null
```

**Problem**: If Supabase environment variables are missing:
1. `createClient()` returns `null` (from `/lib/supabase/server.ts` line 48)
2. Next line tries to call `.auth.getUser()` on null
3. Uncaught exception: `Cannot read property 'auth' of null`
4. Returns 500 error with no helpful message

---

## Root Cause

In `/lib/supabase/server.ts` (lines 44-49):
```typescript
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Supabase] Missing environment variables for createClient')
  }
  return null  // ⬅️ Returns null instead of throwing
}
```

The function returns `null` for graceful degradation in development, but the caller doesn't check for it.

---

## The Fix

Replace lines 37-46 with:

```typescript
export async function GET() {
  try {
    // Get authenticated user
    const supabase = await createClient();

    // ✅ ADD THIS CHECK
    if (!supabase) {
      logger.error('Supabase client initialization failed');
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    // ... rest of code
```

---

## Complete Fixed Function

```typescript
/**
 * Current User Customer Configuration API
 *
 * Automatically fetches the customer config for the authenticated user's organization
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/customer/config/current
 * Get customer configuration for the current authenticated user's organization
 *
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     domain: string,
 *     business_name: string,
 *     business_description: string,
 *     primary_color: string,
 *     welcome_message: string,
 *     suggested_questions: array,
 *     woocommerce_url: string,
 *     shopify_shop: string,
 *     organization_id: string,
 *     ...other fields
 *   }
 * }
 */
export async function GET() {
  try {
    // Get Supabase client
    const supabase = await createClient();

    // ✅ ADDED: Handle missing environment variables
    if (!supabase) {
      logger.error('Supabase client initialization failed - missing environment variables');
      return NextResponse.json(
        { success: false, error: 'Service unavailable' },
        { status: 503 }
      );
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's organization membership
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      logger.warn('User has no organization', { userId: user.id, error: membershipError });
      return NextResponse.json({
        success: false,
        error: 'No organization found for user',
      }, { status: 404 });
    }

    // Get customer config for the organization
    const { data: customerConfig, error: configError } = await supabase
      .from('customer_configs')
      .select('*')
      .eq('organization_id', membership.organization_id)
      .eq('active', true)
      .single();

    if (configError || !customerConfig) {
      logger.warn('No customer config found for organization', {
        organizationId: membership.organization_id,
        error: configError
      });

      return NextResponse.json({
        success: false,
        error: 'No customer configuration found',
        message: 'Please configure your domain in settings first'
      }, { status: 404 });
    }

    // Return the config (excluding sensitive fields)
    const {
      woocommerce_consumer_key,
      woocommerce_consumer_secret,
      encrypted_credentials,
      shopify_access_token,
      ...safeConfig
    } = customerConfig;

    return NextResponse.json({
      success: true,
      data: safeConfig
    });

  } catch (error) {
    logger.error('GET /api/customer/config/current error', { error });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

---

## What This Fix Does

### ✅ Improvements

1. **Handles Missing Environment Variables**
   - Gracefully returns 503 Service Unavailable
   - Generic error message (no details leak)
   - Proper logging for debugging

2. **Better Error Messages**
   - 503 (Service Unavailable) signals temporary issue
   - Distinct from 401 (auth failure) or 404 (not found)
   - Helps clients implement proper retry logic

3. **Debugging Support**
   - Logs clearly indicate missing env vars
   - Easier to diagnose deployment issues
   - Distinguishes from other errors

4. **HTTP Spec Compliance**
   - 503 is correct status for temporary unavailability
   - Client should retry with backoff
   - Different from permanent errors (404, 401)

---

## Testing the Fix

### Scenario 1: With Fix Installed
```bash
# Remove env vars
unset NEXT_PUBLIC_SUPABASE_URL

# Make request
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: valid-session-cookie"

# Response:
# Status: 503
# Body: { "success": false, "error": "Service unavailable" }
# Logs: "Supabase client initialization failed - missing environment variables"
```

### Scenario 2: Without Fix (Current)
```bash
# Same setup...
# Response:
# Status: 500
# Body: { "success": false, "error": "Internal server error" }
# Logs: "Cannot read property 'auth' of null"
# ❌ Not helpful
```

---

## Why This Matters

### Development Impact
- Clearer error messages when env vars misconfigured
- Faster debugging of deployment issues
- Consistent with other endpoints

### Production Impact
- Better client error handling (503 vs 500)
- Clearer logs for monitoring/alerting
- Proper distinction between temporary and permanent failures

### User Experience
- Proper error messages guide users
- Retry logic can work correctly (backoff for 503, don't retry 401)
- Better chance of automatic recovery on transient failures

---

## Implementation Steps

1. **Edit the file**:
   ```bash
   nano /Users/jamesguy/Omniops/app/api/customer/config/current/route.ts
   ```

2. **After line 37** (`const supabase = await createClient();`), add:
   ```typescript

   if (!supabase) {
     logger.error('Supabase client initialization failed - missing environment variables');
     return NextResponse.json(
       { success: false, error: 'Service unavailable' },
       { status: 503 }
     );
   }
   ```

3. **Save the file**

4. **Verify fix**:
   ```bash
   npm run dev  # Should not crash on bad env
   ```

5. **Commit the fix**:
   ```bash
   git add app/api/customer/config/current/route.ts
   git commit -m "fix: add null check for createClient in current config endpoint"
   ```

---

## Related Endpoints to Check

This same pattern may exist in other endpoints using `createClient()`:

```bash
# Find all uses of createClient() without null checks
grep -r "createClient()" app/api --include="*.ts" | \
  xargs grep -L "if (!supabase)" | \
  head -20
```

**Recommendation**: Apply same fix to all affected endpoints for consistency.

---

## Code Review Notes

**Before Merge**:
- [ ] Fix applied correctly
- [ ] Status code is 503 (not 500)
- [ ] Logging message is clear
- [ ] Tests pass with env vars missing
- [ ] No other endpoints have same issue
- [ ] Commit message is clear

**After Merge**:
- [ ] Deployed to staging
- [ ] Tested with missing env vars
- [ ] Error logs are correct
- [ ] Client can handle 503 properly
- [ ] Monitor for any regressions

---

## Summary

**Change Type**: Bug fix (error handling)
**Priority**: P0 (must fix before production)
**Risk**: LOW (only affects error path)
**Testing**: Requires env var test scenario
**Review**: Simple, isolated fix

This fix ensures the endpoint handles missing configuration gracefully instead of crashing with an uncaught exception.

---

**Fix Version**: 1.0
**Created**: 2025-10-28
**Status**: Ready to apply
