# WooCommerce Hooks

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-08
**Verified For:** v0.1.0
**Dependencies:** [WooCommerce Configure Page](/home/user/Omniops/app/dashboard/integrations/woocommerce/configure/page.tsx), [WooCommerce API Utilities](/home/user/Omniops/lib/woocommerce-api/), [All Hooks](/home/user/Omniops/hooks/README.md)
**Estimated Read Time:** 4 minutes

## Purpose

Custom React hooks for WooCommerce integration functionality, providing state management and business logic for configuration, credential management, and connection testing.

## Hooks

### useWooCommerceConfiguration (225 LOC)

**Purpose:** Manages state and business logic for WooCommerce configuration page.

**Responsibilities:**
1. Load existing configuration from API
2. Handle credential placeholder/real value switching
3. Test WooCommerce connection
4. Save configuration to database
5. Manage loading states and error messages

**API:**
```typescript
const {
  // State
  storeUrl,              // string - WooCommerce store URL
  consumerKey,           // string - Consumer key (real or placeholder)
  consumerSecret,        // string - Consumer secret (real or placeholder)
  testResult,            // TestResult | null - Connection test result
  loading,               // boolean - Loading state

  // Actions
  setStoreUrl,           // (url: string) => void
  handleConsumerKeyChange,      // (key: string) => void
  handleConsumerSecretChange,   // (secret: string) => void
  handleTestConnection,  // () => Promise<void>
  handleSave,            // () => Promise<void>
} = useWooCommerceConfiguration();
```

**Usage Example:**
```tsx
import { useWooCommerceConfiguration } from '@/hooks/woocommerce/useWooCommerceConfiguration';

export default function ConfigurePage() {
  const {
    storeUrl,
    consumerKey,
    consumerSecret,
    testResult,
    loading,
    setStoreUrl,
    handleConsumerKeyChange,
    handleConsumerSecretChange,
    handleTestConnection,
    handleSave,
  } = useWooCommerceConfiguration();

  return (
    <CredentialsForm
      storeUrl={storeUrl}
      consumerKey={consumerKey}
      consumerSecret={consumerSecret}
      onStoreUrlChange={setStoreUrl}
      onConsumerKeyChange={handleConsumerKeyChange}
      onConsumerSecretChange={handleConsumerSecretChange}
    />
  );
}
```

**Features:**

1. **Auto-load Configuration**
   - Loads existing config on mount
   - Shows placeholder values for existing credentials
   - Protects sensitive data from immediate exposure

2. **Lazy Credential Fetching**
   - Only fetches real credentials when user starts editing
   - Prevents unnecessary API calls
   - Security: minimizes credential exposure

3. **Connection Testing**
   - Saves credentials before testing (if new)
   - Tests connection using saved database credentials
   - Displays detailed success/error messages
   - Shows test product info on success

4. **Smart Save Logic**
   - Detects if credentials are placeholder values
   - Skips save if config already exists
   - Redirects to integrations page on success
   - Handles all error states with user feedback

**API Endpoints Used:**
- `GET /api/woocommerce/configure?domain={hostname}` - Load config
- `GET /api/woocommerce/credentials?domain={hostname}` - Fetch real credentials
- `POST /api/woocommerce/configure` - Save configuration
- `GET /api/woocommerce/test?mode=dynamic&domain={hostname}` - Test connection

**State Flow:**
```
Initial Load
    ↓
Load Config → Set placeholder values if exists
    ↓
User edits field → Fetch real credentials (if placeholder)
    ↓
Test Connection → Save config (if new) → Test → Show result
    ↓
Save → Check if placeholder → Redirect or save → Redirect
```

**Error Handling:**
- All API calls wrapped in try/catch
- User-friendly error messages
- Loading states prevent duplicate submissions
- Validation before API calls

## Testing

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useWooCommerceConfiguration } from './useWooCommerceConfiguration';

test('loads configuration on mount', async () => {
  const { result, waitForNextUpdate } = renderHook(() =>
    useWooCommerceConfiguration()
  );

  await waitForNextUpdate();

  expect(result.current.storeUrl).toBeDefined();
});
```

## Related Files

**Components that use this hook:**
- [WooCommerce Configure Page](/app/dashboard/integrations/woocommerce/configure/page.tsx)

**API Routes:**
- [Configure API](/app/api/woocommerce/configure/route.ts)
- [Credentials API](/app/api/woocommerce/credentials/route.ts)
- [Test API](/app/api/woocommerce/test/route.ts)
