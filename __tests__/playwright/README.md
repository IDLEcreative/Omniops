**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Playwright E2E Tests

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 7 minutes


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
├── advanced-features/          # Advanced feature flows
│   ├── team-management.spec.ts             # Invite → Accept → Login → Permissions
│   ├── conversations-management.spec.ts    # View → Filter → Search → Export
│   ├── cart-abandonment.spec.ts            # Add → Leave → Return → Restore
│   ├── order-lookup-via-chat.spec.ts       # Chat → AI Lookup → Returns Status
│   ├── shopify-integration.spec.ts         # Setup → Sync → Search → Purchase
│   ├── realtime-analytics.spec.ts          # Dashboard → Real-time Updates
│   └── live-chat-monitoring.spec.ts        # Monitor → Agent Joins → Takeover
│
├── error-scenarios/            # Error handling & recovery flows
│   ├── payment-failure.spec.ts             # Payment Fails → Error → Cart Preserved → Retry
│   ├── network-timeout.spec.ts             # Timeout → Error → Retry → Success
│   ├── invalid-credentials.spec.ts         # Invalid Creds → Error → Fix → Success
│   ├── rate-limiting.spec.ts               # Rate Limit → Wait → Retry → Success
│   ├── database-conflict.spec.ts           # Conflict → Detection → Resolution
│   └── concurrent-operations.spec.ts       # Concurrent → Block → Complete → Allow
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

### 🟢 Priority 3: Advanced Features (IMPLEMENTED ✅)

**Team Management** ([advanced-features/team-management.spec.ts](advanced-features/team-management.spec.ts))
- **Journey:** Invite → Accept → Set Password → Login → **Verify Permissions**
- **Impact:** HIGH - validates role-based access control
- **Duration:** ~50 seconds
- **Status:** ✅ Implemented

**Conversations Management** ([advanced-features/conversations-management.spec.ts](advanced-features/conversations-management.spec.ts))
- **Journey:** View → Filter → Search → View Details → **Export Data**
- **Impact:** MEDIUM - validates data management features
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

**Cart Abandonment** ([advanced-features/cart-abandonment.spec.ts](advanced-features/cart-abandonment.spec.ts))
- **Journey:** Add to Cart → Leave → Return → **Cart Restored**
- **Impact:** HIGH - validates session persistence and recovery
- **Duration:** ~45 seconds
- **Status:** ✅ Implemented

**Order Lookup via Chat** ([advanced-features/order-lookup-via-chat.spec.ts](advanced-features/order-lookup-via-chat.spec.ts))
- **Journey:** Chat → "Where is order #123?" → AI Queries → **Returns Status**
- **Impact:** HIGH - validates AI-powered customer service
- **Duration:** ~40 seconds
- **Status:** ✅ Implemented

**Shopify Integration** ([advanced-features/shopify-integration.spec.ts](advanced-features/shopify-integration.spec.ts))
- **Journey:** Setup → Credentials → Sync → Search → **Purchase Tracked**
- **Impact:** HIGH - validates Shopify e-commerce integration
- **Duration:** ~70 seconds
- **Status:** ✅ Implemented

**Realtime Analytics** ([advanced-features/realtime-analytics.spec.ts](advanced-features/realtime-analytics.spec.ts))
- **Journey:** Dashboard → WebSocket Connects → New Activity → **Metrics Update**
- **Impact:** MEDIUM - validates real-time dashboard updates
- **Duration:** ~50 seconds
- **Status:** ✅ Implemented

**Live Chat Monitoring** ([advanced-features/live-chat-monitoring.spec.ts](advanced-features/live-chat-monitoring.spec.ts))
- **Journey:** View Chats → Monitor → Agent Joins → **Takeover Successful**
- **Impact:** HIGH - validates agent takeover workflow
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

### 🔴 Priority 4: Error Scenarios & Recovery (IMPLEMENTED ✅)

**Payment Failure Recovery** ([error-scenarios/payment-failure.spec.ts](error-scenarios/payment-failure.spec.ts))
- **Journey:** Checkout → Payment Fails → **Error Displayed** → **Cart Preserved** → Retry → Success
- **Impact:** CRITICAL - validates payment error handling and recovery
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

**Network Timeout Handling** ([error-scenarios/network-timeout.spec.ts](error-scenarios/network-timeout.spec.ts))
- **Journey:** Send Message → Timeout (35s) → **Error Shown** → **Retry Available** → Success
- **Impact:** HIGH - validates timeout detection and retry mechanism
- **Duration:** ~180 seconds (includes 35s timeout)
- **Status:** ✅ Implemented

**Invalid Integration Credentials** ([error-scenarios/invalid-credentials.spec.ts](error-scenarios/invalid-credentials.spec.ts))
- **Journey:** Enter Invalid Creds → **Error Shown** → **Not Saved** → Correct → Success
- **Impact:** HIGH - validates credential validation and security
- **Duration:** ~50 seconds
- **Status:** ✅ Implemented

**Rate Limiting Protection** ([error-scenarios/rate-limiting.spec.ts](error-scenarios/rate-limiting.spec.ts))
- **Journey:** 7 Rapid Requests → **Rate Limit After 5** → Wait 10s → **Retry Success**
- **Impact:** MEDIUM - validates rate limiting enforcement
- **Duration:** ~60 seconds
- **Status:** ✅ Implemented

**Database Conflict Resolution** ([error-scenarios/database-conflict.spec.ts](error-scenarios/database-conflict.spec.ts))
- **Journey:** Concurrent Edits → **Conflict Detected** → **Options Shown** → **Resolution Saved**
- **Impact:** MEDIUM - validates optimistic locking and conflict resolution
- **Duration:** ~50 seconds
- **Status:** ✅ Implemented

**Concurrent Operation Safety** ([error-scenarios/concurrent-operations.spec.ts](error-scenarios/concurrent-operations.spec.ts))
- **Journey:** Start Operation → Concurrent Attempt → **Blocked** → First Completes → New Allowed
- **Impact:** MEDIUM - validates atomic operation guarantees
- **Duration:** ~40 seconds
- **Status:** ✅ Implemented

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
- ✅ 100% of dashboard features tested
- ✅ 100% of integration flows tested
- ✅ 100% of error scenarios covered

**Current Coverage:**
- ✅ Revenue flows: 3/3 (100%)
- ✅ Core features: 4/4 (100%)
- ✅ Advanced features: 7/7 (100%)
- ✅ Error scenarios: 6/6 (100%)

**Overall:** ✅ **100% COMPLETE** (20/20 critical tests - 5.5x increase from 18%!)

---

## Next Steps

1. ✅ **Phase 1 Complete:** Critical revenue flows implemented (3 tests)
2. ✅ **Phase 2 Complete:** Core functionality tests implemented (4 tests)
3. ✅ **Phase 3 Complete:** Advanced features implemented (7 tests)
4. ✅ **Phase 4 Complete:** Error scenarios and edge cases implemented (6 tests)

**🎉 ALL PHASES COMPLETE - 100% COVERAGE ACHIEVED!**

**Recent Completion:** Phase 4 finished 2025-11-10 with 6 error scenario tests covering payment failure recovery, network timeout handling, invalid credentials, rate limiting, database conflicts, and concurrent operations.

**All Tests:** 20/20 critical E2E tests implemented (1,962 Phase 4 lines + 2,907 Phase 3 lines + previous phases = comprehensive coverage)

See complete phase reports:
- [Phase 1 Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PRIORITY_1_COMPLETE.md)
- [Phase 2 Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_2_COMPLETE.md)
- [Phase 3 Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_3_COMPLETE.md)
- [Phase 4 Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_4_COMPLETE.md)

---

## Related Documentation

- **[Missing E2E Tests Analysis](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md)** - Complete audit and roadmap
- **[Phase 1 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PRIORITY_1_COMPLETE.md)** - Revenue flows implementation
- **[Phase 2 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_2_COMPLETE.md)** - Core functionality implementation
- **[Phase 3 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_3_COMPLETE.md)** - Advanced features implementation
- **[Phase 4 Completion Report](../../ARCHIVE/completion-reports-2025-11/E2E_TESTS_PHASE_4_COMPLETE.md)** - Error scenarios implementation ⭐ **NEW**
- **[Playwright Config](../../playwright.config.js)** - Test configuration
- **[GDPR Privacy Test](gdpr-privacy.spec.ts)** - Best example to follow
- **[Payment Failure Test](error-scenarios/payment-failure.spec.ts)** - ⭐ Best error handling example
- **[Playwright Documentation](https://playwright.dev/)** - Official docs
- **[Main Tests README](../README.md)** - All test types

---

**Questions?** See [ANALYSIS_MISSING_E2E_TESTS.md](../../docs/10-ANALYSIS/ANALYSIS_MISSING_E2E_TESTS.md) or the team.
