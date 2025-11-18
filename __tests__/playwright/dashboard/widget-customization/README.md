**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Widget Customization E2E Tests

Modular organization of widget customization Playwright tests for end-to-end UI testing.

## Structure

This directory contains focused test modules organized by functionality:

- **config.ts** - Shared configuration (BASE_URL, timeouts)
- **helpers.ts** - Helper functions for common UI interactions
- **complete-workflow.spec.ts** - Full end-to-end customization workflow test
- **preview-and-reset.spec.ts** - Live preview and reset functionality tests
- **navigation.spec.ts** - Tab navigation and advanced color customization tests
- **error-handling.spec.ts** - Error handling and accessibility tests

## Running Tests

```bash
# Run all widget customization E2E tests
npm run test:e2e -- widget-customization.spec.ts

# Run in watch mode for development
npm run test:e2e:watch -- widget-customization.spec.ts

# Run with browser visible (headed mode)
npm run test:e2e:headed -- widget-customization.spec.ts

# Debug mode (step through with inspector)
npm run test:e2e:debug -- widget-customization.spec.ts
```

## Test Coverage

Total: 7 test cases across all modules

- Complete customization workflow (1 test)
- Preview and reset (2 tests)
- Navigation (2 tests)
- Error handling and accessibility (2 tests)

## User Journey Tested

1. Navigate to customize dashboard
2. Verify all tabs load (Essentials, Intelligence, Connect)
3. Modify appearance settings (colors, position, icons)
4. Update AI behavior settings (personality, messages)
5. Configure integrations (WooCommerce, Shopify)
6. Verify live preview updates in real-time
7. Save configuration
8. Reload and verify persistence
9. Test reset functionality
10. Verify widget reflects saved changes (TRUE END)

## Helper Functions

Common UI interactions are available in `helpers.ts`:

- `navigateToDashboard(page)` - Navigate to customize page
- `switchToTab(page, tabName)` - Switch between tabs
- `changeColor(page, colorHex)` - Change color setting
- `setBotName(page, name)` - Update bot name
- `setWelcomeMessage(page, message)` - Update welcome message
- `clickSaveButton(page)` - Click save and wait for completion
- `toggleWooCommerceIntegration(page)` - Toggle WooCommerce

## Adding New Tests

1. Create a new `*.spec.ts` file in this directory
2. Define your tests using Playwright test syntax
3. Use helper functions from `helpers.ts` for common actions
4. Import your test file in the orchestrator (`../widget-customization.spec.ts`)

## Environment

- Base URL: `process.env.BASE_URL` or `http://localhost:3000`
- Timeout: 120 seconds per test
- Requires: Development server running (`npm run dev`)

## Compliance

All modules are under the 300 LOC limit. See orchestrator file for organization pattern.
