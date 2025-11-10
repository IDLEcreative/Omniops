# Playwright E2E Tests

**Last Updated:** 2025-11-09
**Purpose:** End-to-end testing for complete user journeys
**Test Type:** E2E | Browser Automation
**Coverage:** User journeys, revenue flows, integrations, cross-browser compatibility

---

## Overview

This directory contains **end-to-end (e2e) tests** that validate complete user journeys from start to **actual completion**. These tests simulate real user behavior and verify the entire system works together.

**Key Principle:** Tests go to the TRUE "END" of the journey - order confirmations, success pages, analytics tracking - not just intermediate steps.

---

## Directory Structure

```
__tests__/playwright/
├── core-journeys/              # Critical revenue & acquisition flows
│   ├── complete-purchase-flow.spec.ts      # Chat → Product → Cart → Checkout → Confirmation
│   └── landing-page-demo-flow.spec.ts      # Demo URL → Scrape → Chat → AI Response
│
├── integrations/               # Third-party integration flows
│   └── woocommerce-integration-e2e.spec.ts # Setup → Sync → Search → Purchase
│
├── scraping/                   # Web scraping flows
│   └── scraping-flow.spec.ts               # Enter Domain → Scraping → Content Searchable
│
├── dashboard/                  # Dashboard feature flows
│   ├── widget-installation.spec.ts         # Configure → Customize → Install → Verify
│   └── domain-configuration.spec.ts        # Add Domain → Configure → Multi-tenant Isolation
│
├── chat/                       # Chat functionality flows
│   └── multi-turn-chat.spec.ts             # Multi-turn conversation with context
│
├── analytics-dashboard-display.spec.ts      # ✅ Good coverage (75%)
├── gdpr-privacy.spec.ts                     # ✅ Excellent! (95%) - Use as template
├── chat-widget-integration.spec.ts          # ⚠️  Needs enhancement (40%)
├── session-metadata-tracking.spec.ts        # ⚠️  Needs enhancement (60%)
├── telemetry-smoke.spec.ts                  # ⚠️  Basic smoke only (30%)
│
└── README.md                   # This file
```

---

## Test Categories

### 🔴 Priority 1: Critical Revenue Flows (IMPLEMENTED ✅)

**Complete Purchase Flow** ([core-journeys/complete-purchase-flow.spec.ts](core-journeys/complete-purchase-flow.spec.ts))
- **Journey:** Chat → Product → Cart → Checkout → **Order Confirmation**
- **Impact:** CRITICAL - validates entire conversion funnel
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

**Landing Page Demo** ([core-journeys/landing-page-demo-flow.spec.ts](core-journeys/landing-page-demo-flow.spec.ts))
- **Journey:** Enter URL → Scrape → Chat → AI Response → **Session Tracking**
- **Impact:** HIGH - validates user acquisition path
- **Duration:** ~90 seconds
- **Status:** ✅ Implemented

**WooCommerce Integration** ([integrations/woocommerce-integration-e2e.spec.ts](integrations/woocommerce-integration-e2e.spec.ts))
- **Journey:** Setup → Sync → Search → **Purchase + Analytics**
- **Impact:** HIGH - validates primary e-commerce integration
- **Duration:** ~120 seconds
- **Status:** ✅ Implemented

### 🟢 Priority 2: Core Functionality (IMPLEMENTED ✅)

**Scraping Flow** ([scraping/scraping-flow.spec.ts](scraping/scraping-flow.spec.ts))
- **Journey:** Enter Domain → Scraping → Completion → **Content Searchable**
- **Impact:** HIGH - validates content ingestion pipeline
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

**Widget Installation** ([dashboard/widget-installation.spec.ts](dashboard/widget-installation.spec.ts))
- **Journey:** Configure → Customize → Install → **Verify Loaded**
- **Impact:** HIGH - validates customer onboarding
- **Duration:** ~45 seconds
- **Status:** ✅ Implemented

**Multi-turn Chat** ([chat/multi-turn-chat.spec.ts](chat/multi-turn-chat.spec.ts))
- **Journey:** Question 1 → Answer → Question 2 with **Context**
- **Impact:** HIGH - validates conversation quality
- **Duration:** ~40 seconds
- **Status:** ✅ Implemented

**Domain Configuration** ([dashboard/domain-configuration.spec.ts](dashboard/domain-configuration.spec.ts))
- **Journey:** Add Domain → Configure → Save → **Multi-tenant Isolation**
- **Impact:** CRITICAL - validates multi-tenant core
- **Duration:** ~50 seconds
- **Status:** ✅ Implemented

### 🟢 Priority 3: Advanced Features (TODO)

See [ANALYSIS_MISSING_E2E_TESTS.md](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md) for complete list.

---

## Running Tests

### Run All E2E Tests
```bash
npx playwright test
```

### Run Specific Category
```bash
# Run only critical revenue flows
npx playwright test core-journeys/

# Run only integration tests
npx playwright test integrations/

# Run specific test file
npx playwright test complete-purchase-flow.spec.ts
```

### Run in Different Browsers
```bash
# Chromium (default)
npx playwright test --project=chromium

# Firefox
npx playwright test --project=firefox

# WebKit (Safari)
npx playwright test --project=webkit

# All browsers
npx playwright test --project=chromium --project=firefox --project=webkit
```

### Debug Mode
```bash
# Run with headed browser (see what's happening)
npx playwright test --headed

# Run with Playwright Inspector
npx playwright test --debug

# Run specific test in debug mode
npx playwright test complete-purchase-flow.spec.ts --debug

# Run with UI mode
npx playwright test --ui
```

### View Test Report
```bash
# After running tests, view HTML report
npx playwright show-report
```

---

## Test Configuration

Tests use the configuration in [playwright.config.js](../../playwright.config.js):

- **Base URL:** `http://localhost:3000`
- **Timeout:** 30 seconds per test (overridden to 60-180s for complex flows)
- **Parallel:** Yes (tests run concurrently)
- **Global Setup:** `test-utils/playwright-global-setup.js`
- **Global Teardown:** `test-utils/playwright-global-teardown.js`

### Environment Variables

```bash
# Base URL for tests (default: http://localhost:3000)
BASE_URL=http://localhost:3000

# Test WooCommerce credentials (optional)
TEST_WOOCOMMERCE_URL=https://demo.woocommerce.com
TEST_WOOCOMMERCE_KEY=ck_test_xxx
TEST_WOOCOMMERCE_SECRET=cs_test_xxx

# Test demo site (optional)
TEST_DEMO_SITE=https://example.com
```

---

## Writing Good E2E Tests

### ✅ DO: Test Complete Journeys

```typescript
// ✅ GOOD: Tests to the TRUE end
test('user completes purchase', async ({ page }) => {
  await openChat();
  await askProductQuestion();
  await clickProduct();
  await addToCart();
  await checkout();
  await completePurchase();
  await verifyOrderConfirmation();     // ← The real "END"
  await verifyAnalyticsTracked();       // ← Verify side effects
});
```

### ❌ DON'T: Stop at Intermediate Steps

```typescript
// ❌ BAD: Stops before the end
test('user adds to cart', async ({ page }) => {
  await addToCart();
  // Missing: checkout, payment, confirmation!
});
```

### ✅ DO: Verify Side Effects

```typescript
// After completing flow, verify:
await verifyOrderInDatabase();
await verifyEmailSent();
await verifyAnalyticsUpdated();
await verifyInventoryReduced();
```

### ✅ DO: Test Error Scenarios

```typescript
test('handles payment failure gracefully', async ({ page }) => {
  await mockPaymentFailure();
  await attemptCheckout();
  await expectUserFriendlyError();
  await verifyOrderNotCreated();
  await verifyCartStillPopulated();
});
```

### ✅ DO: Use Descriptive Console Logging

```typescript
console.log('📍 Step 5: Adding product to cart');
console.log('✅ Product added successfully');
console.log('⚠️  Warning: Cart count not updated');
console.log('❌ Error: Checkout button not found');
```

### ✅ DO: Take Screenshots on Failure

```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({
      path: `test-results/failure-${Date.now()}.png`,
      fullPage: true
    });
  }
});
```

---

## Coverage Goals

**Target E2E Coverage:**
- ✅ 100% of revenue-generating flows tested
- ✅ 100% of critical user journeys tested
- ⏳ 80% of dashboard features tested
- ⏳ 90% of integration flows tested
- ⏳ All error scenarios covered

**Current Coverage:**
- ✅ Revenue flows: 3/3 (100%)
- ✅ Core features: 4/4 (100%)
- ⏳ Advanced features: 0/7 (0%)

**Overall:** ~35% complete (7/20 critical tests - DOUBLED from 18%!)

---

## Next Steps

1. ✅ **Phase 1 Complete:** Critical revenue flows implemented (3 tests)
2. ✅ **Phase 2 Complete:** Core functionality tests implemented (4 tests)
3. ⏳ **Phase 3:** Advanced features (team, conversations, realtime) - 7 tests planned
4. ⏳ **Phase 4:** Error scenarios and edge cases - 6 tests planned

**Recent Completion:** Phase 2 finished 2025-11-09 with 4 new tests covering scraping, widget installation, multi-turn chat, and domain configuration.

See [ANALYSIS_MISSING_E2E_TESTS.md](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md) for complete implementation plan.

---

## Related Documentation

- **[Missing E2E Tests Analysis](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md)** - Complete audit and roadmap
- **[Phase 1 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PRIORITY_1_COMPLETE.md)** - Revenue flows implementation
- **[Phase 2 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_2_COMPLETE.md)** - Core functionality implementation
- **[Playwright Config](../../playwright.config.js)** - Test configuration
- **[GDPR Privacy Test](gdpr-privacy.spec.ts)** - ⭐ Best example to follow
- **[Playwright Documentation](https://playwright.dev/)** - Official docs
- **[Main Tests README](../README.md)** - All test types

---

**Questions?** See [ANALYSIS_MISSING_E2E_TESTS.md](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md) or the team.
