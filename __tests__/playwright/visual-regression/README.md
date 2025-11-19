# Visual Regression Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Visual Regression Guide](/home/user/Omniops/docs/04-TESTING/GUIDE_VISUAL_REGRESSION_TESTING.md)

## Purpose

Automated visual regression tests to catch unintended UI changes across the OmniOps platform using Playwright screenshot comparison.

## Quick Start

```bash
# Run visual regression tests
npm run test:e2e -- __tests__/playwright/visual-regression

# Generate new baselines (first run or after intentional changes)
npm run test:e2e -- __tests__/playwright/visual-regression --update-snapshots

# Run in UI mode to review diffs
npm run test:e2e:watch -- __tests__/playwright/visual-regression

# Run specific test
npm run test:e2e -- chat-widget-visual.spec.ts
```

## Directory Structure

```
__tests__/playwright/visual-regression/
├── README.md                          # This file
├── chat-widget-visual.spec.ts         # Chat widget snapshots (planned)
├── dashboard-visual.spec.ts           # Dashboard snapshots (planned)
├── responsive-visual.spec.ts          # Responsive layouts (planned)
└── baselines/                         # Baseline screenshots (git-ignored)
    ├── chat-widget-default.png
    ├── chat-widget-dark.png
    └── ...
```

## Running Tests

### Local Development

```bash
# Make sure dev server is running
npm run dev

# In another terminal, run visual tests
npm run test:e2e:visual
```

### Updating Baselines

**When to update:**
- ✅ Intentional design changes
- ✅ New features with UI changes
- ✅ Approved refactoring

**How to update:**

```bash
# Review current diffs first
npm run test:e2e:watch

# If changes are intentional, update baselines
npm run test:e2e -- --update-snapshots

# Commit updated baselines
git add __tests__/playwright/visual-regression/baselines/
git commit -m "chore: update visual regression baselines for new chat design"
```

## Screenshot Naming Conventions

Use descriptive, consistent names:

```typescript
// Format: {component}-{state}-{viewport}.png
await expect(page).toHaveScreenshot('chat-widget-closed-desktop.png');
await expect(page).toHaveScreenshot('chat-widget-open-mobile.png');
await expect(page).toHaveScreenshot('dashboard-analytics-dark-tablet.png');
```

## Configuration

Visual regression settings in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    maxDiffPixels: 100,           // Max pixel differences allowed
    maxDiffPixelRatio: 0.05,       // Max 5% difference
    threshold: 0.2,                // Pixel comparison threshold
    animations: 'disabled',        // Disable animations
    caret: 'hide',                 // Hide text cursor
  },
}
```

## Best Practices

### 1. Wait for Stability

```typescript
// Wait for fonts and images
await page.waitForLoadState('networkidle');

// Wait for animations to complete
await page.waitForTimeout(500);
```

### 2. Mask Dynamic Content

```typescript
// Hide timestamps, IDs, etc.
await expect(page).toHaveScreenshot({
  mask: [
    page.locator('.timestamp'),
    page.locator('.user-id'),
  ],
});
```

### 3. Test Multiple Viewports

```typescript
test.describe('responsive layout', () => {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 1024, name: 'desktop' },
  ];

  for (const viewport of viewports) {
    test(`chat widget - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/widget-test');
      await expect(page).toHaveScreenshot(`chat-${viewport.name}.png`);
    });
  }
});
```

### 4. Disable Animations

```typescript
// Add to page before screenshot
await page.addStyleTag({
  content: '* { animation: none !important; transition: none !important; }'
});
```

## Troubleshooting

### Screenshots Don't Match

**Problem:** Tests pass locally but fail in CI

**Solution:**
- Ensure consistent fonts (use web fonts)
- Disable animations globally
- Increase threshold tolerance

### Flaky Tests

**Problem:** Random failures

**Solution:**
```typescript
// Wait for stability
await page.waitForLoadState('networkidle');
await page.waitForFunction(() => document.fonts.ready);

// Increase timeout
test.setTimeout(60000);
```

### Large Baseline Files

**Problem:** Git repo growing too large

**Solution:**
- Add baselines to `.gitignore` (use cloud storage)
- Use Percy/Chromatic for cloud-based testing
- Optimize screenshot sizes (reduce viewports)

## CI/CD Integration

Visual regression tests run automatically on PRs:

```yaml
# .github/workflows/test.yml
- name: Run E2E tests (includes visual)
  run: npm run test:e2e:chromium
```

Screenshots are uploaded as artifacts on failure for review.

## Example Test

```typescript
// chat-widget-visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Chat Widget Visual Regression', () => {
  test('default state', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveScreenshot('chat-widget-default.png');
  });

  test('dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');
    await page.emulateMedia({ colorScheme: 'dark' });

    await expect(page).toHaveScreenshot('chat-widget-dark.png');
  });

  test('with messages', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');

    // Send a message
    const iframe = page.frameLocator('#chat-widget-iframe');
    await iframe.locator('input').fill('Hello');
    await iframe.locator('button[type="submit"]').click();

    // Wait for response
    await iframe.locator('.message-assistant').waitFor();

    await expect(page).toHaveScreenshot('chat-widget-with-messages.png', {
      mask: [iframe.locator('.timestamp')], // Hide dynamic timestamps
    });
  });
});
```

## Resources

- [Visual Regression Guide](docs/04-TESTING/GUIDE_VISUAL_REGRESSION_TESTING.md) - Complete implementation guide
- [Playwright Snapshots](https://playwright.dev/docs/test-snapshots) - Official documentation
- [Test Configuration](../../../playwright.config.ts) - Playwright config

---

**Questions?** See the [Visual Regression Guide](docs/04-TESTING/GUIDE_VISUAL_REGRESSION_TESTING.md) for comprehensive documentation.
