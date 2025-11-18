**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Playwright E2E Test Helpers

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 3 minutes


**Purpose:** Reusable helper functions for Playwright E2E tests to reduce code duplication and maintain consistency.

**Last Updated:** 2025-11-15
**Status:** Active
**Related:** `__tests__/playwright/`, `__tests__/utils/playwright/`

## Helper Files

### selector-helpers.ts (91 LOC)
Common selector patterns and element finding utilities.

**Exports:**
- `SEARCH_SELECTORS` - Search input selector patterns
- `EMPTY_STATE_SELECTORS` - Empty state message selectors
- `CONVERSATION_ITEM_SELECTORS` - Conversation item selectors
- `findElement(page, selectors, timeout)` - Find element using multiple strategies
- `isAnyVisible(page, selectors, timeout)` - Check if any selector is visible
- `getTextFromSelectors(page, selectors)` - Get text from first matching element

**Usage:**
```typescript
import { findElement, SEARCH_SELECTORS } from '../helpers/selector-helpers';

const searchInput = await findElement(page, SEARCH_SELECTORS);
```

### keyboard-helpers.ts (50 LOC)
Keyboard interaction and shortcut testing utilities.

**Exports:**
- `testKeyboardShortcut(page, key, elementSelectors)` - Test keyboard shortcut focusing
- `clearWithEscape(page, inputElement)` - Clear input using Escape key

**Usage:**
```typescript
import { testKeyboardShortcut, clearWithEscape } from '../helpers/keyboard-helpers';

const worked = await testKeyboardShortcut(page, '/', SEARCH_SELECTORS);
await clearWithEscape(page, searchInput);
```

### conflict-helpers.ts (143 LOC)
Database conflict simulation and resolution testing.

**Exports:**
- `setupConflictMock(page, apiPath)` - Setup route mock for concurrent edits
- `ConflictMockState` - Type for mock state tracking
- `CONFLICT_ERROR_SELECTORS` - Conflict error message selectors
- `RESOLUTION_OPTION_SELECTORS` - Conflict resolution button selectors
- `COMPARISON_SELECTORS` - Change comparison UI selectors
- `SUCCESS_MESSAGE_SELECTORS` - Success message selectors

**Usage:**
```typescript
import { setupConflictMock, CONFLICT_ERROR_SELECTORS } from '../helpers/conflict-helpers';

const mockState = await setupConflictMock(page, '**/api/domains/*/settings');
// ... trigger conflict ...
expect(mockState.conflictDetected).toBe(true);
```

### filter-helpers.ts (50 LOC)
Conversation filter panel interaction helpers.

**Exports:**
- `openFiltersPanel(page)` - Open advanced filters panel
- `applyDateRangeFilter(page, dateRange)` - Apply date range filter
- `applyStatusFilter(page, status)` - Apply status filter
- `submitFilters(page)` - Submit filter form

**Usage:**
```typescript
import { openFiltersPanel, applyStatusFilter } from '../helpers/filter-helpers';

await openFiltersPanel(page);
await applyStatusFilter(page, 'resolved');
```

### search-test-helpers.ts (46 LOC)
Search functionality testing helpers.

**Exports:**
- `testSpecialCharacterSearch(page, searchInput)` - Test special character queries
- `verifyConversationContent(page, searchTerm)` - Verify search term in conversation

**Usage:**
```typescript
import { testSpecialCharacterSearch } from '../helpers/search-test-helpers';

await testSpecialCharacterSearch(page, searchInput);
```

### test-data.ts (39 LOC)
Common test data and selector constants.

**Exports:**
- `SPECIAL_SEARCH_QUERIES` - Special character test cases
- `TEST_AUTH_COOKIE` - Authentication cookie for tests
- `FILTER_BUTTON_SELECTORS` - Filter button selectors
- `DATE_RANGE_SELECTORS` - Date range filter selectors
- `STATUS_CHECKBOX_TEMPLATE(status)` - Status checkbox selector generator
- `APPLY_BUTTON_SELECTORS` - Apply/Submit button selectors

**Usage:**
```typescript
import { TEST_AUTH_COOKIE, SPECIAL_SEARCH_QUERIES } from '../helpers/test-data';

await page.context().addCookies([TEST_AUTH_COOKIE]);
```

## Benefits

**Before Refactoring:**
- `chat-history-search.spec.ts`: 299 LOC
- `database-conflict.spec.ts`: 293 LOC
- **Total:** 592 LOC

**After Refactoring:**
- `chat-history-search.spec.ts`: 268 LOC (-31 LOC, -10%)
- `database-conflict.spec.ts`: 199 LOC (-94 LOC, -32%)
- `helpers/`: 419 LOC (reusable across all tests)
- **Total:** 886 LOC (+294 LOC investment for reusability)

**Key Improvements:**
- ✅ Both files under 280 LOC target
- ✅ All helper files under 200 LOC
- ✅ Eliminated code duplication
- ✅ Improved test readability
- ✅ Easier maintenance (change once, apply everywhere)
- ✅ Consistent selector strategies across tests

## Adding New Helpers

When creating new helper functions:

1. **Choose the right file:**
   - Selector finding → `selector-helpers.ts`
   - Keyboard interactions → `keyboard-helpers.ts`
   - Test data/constants → `test-data.ts`
   - Domain-specific logic → Create new `*-helpers.ts`

2. **Follow naming conventions:**
   - Functions: `camelCase` with action verbs (e.g., `findElement`, `applyFilter`)
   - Constants: `UPPER_SNAKE_CASE` (e.g., `SEARCH_SELECTORS`)
   - Types: `PascalCase` (e.g., `ConflictMockState`)

3. **Document exports:**
   - Add JSDoc comments
   - Update this README
   - Provide usage examples

4. **Keep files under 200 LOC:**
   - Split into multiple files if needed
   - Group by functionality/domain
