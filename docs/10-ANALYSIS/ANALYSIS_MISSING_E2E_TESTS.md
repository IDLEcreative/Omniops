# Missing E2E Tests Analysis

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-09
**Purpose:** Comprehensive audit of missing end-to-end tests based on actual user journeys

---

## Executive Summary

**Current E2E Coverage:** 5 test suites covering ~15% of critical user journeys
**Missing Coverage:** ~85% of end-to-end flows lack comprehensive testing
**Highest Priority Gaps:** Complete purchase journeys, web scraping flows, dashboard features

---

## Existing E2E Test Coverage ✅

### 1. Chat Widget Integration (`chat-widget-integration.spec.ts`)
**What's Tested:**
- ✅ Widget loads and iframe appears
- ✅ Widget configuration verification
- ✅ Programmatic opening via `ChatWidget.open()`
- ✅ Message sending to `/api/chat`
- ✅ Session metadata in localStorage

**What's Missing:**
- ❌ Actual AI response (test stops after sending message)
- ❌ Product recommendations appearing
- ❌ Multi-turn conversation flow
- ❌ Error handling scenarios
- ❌ Rate limiting behavior

**Completion:** ~40% (stops before "end" - no AI response verification)

---

### 2. Analytics Dashboard (`analytics-dashboard-display.spec.ts`)
**What's Tested:**
- ✅ Dashboard loads with all 8 metric cards
- ✅ Charts render correctly
- ✅ Shopping funnel visualization
- ✅ Top pages view
- ✅ API response structure validation
- ✅ Empty data handling
- ✅ Error handling
- ✅ Tab switching

**What's Missing:**
- ❌ Data actually populating from real sessions
- ❌ Date range filtering
- ❌ Real-time updates
- ❌ Export functionality

**Completion:** ~75% (good coverage, missing some interactions)

---

### 3. Session Metadata Tracking (`session-metadata-tracking.spec.ts`)
**What's Tested:**
- ✅ Session creation on page load
- ✅ Page view tracking across navigation
- ✅ Metadata persisted to localStorage
- ✅ Session ID format validation

**What's Missing:**
- ❌ Metadata sent with chat requests (known bug documented)
- ❌ Session timeout handling
- ❌ Cross-domain tracking
- ❌ E-commerce event tracking (product views, cart, checkout)

**Completion:** ~60% (tracking works but not integrated with chat)

---

### 4. GDPR Privacy (`gdpr-privacy.spec.ts`)
**What's Tested:**
- ✅ User data export by session ID
- ✅ User data export by email
- ✅ Data deletion with confirmation
- ✅ Validation errors
- ✅ API error handling
- ✅ Loading states
- ✅ Audit log display
- ✅ Audit log filtering

**What's Missing:**
- Nothing major - this is **excellent** e2e coverage!

**Completion:** ~95% ⭐ **Best Example**

---

### 5. Telemetry Smoke Test (`telemetry-smoke.spec.ts`)
**What's Tested:**
- ✅ Dashboard renders
- ✅ Basic metrics display
- ✅ Domain breakdown
- ✅ Model usage stats

**What's Missing:**
- ❌ Live session monitoring
- ❌ Cost trend analysis
- ❌ Alert configuration
- ❌ Real-time updates
- ❌ Interactive charts

**Completion:** ~30% (basic smoke test only)

---

## Critical Missing E2E Tests ❌

### Priority 1: Complete User Purchase Journeys

#### 1.1 Landing Page Demo to Chat Flow
**User Journey:**
```
Home page → Enter demo URL → Scraping progress → Chat opens → Ask question → Get AI response → See product recommendations → Click product → View product details
```

**Why Critical:** This is the PRIMARY user acquisition flow
**Impact:** High - validates entire demo experience
**File:** `__tests__/playwright/demo-to-chat-flow.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] User enters website URL on homepage
- [ ] Scraping progress updates (homepage → sitemap → pages → embeddings)
- [ ] Demo session created successfully
- [ ] Chat widget automatically opens after scraping
- [ ] User can send message
- [ ] AI responds with relevant answer
- [ ] Product recommendations appear (if applicable)
- [ ] Session expires after 10 minutes
- [ ] Message limit enforced (20 messages)

---

#### 1.2 Chat → Product → Cart → Purchase Flow
**User Journey:**
```
Open chat → "Show me pumps" → AI recommends products → Click product → Add to cart → View cart → Proceed to checkout → Complete purchase → Order confirmation
```

**Why Critical:** This is the REVENUE GENERATION flow
**Impact:** Critical - validates entire conversion funnel
**File:** `__tests__/playwright/complete-purchase-flow.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] User asks product-related question
- [ ] AI returns product recommendations with links
- [ ] User clicks product link
- [ ] Product page loads (WooCommerce/Shopify)
- [ ] User adds product to cart
- [ ] Cart count updates
- [ ] User proceeds to checkout
- [ ] User completes payment
- [ ] Order confirmation displays
- [ ] Purchase tracked in analytics
- [ ] Conversion funnel updated (chat → product → cart → checkout → purchase)

---

#### 1.3 WooCommerce Integration Setup to Purchase
**User Journey:**
```
Dashboard → Integrations → WooCommerce → Configure → Sync products → Test search → Chat query → Product result → Purchase
```

**Why Critical:** Core integration feature
**Impact:** High - validates primary e-commerce integration
**File:** `__tests__/playwright/woocommerce-integration-e2e.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to WooCommerce integration page
- [ ] Enter store URL and credentials
- [ ] Test connection succeeds
- [ ] Product sync initiated
- [ ] Products appear in dashboard
- [ ] Chat query finds WooCommerce product
- [ ] Product details accurate
- [ ] Add to cart works
- [ ] Order placed successfully
- [ ] Order tracked in analytics

---

#### 1.4 Shopify Integration Setup to Purchase
**User Journey:**
```
Dashboard → Integrations → Shopify → Configure → Sync products → Test search → Chat query → Product result → Purchase
```

**Why Critical:** Secondary e-commerce integration
**Impact:** High - validates Shopify support
**File:** `__tests__/playwright/shopify-integration-e2e.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to Shopify integration page
- [ ] Enter store URL and access token
- [ ] Test connection succeeds
- [ ] Product sync initiated
- [ ] Products appear in dashboard
- [ ] Chat query finds Shopify product
- [ ] Product details accurate
- [ ] Add to cart works
- [ ] Order placed successfully
- [ ] Order tracked in analytics

---

### Priority 2: Web Scraping Flows

#### 2.1 Initial Scraping Flow
**User Journey:**
```
Dashboard → Installation → Enter domain → Start scrape → Progress tracking → Scrape completes → Content verified → Embeddings generated
```

**Why Critical:** Core product functionality
**Impact:** Critical - validates content ingestion
**File:** `__tests__/playwright/scraping-flow.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to installation/scraping page
- [ ] Enter domain URL
- [ ] Start scrape button triggers scraping
- [ ] Progress updates (homepage, sitemap, crawling, embeddings)
- [ ] Scraping completes successfully
- [ ] Pages appear in database
- [ ] Embeddings generated
- [ ] Content searchable in chat
- [ ] Error handling for failed scrapes

---

#### 2.2 Re-scraping/Refresh Flow
**User Journey:**
```
Dashboard → Domains → Select domain → Force refresh → Confirmation → Scraping progress → Completion → Verify updated content
```

**Why Critical:** Content stays fresh
**Impact:** Medium - validates content refresh
**File:** `__tests__/playwright/rescrape-flow.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to domain management
- [ ] Select domain for refresh
- [ ] Click "Force Refresh" button
- [ ] Confirm refresh action
- [ ] Lock acquired (prevents concurrent refreshes)
- [ ] Progress tracking displays
- [ ] Old content marked as deleted
- [ ] New content scraped
- [ ] Embeddings regenerated
- [ ] Lock released
- [ ] Updated content searchable

---

### Priority 3: Dashboard Features

#### 3.1 Widget Installation and Configuration
**User Journey:**
```
Dashboard → Installation → Copy embed code → Customize widget → Preview → Save → Install on website → Verify widget loads
```

**Why Critical:** Primary customer onboarding
**Impact:** High - validates setup experience
**File:** `__tests__/playwright/widget-installation.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to installation page
- [ ] Widget embed code displayed
- [ ] Copy code button works
- [ ] Navigate to customization
- [ ] Change widget appearance (colors, position, behavior)
- [ ] Preview shows changes in real-time
- [ ] Save configuration
- [ ] Configuration persisted to database
- [ ] Test page with widget shows customizations
- [ ] Widget loads with correct config

---

#### 3.2 Domain Configuration
**User Journey:**
```
Dashboard → Domains → Add domain → Configure settings → Save → Domain active → Test chat on domain
```

**Why Critical:** Multi-tenant core
**Impact:** High - validates domain isolation
**File:** `__tests__/playwright/domain-configuration.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to domains page
- [ ] Add new domain
- [ ] Configure domain settings (name, URL, credentials)
- [ ] Save domain configuration
- [ ] Domain appears in domains list
- [ ] Domain-specific chat works
- [ ] Domain isolation enforced (can't access other domains' data)
- [ ] Domain can be edited
- [ ] Domain can be disabled/deleted

---

#### 3.3 Team Management
**User Journey:**
```
Dashboard → Team → Invite member → Member receives email → Accepts invitation → Has correct permissions → Can access dashboard
```

**Why Critical:** Multi-user support
**Impact:** Medium - validates collaboration
**File:** `__tests__/playwright/team-management.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to team page
- [ ] Send team invitation
- [ ] Invitation created in database
- [ ] Accept invitation link works
- [ ] New member can log in
- [ ] Permissions enforced correctly
- [ ] Member can view allowed resources
- [ ] Member cannot access restricted resources
- [ ] Team owner can remove member

---

#### 3.4 Conversations View
**User Journey:**
```
Dashboard → Conversations → View list → Filter by domain → Search messages → View conversation details → Export conversation
```

**Why Critical:** Customer support use case
**Impact:** Medium - validates conversation management
**File:** `__tests__/playwright/conversations-management.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to conversations page
- [ ] Conversations list displays
- [ ] Filter by domain works
- [ ] Search finds relevant conversations
- [ ] Click conversation shows messages
- [ ] Messages display correctly
- [ ] Export conversation works
- [ ] Pagination works for large lists
- [ ] Real-time updates when new messages arrive

---

### Priority 4: Advanced Chat Scenarios

#### 4.1 Multi-turn Conversation with Context
**User Journey:**
```
Open chat → "What products do you have?" → AI lists products → "Tell me more about the first one" → AI provides details → "Add to cart" → Product added
```

**Why Critical:** Tests conversation memory and context
**Impact:** High - validates AI quality
**File:** `__tests__/playwright/multi-turn-chat.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] First message gets relevant response
- [ ] Second message uses context from first
- [ ] Third message uses accumulated context
- [ ] AI doesn't repeat information
- [ ] AI correctly handles pronouns ("it", "that one")
- [ ] Conversation history maintained
- [ ] Context limit handled gracefully

---

#### 4.2 Error Scenarios in Chat
**User Journey:**
```
Chat with various error conditions: rate limit, AI failure, network timeout, invalid input, malicious input
```

**Why Critical:** Production resilience
**Impact:** High - validates error handling
**File:** `__tests__/playwright/chat-error-handling.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Rate limit message displayed after hitting limit
- [ ] AI failure shows user-friendly error
- [ ] Network timeout retries and shows message
- [ ] Malicious input sanitized
- [ ] XSS attempts blocked
- [ ] SQL injection attempts blocked
- [ ] Empty messages rejected
- [ ] Messages >10KB rejected
- [ ] Recovery after error (can continue chatting)

---

### Priority 5: E-commerce Specific Features

#### 5.1 Cart Abandonment Tracking
**User Journey:**
```
User adds to cart → Leaves site → Cart saved → Returns later → Cart still populated → Completes purchase
```

**Why Critical:** Revenue recovery
**Impact:** Medium - validates cart persistence
**File:** `__tests__/playwright/cart-abandonment.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] User adds product to cart
- [ ] User leaves site (closes tab)
- [ ] Cart data saved to database
- [ ] User returns (new session)
- [ ] Cart restored from database
- [ ] Cart contents accurate
- [ ] User completes purchase
- [ ] Analytics track cart recovery

---

#### 5.2 Order Lookup
**User Journey:**
```
Chat → "Where is my order #12345?" → AI looks up order → Returns status, tracking, estimated delivery
```

**Why Critical:** Customer service use case
**Impact:** Medium - validates WooCommerce/Shopify integration
**File:** `__tests__/playwright/order-lookup.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] User asks about order
- [ ] AI extracts order number
- [ ] Order looked up in WooCommerce/Shopify
- [ ] Order details returned accurately
- [ ] Tracking information displayed
- [ ] Handles order not found gracefully
- [ ] Privacy: only shows orders for current user

---

### Priority 6: Real-time Features

#### 6.1 Live Analytics Updates
**User Journey:**
```
Open analytics dashboard → New chat session starts → Metrics update in real-time → New product view → Funnel updates
```

**Why Critical:** Real-time monitoring
**Impact:** Low - nice-to-have feature
**File:** `__tests__/playwright/realtime-analytics.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Dashboard open shows current metrics
- [ ] Simulate new chat session
- [ ] Active sessions count updates
- [ ] Simulate product view
- [ ] Product views metric updates
- [ ] Funnel visualization updates
- [ ] Updates happen without page refresh
- [ ] WebSocket/polling works correctly

---

#### 6.2 Live Chat Monitoring
**User Journey:**
```
Dashboard → Live Sessions → See active chats → Monitor messages → Intervene if needed
```

**Why Critical:** Customer support oversight
**Impact:** Low - future feature
**File:** `__tests__/playwright/live-chat-monitoring.spec.ts` (MISSING)

**Test Should Verify:**
- [ ] Navigate to live sessions
- [ ] Active chats displayed
- [ ] Messages appear in real-time
- [ ] Agent can take over chat
- [ ] User notified of agent takeover
- [ ] Conversation continues smoothly
- [ ] Session ends when user closes chat

---

## Test Organization Strategy

### Recommended File Structure

```
__tests__/playwright/
├── core-journeys/
│   ├── demo-to-chat-flow.spec.ts           # Priority 1.1
│   ├── complete-purchase-flow.spec.ts      # Priority 1.2
│   └── user-onboarding.spec.ts             # New registration flow
│
├── integrations/
│   ├── woocommerce-integration-e2e.spec.ts # Priority 1.3
│   ├── shopify-integration-e2e.spec.ts     # Priority 1.4
│   └── stripe-billing.spec.ts              # Billing integration
│
├── scraping/
│   ├── scraping-flow.spec.ts               # Priority 2.1
│   ├── rescrape-flow.spec.ts               # Priority 2.2
│   └── scraping-errors.spec.ts             # Error scenarios
│
├── dashboard/
│   ├── widget-installation.spec.ts         # Priority 3.1
│   ├── domain-configuration.spec.ts        # Priority 3.2
│   ├── team-management.spec.ts             # Priority 3.3
│   ├── conversations-management.spec.ts    # Priority 3.4
│   └── performance-monitoring.spec.ts      # Performance dashboard
│
├── chat/
│   ├── multi-turn-chat.spec.ts             # Priority 4.1
│   ├── chat-error-handling.spec.ts         # Priority 4.2
│   └── chat-product-search.spec.ts         # Product queries
│
├── ecommerce/
│   ├── cart-abandonment.spec.ts            # Priority 5.1
│   ├── order-lookup.spec.ts                # Priority 5.2
│   └── product-recommendations.spec.ts     # AI recommendations
│
├── realtime/
│   ├── realtime-analytics.spec.ts          # Priority 6.1
│   └── live-chat-monitoring.spec.ts        # Priority 6.2
│
└── existing/
    ├── analytics-dashboard-display.spec.ts  # Keep
    ├── chat-widget-integration.spec.ts      # Enhance
    ├── gdpr-privacy.spec.ts                 # Keep (excellent!)
    ├── session-metadata-tracking.spec.ts    # Enhance
    └── telemetry-smoke.spec.ts              # Enhance
```

---

## Implementation Priority

### Phase 1: Critical Revenue Flows (2-3 days)
1. ✅ Complete purchase flow (Priority 1.2)
2. ✅ WooCommerce integration (Priority 1.3)
3. ✅ Demo to chat flow (Priority 1.1)

**Impact:** Validates all revenue-generating paths

---

### Phase 2: Core Functionality (2-3 days)
1. ✅ Scraping flow (Priority 2.1)
2. ✅ Widget installation (Priority 3.1)
3. ✅ Domain configuration (Priority 3.2)
4. ✅ Multi-turn chat (Priority 4.1)

**Impact:** Validates core product features

---

### Phase 3: Enhancements & Edge Cases (1-2 days)
1. ✅ Chat error handling (Priority 4.2)
2. ✅ Rescrape flow (Priority 2.2)
3. ✅ Shopify integration (Priority 1.4)
4. ✅ Cart abandonment (Priority 5.1)

**Impact:** Improves reliability and resilience

---

### Phase 4: Advanced Features (1-2 days)
1. ✅ Conversations management (Priority 3.4)
2. ✅ Team management (Priority 3.3)
3. ✅ Order lookup (Priority 5.2)
4. ✅ Realtime analytics (Priority 6.1)

**Impact:** Validates advanced use cases

---

## Key Principles for New Tests

### 1. Test Complete Journeys
```typescript
// ❌ BAD: Stops before the end
test('user adds to cart', async () => {
  await addToCart();
  // Missing: checkout, payment, confirmation
});

// ✅ GOOD: Complete journey
test('user completes purchase from chat to confirmation', async () => {
  await openChat();
  await askProductQuestion();
  await clickProduct();
  await addToCart();
  await checkout();
  await completePurchase();
  await verifyOrderConfirmation();
  await verifyAnalyticsTracked();
});
```

### 2. Verify Side Effects
```typescript
// After completing purchase flow
await verifyOrderInDatabase();
await verifyEmailSent();
await verifyAnalyticsUpdated();
await verifyInventoryReduced();
```

### 3. Test Error Scenarios
```typescript
test('handles payment failure gracefully', async () => {
  await mockPaymentFailure();
  await attemptCheckout();
  await expectUserFriendlyError();
  await verifyOrderNotCreated();
  await verifyCartStillPopulated();
});
```

### 4. Use Real Data When Possible
```typescript
// ✅ Use actual test products from WooCommerce
// ✅ Use real AI responses (don't mock OpenAI in e2e)
// ✅ Use real scraping (test against controlled test site)
```

### 5. Measure Business Metrics
```typescript
test('conversion funnel updates correctly', async () => {
  const beforeMetrics = await getAnalytics();

  await completePurchaseJourney();

  const afterMetrics = await getAnalytics();
  expect(afterMetrics.conversionRate).toBeGreaterThan(beforeMetrics.conversionRate);
});
```

---

## Success Metrics

**Target E2E Coverage:**
- [ ] 100% of revenue-generating flows tested
- [ ] 100% of critical user journeys tested
- [ ] 80% of dashboard features tested
- [ ] 90% of integration flows tested
- [ ] All error scenarios covered

**Quality Metrics:**
- [ ] All tests verify complete journeys (not partial)
- [ ] All tests verify side effects (database, analytics, etc.)
- [ ] All tests run in <5 minutes total
- [ ] Zero flaky tests
- [ ] All tests have clear assertions

---

## Next Steps

1. **Review this analysis** with team
2. **Prioritize tests** based on business impact
3. **Create test templates** for common patterns
4. **Implement Phase 1** tests (critical revenue flows)
5. **Set up CI/CD** to run e2e tests on every deploy
6. **Monitor test results** and iterate

---

## Related Documents

- [Existing Test: GDPR Privacy](../__tests__/playwright/gdpr-privacy.spec.ts) - ⭐ Use as template
- [Chat Widget Integration](../__tests__/playwright/chat-widget-integration.spec.ts) - Needs enhancement
- [Funnel System Guide](../docs/02-GUIDES/GUIDE_FUNNEL_SYSTEM_COMPLETE.md)
- [WooCommerce Integration](../docs/06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md)
