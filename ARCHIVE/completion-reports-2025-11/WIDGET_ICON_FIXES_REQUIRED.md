# Widget Icon Customization - Required Code Fixes

**Status:** 6 TypeScript errors preventing feature completion
**Estimated Fix Time:** 2-3 hours
**Difficulty:** Medium

---

## Fix #1: Add branding Property to ChatWidgetConfig

**File:** `/components/ChatWidget/hooks/useChatState.ts`
**Lines:** 13-69
**Severity:** CRITICAL

### Current Code:
```typescript
export interface ChatWidgetConfig {
  headerTitle?: string;
  serverUrl?: string;
  domain?: string;
  features?: { /* ... */ };
  appearance?: { /* 40+ properties */ };
  // ❌ MISSING: branding property
}
```

### Required Fix:
Add this property to the interface:

```typescript
export interface ChatWidgetConfig {
  headerTitle?: string;
  serverUrl?: string;
  domain?: string;
  features?: {
    websiteScraping?: { enabled: boolean };
    woocommerce?: { enabled: boolean };
  };
  appearance?: { /* existing 40+ properties */ };

  // ✅ ADD THIS:
  branding?: {
    minimizedIconUrl?: string;
    customLogoUrl?: string;
  };
}
```

### Why:
The ChatWidget component (line 234) tries to access `demoConfig?.branding?.minimizedIconUrl`. Without this property in the type, TypeScript throws an error and the feature doesn't work.

---

## Fix #2: Update ChatWidget.tsx Icon Display Logic

**File:** `/components/ChatWidget.tsx`
**Lines:** 230-235
**Severity:** CRITICAL

### Current Code:
```typescript
const minimizedIconUrl = demoConfig?.branding?.minimizedIconUrl || demoConfig?.appearance?.minimizedIconUrl;
```

### Issue:
- TypeScript error: `Property 'branding' does not exist`
- TypeScript error: `Property 'minimizedIconUrl' does not exist on appearance`

### Required Fix:

**Option A: After adding branding to ChatWidgetConfig (recommended)**
```typescript
const minimizedIconUrl = demoConfig?.branding?.minimizedIconUrl;
```

**Option B: More defensive (includes legacy support)**
```typescript
const minimizedIconUrl =
  demoConfig?.branding?.minimizedIconUrl ||
  (demoConfig as any)?.minimizedIconUrl ||
  undefined;
```

### Context (Lines 225-290):
```typescript
if (!isOpen) {
  // ... button rendering code ...
  const minimizedIconUrl = demoConfig?.branding?.minimizedIconUrl;

  return (
    <div className="fixed bottom-1 right-1 z-50">
      <button
        // ... button props ...
      >
        {/* ... animation rings ... */}

        {/* Icon with hover scale effect */}
        {minimizedIconUrl ? (
          <img
            src={minimizedIconUrl}
            alt="Chat"
            className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform object-contain"
            aria-hidden="true"
            onError={(e) => {
              // Fallback to default icon on error
              e.currentTarget.style.display = 'none';
              const fallbackIcon = document.createElement('div');
              fallbackIcon.innerHTML = '<svg>...</svg>';
              e.currentTarget.parentNode?.appendChild(fallbackIcon.firstChild as Node);
            }}
          />
        ) : (
          <MessageCircle className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
```

---

## Fix #3: Correct Import in LivePreview Component

**File:** `/app/dashboard/customize/components/LivePreview.tsx`
**Line:** 7
**Severity:** HIGH

### Current Code:
```typescript
import type { SimplifiedWidgetConfig } from "../page";
```

### Issue:
Module 'page' has no exported member 'SimplifiedWidgetConfig'

### Required Fix:
```typescript
import type { SimplifiedWidgetConfig } from "../types";
```

### Verification:
Check that `/app/dashboard/customize/types.ts` exports SimplifiedWidgetConfig:
```typescript
export interface SimplifiedWidgetConfig {
  essentials: { /* ... */ };
  intelligence: { /* ... */ };
  connect: { /* ... */ };
}

export const defaultConfig: SimplifiedWidgetConfig = { /* ... */ };
```

---

## Fix #4: Add minimizedIconUrl to LivePreview Mapping

**File:** `/app/dashboard/customize/components/LivePreview.tsx`
**Lines:** 19-54
**Severity:** HIGH

### Current Code:
```typescript
const widgetConfig = useMemo(() => ({
  theme_settings: {
    primaryColor: config.essentials.primaryColor,
    fontFamily: 'system-ui',
  },
  position_settings: {
    position: config.essentials.position,
  },
  behavior_settings: {
    botName: config.essentials.botName,
    welcomeMessage: config.essentials.welcomeMessage,
    placeholderText: config.essentials.placeholderText,
    showAvatar: config.essentials.showAvatar,
    autoOpen: config.essentials.autoOpen,
    openDelay: config.essentials.autoOpenDelay,
    soundNotifications: config.essentials.soundNotifications,
  },
  ai_settings: {
    personality: config.intelligence.personality,
    language: config.intelligence.language,
    responseLength: config.intelligence.responseStyle,
    enableSmartSuggestions: config.intelligence.enableSmartSuggestions,
  },
  branding_settings: {
    customLogoUrl: config.essentials.logoUrl,
    // ❌ MISSING: minimizedIconUrl
  },
  // ... rest
}), [config]);
```

### Required Fix:
```typescript
const widgetConfig = useMemo(() => ({
  theme_settings: {
    primaryColor: config.essentials.primaryColor,
    fontFamily: 'system-ui',
  },
  position_settings: {
    position: config.essentials.position,
  },
  behavior_settings: {
    botName: config.essentials.botName,
    welcomeMessage: config.essentials.welcomeMessage,
    placeholderText: config.essentials.placeholderText,
    showAvatar: config.essentials.showAvatar,
    autoOpen: config.essentials.autoOpen,
    openDelay: config.essentials.autoOpenDelay,
    soundNotifications: config.essentials.soundNotifications,
  },
  ai_settings: {
    personality: config.intelligence.personality,
    language: config.intelligence.language,
    responseLength: config.intelligence.responseStyle,
    enableSmartSuggestions: config.intelligence.enableSmartSuggestions,
  },
  branding_settings: {
    customLogoUrl: config.essentials.logoUrl,
    minimizedIconUrl: config.essentials.minimizedIconUrl,  // ✅ ADD THIS
  },
  integration_settings: {
    enableWooCommerce: config.connect.enableWooCommerce,
    enableWebSearch: config.intelligence.enableWebSearch,
    enableKnowledgeBase: config.connect.enableKnowledgeBase,
  },
  analytics_settings: {
    trackConversations: config.connect.trackConversations,
    dataRetentionDays: config.connect.dataRetentionDays,
  },
}), [config]);
```

### Why:
Without this mapping, the live preview won't pass the minimizedIconUrl to the ChatWidget component, so users won't see their custom icon in real-time while editing.

---

## Fix #5: Enhance RLS Policies for Multi-Tenant Security

**File:** `/supabase/migrations/20251103_create_widget_assets_bucket.sql`
**Lines:** 22-47
**Severity:** HIGH

### Current Code (Security Issue):
```sql
-- Policy: Authenticated users can upload widget assets for their organization
CREATE POLICY "Authenticated users can upload widget assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL
);
```

### Problem:
Any authenticated user can upload/delete ANY organization's assets. The policy doesn't verify organization membership.

### Required Fix:

**Option 1: Database Check (Recommended)**
```sql
-- Better policy with organization verification
CREATE POLICY "Authenticated users can upload organization widget assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Verify path pattern and user's organization
  CASE
    WHEN (storage.foldername(name))[1] = 'organizations' THEN
      (SELECT EXISTS(
        SELECT 1 FROM public.organizations
        WHERE id = (storage.foldername(name))[2]::uuid
        AND organization_id IN (
          SELECT organization_id FROM public.user_organizations
          WHERE user_id = auth.uid()
        )
      ))
    ELSE false
  END
);
```

**Option 2: Simple Organization Check (If path contains org_id)**
```sql
CREATE POLICY "Authenticated users can upload organization widget assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  -- Ensure path starts with 'organizations/{org_id}'
  (storage.foldername(name))[1] = 'organizations'
);

-- Then add a trigger to validate organization ownership
CREATE OR REPLACE FUNCTION validate_widget_asset_organization()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate user belongs to organization
  IF NOT EXISTS(
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(NEW.name))[2]::uuid
  ) THEN
    RAISE EXCEPTION 'User does not have access to this organization';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Update DELETE Policy Similarly:
```sql
-- Current (insecure)
CREATE POLICY "Users can delete their organization widget assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL
);

-- Fixed (with organization check)
CREATE POLICY "Users can delete their organization widget assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'widget-assets' AND
  auth.uid() IS NOT NULL AND
  (SELECT EXISTS(
    SELECT 1 FROM public.user_organizations
    WHERE user_id = auth.uid()
    AND organization_id = (storage.foldername(name))[2]::uuid
  ))
);
```

### Why:
Without organization-level isolation, any authenticated user can see, modify, or delete assets from ANY organization. This is a critical security vulnerability.

---

## Fix #6: Update Database Default Schema

**File:** `/migrations/create_widget_configs_tables.sql`
**Location:** branding_settings default JSON
**Severity:** MEDIUM

### Current Code:
```sql
branding_settings JSONB DEFAULT '{
    "showPoweredBy": true,
    "customBrandingText": "",
    "customLogoUrl": "",
    "customFaviconUrl": "",
    "brandColors": {}
}'::jsonb,
```

### Required Fix:
```sql
branding_settings JSONB DEFAULT '{
    "showPoweredBy": true,
    "customBrandingText": "",
    "customLogoUrl": "",
    "minimizedIconUrl": "",
    "customFaviconUrl": "",
    "brandColors": {}
}'::jsonb,
```

### Why:
Ensures all new configurations have the minimizedIconUrl field, even if it's empty. Prevents null reference errors downstream.

---

## Application Order (Sequential)

**Step 1:** Fix ChatWidgetConfig interface (Fix #1)
**Step 2:** Fix ChatWidget.tsx (Fix #2)
**Step 3:** Fix LivePreview imports (Fix #3)
**Step 4:** Fix LivePreview mappings (Fix #4)
**Step 5:** Enhance RLS policies (Fix #5)
**Step 6:** Update database defaults (Fix #6)

---

## Verification Steps

### After Fixes:

1. **Type Check:**
   ```bash
   npx tsc --noEmit
   # Should report 0 errors related to widget icon feature
   ```

2. **Build:**
   ```bash
   npm run build
   # Should compile without widget-related warnings
   ```

3. **Manual Testing:**
   - Upload custom icon from dashboard
   - See preview in live preview panel
   - Save configuration
   - Verify icon displays in minimized widget button
   - Test fallback to default icon if URL broken

4. **Security Test:**
   - Log in as User A, upload asset to Org A
   - Log in as User B
   - Verify User B cannot access/delete User A's assets

---

## Files to Modify (Summary)

| File | Changes | Lines |
|------|---------|-------|
| `/components/ChatWidget/hooks/useChatState.ts` | Add branding interface | 69 |
| `/components/ChatWidget.tsx` | Update icon reference | 234 |
| `/app/dashboard/customize/components/LivePreview.tsx` | Fix import + add mapping | 7, 42-44 |
| `/supabase/migrations/20251103_create_widget_assets_bucket.sql` | Enhance RLS policies | 22-47 |
| `/migrations/create_widget_configs_tables.sql` | Update default JSON | branding_settings |

**Total Lines to Change:** ~25 lines
**Total Files to Modify:** 5 files

---

## Testing Checklist

- [ ] Type check passes with 0 errors
- [ ] Build compiles successfully
- [ ] Upload endpoint works
- [ ] Configuration saves correctly
- [ ] Custom icon displays in minimized widget
- [ ] Live preview shows custom icon
- [ ] Fallback to default icon on broken URL
- [ ] RLS policies prevent cross-org access
- [ ] Delete endpoint works
- [ ] No regression in other features

---

**Prepared By:** Code Analysis Agent
**Date:** 2025-11-03
**Status:** Ready for Implementation
