# AI Agent Knowledge Base

**Generated:** 2025-11-19T15:59:18.178Z
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

## 🎯 Available Workflows (239)

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

... 229 more workflows available in JSON export

## 🎨 UI Element Catalog (0)

Common UI elements you will interact with:


## 🔌 API Reference (29)

### `/api/dashboard/telemetry**`
- **Purpose:** Application API endpoint
- **Used in:** renders metrics and rollup health badge

### `/api/gdpr/export`
- **Purpose:** Handle privacy-related operations
- **Used in:** exports user data by session ID with download, exports user data by email, shows API error when export fails, shows loading state during export

### `/api/gdpr/delete`
- **Purpose:** Handle privacy-related operations
- **Used in:** deletes user data with confirmation toggle, deletes user data by email with confirmation, shows message when no data found to delete, shows API error when deletion fails, shows loading state during deletion

### `/api/chat`
- **Purpose:** Process chat messages and return AI responses
- **Used in:** should load widget, open programmatically, and send message with session metadata, should filter products by multiple criteria, should sort search results by different criteria, should handle "no results" with helpful suggestions, should paginate large result sets, should measure search performance, should respond to chat messages within 3 seconds (p95), should handle large conversations without degradation (50+ messages), should handle concurrent message burst without errors, should not leak memory over extended usage, should enforce rate limits and allow retry after cooldown, should handle network timeout and allow successful retry, should add and configure domain successfully, should maintain context across multiple conversation turns

### `/api/dashboard/analytics**`
- **Purpose:** Retrieve analytics data
- **Used in:** should display analytics dashboard with user metrics and charts, should handle empty analytics data gracefully, should handle API errors gracefully, export with empty data: handle gracefully

### `/api/woocommerce/cart-test`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should maintain cart session across messages, should handle Store API failures gracefully

### `/api/widget/config**`
- **Purpose:** Application API endpoint
- **Used in:** should enforce rate limits and allow retry after cooldown, should handle network timeout and allow successful retry, should install and customize widget successfully

### `/api/products**`
- **Purpose:** Application API endpoint
- **Used in:** should handle payment failure and allow retry with cart preserved

### `/api/checkout`
- **Purpose:** Application API endpoint
- **Used in:** should handle payment failure and allow retry with cart preserved

### `/api/woocommerce/configure`
- **Purpose:** Interact with WooCommerce integration
- **Used in:** should handle invalid WooCommerce credentials and allow correction

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

### `/api/analytics/export**`
- **Purpose:** Retrieve analytics data
- **Used in:** handle request timeout gracefully

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

### 1. State Verification (161 uses)
Verify expected state or element visibility

**Example:**
```typescript
await expect(element).toBeVisible();
```

### 2. Page Navigation (83 uses)
Navigate to a URL and wait for page load

**Example:**
```typescript
await page.goto(url, { waitUntil: "networkidle" })
```

### 3. Form Filling (22 uses)
Fill multiple form fields and submit

**Example:**
```typescript
await input.fill(value); await submitButton.click();
```

