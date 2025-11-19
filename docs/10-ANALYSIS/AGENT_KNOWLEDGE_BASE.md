# AI Agent Knowledge Base

**Generated:** 2025-11-18T23:58:53.565Z
**Purpose:** This document teaches AI agents how to operate the application autonomously

---

## 📚 How to Use This Guide

**For AI Agents:**
- Each workflow describes a complete user journey you can execute
- Preconditions tell you what must be true before starting
- Steps are ordered actions you should perform
- Success indicators tell you when you've succeeded
- Error recovery tells you how to handle failures

**For Humans:**
- This is auto-generated documentation of E2E tests
- Use it to understand user workflows
- Use it to train AI agents or automation scripts

---

## 🎯 Available Workflows (370)

### 1. renders metrics and rollup health badge

**Intent:** Execute renders metrics and rollup health badge

**Preconditions:**
- User must have network access to application
- Application must be running and accessible

**Steps (10):**

1. **Navigate to /dashboard/telemetry**
   - Action: `navigate`
   - Target: `/dashboard/telemetry`
   - Expected: Page loads successfully with expected content

2. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

3. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

5. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

6. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

7. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

8. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

   ... 2 more steps

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 2. should track session metadata across page navigation

**Intent:** Execute should track session metadata across page navigation

**Preconditions:**
- User must have network access to application
- Application must be running and accessible

**Steps (26):**

1. **Progress marker**
   - Action: `log`
   - Expected: Continue to next step

2. **Progress marker**
   - Action: `log`
   - Expected: Continue to next step

3. **Navigate to target page**
   - Action: `navigate`
   - Expected: Page loads successfully with expected content

4. **Wait for element or condition**
   - Action: `wait`
   - Expected: Element appears or condition becomes true

5. **Progress marker**
   - Action: `log`
   - Expected: Continue to next step

6. **Progress marker**
   - Action: `log`
   - Expected: Continue to next step

7. **Navigate to target page**
   - Action: `navigate`
   - Expected: Page loads successfully with expected content

8. **Wait for element or condition**
   - Action: `wait`
   - Expected: Element appears or condition becomes true

   ... 18 more steps

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 3. exports user data by session ID with download

**Intent:** Export user data in compliance with privacy regulations

**Preconditions:**
- None - workflow can start from any state

**Steps (8):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

3. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

5. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

6. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

7. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

8. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 4. exports user data by email

**Intent:** Export user data in compliance with privacy regulations

**Preconditions:**
- None - workflow can start from any state

**Steps (6):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

3. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

5. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

6. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 5. shows validation error when exporting without identifiers

**Intent:** Export user data in compliance with privacy regulations

**Preconditions:**
- None - workflow can start from any state

**Steps (3):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

3. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ Error message is displayed to user
- ✅ System handles error gracefully

**Error Recovery:**
- ⚠️ Display clear error message to user
- ⚠️ Provide actionable next steps
- ⚠️ Do not lose user progress

---

### 6. shows API error when export fails

**Intent:** Export user data in compliance with privacy regulations

**Preconditions:**
- None - workflow can start from any state

**Steps (4):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

3. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ Error message is displayed to user
- ✅ System handles error gracefully

**Error Recovery:**
- ⚠️ Display clear error message to user
- ⚠️ Provide actionable next steps
- ⚠️ Do not lose user progress

---

### 7. deletes user data with confirmation toggle

**Intent:** Delete user data permanently with proper authorization

**Preconditions:**
- None - workflow can start from any state

**Steps (12):**

1. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

2. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

3. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

5. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

6. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

7. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

8. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

   ... 4 more steps

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 8. deletes user data by email with confirmation

**Intent:** Delete user data permanently with proper authorization

**Preconditions:**
- None - workflow can start from any state

**Steps (10):**

1. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

2. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

3. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

4. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

5. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

6. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

7. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

8. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

   ... 2 more steps

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 9. shows message when no data found to delete

**Intent:** Delete user data permanently with proper authorization

**Preconditions:**
- None - workflow can start from any state

**Steps (5):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

3. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

4. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

5. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

### 10. prevents deletion without confirmation

**Intent:** Execute prevents deletion without confirmation

**Preconditions:**
- None - workflow can start from any state

**Steps (4):**

1. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

2. **Enter data into field**
   - Action: `fill`
   - Expected: Field accepts input and validates correctly

3. **Click on element**
   - Action: `click`
   - Expected: Element responds and triggers expected action

4. **Verify expected state or outcome**
   - Action: `verify`
   - Expected: Verification passes

**Success Indicators:**
- ✅ No error messages displayed
- ✅ All steps complete without exceptions

**Error Recovery:**
- ⚠️ Log error and notify user

---

... 360 more workflows available in JSON export

## 🎨 UI Element Catalog (0)

Common UI elements you will interact with:


## 🔌 API Reference (67)

### `/api/dashboard/telemetry**`
- **Purpose:** Application API endpoint
- **Used in:** renders metrics and rollup health badge

### `/api/gdpr/export`
- **Purpose:** Handle privacy-related operations
- **Used in:** exports user data by session ID with download, exports user data by email, shows API error when export fails, shows loading state during export, verifies data portability - complete export format validation, verifies email notification sent for data export

### `/api/gdpr/delete`
- **Purpose:** Handle privacy-related operations
- **Used in:** deletes user data with confirmation toggle, deletes user data by email with confirmation, shows message when no data found to delete, shows API error when deletion fails, shows loading state during deletion, executes right to be forgotten - complete data erasure, verifies database cleanup after deletion

### `/api/chat`
- **Purpose:** Process chat messages and return AI responses
- **Used in:** should load widget, open programmatically, and send message with session metadata, should handle cart tracking webhook events, should lookup product by Shopify product ID, should lookup product by SKU, should search products by title, should handle product variant selection, should track purchase completion events, enforces Do Not Sell opt-out in chat widget, should add and configure domain successfully, should enforce rate limits and allow retry after cooldown, should handle network timeout and allow successful retry, should maintain context across multiple messages, should maintain context across multiple conversation turns

### `/api/dashboard/analytics**`
- **Purpose:** Retrieve analytics data
- **Used in:** should display analytics dashboard with user metrics and charts, should handle empty analytics data gracefully, should handle API errors gracefully, export with empty data: handle gracefully

### `/api/woocommerce/orders/recent`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should process order created webhook event

### `/api/woocommerce/orders**`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should handle order status update webhooks

### `/api/woocommerce/webhooks/logs`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should handle webhook delivery failures

### `/api/woocommerce/configure`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should trigger re-authentication flow for expired credentials, should handle invalid WooCommerce credentials and allow correction

### `/api/woocommerce/webhooks/settings`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should validate webhook signature security

### `/api/woocommerce/sync`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should sync full product catalog successfully, should handle incremental product updates, should sync product variants correctly, should handle product sync errors gracefully

### `/api/woocommerce/sync**`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should display sync progress in real-time

### `/api/woocommerce/cart-tracking/setup`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should setup cart tracking successfully

### `/api/woocommerce/abandoned-carts`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should detect abandoned carts, should trigger abandoned cart email

### `/api/woocommerce/abandoned-carts/*/email`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should trigger abandoned cart email

### `/api/woocommerce/cart-analytics`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should track cart recovery success

### `/api/woocommerce/cart-test`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should maintain cart session across messages, should handle Store API failures gracefully

### `/api/shopify/products/*`
- **Purpose:** Interact with Shopify integration
- **Used in:** should lookup product by Shopify product ID, should handle product variant selection

### `/api/shopify/products/search**`
- **Purpose:** Interact with Shopify integration
- **Used in:** should lookup product by SKU, should search products by title

### `/api/shopify/inventory/*`
- **Purpose:** Interact with Shopify integration
- **Used in:** should sync product inventory in real-time

### `/api/shopify/configure`
- **Purpose:** Interact with Shopify integration
- **Used in:** should setup order tracking, should re-authenticate with Shopify

### `/api/shopify/orders/*`
- **Purpose:** Interact with Shopify integration
- **Used in:** should query order status

### `/api/shopify/customers**`
- **Purpose:** Interact with Shopify integration
- **Used in:** should lookup customer information

### `/api/shopify/webhooks/logs`
- **Purpose:** Interact with Shopify integration
- **Used in:** should process Shopify webhook events

### `/api/shopify/**`
- **Purpose:** Interact with Shopify integration
- **Used in:** should handle Shopify API rate limiting, should re-authenticate with Shopify

### `/api/analytics/init`
- **Purpose:** Retrieve analytics data
- **Used in:** should initialize event tracking on widget load

### `/api/analytics/session`
- **Purpose:** Retrieve analytics data
- **Used in:** should initialize event tracking on widget load

### `/api/analytics/events`
- **Purpose:** Retrieve analytics data
- **Used in:** should track user interaction events, should track purchase completion events

### `/api/analytics/custom-events`
- **Purpose:** Retrieve analytics data
- **Used in:** should create and track custom events

### `/api/analytics/export**`
- **Purpose:** Retrieve analytics data
- **Used in:** should export analytics data, handle request timeout gracefully

### `/api/privacy/portability`
- **Purpose:** Handle privacy-related operations
- **Used in:** submits data portability request with machine-readable format, verifies data portability includes third-party data

### `/api/privacy/rectification`
- **Purpose:** Handle privacy-related operations
- **Used in:** submits data rectification request

### `/api/privacy/access`
- **Purpose:** Handle privacy-related operations
- **Used in:** views personal data via access request, handles access request with no data found

### `/api/privacy/restrict-processing`
- **Purpose:** Handle privacy-related operations
- **Used in:** submits restriction of processing request

### `/api/privacy/object-to-processing`
- **Purpose:** Handle privacy-related operations
- **Used in:** objects to processing based on legitimate grounds

### `/api/privacy/rectification/status`
- **Purpose:** Handle privacy-related operations
- **Used in:** tracks rectification request status

### `/api/privacy/consent`
- **Purpose:** Handle privacy-related operations
- **Used in:** manages consent - user opts in to data collection, manages consent - user opts out of data collection

### `/api/privacy/consent/withdraw`
- **Purpose:** Handle privacy-related operations
- **Used in:** withdraws consent - user revokes all consent

### `/api/gdpr/audit**`
- **Purpose:** Handle privacy-related operations
- **Used in:** enforces 30-day legal timeframe for data requests, maintains comprehensive audit trail for compliance

### `/api/privacy/automated-decisions/opt-out`
- **Purpose:** Handle privacy-related operations
- **Used in:** opts out of automated decision-making

### `/api/privacy/ccpa/do-not-sell`
- **Purpose:** Handle privacy-related operations
- **Used in:** submits Do Not Sell request, handles Do Not Sell request with verification

### `/api/privacy/ccpa/do-not-sell/status`
- **Purpose:** Handle privacy-related operations
- **Used in:** confirms Do Not Sell opt-out status

### `/api/privacy/ccpa/disclosure`
- **Purpose:** Handle privacy-related operations
- **Used in:** submits data disclosure request

### `/api/privacy/ccpa/disclosure/download`
- **Purpose:** Handle privacy-related operations
- **Used in:** delivers data disclosure report

### `/api/privacy/ccpa/do-not-sell/verify`
- **Purpose:** Handle privacy-related operations
- **Used in:** handles Do Not Sell request with verification

### `/api/privacy/ccpa/third-party-sharing`
- **Purpose:** Handle privacy-related operations
- **Used in:** tracks third-party data sharing disclosures

### `/api/widget/config**`
- **Purpose:** Application API endpoint
- **Used in:** should install and customize widget successfully, should enforce rate limits and allow retry after cooldown, should handle network timeout and allow successful retry

### `/api/domains**`
- **Purpose:** Application API endpoint
- **Used in:** should add and configure domain successfully

### `/api/dashboard/analytics`
- **Purpose:** Retrieve analytics data
- **Used in:** should enable comparison mode and display change indicators, should manually refresh analytics data

### `/api/analytics/export?format=csv&days={days}`
- **Purpose:** Retrieve analytics data
- **Used in:** Export workflow documentation for AI agents

### `/api/analytics/export?format=excel&days={days}`
- **Purpose:** Retrieve analytics data
- **Used in:** Export workflow documentation for AI agents

### `/api/analytics/export?format=pdf&days={days}`
- **Purpose:** Retrieve analytics data
- **Used in:** Export workflow documentation for AI agents

### `/api/dashboard/analytics?days={days}`
- **Purpose:** Retrieve analytics data
- **Used in:** Export workflow documentation for AI agents

### `/api/analytics/intelligence`
- **Purpose:** Retrieve analytics data
- **Used in:** should manually refresh analytics data

### `/api/products**`
- **Purpose:** Application API endpoint
- **Used in:** should handle payment failure and allow retry with cart preserved

### `/api/checkout`
- **Purpose:** Application API endpoint
- **Used in:** should handle payment failure and allow retry with cart preserved

### `/api/domains/test/settings`
- **Purpose:** Application API endpoint
- **Used in:** should detect concurrent edits and provide conflict resolution

### `/api/scrape`
- **Purpose:** Initiate web scraping job
- **Used in:** should prevent concurrent scraping and allow retry after completion

### `/api/scrape/status**`
- **Purpose:** Initiate web scraping job
- **Used in:** should prevent concurrent scraping and allow retry after completion

### `/api/scrape/status?jobId=job-12345`
- **Purpose:** Initiate web scraping job
- **Used in:** should prevent concurrent scraping and allow retry after completion

### `/api/demo/scrape`
- **Purpose:** Initiate web scraping job
- **Used in:** should complete demo flow from URL entry to AI chat response

### `/api/demo/chat`
- **Purpose:** Process chat messages and return AI responses
- **Used in:** should complete demo flow from URL entry to AI chat response

### `/api/analytics/realtime**`
- **Purpose:** Retrieve analytics data
- **Used in:** should handle connection interruptions gracefully

### `/api/widget/config`
- **Purpose:** Application API endpoint
- **Used in:** handles save errors gracefully

### `/api/analytics/export?format=csv&days=7`
- **Purpose:** Retrieve analytics data
- **Used in:** handle request timeout gracefully, complete export workflow: UI suggestion for missing buttons

### `/api/analytics/export?format=${formats[i]}&days=7`);`
- **Purpose:** Retrieve analytics data
- **Used in:** sequential export downloads: verify file independence

### `/api/analytics/export?format=csv&days=${days}`);`
- **Purpose:** Retrieve analytics data
- **Used in:** export with custom time ranges


## 🔄 Common Patterns

### 1. State Verification (266 uses)
Verify expected state or element visibility

**Example:**
```typescript
await expect(element).toBeVisible();
```

### 2. Page Navigation (184 uses)
Navigate to a URL and wait for page load

**Example:**
```typescript
await page.goto(url, { waitUntil: "networkidle" })
```

### 3. Form Filling (38 uses)
Fill multiple form fields and submit

**Example:**
```typescript
await input.fill(value); await submitButton.click();
```

