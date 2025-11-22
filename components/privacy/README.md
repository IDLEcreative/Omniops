# Privacy Components

**Purpose:** Standalone privacy-related UI components for GDPR compliance and user data management.

**Last Updated:** 2025-11-22

## Components

### 1. ExportDataButton
**File:** `export-data-button.tsx` (79 lines)
- Standalone button for data export functionality
- Handles ZIP/JSON file downloads
- Shows loading states and error handling
- Integrates with `/api/privacy/export` endpoint

**Usage:**
```tsx
import { ExportDataButton } from '@/components/privacy/export-data-button';

// Basic usage
<ExportDataButton />

// With custom styling
<ExportDataButton variant="outline" size="sm" className="mt-4" />
```

### 2. DeleteAccountButton
**File:** `delete-account-button.tsx` (60 lines)
- Button that triggers account deletion flow
- Opens confirmation modal
- Optionally requires password verification
- Handles post-deletion redirect

**Usage:**
```tsx
import { DeleteAccountButton } from '@/components/privacy/delete-account-button';

// Basic usage
<DeleteAccountButton />

// With callback
<DeleteAccountButton
  onAccountDeleted={() => router.push('/goodbye')}
  requirePassword={true}
/>
```

### 3. DeleteConfirmationModal
**File:** `delete-confirmation-modal.tsx` (116 lines)
- Modal dialog for delete account confirmation
- Password verification support
- Clear warnings about permanent deletion
- Checkbox confirmation requirement

**Usage:**
```tsx
import { DeleteConfirmationModal } from '@/components/privacy/delete-confirmation-modal';

<DeleteConfirmationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDelete}
  requirePassword={true}
/>
```

### 4. CookiePreferences
**File:** `cookie-preferences.tsx` (225 lines)
- Comprehensive cookie preference management
- Essential, Analytics, and Marketing cookie toggles
- Saves preferences to localStorage and cookies
- Integrates with Google Analytics consent API

**Features:**
- Essential cookies always enabled (required for functionality)
- Analytics cookies control Google Analytics tracking
- Marketing cookies control advertising/tracking cookies
- Auto-saves to localStorage and sets browser cookies
- Clears tracking cookies when disabled

**Usage:**
```tsx
import { CookiePreferences } from '@/components/privacy/cookie-preferences';

<CookiePreferences />
```

### 5. PrivacyRightsInfo
**File:** `privacy-rights-info.tsx` (176 lines)
- Static display of GDPR rights (Articles 15-22)
- Visual icons for each right
- Implementation status badges
- Optional action links for exercising rights

**Features:**
- All 8 GDPR articles explained
- Clear descriptions of each right
- How-to guide for exercising rights
- Visual design with icons and cards

**Usage:**
```tsx
import { PrivacyRightsInfo } from '@/components/privacy/privacy-rights-info';

// Static display
<PrivacyRightsInfo />

// With interactive actions
<PrivacyRightsInfo
  showActions={true}
  onActionClick={(article) => handleArticleAction(article)}
/>
```

## API Integration

These components integrate with the following API endpoints:
- `/api/privacy/export` - Data export (POST)
- `/api/privacy/delete` - Account deletion (POST)

## Accessibility

All components follow WCAG 2.1 AA standards:
- Keyboard navigation support
- ARIA labels and descriptions
- Focus management
- Screen reader friendly

## Testing

Test file available at:
- `__tests__/components/privacy/export-data-button.test.tsx` (104 lines)
  - Button rendering
  - Loading states
  - Success/error handling
  - Network error handling
  - Props testing

## Related Files

- **Dashboard Page:** `/app/dashboard/privacy/page.tsx` - Main privacy dashboard
- **Dashboard Components:** `/components/dashboard/privacy/*` - Additional privacy components
- **Types:** `/types/privacy.ts` - TypeScript definitions for privacy settings

## Design Principles

1. **Brand-agnostic:** No hardcoded business logic
2. **Mobile-responsive:** Works on all screen sizes
3. **Error handling:** User-friendly error messages
4. **Loading states:** Clear feedback during async operations
5. **TypeScript:** Fully typed for type safety

## Total Lines of Code

- `export-data-button.tsx`: 79 lines
- `delete-account-button.tsx`: 60 lines
- `delete-confirmation-modal.tsx`: 116 lines
- `cookie-preferences.tsx`: 225 lines
- `privacy-rights-info.tsx`: 176 lines
- **Total:** 656 lines (all files under 300 LOC requirement ✅)