# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** 2025-11-10T00:21:29.085Z
**Source:** Playwright E2E test files in `__tests__/playwright/`

## Summary

- **Total Tests:** 44
- **Total Steps:** 284
- **API Endpoints Documented:** 0
- **UI Elements Documented:** 47

---

## Table of Contents

1. [renders metrics and rollup health badge](#renders-metrics-and-rollup-health-badge)
2. [should track session metadata across page navigation](#should-track-session-metadata-across-page-navigation)
3. [exports user data by session ID with download](#exports-user-data-by-session-id-with-download)
4. [exports user data by email](#exports-user-data-by-email)
5. [shows validation error when exporting without identifiers](#shows-validation-error-when-exporting-without-identifiers)
6. [shows API error when export fails](#shows-api-error-when-export-fails)
7. [deletes user data with confirmation toggle](#deletes-user-data-with-confirmation-toggle)
8. [deletes user data by email with confirmation](#deletes-user-data-by-email-with-confirmation)
9. [shows message when no data found to delete](#shows-message-when-no-data-found-to-delete)
10. [prevents deletion without confirmation](#prevents-deletion-without-confirmation)
11. [shows API error when deletion fails](#shows-api-error-when-deletion-fails)
12. [shows loading state during export](#shows-loading-state-during-export)
13. [shows loading state during deletion](#shows-loading-state-during-deletion)
14. [renders GDPR compliance UI elements](#renders-gdpr-compliance-ui-elements)
15. [displays audit log entries with correct metadata](#displays-audit-log-entries-with-correct-metadata)
16. [filters audit log by request type](#filters-audit-log-by-request-type)
17. [should load widget, open programmatically, and send message with session metadata](#should-load-widget-open-programmatically-and-send-message-with-session-metadata)
18. [should display analytics dashboard with user metrics and charts](#should-display-analytics-dashboard-with-user-metrics-and-charts)
19. [should handle empty analytics data gracefully](#should-handle-empty-analytics-data-gracefully)
20. [should handle API errors gracefully](#should-handle-api-errors-gracefully)
21. [should switch between tabs correctly](#should-switch-between-tabs-correctly)
22. [should complete scraping and make content searchable in chat](#should-complete-scraping-and-make-content-searchable-in-chat)
23. [should handle scraping errors gracefully](#should-handle-scraping-errors-gracefully)
24. [should show progress during long scraping jobs](#should-show-progress-during-long-scraping-jobs)
25. [should complete WooCommerce setup and enable product search](#should-complete-woocommerce-setup-and-enable-product-search)
26. [should handle WooCommerce connection errors gracefully](#should-handle-woocommerce-connection-errors-gracefully)
27. [should install and customize widget successfully](#should-install-and-customize-widget-successfully)
28. [should generate correct embed code for different environments](#should-generate-correct-embed-code-for-different-environments)
29. [should handle widget customization with invalid values](#should-handle-widget-customization-with-invalid-values)
30. [should add and configure domain successfully](#should-add-and-configure-domain-successfully)
31. [should handle domain editing](#should-handle-domain-editing)
32. [should handle domain deletion/disabling](#should-handle-domain-deletion-disabling)
33. [should enforce domain access control](#should-enforce-domain-access-control)
34. [should complete demo flow from URL entry to AI chat response](#should-complete-demo-flow-from-url-entry-to-ai-chat-response)
35. [should handle invalid URLs gracefully](#should-handle-invalid-urls-gracefully)
36. [should enforce demo session limits](#should-enforce-demo-session-limits)
37. [should show upgrade prompt after demo limits reached](#should-show-upgrade-prompt-after-demo-limits-reached)
38. [should complete full purchase flow from chat to order confirmation](#should-complete-full-purchase-flow-from-chat-to-order-confirmation)
39. [should handle purchase flow with guest checkout](#should-handle-purchase-flow-with-guest-checkout)
40. [should handle purchase flow with registered user](#should-handle-purchase-flow-with-registered-user)
41. [should maintain context across multiple conversation turns](#should-maintain-context-across-multiple-conversation-turns)
42. [should handle conversation with context reset](#should-handle-conversation-with-context-reset)
43. [should handle very long conversations](#should-handle-very-long-conversations)
44. [should handle ambiguous pronouns](#should-handle-ambiguous-pronouns)

---

## 1. renders metrics and rollup health badge

**Source:** [`__tests__/playwright/telemetry-smoke.spec.ts`](/__tests__/playwright/telemetry-smoke.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/dashboard/telemetry` |  |  |

**Code Reference:**

```typescript
// Line 70
await page.goto('/dashboard/telemetry');

```

---

## 2. should track session metadata across page navigation

**Source:** [`__tests__/playwright/session-metadata-tracking.spec.ts`](/__tests__/playwright/session-metadata-tracking.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to home page |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | log |  |  | 📍 Step 2: Navigating to pricing page |
| 5 | navigate | ``${BASE_URL}/pricing`` |  |  |
| 6 | wait | `1000` |  |  |
| 7 | log |  |  | 📍 Step 3: Navigating to test-widget page |
| 8 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 9 | wait | `2000` |  |  |
| 10 | log |  |  | 📍 Step 4: Checking localStorage for session metadata |

**Code Reference:**

```typescript
// Line 13
console.log('📍 Step 1: Navigating to home page');

// Line 14
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 15
await page.waitForTimeout(1000);

// Line 19
console.log('📍 Step 2: Navigating to pricing page');

// Line 20
await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });

// Line 21
await page.waitForTimeout(1000);

// Line 25
console.log('📍 Step 3: Navigating to test-widget page');

// Line 26
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 27
await page.waitForTimeout(2000);

// Line 31
console.log('📍 Step 4: Checking localStorage for session metadata');

```

---

## 3. exports user data by session ID with download

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-abc-123` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 66
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 67
await page.getByLabel(/Session ID/i).fill('session-abc-123');

// Line 69
await page.getByRole('button', { name: /Export User Data/i }).click();

// Line 76
await page.getByRole('button', { name: /exports/i }).click();

```

---

## 4. exports user data by email

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `user@acme.com` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 103
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 104
await page.getByLabel(/Email Address/i).fill('user@acme.com');

// Line 106
await page.getByRole('button', { name: /Export User Data/i }).click();

// Line 110
await page.getByRole('button', { name: /exports/i }).click();

```

---

## 5. shows validation error when exporting without identifiers

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | click |  |  |  |

**Code Reference:**

```typescript
// Line 115
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 118
await page.getByRole('button', { name: /Export User Data/i }).click();

```

---

## 6. shows API error when export fails

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-123` |  |  |
| 3 | click |  |  |  |

**Code Reference:**

```typescript
// Line 135
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 136
await page.getByLabel(/Session ID/i).fill('session-123');

// Line 138
await page.getByRole('button', { name: /Export User Data/i }).click();

```

---

## 7. deletes user data with confirmation toggle

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-xyz-789` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |
| 5 | click |  |  |  |

**Code Reference:**

```typescript
// Line 162
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 163
await page.getByLabel(/Session ID/i).fill('session-xyz-789');

// Line 166
await page.getByLabel(/Confirm deletion request/i).click();

// Line 168
await page.getByRole('button', { name: /Delete User Data/i }).click();

// Line 172
await page.getByRole('button', { name: /Deletions/i }).click();

```

---

## 8. deletes user data by email with confirmation

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `user@acme.com` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |
| 5 | click |  |  |  |

**Code Reference:**

```typescript
// Line 196
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 197
await page.getByLabel(/Email Address/i).fill('user@acme.com');

// Line 199
await page.getByLabel(/Confirm deletion request/i).click();

// Line 201
await page.getByRole('button', { name: /Delete User Data/i }).click();

// Line 204
await page.getByRole('button', { name: /Deletions/i }).click();

```

---

## 9. shows message when no data found to delete

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `nonexistent-session` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 220
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 221
await page.getByLabel(/Session ID/i).fill('nonexistent-session');

// Line 223
await page.getByLabel(/Confirm deletion request/i).click();

// Line 225
await page.getByRole('button', { name: /Delete User Data/i }).click();

```

---

## 10. prevents deletion without confirmation

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-123` |  |  |
| 3 | click |  |  |  |

**Code Reference:**

```typescript
// Line 231
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 232
await page.getByLabel(/Session ID/i).fill('session-123');

// Line 236
await page.getByRole('button', { name: /Delete User Data/i }).click();

```

---

## 11. shows API error when deletion fails

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-123` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 253
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 254
await page.getByLabel(/Session ID/i).fill('session-123');

// Line 255
await page.getByLabel(/Confirm deletion request/i).click();

// Line 257
await page.getByRole('button', { name: /Delete User Data/i }).click();

```

---

## 12. shows loading state during export

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-123` |  |  |
| 3 | click |  |  |  |

**Code Reference:**

```typescript
// Line 284
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 285
await page.getByLabel(/Session ID/i).fill('session-123');

// Line 287
await page.getByRole('button', { name: /Export User Data/i }).click();

```

---

## 13. shows loading state during deletion

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `acme.com` |  |  |
| 2 | fill | `session-123` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 311
await page.getByLabel(/Customer Domain/i).fill('acme.com');

// Line 312
await page.getByLabel(/Session ID/i).fill('session-123');

// Line 313
await page.getByLabel(/Confirm deletion request/i).click();

// Line 315
await page.getByRole('button', { name: /Delete User Data/i }).click();

```

---

## 14. renders GDPR compliance UI elements

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 15. displays audit log entries with correct metadata

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 346
await page.waitForTimeout(500);

```

---

## 16. filters audit log by request type

**Source:** [`__tests__/playwright/gdpr-privacy.spec.ts`](/__tests__/playwright/gdpr-privacy.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | click |  |  |  |
| 2 | click |  |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 361
await page.getByRole('combobox', { name: /Filter by Type/i }).click();

// Line 362
await page.getByRole('option', { name: /Export/i }).click();

// Line 368
await page.getByRole('combobox', { name: /Filter by Type/i }).click();

// Line 369
await page.getByRole('option', { name: /Delete/i }).click();

```

---

## 17. should load widget, open programmatically, and send message with session metadata

**Source:** [`__tests__/playwright/chat-widget-integration.spec.ts`](/__tests__/playwright/chat-widget-integration.spec.ts)

**Total Steps:** 20

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Waiting for chat widget to load |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | screenshot |  |  |  |
| 6 | log |  |  | 📍 Step 3: Verifying widget configuration |
| 7 | log |  |  | 📍 Step 4: Waiting for widget to initialize |
| 8 | wait | `3000` |  |  |
| 9 | log |  |  | 📍 Step 5: Opening widget via ChatWidget.open() API |
| 10 | wait | `2000` |  |  |
| 11 | log |  |  | 📍 Step 6: Verifying widget expanded |
| 12 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 13 | screenshot |  |  |  |
| 14 | log |  |  | 📍 Step 7: Checking for session metadata in localStorage |
| 15 | log |  |  | 📍 Step 8: Sending test message and intercepting API request |
| 16 | fill | `Test message for session tracking` |  |  |
| 17 | click |  |  |  |
| 18 | wait | `3000` |  |  |
| 19 | log |  |  | 📍 Step 9: Verifying chat request structure |
| 20 | log |  |  | 📍 Step 10: Checking for session_metadata in request |

**Code Reference:**

```typescript
// Line 21
console.log('📍 Step 1: Navigating to widget test page');

// Line 22
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 26
console.log('📍 Step 2: Waiting for chat widget to load');

// Line 32
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 36
await page.screenshot({ path: `test-results/widget-not-found-${Date.now()}.png`, fullPage: true });

// Line 41
console.log('📍 Step 3: Verifying widget configuration');

// Line 58
console.log('📍 Step 4: Waiting for widget to initialize');

// Line 59
await page.waitForTimeout(3000);

// Line 62
console.log('📍 Step 5: Opening widget via ChatWidget.open() API');

// Line 69
await page.waitForTimeout(2000);

// ... 10 more steps ...
```

---

## 18. should display analytics dashboard with user metrics and charts

**Source:** [`__tests__/playwright/analytics-dashboard-display.spec.ts`](/__tests__/playwright/analytics-dashboard-display.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/dashboard/analytics` |  |  |
| 2 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 36
await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

// Line 53
await page.waitForTimeout(2000);

```

---

## 19. should handle empty analytics data gracefully

**Source:** [`__tests__/playwright/analytics-dashboard-display.spec.ts`](/__tests__/playwright/analytics-dashboard-display.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/dashboard/analytics` |  |  |

**Code Reference:**

```typescript
// Line 247
await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

```

---

## 20. should handle API errors gracefully

**Source:** [`__tests__/playwright/analytics-dashboard-display.spec.ts`](/__tests__/playwright/analytics-dashboard-display.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/dashboard/analytics` |  |  |

**Code Reference:**

```typescript
// Line 268
await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

```

---

## 21. should switch between tabs correctly

**Source:** [`__tests__/playwright/analytics-dashboard-display.spec.ts`](/__tests__/playwright/analytics-dashboard-display.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/dashboard/analytics` |  |  |
| 2 | wait | `2000` |  |  |
| 3 | click |  |  |  |
| 4 | click |  |  |  |

**Code Reference:**

```typescript
// Line 278
await page.goto('/dashboard/analytics', { waitUntil: 'networkidle', timeout: 10000 });

// Line 282
await page.waitForTimeout(2000);

// Line 286
await intelligenceTab.click();

// Line 293
await overviewTab.click();

```

---

## 22. should complete scraping and make content searchable in chat

**Source:** [`__tests__/playwright/scraping/scraping-flow.spec.ts`](/__tests__/playwright/scraping/scraping-flow.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 3 | fill | `What pages are on this website?` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `5000` |  |  |
| 6 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 36
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 50
await inputField.waitFor({ state: 'visible', timeout: 10000 });

// Line 51
await inputField.fill('What pages are on this website?');

// Line 54
await sendButton.click();

// Line 55
await page.waitForTimeout(5000);

// Line 70
await page.screenshot({
      path: `test-results/scraping-flow-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 23. should handle scraping errors gracefully

**Source:** [`__tests__/playwright/scraping/scraping-flow.spec.ts`](/__tests__/playwright/scraping/scraping-flow.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 3 | fill | `invalid-domain-that-does-not-exist.xyz` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 81
await page.goto(`${BASE_URL}/dashboard/installation`, { waitUntil: 'networkidle' });

// Line 85
await domainInput.waitFor({ state: 'visible', timeout: 10000 });

// Line 86
await domainInput.fill('invalid-domain-that-does-not-exist.xyz');

// Line 89
await startButton.click();

// Line 90
await page.waitForTimeout(2000);

```

---

## 24. should show progress during long scraping jobs

**Source:** [`__tests__/playwright/scraping/scraping-flow.spec.ts`](/__tests__/playwright/scraping/scraping-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 25. should complete WooCommerce setup and enable product search

**Source:** [`__tests__/playwright/integrations/woocommerce-integration-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-integration-e2e.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | fill | `Show me your widgets` |  |  |
| 3 | click |  |  |  |
| 4 | wait | `5000` |  |  |
| 5 | navigate | ``${BASE_URL}/dashboard/analytics`` |  |  |
| 6 | reload |  |  |  |

**Code Reference:**

```typescript
// Line 41
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 50
await inputField.fill('Show me your widgets');

// Line 52
await sendButton.click();

// Line 54
await page.waitForTimeout(5000);

// Line 65
await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

// Line 76
await page.reload({ waitUntil: 'networkidle' });

```

---

## 26. should handle WooCommerce connection errors gracefully

**Source:** [`__tests__/playwright/integrations/woocommerce-integration-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-integration-e2e.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/integrations/woocommerce`` |  |  |
| 2 | click | `button[type="submit"]` |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 87
await page.goto(`${BASE_URL}/dashboard/integrations/woocommerce`, { waitUntil: 'networkidle' });

// Line 95
await page.click('button[type="submit"]');

// Line 96
await page.waitForTimeout(2000);

```

---

## 27. should install and customize widget successfully

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 30

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to installation page |
| 2 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 3 | log |  |  | 📍 Step 2: Finding widget embed code |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | screenshot |  |  |  |
| 6 | log |  |  | 📍 Step 3: Copying embed code to clipboard |
| 7 | click |  |  |  |
| 8 | wait | `500` |  |  |
| 9 | log |  |  | 📍 Step 4: Navigating to widget customization |
| 10 | click |  |  |  |
| 11 | navigate | ``${BASE_URL}/dashboard/customize`` |  |  |
| 12 | log |  |  | 📍 Step 5: Setting up configuration API mock |
| 13 | log |  |  | 📍 Step 6: Customizing widget appearance |
| 14 | fill | `#FF6B6B` |  |  |
| 15 | wait | `500` |  |  |
| 16 | wait | `500` |  |  |
| 17 | wait | `500` |  |  |
| 18 | log |  |  | 📍 Step 7: Checking preview updates |
| 19 | log |  |  | 📍 Step 8: Saving widget configuration |
| 20 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 21 | click |  |  |  |
| 22 | wait | `2000` |  |  |
| 23 | log |  |  | 📍 Step 9: Verifying configuration saved |
| 24 | log |  |  | 📍 Step 10: Testing widget with saved configuration |
| 25 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 26 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 27 | screenshot |  |  |  |
| 28 | wait | `3000` |  |  |
| 29 | log |  |  | 📍 Step 11: Verifying customizations applied |
| 30 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 44
console.log('📍 Step 1: Navigating to installation page');

// Line 46
await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 56
console.log('📍 Step 2: Finding widget embed code');

// Line 67
await embedCodeBlock.waitFor({ state: 'visible', timeout: 10000 });

// Line 71
await page.screenshot({
        path: `test-results/widget-install-no-code-${Date.now()}.png`,
        fullPage: true
      });

// Line 92
console.log('📍 Step 3: Copying embed code to clipboard');

// Line 107
await copyButton.click();

// Line 111
await page.waitForTimeout(500);

// Line 128
console.log('📍 Step 4: Navigating to widget customization');

// Line 139
await customizeLink.click();

// ... 20 more steps ...
```

---

## 28. should generate correct embed code for different environments

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |

**Code Reference:**

```typescript
// Line 436
await page.goto(`${BASE_URL}/dashboard/installation`, { waitUntil: 'networkidle' });

```

---

## 29. should handle widget customization with invalid values

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 30. should add and configure domain successfully

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 33

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to domains page |
| 2 | navigate | ``${BASE_URL}/dashboard`` |  |  |
| 3 | click |  |  |  |
| 4 | navigate | ``${BASE_URL}/dashboard/domains`` |  |  |
| 5 | log |  |  | 📍 Step 2: Initiating domain addition |
| 6 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 7 | click |  |  |  |
| 8 | screenshot |  |  |  |
| 9 | wait | `1000` |  |  |
| 10 | log |  |  | 📍 Step 3: Setting up domain API mock |
| 11 | log |  |  | 📍 Step 4: Entering domain details |
| 12 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 13 | fill | `TEST_DOMAIN` |  |  |
| 14 | fill | ``https://${TEST_DOMAIN}`` |  |  |
| 15 | log |  |  | 📍 Step 5: Configuring domain settings |
| 16 | log |  |  | 📍 Step 6: Saving domain configuration |
| 17 | click |  |  |  |
| 18 | wait | `2000` |  |  |
| 19 | log |  |  | 📍 Step 7: Verifying domain created |
| 20 | log |  |  | 📍 Step 8: Verifying domain in domains list |
| 21 | wait | `1000` |  |  |
| 22 | reload |  |  |  |
| 23 | wait | `1000` |  |  |
| 24 | log |  |  | 📍 Step 9: Testing chat with configured domain |
| 25 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 26 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 27 | wait | `3000` |  |  |
| 28 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 29 | fill | `Test message for domain verification` |  |  |
| 30 | click |  |  |  |
| 31 | wait | `3000` |  |  |
| 32 | log |  |  | 📍 Step 10: Verifying domain isolation |
| 33 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 45
console.log('📍 Step 1: Navigating to domains page');

// Line 47
await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });

// Line 57
await domainsLink.click();

// Line 62
await page.goto(`${BASE_URL}/dashboard/domains`, { waitUntil: 'networkidle' });

// Line 70
console.log('📍 Step 2: Initiating domain addition');

// Line 79
await addDomainButton.waitFor({ state: 'visible', timeout: 10000 });

// Line 80
await addDomainButton.click();

// Line 84
await page.screenshot({
        path: `test-results/domain-config-no-add-button-${Date.now()}.png`,
        fullPage: true
      });

// Line 92
await page.waitForTimeout(1000);

// Line 97
console.log('📍 Step 3: Setting up domain API mock');

// ... 23 more steps ...
```

---

## 31. should handle domain editing

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 32. should handle domain deletion/disabling

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 33. should enforce domain access control

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 34. should complete demo flow from URL entry to AI chat response

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 33

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to homepage |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Finding demo section |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | screenshot |  |  |  |
| 6 | log |  |  | 📍 Step 3: Entering test website URL |
| 7 | fill | `TEST_DEMO_SITE` |  |  |
| 8 | log |  |  | 📍 Step 4: Setting up scraping API mock |
| 9 | log |  |  | 📍 Step 5: Starting demo scraping |
| 10 | click |  |  |  |
| 11 | log |  |  | 📍 Step 6: Monitoring scraping progress |
| 12 | wait | `500` |  |  |
| 13 | wait | `3000` |  |  |
| 14 | log |  |  | 📍 Step 7: Verifying demo session created |
| 15 | log |  |  | 📍 Step 8: Checking for chat interface |
| 16 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 17 | screenshot |  |  |  |
| 18 | log |  |  | 📍 Step 9: Setting up chat API mock |
| 19 | log |  |  | 📍 Step 10: Sending test message |
| 20 | fill | `testMessage` |  |  |
| 21 | click |  |  |  |
| 22 | log |  |  | 📍 Step 11: Waiting for AI response |
| 23 | wait | `3000` |  |  |
| 24 | log |  |  | 📍 Step 12: Verifying response in UI |
| 25 | screenshot |  |  |  |
| 26 | log |  |  | 📍 Step 13: Verifying message limits |
| 27 | log |  |  | 📍 Step 14: Checking for session timer |
| 28 | log |  |  | 📍 Step 15: Testing multi-turn conversation |
| 29 | fill | `followUpMessage` |  |  |
| 30 | click |  |  |  |
| 31 | wait | `3000` |  |  |
| 32 | log |  |  | 📍 Step 16: Verifying demo session analytics |
| 33 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 47
console.log('📍 Step 1: Navigating to homepage');

// Line 49
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 56
console.log('📍 Step 2: Finding demo section');

// Line 68
await demoUrlInput.waitFor({ state: 'visible', timeout: 10000 });

// Line 72
await page.screenshot({
        path: `test-results/demo-flow-no-input-${Date.now()}.png`,
        fullPage: true
      });

// Line 82
console.log('📍 Step 3: Entering test website URL');

// Line 84
await demoUrlInput.fill(TEST_DEMO_SITE);

// Line 90
console.log('📍 Step 4: Setting up scraping API mock');

// Line 118
console.log('📍 Step 5: Starting demo scraping');

// Line 129
await startDemoButton.click();

// ... 23 more steps ...
```

---

## 35. should handle invalid URLs gracefully

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `BASE_URL` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 3 | fill | `invalidUrl` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 438
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 441
await demoUrlInput.waitFor({ state: 'visible', timeout: 5000 });

// Line 455
await demoUrlInput.fill(invalidUrl);

// Line 458
await startButton.click();

// Line 477
await page.waitForTimeout(500);

```

---

## 36. should enforce demo session limits

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 37. should show upgrade prompt after demo limits reached

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 38. should complete full purchase flow from chat to order confirmation

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 44

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to widget test page |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Waiting for chat widget to load |
| 4 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 5 | screenshot |  |  |  |
| 6 | wait | `3000` |  |  |
| 7 | log |  |  | 📍 Step 3: Verifying widget is open |
| 8 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 9 | screenshot |  |  |  |
| 10 | log |  |  | 📍 Step 4: Setting up API interception |
| 11 | log |  |  | 📍 Step 5: Sending product search query |
| 12 | fill | `productQuery` |  |  |
| 13 | click |  |  |  |
| 14 | log |  |  | 📍 Step 6: Waiting for AI response |
| 15 | wait | `5000` |  |  |
| 16 | log |  |  | 📍 Step 7: Checking for product recommendations |
| 17 | log |  |  | 📍 Step 8: Looking for product links in chat |
| 18 | screenshot |  |  |  |
| 19 | log |  |  | 📍 Step 9: Clicking on first product link |
| 20 | log |  |  | 📍 Step 10: Verifying product page |
| 21 | log |  |  | 📍 Step 11: Adding product to cart |
| 22 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 23 | click |  |  |  |
| 24 | screenshot |  |  |  |
| 25 | wait | `2000` |  |  |
| 26 | log |  |  | 📍 Step 12: Navigating to cart |
| 27 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 28 | click |  |  |  |
| 29 | navigate | ``${baseUrl}/cart`` |  |  |
| 30 | log |  |  | 📍 Step 13: Verifying product in cart |
| 31 | log |  |  | 📍 Step 14: Proceeding to checkout |
| 32 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 33 | click |  |  |  |
| 34 | log |  |  | 📍 Step 15: Filling checkout form |
| 35 | log |  |  | 📍 Step 16: Selecting payment method |
| 36 | log |  |  | 📍 Step 17: Placing order |
| 37 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 38 | click |  |  |  |
| 39 | log |  |  | 📍 Step 18: Waiting for order confirmation |
| 40 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 41 | screenshot |  |  |  |
| 42 | log |  |  | 📍 Step 19: Verifying order details |
| 43 | screenshot |  |  |  |
| 44 | log |  |  | 📍 Step 20: Checking analytics tracking |

**Code Reference:**

```typescript
// Line 43
console.log('📍 Step 1: Navigating to widget test page');

// Line 44
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 50
console.log('📍 Step 2: Waiting for chat widget to load');

// Line 54
await iframeLocator.waitFor({ state: 'attached', timeout: 15000 });

// Line 58
await page.screenshot({
        path: `test-results/purchase-flow-widget-not-found-${Date.now()}.png`,
        fullPage: true
      });

// Line 66
await page.waitForTimeout(3000);

// Line 71
console.log('📍 Step 3: Verifying widget is open');

// Line 77
await inputField.waitFor({ state: 'visible', timeout: 10000 });

// Line 81
await page.screenshot({
        path: `test-results/purchase-flow-widget-not-open-${Date.now()}.png`,
        fullPage: true
      });

// Line 91
console.log('📍 Step 4: Setting up API interception');

// ... 34 more steps ...
```

---

## 39. should handle purchase flow with guest checkout

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 40. should handle purchase flow with registered user

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 41. should maintain context across multiple conversation turns

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 33

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Loading chat widget |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 4 | wait | `3000` |  |  |
| 5 | log |  |  | 📍 Step 2: Setting up conversation tracking |
| 6 | log |  |  | 📍 Step 3: First turn - Asking about products |
| 7 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 8 | fill | `firstMessage` |  |  |
| 9 | click |  |  |  |
| 10 | wait | `3000` |  |  |
| 11 | log |  |  | 📍 Step 4: Second turn - Using context (pronoun reference) |
| 12 | wait | `1000` |  |  |
| 13 | fill | `secondMessage` |  |  |
| 14 | click |  |  |  |
| 15 | wait | `3000` |  |  |
| 16 | log |  |  | 📍 Step 5: Third turn - Building on conversation |
| 17 | wait | `1000` |  |  |
| 18 | fill | `thirdMessage` |  |  |
| 19 | click |  |  |  |
| 20 | wait | `3000` |  |  |
| 21 | log |  |  | 📍 Step 6: Fourth turn - Referencing previous details |
| 22 | wait | `1000` |  |  |
| 23 | fill | `fourthMessage` |  |  |
| 24 | click |  |  |  |
| 25 | wait | `3000` |  |  |
| 26 | log |  |  | 📍 Step 7: Verifying conversation ID consistency |
| 27 | log |  |  | 📍 Step 8: Verifying conversation history visible |
| 28 | log |  |  | 📍 Step 9: Final context test with complex reference |
| 29 | wait | `1000` |  |  |
| 30 | fill | `fifthMessage` |  |  |
| 31 | click |  |  |  |
| 32 | wait | `3000` |  |  |
| 33 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 42
console.log('📍 Step 1: Loading chat widget');

// Line 44
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 48
await widgetIframe.waitFor({ state: 'attached', timeout: 15000 });

// Line 49
await page.waitForTimeout(3000);

// Line 58
console.log('📍 Step 2: Setting up conversation tracking');

// Line 127
console.log('📍 Step 3: First turn - Asking about products');

// Line 130
await inputField.waitFor({ state: 'visible', timeout: 10000 });

// Line 133
await inputField.fill(firstMessage);

// Line 136
await sendButton.click();

// Line 141
await page.waitForTimeout(3000);

// ... 23 more steps ...
```

---

## 42. should handle conversation with context reset

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 43. should handle very long conversations

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 44. should handle ambiguous pronouns

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## Coverage Summary

### API Endpoints


### UI Elements

<details>
<summary>Click to expand UI element catalog</summary>

- `#FF6B6B`
- `/dashboard/analytics`
- `/dashboard/telemetry`
- `1000`
- `2000`
- `3000`
- `500`
- `5000`
- `BASE_URL`
- `Show me your widgets`
- `TEST_DEMO_SITE`
- `TEST_DOMAIN`
- `Test message for domain verification`
- `Test message for session tracking`
- `What pages are on this website?`
- ``${BASE_URL}/dashboard/analytics``
- ``${BASE_URL}/dashboard/customize``
- ``${BASE_URL}/dashboard/domains``
- ``${BASE_URL}/dashboard/installation``
- ``${BASE_URL}/dashboard/integrations/woocommerce``
- ``${BASE_URL}/dashboard``
- ``${BASE_URL}/pricing``
- ``${BASE_URL}/test-widget``
- ``${BASE_URL}/widget-test``
- ``${baseUrl}/cart``
- ``https://${TEST_DOMAIN}``
- `acme.com`
- `button[type="submit"]`
- `fifthMessage`
- `firstMessage`
- `followUpMessage`
- `fourthMessage`
- `invalid-domain-that-does-not-exist.xyz`
- `invalidUrl`
- `nonexistent-session`
- `productQuery`
- `secondMessage`
- `session-123`
- `session-abc-123`
- `session-xyz-789`
- `testMessage`
- `thirdMessage`
- `user@acme.com`
- `{ state: 'attached', timeout: 10000 }`
- `{ state: 'attached', timeout: 15000 }`
- `{ state: 'visible', timeout: 10000 }`
- `{ state: 'visible', timeout: 5000 }`

</details>

---

**Note:** This document is auto-generated from E2E tests. To update, run `npx tsx scripts/extract-workflows-from-e2e.ts`
