# Playwright Tests Directory

**Purpose:** End-to-end browser tests using Playwright for UI automation and user flow validation.

**Test Type:** E2E | Browser Automation

**Last Updated:** 2025-10-30

**Coverage:** User journeys, cross-browser compatibility, visual regression, and accessibility testing.

## Overview

Playwright tests simulate real user interactions in actual browsers to validate complete user workflows.

## Running Tests

```bash
# Run Playwright tests
npx playwright test

# Run in specific browser
npx playwright test --project=chromium

# Run with UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Key Test Areas

- Chat widget embedding
- User authentication flows
- Dashboard interactions
- Form submissions
- Cross-browser compatibility

## Configuration

See `playwright.config.ts` in project root.

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md)
- [Playwright Documentation](https://playwright.dev/)
