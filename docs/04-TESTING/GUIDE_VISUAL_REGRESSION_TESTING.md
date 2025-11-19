# Visual Regression Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Playwright E2E Tests](/__tests__/playwright/), [CLAUDE.md](/home/user/Omniops/CLAUDE.md)
**Estimated Read Time:** 12 minutes

## Purpose

Complete guide to implementing and maintaining visual regression testing for the OmniOps platform, ensuring UI consistency and preventing unintended visual changes across releases.

## Quick Links

- [Visual Regression Test Directory](/__tests__/playwright/visual-regression/)
- [Playwright Documentation](https://playwright.dev/docs/test-snapshots)
- [Percy Documentation](https://docs.percy.io/)
- [Chromatic Documentation](https://www.chromatic.com/docs/)

## Table of Contents

- [Overview](#overview)
- [Why Visual Regression Testing](#why-visual-regression-testing)
- [Tool Options](#tool-options)
- [Playwright Built-in Screenshots](#playwright-built-in-screenshots)
- [Percy Integration](#percy-integration)
- [Chromatic Integration](#chromatic-integration)
- [BackstopJS Alternative](#backstopjs-alternative)
- [Baseline Management](#baseline-management)
- [Handling False Positives](#handling-false-positives)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Overview

Visual regression testing automatically detects unintended visual changes by comparing screenshots of your application against baseline images. This catches CSS bugs, layout shifts, and design regressions that unit tests can't detect.

**What Visual Regression Testing Catches:**
- ✅ CSS rule changes affecting layout
- ✅ Responsive design breakpoints breaking
- ✅ Font rendering changes
- ✅ Color/theme inconsistencies
- ✅ Component positioning shifts
- ✅ Image loading issues
- ✅ Animation/transition problems

**What It Doesn't Catch:**
- ❌ Functional bugs (use E2E tests)
- ❌ Business logic errors (use unit tests)
- ❌ API contract changes (use integration tests)

---

## Why Visual Regression Testing

**Real-World Scenarios:**

1. **Dependency Update Breaks Layout**
   - Update Tailwind CSS → chat widget overlaps content
   - Visual regression catches it immediately

2. **Responsive Design Regression**
   - CSS change breaks mobile layout
   - Screenshots show broken layout at mobile viewport

3. **Theme/Dark Mode Issues**
   - New component doesn't support dark mode
   - Visual diff shows missing styles

4. **Cross-Browser Rendering**
   - Works in Chrome, broken in Firefox
   - Browser-specific screenshots catch it

**ROI:**
- Prevents production UI bugs
- Faster QA cycles (automated)
- Developer confidence in refactoring
- Catches regressions before users see them

---

## Tool Options

### Comparison Matrix

| Tool | Cost | Setup Effort | CI/CD | Features | Best For |
|------|------|--------------|-------|----------|----------|
| **Playwright Snapshots** | Free | Low | Easy | Basic comparison | Quick start, small teams |
| **Percy** | $149-999/mo | Low | Easy | Smart diffing, cross-browser | Medium-large teams |
| **Chromatic** | $149-499/mo | Low | Easy | Storybook integration | Component library focused |
| **BackstopJS** | Free | Medium | Medium | Full featured, local | Budget-conscious teams |

---

## Playwright Built-in Screenshots

**Best for:** Quick start, local development

### Setup

Already included with Playwright installation. No additional dependencies needed.

### Basic Usage

```typescript
// __tests__/playwright/visual-regression/chat-widget.spec.ts
import { test, expect } from '@playwright/test';

test('chat widget renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3000/widget-test');

  // Take screenshot and compare with baseline
  await expect(page).toHaveScreenshot('chat-widget-default.png');
});

test('chat widget in dark mode', async ({ page }) => {
  await page.goto('http://localhost:3000/widget-test');

  // Enable dark mode
  await page.emulateMedia({ colorScheme: 'dark' });

  await expect(page).toHaveScreenshot('chat-widget-dark.png');
});

test('chat widget responsive - mobile', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:3000/widget-test');

  await expect(page).toHaveScreenshot('chat-widget-mobile.png');
});
```

### Updating Baselines

```bash
# Generate new baseline screenshots
npm run test:e2e -- --update-snapshots

# Update only specific test
npm run test:e2e -- chat-widget.spec.ts --update-snapshots

# Update in headed mode to see what's happening
npm run test:e2e -- --headed --update-snapshots
```

### Configuration

Add to `playwright.config.ts`:

```typescript
export default defineConfig({
  expect: {
    toHaveScreenshot: {
      // Maximum allowed pixel difference
      maxDiffPixels: 100,

      // Maximum allowed difference ratio (0-1)
      maxDiffPixelRatio: 0.05,

      // Threshold for considering two pixels different (0-1)
      threshold: 0.2,

      // Animations: 'disabled' | 'allow'
      animations: 'disabled',

      // CSS animations and transitions
      caret: 'hide',
    },
  },
});
```

**Pros:**
- ✅ Free and included
- ✅ Simple setup
- ✅ Works offline
- ✅ Fast execution

**Cons:**
- ❌ Limited cross-browser (manual)
- ❌ No smart diffing
- ❌ Large git repo (images)
- ❌ No visual UI for reviewing

---

## Percy Integration

**Best for:** Teams needing cross-browser testing and smart diffing

### Setup

```bash
npm install --save-dev @percy/cli @percy/playwright
```

### Configuration

```typescript
// __tests__/playwright/visual-regression/percy-chat-widget.spec.ts
import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test('chat widget visual regression', async ({ page }) => {
  await page.goto('http://localhost:3000/widget-test');

  // Wait for widget to load
  await page.waitForSelector('#chat-widget');

  // Take Percy snapshot
  await percySnapshot(page, 'Chat Widget - Default');
});

test('chat widget with open chat', async ({ page }) => {
  await page.goto('http://localhost:3000/widget-test');

  // Open chat
  await page.click('#chat-toggle');
  await page.waitForSelector('.chat-messages');

  await percySnapshot(page, 'Chat Widget - Open');
});

test('chat widget responsive views', async ({ page }) => {
  await page.goto('http://localhost:3000/widget-test');

  // Percy automatically tests multiple viewports
  await percySnapshot(page, 'Chat Widget - Responsive', {
    widths: [375, 768, 1280],
  });
});
```

### Running Percy Tests

```bash
# Set Percy token (from percy.io project settings)
export PERCY_TOKEN=your_percy_token

# Run tests with Percy
npx percy exec -- npm run test:e2e:chromium
```

### CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Percy visual tests
  run: npx percy exec -- npm run test:e2e:chromium
  env:
    PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

**Percy Features:**
- ✅ Automatic cross-browser screenshots
- ✅ Smart diffing (ignores anti-aliasing)
- ✅ Responsive testing (multiple viewports)
- ✅ Web UI for reviewing changes
- ✅ GitHub PR integration
- ✅ Baseline management in cloud

**Pricing:** $149-999/mo based on snapshots

---

## Chromatic Integration

**Best for:** Teams using Storybook for component development

### Setup

```bash
npm install --save-dev chromatic
```

### Configuration

```bash
# Link to Chromatic project
npx chromatic --project-token=your_project_token
```

### Usage with Storybook

```typescript
// components/ChatWidget.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ChatWidget } from './ChatWidget';

const meta: Meta<typeof ChatWidget> = {
  title: 'Components/ChatWidget',
  component: ChatWidget,
};

export default meta;
type Story = StoryObj<typeof ChatWidget>;

export const Default: Story = {
  args: {
    domain: 'example.com',
  },
};

export const DarkMode: Story = {
  args: {
    domain: 'example.com',
    theme: 'dark',
  },
};

export const WithMessages: Story = {
  args: {
    domain: 'example.com',
    initialMessages: [
      { role: 'assistant', content: 'Hello! How can I help?' },
    ],
  },
};
```

### Running Chromatic

```bash
# Run Chromatic on all stories
npx chromatic

# Run on specific branch
npx chromatic --branch-name=feature/new-ui
```

**Chromatic Features:**
- ✅ Storybook integration
- ✅ Component isolation testing
- ✅ UI review workflow
- ✅ Cross-browser testing
- ✅ Git workflow integration

---

## BackstopJS Alternative

**Best for:** Budget-conscious teams wanting full features locally

### Setup

```bash
npm install --save-dev backstopjs
```

### Configuration

```json
// backstop.json
{
  "id": "omniops_visual_regression",
  "viewports": [
    {
      "label": "phone",
      "width": 375,
      "height": 667
    },
    {
      "label": "tablet",
      "width": 768,
      "height": 1024
    },
    {
      "label": "desktop",
      "width": 1280,
      "height": 1024
    }
  ],
  "scenarios": [
    {
      "label": "Chat Widget - Default",
      "url": "http://localhost:3000/widget-test",
      "selectors": ["#chat-widget"],
      "delay": 500
    },
    {
      "label": "Chat Widget - Open",
      "url": "http://localhost:3000/widget-test",
      "clickSelector": "#chat-toggle",
      "postInteractionWait": 500,
      "selectors": [".chat-messages"]
    }
  ],
  "paths": {
    "bitmaps_reference": "__tests__/visual-regression/backstop_data/bitmaps_reference",
    "bitmaps_test": "__tests__/visual-regression/backstop_data/bitmaps_test",
    "html_report": "__tests__/visual-regression/backstop_data/html_report"
  }
}
```

### Running BackstopJS

```bash
# Create baseline
npx backstop reference

# Run tests
npx backstop test

# Approve changes
npx backstop approve

# Open report
npx backstop openReport
```

---

## Baseline Management

### When to Update Baselines

**Update baselines when:**
- ✅ Intentional design changes
- ✅ New features added
- ✅ Refactoring with visual changes
- ✅ Viewport sizes change

**Don't update for:**
- ❌ Flaky tests
- ❌ CI/local environment differences
- ❌ Unintended changes (fix the code!)

### Best Practices

1. **Review before approving**
   - Always review diffs visually
   - Don't blindly update baselines

2. **Version control**
   - Commit baseline images to git (small projects)
   - Use cloud storage (large projects)

3. **Team coordination**
   - Communicate baseline updates
   - Include screenshots in PR reviews

---

## Handling False Positives

### Common Causes

1. **Fonts rendering differently**
   ```typescript
   await page.addStyleTag({
     content: '* { font-family: Arial !important; }'
   });
   ```

2. **Dynamic content (timestamps, IDs)**
   ```typescript
   // Mask dynamic content
   await expect(page).toHaveScreenshot({
     mask: [page.locator('.timestamp')],
   });
   ```

3. **Animations**
   ```typescript
   await page.emulateMedia({ reducedMotion: 'reduce' });
   ```

4. **Anti-aliasing differences**
   - Increase threshold in config
   - Use Percy's smart diffing

### Strategies

```typescript
// Ignore specific elements
await expect(page).toHaveScreenshot({
  mask: [
    page.locator('.timestamp'),
    page.locator('.avatar'),
  ],
});

// Wait for fonts to load
await page.waitForLoadState('networkidle');

// Disable animations
await page.addStyleTag({
  content: '* { animation: none !important; transition: none !important; }'
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on:
  pull_request:
    branches: [main, develop]

jobs:
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Start dev server
        run: npm run dev &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run visual regression tests
        run: npm run test:e2e:visual

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: visual-regression-diffs
          path: __tests__/visual-regression/
```

---

## Best Practices

### 1. Test Critical Paths Only

Don't screenshot everything. Focus on:
- Landing pages
- Chat widget (all states)
- Dashboard key views
- Settings pages
- Checkout flows

### 2. Use Descriptive Names

```typescript
// ❌ Bad
await percySnapshot(page, 'test1');

// ✅ Good
await percySnapshot(page, 'Chat Widget - Message List - With 5 Messages');
```

### 3. Test Multiple States

```typescript
test('chat widget all states', async ({ page }) => {
  await page.goto('/widget-test');

  // Closed state
  await percySnapshot(page, 'Chat - Closed');

  // Open state
  await page.click('#chat-toggle');
  await percySnapshot(page, 'Chat - Open Empty');

  // With messages
  await page.fill('input', 'Hello');
  await page.press('input', 'Enter');
  await percySnapshot(page, 'Chat - With Message');

  // Loading state
  // ... trigger loading ...
  await percySnapshot(page, 'Chat - Loading');
});
```

### 4. Isolate Components

Test components in isolation when possible:
```typescript
// Test widget without full page
await page.goto('/widget-test?isolated=true');
```

### 5. Document Differences

When updating baselines, document why in PR:
```markdown
## Visual Changes

Updated chat widget baseline due to:
- New message bubble design
- Updated color scheme
- Improved spacing

Screenshots:
[before] [after]
```

---

## Troubleshooting

### Screenshots Don't Match Locally

**Cause:** OS/browser rendering differences

**Solution:**
- Run tests in Docker
- Use Percy/Chromatic cloud
- Increase threshold tolerance

### Tests Flaky in CI

**Cause:** Fonts loading, animations, timing

**Solution:**
```typescript
// Wait for everything to settle
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500);

// Disable animations
await page.emulateMedia({ reducedMotion: 'reduce' });
```

### Large Baseline Images

**Cause:** Too many screenshots, high resolution

**Solution:**
- Use cloud storage (Percy/Chromatic)
- Git LFS for baseline images
- Test smaller viewports
- Reduce screenshot count

---

## Quick Start Checklist

- [ ] Install Playwright (already done)
- [ ] Create visual regression test directory
- [ ] Write first snapshot test for chat widget
- [ ] Generate baselines (`--update-snapshots`)
- [ ] Run tests to verify
- [ ] Add to CI/CD pipeline
- [ ] Document baseline update process
- [ ] Train team on reviewing diffs

---

## Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Percy Best Practices](https://docs.percy.io/docs/best-practices)
- [Chromatic Guides](https://www.chromatic.com/docs/guides)
- [BackstopJS Documentation](https://github.com/garris/BackstopJS)

---

**Next Steps:**
1. Start with Playwright built-in screenshots
2. Test chat widget in 3 states
3. Add to CI/CD pipeline
4. Consider Percy/Chromatic if team grows
