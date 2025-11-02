# Embed URL Fix: Localhost → Production URL

**Date:** 2025-11-02
**Issue:** Installation pages were showing `http://localhost:3000` in embed code
**Status:** ✅ Fixed

---

## Problem Description

When viewing the installation/onboarding pages locally, the embed code snippets were showing:

```html
<script src="http://localhost:3000/embed.js" async></script>
```

This is incorrect because:
1. Customers would copy/paste localhost URLs into their production sites
2. The widget wouldn't load on their actual websites
3. Violates SaaS industry best practices (Stripe, Intercom, etc.)

## Root Cause

The code was using environment-aware URL generation:

```typescript
const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
setServerUrl(url);
```

When viewing locally:
- `NEXT_PUBLIC_APP_URL` = `http://localhost:3000` (from `.env.local`)
- Fallback to `window.location.origin` = `http://localhost:3000`
- Result: Embed code shows localhost URL ❌

## Solution

Implemented localhost detection with production URL override:

```typescript
const url = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;

// If URL contains localhost, use production domain instead
const productionUrl = url.includes('localhost')
  ? 'https://omniops.co.uk'
  : url;

setServerUrl(productionUrl);
```

**Result:** Embed code always shows `https://omniops.co.uk/embed.js` ✅

## Files Modified

### 1. `/app/dashboard/installation/page.tsx`
**Changes:**
- Added localhost detection logic (lines 28-37)
- Added development mode indicator banner (lines 112-118)
- Shows warning when viewing locally but embed code uses production URL

**Impact:** Main installation dashboard now shows correct URLs

### 2. `/app/dashboard/installation/components/PlatformGuides.tsx`
**Changes:**
- Updated fallback from `"https://your-domain.com"` to `"https://omniops.co.uk"` (line 14)

**Impact:** All platform-specific guides (WordPress, Shopify, Next.js, React, HTML) now show production URLs

### 3. `/app/dashboard/installation/components/QuickStart.tsx`
**Changes:**
- Updated fallback from `"https://your-domain.com"` to `"https://omniops.co.uk"` (line 47)

**Impact:** Quick start embed code generator uses production URL

### 4. `/app/install/page.tsx`
**Changes:**
- Added localhost detection logic (lines 6-9)
- Updated all embed code snippets to use `${serverUrl}` variable (lines 22, 41, 241)

**Impact:** Legacy installation page now shows correct URLs

## Industry Best Practices Followed

### ✅ Minimal Embed Code
Embed code remains 5-7 lines, not hardcoded configuration:

```html
<script>
window.ChatWidgetConfig = { serverUrl: "https://omniops.co.uk" };
</script>
<script src="https://omniops.co.uk/embed.js" async></script>
```

### ✅ Environment-Agnostic Installation
- Customers install once, never need to update code
- Configuration changes happen server-side
- Matches Intercom, Drift, Segment patterns

### ✅ Developer Experience
- Added visual indicator when viewing in dev mode
- Clear messaging: "This is correct - always use production URLs"
- Prevents confusion for developers testing locally

## Testing Recommendations

### Manual Testing:
1. **Local Development:**
   ```bash
   npm run dev
   # Visit: http://localhost:3000/dashboard/installation
   # Verify: Embed code shows https://omniops.co.uk
   # Verify: Warning banner shows "Development Mode" message
   ```

2. **Production:**
   ```bash
   # Visit: https://omniops.co.uk/dashboard/installation
   # Verify: Embed code shows https://omniops.co.uk
   # Verify: No warning banner (not localhost)
   ```

3. **Staging/Preview:**
   ```bash
   # Set: NEXT_PUBLIC_APP_URL=https://staging.omniops.co.uk
   # Verify: Embed code shows staging URL
   ```

### Automated Testing:
```typescript
// Test case to add:
describe('Installation Page', () => {
  it('should show production URL in embed code when viewing locally', () => {
    // Mock window.location.origin = 'http://localhost:3000'
    // Render InstallationPage
    // Expect embed code to contain 'https://omniops.co.uk'
    // Expect warning banner to be visible
  });

  it('should show production URL without warning in production', () => {
    // Mock window.location.origin = 'https://omniops.co.uk'
    // Render InstallationPage
    // Expect embed code to contain 'https://omniops.co.uk'
    // Expect warning banner to NOT be visible
  });
});
```

## Environment Variable Setup

**Development (`.env.local`):**
```bash
# Can stay as localhost for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Production (Vercel/hosting):**
```bash
# MUST be set to actual production domain
NEXT_PUBLIC_APP_URL=https://omniops.co.uk
```

**Staging:**
```bash
# Use staging domain
NEXT_PUBLIC_APP_URL=https://staging.omniops.co.uk
```

## Verification Checklist

- [x] Code changes implemented
- [x] TypeScript compilation passes
- [ ] Manual testing on localhost (pending server restart)
- [ ] Manual testing on production
- [ ] Update .env.example with clear comments
- [ ] Add automated tests
- [ ] Update deployment documentation

## Related Documentation

- **Industry Standards:** See [CLAUDE.md](../../CLAUDE.md) - "Industry Best Practices" section
- **Widget Embedding:** See [docs/02-GUIDES/GUIDE_WIDGET_ANIMATIONS.md](../../docs/02-GUIDES/GUIDE_WIDGET_ANIMATIONS.md)
- **Deployment:** See [docs/05-DEPLOYMENT/](../../docs/05-DEPLOYMENT/)

## Lessons Learned

### What Went Well:
✅ Clear pattern from industry leaders (Stripe, Intercom)
✅ Simple solution: localhost detection + override
✅ Added helpful developer UX (warning banner)
✅ Updated all relevant files consistently

### What Could Improve:
⚠️ Should have had automated tests catching this earlier
⚠️ Environment variables need better documentation
⚠️ Consider build-time URL validation

### Preventive Measures:
1. **Automated Test:** Add E2E test that verifies embed code URLs
2. **Build Validation:** Add check to fail build if production deploy has localhost URLs
3. **Documentation:** Update onboarding docs with environment variable setup
4. **Code Review:** Add checklist item for URL generation in new features

---

**Result:** Installation pages now correctly show production URLs regardless of where they're viewed from, following SaaS industry best practices. ✅
