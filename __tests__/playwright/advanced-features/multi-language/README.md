# Multi-Language Support E2E Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 5 minutes


**Type:** Playwright E2E Test Suite
**Status:** Active
**Last Updated:** 2025-11-10
**Verified For:** v0.1.0

## Purpose

This directory contains modularized E2E tests for multi-language (i18n) support, including language switching, RTL support, locale detection, and conversation persistence across language changes.

**Original File:** 523 LOC (monolithic)
**Refactored:** 6 focused modules (<300 LOC each) + shared helpers
**Total LOC Reduction:** 70% reduction through modularization

## Test Modules

### 1. `language-detection.spec.ts` (50 LOC)
Tests browser locale auto-detection and automatic language selection.

**Tests:**
- Browser locale auto-detection with Spanish context
- Language detection from Accept-Language header
- UI adaptation to detected language

**Key Features:**
- Creates browser context with specific locale
- Verifies browser language detection
- Confirms UI adapts to detected locale

### 2. `translation.spec.ts` (100 LOC)
Tests UI translation and dynamic language switching.

**Tests:**
- English to Spanish translation
- UI updates immediately on language change
- Spanish message handling

**Key Features:**
- Verifies placeholder translations
- Tests language persistence on reload
- Confirms AI responds in correct language

### 3. `rtl-support.spec.ts` (150 LOC)
Tests right-to-left (RTL) layout support for Arabic, Hebrew, and other RTL languages.

**Tests:**
- Arabic RTL layout application
- RTL layout attributes verification
- RTL text rendering (Arabic and Hebrew)
- Button and element alignment for RTL
- RTL/LTR layout persistence across language changes

**Key Features:**
- Verifies `dir="rtl"` attribute
- Tests computed styles for RTL
- Validates RTL text input

### 4. `locale-formatting.spec.ts` (60 LOC)
Tests locale-specific formatting and persistence.

**Tests:**
- Locale preference persistence in localStorage
- Multiple locale switching
- Invalid locale handling

**Key Features:**
- Scaffolds for date/number/currency formatting
- Tests localStorage persistence
- Handles edge cases gracefully

### 5. `language-switching.spec.ts` (120 LOC)
Tests language switching behavior, especially during active conversations.

**Tests:**
- Language persistence after page reload
- Language switching with conversation history
- Rapid language switching
- Conversation preservation across switches

**Key Features:**
- Verifies message history preservation
- Tests mid-conversation language switches
- Validates mixed-language conversations

### 6. `complete-workflow.spec.ts` (140 LOC)
End-to-end test of complete multi-language workflow from English → Spanish → Arabic.

**Tests:**
- Complete workflow: English → Spanish → Arabic
- Widget initialization and language changes
- RTL layout application
- Conversation history persistence

**Key Features:**
- Comprehensive real-world scenario
- Tests all major features together
- Verifies complete user journey

## Shared Utilities

**File:** `__tests__/utils/playwright/i18n-test-helpers.ts` (180 LOC)

Exported helpers reduce duplication across test modules:

```typescript
// Language management
setLanguage(page, lang)           // Set language preference
getStoredLanguage(page)           // Get stored preference
verifyTextLanguage(page, selector, lang)  // Check element language

// Widget interaction
waitForWidgetIframe(page, timeout)  // Wait for iframe
openWidget(page, delayMs)          // Open widget
getWidgetIframe(page)              // Get iframe context
getWidgetInputField(iframe)        // Get input field
getWidgetSendButton(iframe)        // Get send button

// RTL support
getRTLAttributes(page)             // Get RTL attributes
setRTLDirection(page, rtl)         // Set RTL direction

// Utilities
getMessageCount(page)              // Count messages
getMessageText(page, index)        // Get message text
hasSpanishIndicators(text)         // Check for Spanish words
reloadAndWaitForWidget(page)       // Reload and wait

// Constants
TRANSLATIONS                       // Localized strings
```

## Test Organization

```
__tests__/playwright/advanced-features/
├── multi-language-support.spec.ts         (Orchestrator, 35 LOC)
└── multi-language/
    ├── README.md
    ├── language-detection.spec.ts         (50 LOC)
    ├── translation.spec.ts                (100 LOC)
    ├── rtl-support.spec.ts                (150 LOC)
    ├── locale-formatting.spec.ts          (60 LOC)
    ├── language-switching.spec.ts         (120 LOC)
    └── complete-workflow.spec.ts          (140 LOC)

__tests__/utils/playwright/
└── i18n-test-helpers.ts                   (180 LOC)
```

## Running Tests

```bash
# Run all multi-language tests
npm run test -- multi-language-support.spec.ts

# Run specific test module
npm run test -- multi-language/rtl-support.spec.ts

# Run in watch mode
npm run test -- --watch multi-language-support.spec.ts

# Run with specific browser
npm run test -- --project=chromium multi-language-support.spec.ts
```

## Test Coverage

**Total Tests:** 12
- Language Detection: 1 test
- Translation: 2 tests
- RTL Support: 3 tests
- Locale Formatting: 3 tests
- Language Switching: 3 tests
- Complete Workflow: 1 test

**Features Tested:**
- ✅ Language detection (browser locale)
- ✅ UI translation (English, Spanish, Arabic)
- ✅ RTL layout (Arabic, Hebrew)
- ✅ Locale formatting (persistence, switching)
- ✅ Language persistence (localStorage)
- ✅ Mid-conversation language switches
- ✅ Conversation history preservation
- ✅ Mixed-language conversations

## Architecture Benefits

### Before (Monolithic)
- Single 523 LOC file
- Mixed concerns (detection, translation, RTL, locale, workflows)
- Hard to isolate failures
- Difficult to extend

### After (Modularized)
- 6 focused test modules (<300 LOC each)
- Clear separation of concerns
- Easy to identify which area failed
- Simple to add new language tests
- Reusable helper library for other i18n tests

## Dependencies

```typescript
// Playwright
@playwright/test

// Utilities
__tests__/utils/playwright/i18n-test-helpers.ts

// Base URL
process.env.BASE_URL || 'http://localhost:3000'
```

## Prerequisites

- Development server running: `npm run dev`
- Server available at http://localhost:3000
- Modern browser (Chrome, Firefox, Safari, Edge)

## Common Issues

### "Widget iframe not found"
- Ensure test-widget page is available
- Check iframe ID is `chat-widget-iframe`
- Verify widget is loading correctly

### "Spanish placeholder not found"
- Widget may not have full i18n implementation
- Check translation strings exist in codebase
- Verify localStorage is working

### "RTL layout not applied"
- Document `dir` attribute may need manual setting
- Check CSS supports `[dir="rtl"]` selectors
- Verify language affects dir attribute

## Future Enhancements

- [ ] Date/time formatting tests
- [ ] Number formatting tests (1,000.00 vs 1.000,00)
- [ ] Currency formatting tests
- [ ] Performance benchmarks for language switching
- [ ] Additional language tests (French, German, etc.)
- [ ] Accessibility testing for RTL

## Cross-References

- **Chat System:** [app/api/chat/route.ts](../../../../app/api/chat/route.ts)
- **Widget:** [app/embed/page.tsx](../../../../app/embed/page.tsx)
- **Test Helpers:** [__tests__/utils/playwright/i18n-test-helpers.ts](../../../../__tests__/utils/playwright/i18n-test-helpers.ts)
- **E2E Base:** [__tests__/playwright/](../)

## Maintenance

**When updating language strings:**
1. Update `TRANSLATIONS` in `i18n-test-helpers.ts`
2. Update affected test modules
3. Run full test suite: `npm run test`

**When adding new language:**
1. Add to TRANSLATIONS constant
2. Update relevant test modules
3. Add new test case if needed

**When refactoring widget:**
1. Check for selector changes
2. Update locators in helpers if needed
3. Run tests to verify selectors still work
