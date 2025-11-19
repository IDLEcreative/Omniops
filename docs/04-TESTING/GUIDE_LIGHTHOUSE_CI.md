# Lighthouse CI Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [.lighthouserc.js](/.lighthouserc.js), [CLAUDE.md](/home/user/Omniops/CLAUDE.md)
**Estimated Read Time:** 10 minutes

## Purpose

Complete guide to implementing and using Lighthouse CI for automated performance, accessibility, SEO, and best practices auditing on every pull request.

## Quick Links

- [Lighthouse CI Config](/.lighthouserc.js)
- [GitHub Workflow](/.github/workflows/lighthouse.yml)
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Vitals](https://web.dev/vitals/)

## Table of Contents

- [Overview](#overview)
- [What Lighthouse Tests](#what-lighthouse-tests)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [CI/CD Integration](#cicd-integration)
- [Understanding Results](#understanding-results)
- [Performance Budgets](#performance-budgets)
- [Improving Scores](#improving-scores)
- [Troubleshooting](#troubleshooting)

---

## Overview

Lighthouse CI automatically audits web pages on every pull request, ensuring quality standards are maintained. It tests:

- **Performance** - Load times, render speed, responsiveness
- **Accessibility** - WCAG compliance, screen reader compatibility
- **Best Practices** - Security, modern web standards
- **SEO** - Search engine optimization

**Benefits:**
- ✅ Catch performance regressions early
- ✅ Enforce accessibility standards (WCAG 2.1 AA)
- ✅ Prevent SEO issues
- ✅ Automated quality gates in PRs
- ✅ Historical trend tracking

---

## What Lighthouse Tests

### Performance (Target: 90+)

**Core Web Vitals:**
- **LCP (Largest Contentful Paint)**: < 2.5s
  - How long it takes for main content to load
- **FID (First Input Delay)**: < 100ms
  - How quickly page responds to interactions
- **CLS (Cumulative Layout Shift)**: < 0.1
  - Visual stability (no unexpected layout shifts)

**Other Metrics:**
- **FCP (First Contentful Paint)**: < 2.0s
- **Speed Index**: < 3.0s
- **Time to Interactive**: < 3.5s
- **Total Blocking Time**: < 300ms

### Accessibility (Target: 100)

**WCAG 2.1 AA Compliance:**
- Color contrast ratios (4.5:1 minimum)
- Form labels and ARIA attributes
- Semantic HTML structure
- Keyboard navigation
- Screen reader compatibility
- Focus indicators

### Best Practices (Target: 95+)

- No console errors
- HTTPS usage
- Secure dependencies (no known vulnerabilities)
- Modern image formats (WebP, AVIF)
- Efficient caching strategies
- No deprecated APIs

### SEO (Target: 90+)

- Valid HTML structure
- Meta descriptions
- Meaningful page titles
- Mobile-friendly viewport
- Crawlable links
- Proper heading hierarchy

---

## Installation

```bash
# Install Lighthouse CI
npm install --save-dev @lhci/cli

# Verify installation
npx lhci --version
```

Already configured in `.lighthouserc.js`.

---

## Configuration

### Budget Settings

Current budgets in `.lighthouserc.js`:

```javascript
// Performance budgets
'categories:performance': ['error', { minScore: 0.90 }],    // 90+
'categories:accessibility': ['error', { minScore: 1.0 }],   // 100
'categories:best-practices': ['error', { minScore: 0.95 }], // 95+
'categories:seo': ['error', { minScore: 0.90 }],            // 90+

// Core Web Vitals
'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5s
'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],   // 0.1
'total-blocking-time': ['warn', { maxNumericValue: 300 }],        // 300ms

// Resource budgets
'resource-summary:script:size': ['warn', { maxNumericValue: 300000 }],     // 300KB
'resource-summary:stylesheet:size': ['warn', { maxNumericValue: 50000 }],  // 50KB
'resource-summary:image:size': ['warn', { maxNumericValue: 200000 }],      // 200KB
```

### URLs Tested

```javascript
url: [
  'http://localhost:3000/',              // Homepage
  'http://localhost:3000/widget-test',   // Chat widget
  'http://localhost:3000/dashboard',     // Dashboard
],
```

Add more URLs as needed for comprehensive coverage.

---

## Running Locally

### Basic Usage

```bash
# Run Lighthouse CI
npx lhci autorun

# This will:
# 1. Start dev server (npm run dev)
# 2. Wait for server to be ready
# 3. Run Lighthouse on each URL (3 times each)
# 4. Assert against budgets
# 5. Upload results to temporary storage
```

### Manual Steps

```bash
# 1. Start dev server
npm run dev

# 2. Collect Lighthouse data
npx lhci collect --url=http://localhost:3000

# 3. Assert against budgets
npx lhci assert

# 4. Upload results
npx lhci upload
```

### View Reports

```bash
# After running, open the HTML report
open .lighthouseci/*.report.html
```

---

## CI/CD Integration

### GitHub Actions

Create `.github/workflows/lighthouse.yml`:

```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main, develop]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20.x'

      - name: Install dependencies
        run: npm ci

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-reports
          path: .lighthouseci/

      - name: Comment PR with results
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            http://localhost:3000
            http://localhost:3000/widget-test
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### Status Checks

Lighthouse CI will:
- ✅ Pass: All assertions met
- ⚠️ Warn: Some warnings but no errors
- ❌ Fail: Budget violations (blocks PR merge)

---

## Understanding Results

### Lighthouse Score Breakdown

**90-100**: Excellent - Ship it!
**70-89**: Good - Minor improvements recommended
**50-69**: Needs work - Address issues before shipping
**0-49**: Poor - Significant problems

### Common Issues

**Performance:**
- Large JavaScript bundles
- Unoptimized images
- Blocking resources
- No caching strategy

**Accessibility:**
- Missing alt text
- Low color contrast
- Missing form labels
- No ARIA attributes

**SEO:**
- Missing meta description
- Non-crawlable links
- No viewport meta tag

### Reading Reports

```
Performance: 92 ✅
├─ First Contentful Paint: 1.2s ✅
├─ Largest Contentful Paint: 2.1s ✅
├─ Cumulative Layout Shift: 0.05 ✅
├─ Total Blocking Time: 250ms ✅
└─ Speed Index: 2.5s ✅

Accessibility: 100 ✅
├─ Color contrast: Passed
├─ Image alt: Passed
├─ Form labels: Passed
└─ ARIA: Passed

Best Practices: 95 ✅
├─ HTTPS: Passed
├─ No console errors: Passed
└─ Secure dependencies: Passed

SEO: 90 ✅
├─ Meta description: Passed
├─ Page title: Passed
└─ Mobile friendly: Passed
```

---

## Performance Budgets

### Why Budgets Matter

**User Impact:**
- 1 second delay = 7% drop in conversions
- 53% of mobile users abandon sites > 3s load time
- Fast sites rank higher in search results

**Our Budgets:**

| Resource Type | Budget | Current | Status |
|---------------|--------|---------|--------|
| JavaScript | 300 KB | ~250 KB | ✅ |
| CSS | 50 KB | ~35 KB | ✅ |
| Images | 200 KB | ~180 KB | ✅ |
| Fonts | 100 KB | ~60 KB | ✅ |

### Setting Budgets

```javascript
// Conservative (mobile-first)
'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],

// Moderate (our current)
'resource-summary:script:size': ['warn', { maxNumericValue: 300000 }],

// Relaxed (not recommended)
'resource-summary:script:size': ['warn', { maxNumericValue: 500000 }],
```

---

## Improving Scores

### Performance

**1. Optimize Images**
```bash
# Use next/image for automatic optimization
import Image from 'next/image';

<Image
  src="/product.jpg"
  width={800}
  height={600}
  alt="Product"
  loading="lazy"
/>
```

**2. Code Splitting**
```typescript
// Lazy load components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

**3. Reduce Bundle Size**
```bash
# Analyze bundle
npm run build:widget:analyze

# Remove unused dependencies
npm prune
```

**4. Enable Compression**
```javascript
// next.config.js
module.exports = {
  compress: true,
};
```

### Accessibility

**1. Add Alt Text**
```html
<!-- ❌ Before -->
<img src="logo.png" />

<!-- ✅ After -->
<img src="logo.png" alt="Company logo" />
```

**2. Improve Color Contrast**
```css
/* ❌ Fails (2.1:1) */
color: #999;
background: #fff;

/* ✅ Passes (7.0:1) */
color: #595959;
background: #fff;
```

**3. Add Form Labels**
```html
<!-- ❌ Before -->
<input type="email" placeholder="Email" />

<!-- ✅ After -->
<label for="email">Email</label>
<input type="email" id="email" placeholder="you@example.com" />
```

### SEO

**1. Add Meta Description**
```html
<meta
  name="description"
  content="AI-powered customer service platform"
/>
```

**2. Meaningful Titles**
```html
<!-- ❌ Before -->
<title>Dashboard</title>

<!-- ✅ After -->
<title>Analytics Dashboard - OmniOps</title>
```

**3. Semantic HTML**
```html
<header>
  <nav>
    <a href="/">Home</a>
  </nav>
</header>
<main>
  <article>Content</article>
</main>
<footer>
  <p>&copy; 2025</p>
</footer>
```

---

## Troubleshooting

### Lighthouse CI Fails Locally

**Problem:** `lhci autorun` fails to start server

**Solution:**
```bash
# Start server manually
npm run dev

# In another terminal
npx lhci collect --url=http://localhost:3000
npx lhci assert
```

### Scores Differ from Production

**Problem:** Lighthouse CI scores don't match production Lighthouse

**Solution:**
- Lighthouse CI tests localhost (unoptimized)
- Production has CDN, caching, minification
- Use Lighthouse CI for trends, not absolute scores

### Flaky Performance Scores

**Problem:** Scores vary between runs

**Solution:**
```javascript
// Increase number of runs (median of 5 instead of 3)
numberOfRuns: 5,
```

### Budget Too Strict

**Problem:** Can't meet performance budgets

**Solution:**
1. **Optimize first** (images, code splitting)
2. **Adjust budget** if optimization maxed out
3. **Document why** in PR if budget increased

---

## Best Practices

### 1. Run Before Committing

```bash
# Add to package.json
"scripts": {
  "precommit": "lhci autorun"
}
```

### 2. Review Trends

Track scores over time:
- Week 1: Performance 85 → Week 4: Performance 92
- Identify regressions early

### 3. Fix Regressions Immediately

If PR drops score by 5+ points:
- ❌ Don't merge
- 🔧 Fix the regression
- ✅ Merge when score recovers

### 4. Document Trade-offs

```markdown
## Performance Impact

Added new analytics dashboard:
- Performance score: 92 → 88 (acceptable trade-off)
- Reason: Rich charting library needed for feature
- Mitigation: Code split, lazy load charts
```

---

## Resources

- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md)
- [Web Vitals](https://web.dev/vitals/)
- [Performance Budgets](https://web.dev/performance-budgets-101/)
- [Lighthouse Scoring Guide](https://web.dev/performance-scoring/)

---

## Quick Start Checklist

- [x] Install @lhci/cli
- [x] Configure .lighthouserc.js
- [ ] Run locally (`npx lhci autorun`)
- [ ] Review reports
- [ ] Fix critical issues (accessibility 100, performance 90+)
- [ ] Add to CI/CD pipeline
- [ ] Set up PR status checks
- [ ] Monitor trends weekly

---

**Next Steps:**
1. Run Lighthouse CI locally to establish baseline
2. Fix any critical violations (accessibility, security)
3. Add GitHub Actions workflow
4. Set up PR commenting for visibility
5. Track performance trends over time
