**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Widget Config E2E Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minute

Modular organization of widget configuration end-to-end tests for the chat API.

## Structure

This directory contains focused test modules organized by functionality:

- **mocks-setup.ts** - Shared mocks for OpenAI, Supabase, and analytics
- **test-helpers.ts** - Helper functions for database setup and request creation
- **personality-tests.ts** - Tests for personality and tone settings
- **response-length-tests.ts** - Tests for response length token limits
- **language-and-prompt-tests.ts** - Tests for language and custom system prompt settings
- **temperature-and-defaults-tests.ts** - Tests for temperature settings and default behavior

## Running Tests

```bash
# Run all widget config E2E tests
npm test -- __tests__/api/chat/widget-config-e2e.test.ts

# Run specific test module
npm test -- __tests__/api/chat/widget-config-e2e/personality-tests.ts
```

## Test Coverage

Total: 9 test cases across all modules

- Personality settings (2 tests)
- Response length settings (3 tests)
- Language and custom prompts (2 tests)
- Temperature and defaults (2 tests)

## Adding New Tests

1. Create a new `*.ts` file in this directory
2. Export a test definition function (e.g., `export function defineMyTests()`)
3. Import the function in the orchestrator (`../widget-config-e2e.test.ts`)
4. Add a describe block that calls the function

## Compliance

All modules are under the 300 LOC limit. See orchestrator file for organization pattern.
