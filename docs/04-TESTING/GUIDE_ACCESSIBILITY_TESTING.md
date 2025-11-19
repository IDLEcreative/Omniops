# Accessibility Testing Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Accessibility Tests](/__tests__/accessibility/), [CLAUDE.md](/home/user/Omniops/CLAUDE.md)
**Estimated Read Time:** 15 minutes

## Purpose

Complete guide to implementing and maintaining accessibility testing for the OmniOps platform, ensuring WCAG 2.1 AA compliance and an inclusive user experience for all users, including those with disabilities.

## Quick Links

- [Accessibility Test Suite](/__tests__/accessibility/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [Accessibility Audit Runbook](/home/user/Omniops/docs/04-TESTING/RUNBOOK_ACCESSIBILITY_AUDIT.md)

## Table of Contents

- [Overview](#overview)
- [Why Accessibility Matters](#why-accessibility-matters)
- [WCAG Compliance Levels](#wcag-compliance-levels)
- [Automated Testing with axe](#automated-testing-with-axe)
- [Manual Testing Checklist](#manual-testing-checklist)
- [Screen Reader Testing](#screen-reader-testing)
- [Keyboard Navigation Testing](#keyboard-navigation-testing)
- [Color Contrast Checking](#color-contrast-checking)
- [ARIA Best Practices](#aria-best-practices)
- [Common Issues and Fixes](#common-issues-and-fixes)
- [CI/CD Integration](#cicd-integration)
- [Resources](#resources)

---

## Overview

Accessibility testing ensures that people with disabilities can use the OmniOps platform effectively. This includes:

- **Visual disabilities**: Blindness, low vision, color blindness
- **Motor disabilities**: Limited mobility, tremors, no mouse use
- **Auditory disabilities**: Deafness, hard of hearing
- **Cognitive disabilities**: Learning disabilities, memory issues

**Multi-Layered Testing Approach:**
1. **Automated tests** (axe-core) - Catch 30-40% of issues
2. **Manual testing** - Catch remaining 60-70%
3. **Screen reader testing** - Real-world validation
4. **Keyboard navigation** - Ensure mouse-free usage

---

## Why Accessibility Matters

### Legal Requirements

**ADA Compliance (US):**
- Title III requires web accessibility
- Penalties: $75,000 - $150,000+ per violation

**International Laws:**
- EU: Web Accessibility Directive (2018)
- UK: Equality Act (2010)
- Canada: AODA (Accessibility for Ontarians with Disabilities Act)

### Business Benefits

- **Larger audience**: 15% of global population has a disability
- **Better SEO**: Accessible sites rank higher
- **Improved UX**: Benefits all users (e.g., captions help in noisy environments)
- **Brand reputation**: Shows commitment to inclusion

### Real-World Impact

```
User with visual impairment + screen reader:
❌ Cannot use chat widget → Lost customer
✅ Accessible chat widget → Successful purchase

User with motor disability (keyboard only):
❌ Cannot navigate dashboard → Cannot manage account
✅ Keyboard-accessible → Full functionality
```

---

## WCAG Compliance Levels

### WCAG 2.1 Levels

| Level | Description | Compliance |
|-------|-------------|------------|
| **A** | Basic accessibility | Minimum requirement |
| **AA** | Intermediate accessibility | **Target for OmniOps** |
| **AAA** | Highest accessibility | Aspirational |

### Our Target: WCAG 2.1 AA

**Key Requirements:**
- ✅ Color contrast ratio ≥ 4.5:1 for text
- ✅ All functionality available via keyboard
- ✅ Form inputs have labels
- ✅ Images have alt text
- ✅ Focus indicators visible
- ✅ Headings properly structured (H1 → H2 → H3)
- ✅ ARIA attributes used correctly
- ✅ No keyboard traps

---

## Automated Testing with axe

### Setup

```bash
npm install --save-dev @axe-core/playwright
```

### Basic Usage

```typescript
// __tests__/accessibility/axe-tests.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('homepage should not have any accessibility violations', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('chat widget should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/widget-test');

    // Wait for widget to load
    await page.waitForSelector('#chat-widget-iframe');

    const results = await new AxeBuilder({ page })
      .include('#chat-widget-iframe')
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('dashboard should be accessible', async ({ page }) => {
    await page.goto('http://localhost:3000/dashboard');

    // Exclude third-party components if needed
    const results = await new AxeBuilder({ page })
      .exclude('.third-party-embed')
      .analyze();

    expect(results.violations).toEqual([]);
  });
});
```

### Advanced Configuration

```typescript
// Test specific rules
const results = await new AxeBuilder({ page })
  .withRules(['color-contrast', 'heading-order', 'label'])
  .analyze();

// Disable specific rules (with justification)
const results = await new AxeBuilder({ page })
  .disableRules(['duplicate-id']) // Third-party widget IDs
  .analyze();

// Set impact level threshold
const results = await new AxeBuilder({ page })
  .options({ resultTypes: ['violations', 'incomplete'] })
  .analyze();
```

### Interpreting Results

```typescript
if (results.violations.length > 0) {
  console.log('Accessibility Violations:');
  results.violations.forEach(violation => {
    console.log(`
      Rule: ${violation.id}
      Impact: ${violation.impact}
      Description: ${violation.description}
      Help: ${violation.help}
      Help URL: ${violation.helpUrl}
      Affected elements: ${violation.nodes.length}
    `);

    violation.nodes.forEach(node => {
      console.log(`  - ${node.html}`);
      console.log(`    ${node.failureSummary}`);
    });
  });
}
```

---

## Manual Testing Checklist

### Visual Inspection

- [ ] All images have alt text
- [ ] Form inputs have visible labels
- [ ] Focus indicators are clearly visible
- [ ] Color is not the only way to convey information
- [ ] Text can be resized to 200% without breaking layout
- [ ] Content is readable in high contrast mode

### Keyboard Navigation

- [ ] Tab key moves focus in logical order
- [ ] Shift+Tab moves focus backward
- [ ] Enter/Space activate buttons and links
- [ ] Escape closes modals and popups
- [ ] Arrow keys navigate menus and lists
- [ ] No keyboard traps (can always tab out)

### Screen Reader

- [ ] Page title is descriptive
- [ ] Headings are properly nested (H1 → H2 → H3)
- [ ] Landmark roles identify regions (nav, main, footer)
- [ ] Form errors are announced
- [ ] Dynamic content updates are announced (aria-live)
- [ ] Button purposes are clear

### Color Contrast

- [ ] Text contrast ≥ 4.5:1 (normal text)
- [ ] Large text contrast ≥ 3:1 (18pt+ or 14pt+ bold)
- [ ] UI component contrast ≥ 3:1 (buttons, inputs)
- [ ] Focus indicators contrast ≥ 3:1

---

## Screen Reader Testing

### Recommended Screen Readers

| OS | Screen Reader | Cost | Best For |
|----|---------------|------|----------|
| **Windows** | NVDA | Free | Most popular, full-featured |
| **Windows** | JAWS | $1,000+ | Enterprise standard |
| **macOS** | VoiceOver | Free (built-in) | Apple ecosystem |
| **iOS** | VoiceOver | Free (built-in) | Mobile testing |
| **Android** | TalkBack | Free (built-in) | Mobile testing |

### NVDA Quick Start (Windows)

**Download:** https://www.nvaccess.org/download/

**Basic Commands:**
- `Ctrl` - Stop reading
- `Insert + Down Arrow` - Read all
- `Insert + F7` - List all links
- `Insert + F5` - List all form fields
- `H` - Next heading
- `Tab` - Next focusable element

**Testing Workflow:**
```
1. Start NVDA
2. Navigate to your page
3. Press Insert + Down Arrow to read all content
4. Press Tab to navigate interactive elements
5. Verify announcements are meaningful
6. Check form submission flow
7. Test error messages are announced
```

### VoiceOver Quick Start (macOS)

**Enable:** System Settings → Accessibility → VoiceOver

**Basic Commands:**
- `VO + A` - Read all (VO = Ctrl + Option)
- `VO + Right Arrow` - Next element
- `VO + Space` - Activate element
- `VO + U` - Open rotor (lists)

### Common Screen Reader Issues

**Problem: "Button button"**
```html
<!-- ❌ Wrong -->
<button aria-label="Submit button">Submit</button>

<!-- ✅ Right -->
<button>Submit</button>
```

**Problem: Generic link text**
```html
<!-- ❌ Wrong -->
<a href="/products">Click here</a>

<!-- ✅ Right -->
<a href="/products">View all products</a>
```

**Problem: Unlabeled form inputs**
```html
<!-- ❌ Wrong -->
<input type="text" placeholder="Email" />

<!-- ✅ Right -->
<label for="email">Email</label>
<input type="text" id="email" placeholder="you@example.com" />
```

---

## Keyboard Navigation Testing

### Keyboard Test Flow

**Chat Widget:**
```
1. Tab to chat toggle button
2. Press Enter to open chat
3. Tab to message input
4. Type message
5. Tab to send button
6. Press Enter to send
7. Verify message appears
8. Press Escape to close chat
9. Verify chat closes
```

**Dashboard:**
```
1. Tab through navigation menu
2. Press Enter to select menu item
3. Tab through page content
4. Tab to data table
5. Use arrow keys to navigate cells
6. Tab to filter controls
7. Change filters with keyboard
8. Verify no keyboard traps
```

### Focus Management

**Good focus indicators:**
```css
/* Clear, visible focus ring */
*:focus-visible {
  outline: 3px solid #0066cc;
  outline-offset: 2px;
}

/* Don't remove focus outline! */
/* ❌ Never do this: */
*:focus {
  outline: none; /* Terrible for accessibility */
}
```

**Skip links:**
```html
<!-- Allow skipping to main content -->
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<main id="main-content">
  <!-- Page content -->
</main>

<style>
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
</style>
```

---

## Color Contrast Checking

### Tools

**Browser Extensions:**
- WAVE (https://wave.webaim.org/extension/)
- axe DevTools (https://www.deque.com/axe/devtools/)

**Online Checkers:**
- WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- Coolors Contrast Checker (https://coolors.co/contrast-checker)

### Minimum Ratios (WCAG AA)

| Content | Minimum Ratio |
|---------|---------------|
| Normal text (<18pt) | 4.5:1 |
| Large text (≥18pt or ≥14pt bold) | 3:1 |
| UI components (buttons, inputs) | 3:1 |
| Focus indicators | 3:1 |

### Common Fixes

**Low contrast text:**
```css
/* ❌ Fails: Light gray on white (2.3:1) */
color: #999999;
background: #ffffff;

/* ✅ Passes: Dark gray on white (7.0:1) */
color: #595959;
background: #ffffff;
```

**Button contrast:**
```css
/* ❌ Fails: Light blue on white (2.1:1) */
.button {
  background: #99ccff;
  color: #ffffff;
}

/* ✅ Passes: Dark blue on white (4.8:1) */
.button {
  background: #0066cc;
  color: #ffffff;
}
```

---

## ARIA Best Practices

### When to Use ARIA

**First Rule:** No ARIA is better than bad ARIA

**Use ARIA when:**
- ✅ Semantic HTML isn't enough
- ✅ Custom widgets (autocomplete, tabs)
- ✅ Live regions (chat messages)
- ✅ Screen reader instructions needed

**Don't use ARIA when:**
- ❌ Semantic HTML works (`<button>` not `<div role="button">`)
- ❌ You're unsure how it works
- ❌ Duplicating native semantics

### Common ARIA Patterns

**Modal dialogs:**
```html
<div role="dialog" aria-labelledby="dialog-title" aria-modal="true">
  <h2 id="dialog-title">Confirm Action</h2>
  <p>Are you sure?</p>
  <button>Yes</button>
  <button>Cancel</button>
</div>
```

**Live regions (chat):**
```html
<div role="log" aria-live="polite" aria-atomic="false">
  <!-- New messages announced as they arrive -->
  <div class="message">New message</div>
</div>
```

**Form errors:**
```html
<label for="email">Email</label>
<input type="email" id="email" aria-describedby="email-error" aria-invalid="true" />
<span id="email-error" role="alert">Please enter a valid email</span>
```

**Loading states:**
```html
<button aria-busy="true">
  <span class="spinner" aria-hidden="true"></span>
  Loading...
</button>
```

---

## Common Issues and Fixes

### Issue: Missing Alt Text

**Problem:**
```html
<img src="product.jpg" />
```

**Fix:**
```html
<!-- Decorative image -->
<img src="decorative.jpg" alt="" />

<!-- Meaningful image -->
<img src="product.jpg" alt="Blue hydraulic pump model A4VTG90" />
```

### Issue: Unlabeled Inputs

**Problem:**
```html
<input type="text" placeholder="Search..." />
```

**Fix:**
```html
<label for="search">Search products</label>
<input type="text" id="search" placeholder="Enter product name..." />

<!-- Or use aria-label -->
<input type="text" aria-label="Search products" placeholder="Enter product name..." />
```

### Issue: Poor Heading Structure

**Problem:**
```html
<h1>Dashboard</h1>
<h3>Analytics</h3> <!-- Skipped H2 -->
<h4>Revenue</h4>
```

**Fix:**
```html
<h1>Dashboard</h1>
<h2>Analytics</h2>
<h3>Revenue</h3>
```

### Issue: Keyboard Trap

**Problem:**
```typescript
// Modal traps focus forever
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault(); // Blocks escape!
  }
});
```

**Fix:**
```typescript
// Allow Escape to close
modal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# Add to .github/workflows/test.yml
- name: Run accessibility tests
  run: npm run test:accessibility

- name: Upload accessibility reports
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: accessibility-violations
    path: __tests__/accessibility/reports/
```

### Package.json Scripts

```json
{
  "scripts": {
    "test:accessibility": "playwright test __tests__/accessibility",
    "test:a11y": "npm run test:accessibility",
    "audit:wcag": "npm run test:accessibility"
  }
}
```

---

## Resources

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Pa11y](https://pa11y.org/) - Automated testing
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools

### Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/) - Comprehensive guides
- [A11Y Project](https://www.a11yproject.com/) - Community-driven checklist

### Testing
- [Screen Reader Testing](https://webaim.org/articles/screenreader_testing/)
- [Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [Color Contrast Guide](https://webaim.org/articles/contrast/)

---

## Quick Start Checklist

- [ ] Install @axe-core/playwright
- [ ] Create accessibility test suite
- [ ] Run automated tests on key pages
- [ ] Test keyboard navigation manually
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Check color contrast
- [ ] Add to CI/CD pipeline
- [ ] Document findings and fixes

---

**Next Steps:**
1. Run axe tests on chat widget and dashboard
2. Fix critical violations (color contrast, labels)
3. Test keyboard navigation flows
4. Validate with screen reader
5. See [Accessibility Audit Runbook](RUNBOOK_ACCESSIBILITY_AUDIT.md) for comprehensive process
