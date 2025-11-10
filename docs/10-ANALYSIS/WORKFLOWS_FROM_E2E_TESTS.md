# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** 2025-11-10T14:53:14.578Z
**Source:** Playwright E2E test files in `__tests__/playwright/`

## Summary

- **Total Tests:** 156
- **Total Steps:** 650
- **API Endpoints Documented:** 5
- **UI Elements Documented:** 110

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
25. [complete recommendation workflow: chat → recommendations → click → purchase tracking](#complete-recommendation-workflow-chat-recommendations-click-purchase-tracking)
26. [recommendation algorithms display correctly](#recommendation-algorithms-display-correctly)
27. [empty state when no recommendations available](#empty-state-when-no-recommendations-available)
28. [click tracking without navigation](#click-tracking-without-navigation)
29. [purchase tracking without navigation](#purchase-tracking-without-navigation)
30. [recommendation API returns valid data](#recommendation-api-returns-valid-data)
31. [invalid API requests return proper errors](#invalid-api-requests-return-proper-errors)
32. [should complete WooCommerce setup and enable product search](#should-complete-woocommerce-setup-and-enable-product-search)
33. [should handle WooCommerce connection errors gracefully](#should-handle-woocommerce-connection-errors-gracefully)
34. [should maintain cart session across messages](#should-maintain-cart-session-across-messages)
35. [should handle Store API failures gracefully](#should-handle-store-api-failures-gracefully)
36. [should enforce rate limits and allow retry after cooldown](#should-enforce-rate-limits-and-allow-retry-after-cooldown)
37. [should handle payment failure and allow retry with cart preserved](#should-handle-payment-failure-and-allow-retry-with-cart-preserved)
38. [should handle network timeout and allow successful retry](#should-handle-network-timeout-and-allow-successful-retry)
39. [should handle invalid WooCommerce credentials and allow correction](#should-handle-invalid-woocommerce-credentials-and-allow-correction)
40. [should detect concurrent edits and provide conflict resolution](#should-detect-concurrent-edits-and-provide-conflict-resolution)
41. [should prevent concurrent scraping and allow retry after completion](#should-prevent-concurrent-scraping-and-allow-retry-after-completion)
42. [should install and customize widget successfully](#should-install-and-customize-widget-successfully)
43. [should generate correct embed code for different environments](#should-generate-correct-embed-code-for-different-environments)
44. [should handle widget customization with invalid values](#should-handle-widget-customization-with-invalid-values)
45. [complete customization workflow: appearance → behavior → save → persist](#complete-customization-workflow-appearance-behavior-save-persist)
46. [live preview updates in real-time](#live-preview-updates-in-real-time)
47. [reset button restores default settings](#reset-button-restores-default-settings)
48. [tab navigation works correctly](#tab-navigation-works-correctly)
49. [advanced color customization works](#advanced-color-customization-works)
50. [handles save errors gracefully](#handles-save-errors-gracefully)
51. [supports keyboard navigation](#supports-keyboard-navigation)
52. [should add and configure domain successfully](#should-add-and-configure-domain-successfully)
53. [should handle domain editing](#should-handle-domain-editing)
54. [should handle domain deletion/disabling](#should-handle-domain-deletion-disabling)
55. [should enforce domain access control](#should-enforce-domain-access-control)
56. [complete search workflow: search → results → view conversation with highlight](#complete-search-workflow-search-results-view-conversation-with-highlight)
57. [search with advanced filters: date range and status filtering](#search-with-advanced-filters-date-range-and-status-filtering)
58. [handles empty search results gracefully](#handles-empty-search-results-gracefully)
59. [search with special characters and edge cases](#search-with-special-characters-and-edge-cases)
60. [keyboard navigation and shortcuts in search](#keyboard-navigation-and-shortcuts-in-search)
61. [search result persistence and back navigation](#search-result-persistence-and-back-navigation)
62. [CSV export endpoint: verify availability and response](#csv-export-endpoint-verify-availability-and-response)
63. [JSON analytics endpoint: verify data structure](#json-analytics-endpoint-verify-data-structure)
64. [Export formats: test all supported formats](#export-formats-test-all-supported-formats)
65. [Date range parameters: test different time periods](#date-range-parameters-test-different-time-periods)
66. [Error handling: test invalid parameters](#error-handling-test-invalid-parameters)
67. [Export workflow documentation for AI agents](#export-workflow-documentation-for-ai-agents)
68. [should complete demo flow from URL entry to AI chat response](#should-complete-demo-flow-from-url-entry-to-ai-chat-response)
69. [should handle invalid URLs gracefully](#should-handle-invalid-urls-gracefully)
70. [should enforce demo session limits](#should-enforce-demo-session-limits)
71. [should show upgrade prompt after demo limits reached](#should-show-upgrade-prompt-after-demo-limits-reached)
72. [should complete full purchase flow from chat to order confirmation](#should-complete-full-purchase-flow-from-chat-to-order-confirmation)
73. [should handle purchase flow with guest checkout](#should-handle-purchase-flow-with-guest-checkout)
74. [should handle purchase flow with registered user](#should-handle-purchase-flow-with-registered-user)
75. [should maintain context across multiple conversation turns](#should-maintain-context-across-multiple-conversation-turns)
76. [should handle conversation with context reset](#should-handle-conversation-with-context-reset)
77. [should handle very long conversations](#should-handle-very-long-conversations)
78. [should handle ambiguous pronouns](#should-handle-ambiguous-pronouns)
79. [should complete full team invitation flow for viewer role](#should-complete-full-team-invitation-flow-for-viewer-role)
80. [should handle editor role with correct permissions](#should-handle-editor-role-with-correct-permissions)
81. [should show team members list with correct roles](#should-show-team-members-list-with-correct-roles)
82. [should allow admin to revoke member access](#should-allow-admin-to-revoke-member-access)
83. [should handle expired invitation tokens](#should-handle-expired-invitation-tokens)
84. [should complete Shopify setup and track purchases](#should-complete-shopify-setup-and-track-purchases)
85. [should handle Shopify connection errors](#should-handle-shopify-connection-errors)
86. [should sync product inventory updates](#should-sync-product-inventory-updates)
87. [should handle product out of stock scenarios](#should-handle-product-out-of-stock-scenarios)
88. [should track Shopify order fulfillment](#should-track-shopify-order-fulfillment)
89. [should handle Shopify webhooks](#should-handle-shopify-webhooks)
90. [should display real-time metrics and update without refresh](#should-display-real-time-metrics-and-update-without-refresh)
91. [should handle connection interruptions gracefully](#should-handle-connection-interruptions-gracefully)
92. [should show historical trend alongside real-time data](#should-show-historical-trend-alongside-real-time-data)
93. [should filter real-time events by type](#should-filter-real-time-events-by-type)
94. [should export real-time data snapshot](#should-export-real-time-data-snapshot)
95. [should handle high-frequency updates efficiently](#should-handle-high-frequency-updates-efficiently)
96. [should lookup order status via chat and return accurate information](#should-lookup-order-status-via-chat-and-return-accurate-information)
97. [should handle order lookup for processing orders](#should-handle-order-lookup-for-processing-orders)
98. [should handle invalid order numbers gracefully](#should-handle-invalid-order-numbers-gracefully)
99. [should handle multiple order lookups in same conversation](#should-handle-multiple-order-lookups-in-same-conversation)
100. [should provide order modification options](#should-provide-order-modification-options)
101. [should handle orders without tracking numbers](#should-handle-orders-without-tracking-numbers)
102. [should monitor live chat and complete agent takeover](#should-monitor-live-chat-and-complete-agent-takeover)
103. [should show waiting chats requiring agent attention](#should-show-waiting-chats-requiring-agent-attention)
104. [should complete full conversations management flow with export](#should-complete-full-conversations-management-flow-with-export)
105. [should filter conversations by date range](#should-filter-conversations-by-date-range)
106. [should handle empty search results gracefully](#should-handle-empty-search-results-gracefully)
107. [should allow bulk operations on conversations](#should-allow-bulk-operations-on-conversations)
108. [should show conversation analytics](#should-show-conversation-analytics)
109. [should restore abandoned cart when customer returns](#should-restore-abandoned-cart-when-customer-returns)
110. [should track cart abandonment analytics](#should-track-cart-abandonment-analytics)
111. [should send abandonment email reminder](#should-send-abandonment-email-reminder)
112. [should handle expired cart sessions](#should-handle-expired-cart-sessions)
113. [should merge guest and authenticated user carts](#should-merge-guest-and-authenticated-user-carts)
114. [should handle out-of-stock items in restored cart](#should-handle-out-of-stock-items-in-restored-cart)
115. [complete workflow: abandoned conversation → detection → schedule → send](#complete-workflow-abandoned-conversation-detection-schedule-send)
116. [follow-up cancelled when user returns](#follow-up-cancelled-when-user-returns)
117. [follow-up analytics track response rate](#follow-up-analytics-track-response-rate)
118. [abandoned cart follow-up scenario](#abandoned-cart-follow-up-scenario)
119. [product inquiry without answer follow-up](#product-inquiry-without-answer-follow-up)
120. [support request left hanging follow-up](#support-request-left-hanging-follow-up)
121. [low satisfaction follow-up with high priority](#low-satisfaction-follow-up-with-high-priority)
122. [should handle multiple follow-up attempts limit](#should-handle-multiple-follow-up-attempts-limit)
123. [should handle time-based scheduling correctly](#should-handle-time-based-scheduling-correctly)
124. [should handle email vs in-app channel selection](#should-handle-email-vs-in-app-channel-selection)
125. [verify file naming convention for all formats](#verify-file-naming-convention-for-all-formats)
126. [PDF export with 90-day range](#pdf-export-with-90-day-range)
127. [Excel export validation](#excel-export-validation)
128. [export with empty data: handle gracefully](#export-with-empty-data-handle-gracefully)
129. [export with user authentication and permissions](#export-with-user-authentication-and-permissions)
130. [handle invalid export format gracefully](#handle-invalid-export-format-gracefully)
131. [handle missing query parameters](#handle-missing-query-parameters)
132. [handle request timeout gracefully](#handle-request-timeout-gracefully)
133. [complete export workflow: UI suggestion for missing buttons](#complete-export-workflow-ui-suggestion-for-missing-buttons)
134. [export performance: large dataset handling](#export-performance-large-dataset-handling)
135. [sequential export downloads: verify file independence](#sequential-export-downloads-verify-file-independence)
136. [export with custom time ranges](#export-with-custom-time-ranges)
137. [verify JSON analytics data structure](#verify-json-analytics-data-structure)
138. [export with date range filter applied](#export-with-date-range-filter-applied)
139. [validate CSV data accuracy and formatting](#validate-csv-data-accuracy-and-formatting)
140. [verify API endpoint responses](#verify-api-endpoint-responses)
141. [export analytics as CSV: click → download → verify](#export-analytics-as-csv-click-download-verify)
142. [verify CSV file structure and headers](#verify-csv-file-structure-and-headers)
143. [CSV export with 30-day range](#csv-export-with-30-day-range)
144. [English to Spanish translation](#english-to-spanish-translation)
145. [UI updates immediately on language change](#ui-updates-immediately-on-language-change)
146. [RTL languages display correctly (Arabic)](#rtl-languages-display-correctly-arabic)
147. [Hebrew (RTL) text rendering](#hebrew-rtl-text-rendering)
148. [RTL layout persists across language changes](#rtl-layout-persists-across-language-changes)
149. [locale preference persists in localStorage](#locale-preference-persists-in-localstorage)
150. [multiple locales can be switched](#multiple-locales-can-be-switched)
151. [invalid locale handled gracefully](#invalid-locale-handled-gracefully)
152. [language switching preserves conversation history](#language-switching-preserves-conversation-history)
153. [language persists after page reload](#language-persists-after-page-reload)
154. [rapid language switches handled correctly](#rapid-language-switches-handled-correctly)
155. [browser locale auto-detection](#browser-locale-auto-detection)
156. [complete language workflow: English → Spanish → Arabic (RTL)](#complete-language-workflow-english-spanish-arabic-rtl)

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
| 9 | log |  |  | 📍 Step 5: Checking iframe state before opening |
| 10 | wait | `3000` |  |  |
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
// Line 38
console.log('📍 Step 1: Navigating to widget test page');

// Line 39
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 43
console.log('📍 Step 2: Waiting for chat widget to load');

// Line 49
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 53
await page.screenshot({ path: `test-results/widget-not-found-${Date.now()}.png`, fullPage: true });

// Line 58
console.log('📍 Step 3: Verifying widget configuration');

// Line 75
console.log('📍 Step 4: Waiting for widget to initialize');

// Line 76
await page.waitForTimeout(3000);

// Line 79
console.log('📍 Step 5: Checking iframe state before opening');

// Line 104
await page.waitForTimeout(3000);

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

## 25. complete recommendation workflow: chat → recommendations → click → purchase tracking

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 27

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `iframe#chat-widget-iframe` |  |  |
| 2 | log |  |  | ✅ Step 2: Chat widget iframe loaded |
| 3 | wait | `{
      timeout: 10000,
    }` |  |  |
| 4 | log |  |  | ✅ Step 3: Chat input ready |
| 5 | fill | `I need a hydraulic pump for my machinery` |  |  |
| 6 | log |  |  | 📍 Step 4: Typed product inquiry message |
| 7 | log |  |  | ✅ Step 5: Sent message |
| 8 | wait | `3000` |  |  |
| 9 | log |  |  | ⏳ Step 6: Waiting for AI response... |
| 10 | log |  |  | ✅ Step 7: Recommendations appeared |
| 11 | log |  |  | ✅ Step 8: Algorithm badge visible |
| 12 | log |  |  | ✅ Step 9: View Product button visible |
| 13 | log |  |  | 📍 Step 10: Multiple recommendations detected, testing navigation |
| 14 | click |  |  |  |
| 15 | log |  |  | ✅ Step 12: Navigated to next recommendation |
| 16 | wait | `500` |  |  |
| 17 | log |  |  | ✅ Step 13: Carousel navigation working |
| 18 | log |  |  | 📍 Step 10: Single recommendation shown |
| 19 | click |  |  |  |
| 20 | log |  |  | ✅ Step 14: Clicked View Product button |
| 21 | wait | `1000` |  |  |
| 22 | log |  |  | ✅ Step 15: Product view action triggered |
| 23 | log |  |  | ✅ Step 16: Purchase event tracked successfully |
| 24 | navigate | `http://localhost:3000/dashboard/analytics` |  |  |
| 25 | log |  |  | 📍 Step 17: Navigated to analytics dashboard |
| 26 | wait | `text=/recommendation/i` |  |  |
| 27 | log |  |  | ✅ Step 18: Analytics dashboard loaded with recommendation data |

**Code Reference:**

```typescript
// Line 26
await page.waitForSelector('iframe#chat-widget-iframe', { timeout: 10000 });

// Line 27
console.log('✅ Step 2: Chat widget iframe loaded');

// Line 32
await iframe.locator('input[placeholder*="message"], textarea').waitFor({
      timeout: 10000,
    });

// Line 35
console.log('✅ Step 3: Chat input ready');

// Line 39
await chatInput.fill('I need a hydraulic pump for my machinery');

// Line 40
console.log('📍 Step 4: Typed product inquiry message');

// Line 43
console.log('✅ Step 5: Sent message');

// Line 46
await page.waitForTimeout(3000);

// Line 47
console.log('⏳ Step 6: Waiting for AI response...');

// Line 54
console.log('✅ Step 7: Recommendations appeared');

// ... 17 more steps ...
```

---

## 26. recommendation algorithms display correctly

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `iframe#chat-widget-iframe` |  |  |
| 2 | fill | `Show me your best products` |  |  |
| 3 | wait | `{ timeout: 15000 }` |  |  |

**Code Reference:**

```typescript
// Line 133
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 138
await chatInput.fill('Show me your best products');

// Line 142
await iframe.locator('text=Recommended for you').waitFor({ timeout: 15000 });

```

---

## 27. empty state when no recommendations available

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `iframe#chat-widget-iframe` |  |  |
| 2 | fill | `xyz123nonexistentproduct456abc` |  |  |
| 3 | wait | `5000` |  |  |

**Code Reference:**

```typescript
// Line 161
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 166
await chatInput.fill('xyz123nonexistentproduct456abc');

// Line 169
await page.waitForTimeout(5000);

```

---

## 28. click tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 29. purchase tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 30. recommendation API returns valid data

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 31. invalid API requests return proper errors

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 32. should complete WooCommerce setup and enable product search

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
// Line 40
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 49
await inputField.fill('Show me your widgets');

// Line 51
await sendButton.click();

// Line 53
await page.waitForTimeout(5000);

// Line 64
await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

// Line 75
await page.reload({ waitUntil: 'networkidle' });

```

---

## 33. should handle WooCommerce connection errors gracefully

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
// Line 86
await page.goto(`${BASE_URL}/dashboard/integrations/woocommerce`, { waitUntil: 'networkidle' });

// Line 94
await page.click('button[type="submit"]');

// Line 95
await page.waitForTimeout(2000);

```

---

## 34. should maintain cart session across messages

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts)

**Description:**
// ============================================================================

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |

**Code Reference:**

```typescript
// Line 418
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

```

---

## 35. should handle Store API failures gracefully

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts)

**Description:**
// ============================================================================

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 36. should enforce rate limits and allow retry after cooldown

**Source:** [`__tests__/playwright/error-scenarios/rate-limiting.spec.ts`](/__tests__/playwright/error-scenarios/rate-limiting.spec.ts)

**Total Steps:** 22

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to homepage with chat widget |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Setting up widget mock |
| 4 | log |  |  | 📍 Step 3: Setting up rate limiting mock |
| 5 | log |  |  | 📍 Step 4: Opening chat widget |
| 6 | log |  |  | 📍 Step 5: Sending messages rapidly to trigger rate limit |
| 7 | fill | `'Message ' + i` |  |  |
| 8 | click |  |  |  |
| 9 | wait | `300` |  |  |
| 10 | log |  |  | 📍 Step 6: Verifying rate limit was triggered |
| 11 | wait | `1000` |  |  |
| 12 | log |  |  | 📍 Step 7: Verifying rate limit error message |
| 13 | log |  |  | 📍 Step 8: Verifying retry-after timing is shown |
| 14 | log |  |  | 📍 Step 9: Verifying send button state during cooldown |
| 15 | wait | `(RETRY_AFTER_SECONDS + 1) * 1000` |  |  |
| 16 | log |  |  | 📍 Step 11: Attempting to send message after cooldown |
| 17 | fill | `Message after cooldown` |  |  |
| 18 | click |  |  |  |
| 19 | wait | `1000` |  |  |
| 20 | log |  |  | 📍 Step 12: Verifying request succeeds after cooldown |
| 21 | log |  |  | 📍 Step 13: Verifying rate limit error is cleared |
| 22 | log |  |  | 📍 Step 14: Verifying system stability |

**Code Reference:**

```typescript
// Line 23
console.log('📍 Step 1: Navigating to homepage with chat widget');

// Line 24
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 28
console.log('📍 Step 2: Setting up widget mock');

// Line 41
console.log('📍 Step 3: Setting up rate limiting mock');

// Line 100
console.log('📍 Step 4: Opening chat widget');

// Line 116
console.log('📍 Step 5: Sending messages rapidly to trigger rate limit');

// Line 126
await input.fill('Message ' + i);

// Line 130
await sendBtn.click();

// Line 143
await page.waitForTimeout(300);

// Line 153
console.log('📍 Step 6: Verifying rate limit was triggered');

// ... 12 more steps ...
```

---

## 37. should handle payment failure and allow retry with cart preserved

**Source:** [`__tests__/playwright/error-scenarios/payment-failure.spec.ts`](/__tests__/playwright/error-scenarios/payment-failure.spec.ts)

**Total Steps:** 33

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to shop |
| 2 | navigate | `BASE_URL + '/shop'` |  |  |
| 3 | log |  |  | 📍 Step 2: Setting up product mocks |
| 4 | log |  |  | 📍 Step 3: Opening product page |
| 5 | navigate | `BASE_URL + '/product/test-product'` |  |  |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Adding product to cart |
| 8 | click |  |  |  |
| 9 | wait | `2000` |  |  |
| 10 | log |  |  | 📍 Step 5: Navigating to cart |
| 11 | click |  |  |  |
| 12 | navigate | `BASE_URL + '/cart'` |  |  |
| 13 | log |  |  | 📍 Step 6: Verifying cart contains items |
| 14 | log |  |  | 📍 Step 7: Proceeding to checkout |
| 15 | click |  |  |  |
| 16 | navigate | `BASE_URL + '/checkout'` |  |  |
| 17 | log |  |  | 📍 Step 8: Filling checkout form |
| 18 | fill | `field.value` |  |  |
| 19 | log |  |  | 📍 Step 9: Selecting payment method |
| 20 | log |  |  | 📍 Step 10: Setting up payment failure mock |
| 21 | log |  |  | 📍 Step 11: Placing order (expecting failure) |
| 22 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 23 | click |  |  |  |
| 24 | wait | `3000` |  |  |
| 25 | log |  |  | 📍 Step 12: Verifying error message is displayed |
| 26 | log |  |  | 📍 Step 13: Verifying error message is user-friendly |
| 27 | log |  |  | 📍 Step 14: Verifying cart items are preserved |
| 28 | log |  |  | 📍 Step 15: Verifying user can retry checkout |
| 29 | log |  |  | 📍 Step 16: Retrying order (expecting success) |
| 30 | click |  |  |  |
| 31 | wait | `4000` |  |  |
| 32 | log |  |  | 📍 Step 17: Verifying successful order after retry |
| 33 | log |  |  | 📍 Step 18: Verifying no duplicate orders |

**Code Reference:**

```typescript
// Line 24
console.log('📍 Step 1: Navigating to shop');

// Line 25
await page.goto(BASE_URL + '/shop', { waitUntil: 'networkidle' });

// Line 29
console.log('📍 Step 2: Setting up product mocks');

// Line 45
console.log('📍 Step 3: Opening product page');

// Line 51
await page.goto(BASE_URL + '/product/test-product', { waitUntil: 'networkidle' });

// Line 54
await productLinks.first().click();

// Line 60
console.log('📍 Step 4: Adding product to cart');

// Line 65
await addToCartBtn.click();

// Line 66
await page.waitForTimeout(2000);

// Line 78
console.log('📍 Step 5: Navigating to cart');

// ... 23 more steps ...
```

---

## 38. should handle network timeout and allow successful retry

**Source:** [`__tests__/playwright/error-scenarios/network-timeout.spec.ts`](/__tests__/playwright/error-scenarios/network-timeout.spec.ts)

**Total Steps:** 23

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to homepage with chat widget |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Setting up chat widget mock |
| 4 | log |  |  | 📍 Step 3: Waiting for chat widget iframe |
| 5 | wait | `1000` |  |  |
| 6 | log |  |  | 📍 Step 4: Setting up network timeout mock |
| 7 | log |  |  | 📍 Step 5: Opening chat widget |
| 8 | click |  |  |  |
| 9 | wait | `1000` |  |  |
| 10 | log |  |  | 📍 Step 6: Accessing chat widget iframe |
| 11 | log |  |  | 📍 Step 7: Typing message in chat |
| 12 | fill | `Hello, I need help` |  |  |
| 13 | log |  |  | 📍 Step 8: Sending message (expecting timeout) |
| 14 | click |  |  |  |
| 15 | wait | `36000` |  |  |
| 16 | log |  |  | 📍 Step 9: Verifying timeout error message |
| 17 | log |  |  | 📍 Step 10: Verifying retry button is available |
| 18 | log |  |  | 📍 Step 11: Clicking retry button |
| 19 | click |  |  |  |
| 20 | log |  |  | 📍 Step 12: Waiting for successful response after retry |
| 21 | wait | `3000` |  |  |
| 22 | log |  |  | 📍 Step 13: Verifying message sent successfully |
| 23 | log |  |  | 📍 Step 14: Verifying retry behavior |

**Code Reference:**

```typescript
// Line 24
console.log('📍 Step 1: Navigating to homepage with chat widget');

// Line 25
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 29
console.log('📍 Step 2: Setting up chat widget mock');

// Line 46
console.log('📍 Step 3: Waiting for chat widget iframe');

// Line 62
await page.waitForTimeout(1000);

// Line 67
console.log('📍 Step 4: Setting up network timeout mock');

// Line 110
console.log('📍 Step 5: Opening chat widget');

// Line 115
await chatButton.click();

// Line 116
await page.waitForTimeout(1000);

// Line 123
console.log('📍 Step 6: Accessing chat widget iframe');

// ... 13 more steps ...
```

---

## 39. should handle invalid WooCommerce credentials and allow correction

**Source:** [`__tests__/playwright/error-scenarios/invalid-credentials.spec.ts`](/__tests__/playwright/error-scenarios/invalid-credentials.spec.ts)

**Total Steps:** 34

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to dashboard |
| 2 | navigate | `BASE_URL + '/dashboard'` |  |  |
| 3 | log |  |  | 📍 Step 2: Navigating to integrations |
| 4 | click |  |  |  |
| 5 | navigate | `BASE_URL + '/dashboard/integrations'` |  |  |
| 6 | log |  |  | 📍 Step 3: Navigating to WooCommerce integration |
| 7 | click |  |  |  |
| 8 | navigate | `BASE_URL + '/dashboard/integrations/woocommerce/configure'` |  |  |
| 9 | log |  |  | 📍 Step 4: Verifying WooCommerce configuration page |
| 10 | log |  |  | 📍 Step 5: Setting up credential validation mock |
| 11 | log |  |  | 📍 Step 6: Entering invalid credentials |
| 12 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 13 | fill | `invalidCreds.storeUrl` |  |  |
| 14 | fill | `invalidCreds.consumerKey` |  |  |
| 15 | fill | `invalidCreds.consumerSecret` |  |  |
| 16 | log |  |  | 📍 Step 7: Testing connection with invalid credentials |
| 17 | click |  |  |  |
| 18 | click |  |  |  |
| 19 | wait | `2000` |  |  |
| 20 | log |  |  | 📍 Step 8: Verifying error message is displayed |
| 21 | log |  |  | 📍 Step 9: Verifying error message is helpful |
| 22 | log |  |  | 📍 Step 10: Verifying credentials were not saved |
| 23 | log |  |  | 📍 Step 11: Verifying user can correct credentials |
| 24 | log |  |  | 📍 Step 12: Correcting credentials |
| 25 | fill | `validCreds.storeUrl` |  |  |
| 26 | fill | `validCreds.consumerKey` |  |  |
| 27 | fill | `validCreds.consumerSecret` |  |  |
| 28 | log |  |  | 📍 Step 13: Testing connection with valid credentials |
| 29 | click |  |  |  |
| 30 | click |  |  |  |
| 31 | wait | `2000` |  |  |
| 32 | log |  |  | 📍 Step 14: Verifying successful connection |
| 33 | log |  |  | 📍 Step 15: Verifying credentials saved after success |
| 34 | log |  |  | 📍 Step 16: Verifying retry behavior |

**Code Reference:**

```typescript
// Line 24
console.log('📍 Step 1: Navigating to dashboard');

// Line 25
await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });

// Line 29
console.log('📍 Step 2: Navigating to integrations');

// Line 34
await integrationsLink.click();

// Line 38
await page.goto(BASE_URL + '/dashboard/integrations', { waitUntil: 'networkidle' });

// Line 43
console.log('📍 Step 3: Navigating to WooCommerce integration');

// Line 48
await wooLink.click();

// Line 52
await page.goto(BASE_URL + '/dashboard/integrations/woocommerce/configure', { waitUntil: 'networkidle' });

// Line 57
console.log('📍 Step 4: Verifying WooCommerce configuration page');

// Line 71
console.log('📍 Step 5: Setting up credential validation mock');

// ... 24 more steps ...
```

---

## 40. should detect concurrent edits and provide conflict resolution

**Source:** [`__tests__/playwright/error-scenarios/database-conflict.spec.ts`](/__tests__/playwright/error-scenarios/database-conflict.spec.ts)

**Total Steps:** 28

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to dashboard |
| 2 | navigate | `BASE_URL + '/dashboard'` |  |  |
| 3 | log |  |  | 📍 Step 2: Navigating to domain settings |
| 4 | click |  |  |  |
| 5 | navigate | `BASE_URL + '/dashboard/domains'` |  |  |
| 6 | log |  |  | 📍 Step 3: Selecting domain to edit |
| 7 | click |  |  |  |
| 8 | navigate | `BASE_URL + '/dashboard/domains/test-domain-123/settings'` |  |  |
| 9 | log |  |  | 📍 Step 4: Setting up concurrent edit simulation |
| 10 | log |  |  | 📍 Step 5: Editing domain settings (User A) |
| 11 | fill | `Updated by User A` |  |  |
| 12 | fill | `45` |  |  |
| 13 | log |  |  | 📍 Step 6: Simulating time passage (concurrent edit occurs) |
| 14 | wait | `1000` |  |  |
| 15 | log |  |  | 📍 Step 7: Saving changes (expecting conflict) |
| 16 | click |  |  |  |
| 17 | wait | `2000` |  |  |
| 18 | log |  |  | 📍 Step 8: Verifying conflict detection |
| 19 | log |  |  | 📍 Step 9: Verifying conflict error message |
| 20 | log |  |  | 📍 Step 10: Verifying resolution options are shown |
| 21 | log |  |  | 📍 Step 11: Verifying change comparison is shown |
| 22 | log |  |  | 📍 Step 12: Resolving conflict |
| 23 | click |  |  |  |
| 24 | click |  |  |  |
| 25 | wait | `2000` |  |  |
| 26 | log |  |  | 📍 Step 13: Verifying successful resolution |
| 27 | log |  |  | 📍 Step 14: Verifying success message |
| 28 | log |  |  | 📍 Step 15: Verifying final state |

**Code Reference:**

```typescript
// Line 23
console.log('📍 Step 1: Navigating to dashboard');

// Line 24
await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });

// Line 28
console.log('📍 Step 2: Navigating to domain settings');

// Line 33
await domainsLink.click();

// Line 37
await page.goto(BASE_URL + '/dashboard/domains', { waitUntil: 'networkidle' });

// Line 42
console.log('📍 Step 3: Selecting domain to edit');

// Line 47
await domainItem.click();

// Line 51
await page.goto(BASE_URL + '/dashboard/domains/test-domain-123/settings', { waitUntil: 'networkidle' });

// Line 56
console.log('📍 Step 4: Setting up concurrent edit simulation');

// Line 142
console.log('📍 Step 5: Editing domain settings (User A)');

// ... 18 more steps ...
```

---

## 41. should prevent concurrent scraping and allow retry after completion

**Source:** [`__tests__/playwright/error-scenarios/concurrent-operations.spec.ts`](/__tests__/playwright/error-scenarios/concurrent-operations.spec.ts)

**Total Steps:** 26

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigating to dashboard |
| 2 | navigate | `BASE_URL + '/dashboard'` |  |  |
| 3 | log |  |  | 📍 Step 2: Navigating to scraping page |
| 4 | click |  |  |  |
| 5 | navigate | `BASE_URL + '/dashboard/installation'` |  |  |
| 6 | log |  |  | 📍 Step 3: Setting up concurrent operation protection |
| 7 | log |  |  | 📍 Step 4: Starting first scraping operation |
| 8 | fill | `DOMAIN` |  |  |
| 9 | click |  |  |  |
| 10 | wait | `1000` |  |  |
| 11 | log |  |  | 📍 Step 5: Verifying first operation started |
| 12 | log |  |  | 📍 Step 6: Attempting concurrent scraping (should be blocked) |
| 13 | fill | `DOMAIN` |  |  |
| 14 | click |  |  |  |
| 15 | wait | `1000` |  |  |
| 16 | log |  |  | 📍 Step 7: Verifying concurrent operation was prevented |
| 17 | log |  |  | 📍 Step 8: Verifying error message for concurrent attempt |
| 18 | log |  |  | 📍 Step 9: Waiting for first operation to complete |
| 19 | wait | `1000` |  |  |
| 20 | log |  |  | 📍 Step 10: Verifying first operation completion |
| 21 | log |  |  | 📍 Step 11: Starting new scraping operation after completion |
| 22 | fill | `newdomain.com` |  |  |
| 23 | click |  |  |  |
| 24 | wait | `1000` |  |  |
| 25 | log |  |  | 📍 Step 12: Verifying new operation is allowed |
| 26 | log |  |  | 📍 Step 13: Verifying atomic operation handling |

**Code Reference:**

```typescript
// Line 23
console.log('📍 Step 1: Navigating to dashboard');

// Line 24
await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });

// Line 28
console.log('📍 Step 2: Navigating to scraping page');

// Line 33
await scrapingLink.click();

// Line 37
await page.goto(BASE_URL + '/dashboard/installation', { waitUntil: 'networkidle' });

// Line 42
console.log('📍 Step 3: Setting up concurrent operation protection');

// Line 138
console.log('📍 Step 4: Starting first scraping operation');

// Line 145
await domainInput.fill(DOMAIN);

// Line 150
await startButton.click();

// Line 164
await page.waitForTimeout(1000);

// ... 16 more steps ...
```

---

## 42. should install and customize widget successfully

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 15

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 3 | click |  |  |  |
| 4 | wait | `500` |  |  |
| 5 | click |  |  |  |
| 6 | navigate | ``${BASE_URL}/dashboard/customize`` |  |  |
| 7 | fill | `#FF6B6B` |  |  |
| 8 | wait | `500` |  |  |
| 9 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 10 | click |  |  |  |
| 11 | wait | `2000` |  |  |
| 12 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 13 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 14 | wait | `3000` |  |  |
| 15 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 19
await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 29
await embedCodeBlock.waitFor({ state: 'visible', timeout: 10000 });

// Line 42
await copyButton.click();

// Line 43
await page.waitForTimeout(500);

// Line 54
await customizeLink.click();

// Line 57
await page.goto(`${BASE_URL}/dashboard/customize`, { waitUntil: 'networkidle' });

// Line 105
await colorInput.fill('#FF6B6B');

// Line 106
await page.waitForTimeout(500);

// Line 114
await saveButton.waitFor({ state: 'visible', timeout: 5000 });

// Line 115
await saveButton.click();

// ... 5 more steps ...
```

---

## 43. should generate correct embed code for different environments

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |

**Code Reference:**

```typescript
// Line 158
await page.goto(`${BASE_URL}/dashboard/installation`, { waitUntil: 'networkidle' });

```

---

## 44. should handle widget customization with invalid values

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 45. complete customization workflow: appearance → behavior → save → persist

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 34

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 2: Verify Essentials tab is active |
| 2 | log |  |  | 📍 Step 3: Change primary color |
| 3 | click |  |  |  |
| 4 | fill | `#10b981` |  |  |
| 5 | log |  |  | 📍 Step 4: Change widget position |
| 6 | click |  |  |  |
| 7 | click |  |  |  |
| 8 | log |  |  | 📍 Step 5: Verify live preview updates |
| 9 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 10 | log |  |  | 📍 Step 6: Switch to Intelligence tab |
| 11 | click |  |  |  |
| 12 | wait | `500` |  |  |
| 13 | log |  |  | 📍 Step 7: Update welcome message |
| 14 | fill | `Hello! Welcome to our customized support bot. How can I help you today?` |  |  |
| 15 | log |  |  | 📍 Step 8: Update bot name |
| 16 | fill | `CustomBot` |  |  |
| 17 | log |  |  | 📍 Step 9: Change AI personality |
| 18 | click |  |  |  |
| 19 | click |  |  |  |
| 20 | log |  |  | 📍 Step 10: Switch to Connect tab |
| 21 | click |  |  |  |
| 22 | wait | `500` |  |  |
| 23 | log |  |  | 📍 Step 11: Toggle WooCommerce integration |
| 24 | click |  |  |  |
| 25 | log |  |  | 📍 Step 12: Verify unsaved changes indicator |
| 26 | log |  |  | 📍 Step 13: Save configuration |
| 27 | click |  |  |  |
| 28 | wait | `2000` |  |  |
| 29 | log |  |  | 📍 Step 14: Reload page to verify persistence |
| 30 | reload |  |  |  |
| 31 | wait | `2000` |  |  |
| 32 | log |  |  | 📍 Step 15: Verify settings persisted after reload |
| 33 | click |  |  |  |
| 34 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 68
console.log('📍 Step 2: Verify Essentials tab is active');

// Line 82
console.log('📍 Step 3: Change primary color');

// Line 92
await greenPreset.click();

// Line 96
await colorInput.fill('#10b981');

// Line 108
console.log('📍 Step 4: Change widget position');

// Line 115
await bottomLeftButton.click();

// Line 122
await bottomLeftOption.click();

// Line 130
console.log('📍 Step 5: Verify live preview updates');

// Line 139
await widgetInPreview.waitFor({ state: 'visible', timeout: 5000 });

// Line 158
console.log('📍 Step 6: Switch to Intelligence tab');

// ... 24 more steps ...
```

---

## 46. live preview updates in real-time

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Locate preview iframe |
| 2 | log |  |  | 📍 Step 2: Change primary color |
| 3 | fill | `#ef4444` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify preview updated immediately |
| 5 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 340
console.log('📍 Step 1: Locate preview iframe');

// Line 349
console.log('📍 Step 2: Change primary color');

// Line 352
await colorInput.fill('#ef4444');

// Line 358
console.log('📍 Step 3: Verify preview updated immediately');

// Line 361
await page.waitForTimeout(1000);

```

---

## 47. reset button restores default settings

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 13

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Make changes to settings |
| 2 | fill | `#8b5cf6` |  |  |
| 3 | click |  |  |  |
| 4 | wait | `500` |  |  |
| 5 | fill | `TestBot` |  |  |
| 6 | log |  |  | 📍 Step 2: Click Reset button |
| 7 | click |  |  |  |
| 8 | wait | `1000` |  |  |
| 9 | log |  |  | 📍 Step 3: Verify settings restored to defaults |
| 10 | click |  |  |  |
| 11 | wait | `500` |  |  |
| 12 | click |  |  |  |
| 13 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 394
console.log('📍 Step 1: Make changes to settings');

// Line 399
await colorInput.fill('#8b5cf6');

// Line 403
await page.locator('[role="tab"]:has-text("Intelligence")').first().click();

// Line 404
await page.waitForTimeout(500);

// Line 413
await botNameInput.fill('TestBot');

// Line 419
console.log('📍 Step 2: Click Reset button');

// Line 423
await resetButton.click();

// Line 427
await page.waitForTimeout(1000);

// Line 432
console.log('📍 Step 3: Verify settings restored to defaults');

// Line 435
await page.locator('[role="tab"]:has-text("Essentials")').first().click();

// ... 3 more steps ...
```

---

## 48. tab navigation works correctly

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Verify all tabs are present |
| 2 | log |  |  | 📍 Step 2: Navigate through all tabs |
| 3 | click |  |  |  |
| 4 | wait | `500` |  |  |
| 5 | click |  |  |  |
| 6 | wait | `500` |  |  |
| 7 | click |  |  |  |
| 8 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 460
console.log('📍 Step 1: Verify all tabs are present');

// Line 474
console.log('📍 Step 2: Navigate through all tabs');

// Line 481
await intelligenceTab.click();

// Line 482
await page.waitForTimeout(500);

// Line 493
await connectTab.click();

// Line 494
await page.waitForTimeout(500);

// Line 505
await essentialsTab.click();

// Line 506
await page.waitForTimeout(500);

```

---

## 49. advanced color customization works

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Look for advanced color options |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step 2: Test multiple color inputs |
| 4 | fill | `#6366f1` |  |  |
| 5 | fill | `#f59e0b` |  |  |

**Code Reference:**

```typescript
// Line 519
console.log('📍 Step 1: Look for advanced color options');

// Line 529
await advancedButton.click();

// Line 535
console.log('📍 Step 2: Test multiple color inputs');

// Line 548
await headerColorInput.fill('#6366f1');

// Line 559
await buttonColorInput.fill('#f59e0b');

```

---

## 50. handles save errors gracefully

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to customize page |
| 2 | navigate | ``${BASE_URL}/dashboard/customize`` |  |  |
| 3 | log |  |  | 📍 Step 2: Set up API error simulation |
| 4 | log |  |  | 📍 Step 3: Make changes and attempt save |
| 5 | fill | `#dc2626` |  |  |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Verify error is handled gracefully |

**Code Reference:**

```typescript
// Line 580
console.log('📍 Step 1: Navigate to customize page');

// Line 581
await page.goto(`${BASE_URL}/dashboard/customize`, { waitUntil: 'networkidle' });

// Line 587
console.log('📍 Step 2: Set up API error simulation');

// Line 605
console.log('📍 Step 3: Make changes and attempt save');

// Line 609
await colorInput.fill('#dc2626');

// Line 614
await saveButton.click();

// Line 620
console.log('📍 Step 4: Verify error is handled gracefully');

```

---

## 51. supports keyboard navigation

**Source:** [`__tests__/playwright/dashboard/widget-customization.spec.ts`](/__tests__/playwright/dashboard/widget-customization.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/customize`` |  |  |
| 2 | log |  |  | 📍 Step 1: Test tab navigation through main elements |
| 3 | log |  |  | 📍 Step 2: Test form input navigation |
| 4 | fill | `Test Input` |  |  |

**Code Reference:**

```typescript
// Line 658
await page.goto(`${BASE_URL}/dashboard/customize`, { waitUntil: 'networkidle' });

// Line 664
console.log('📍 Step 1: Test tab navigation through main elements');

// Line 691
console.log('📍 Step 2: Test form input navigation');

// Line 698
await page.keyboard.type('Test Input');

```

---

## 52. should add and configure domain successfully

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

## 53. should handle domain editing

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 54. should handle domain deletion/disabling

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 55. should enforce domain access control

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 56. complete search workflow: search → results → view conversation with highlight

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 3: Entering search query for "hydraulic pump" |
| 2 | wait | `1000` |  |  |
| 3 | log |  |  | 📍 Step 4: Verifying search results display |
| 4 | log |  |  | 📍 Step 5: Clicking on first search result to view conversation |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 6: Verifying conversation details loaded |
| 7 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 99
console.log('📍 Step 3: Entering search query for "hydraulic pump"');

// Line 108
await page.waitForTimeout(1000);

// Line 113
console.log('📍 Step 4: Verifying search results display');

// Line 123
console.log('📍 Step 5: Clicking on first search result to view conversation');

// Line 127
await page.waitForTimeout(2000);

// Line 130
console.log('📍 Step 6: Verifying conversation details loaded');

// Line 148
await page.screenshot({
        path: `test-results/search-result-success-${Date.now()}.png`,
        fullPage: true
      });

```

---

## 57. search with advanced filters: date range and status filtering

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Entering search term "order" |
| 2 | fill | `order` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | log |  |  | 📍 Step 2: Opening advanced filters |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 3: Applying date range filter for last 7 days |
| 7 | log |  |  | 📍 Step 4: Applying status filter for "resolved" conversations |
| 8 | click |  |  |  |
| 9 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 170
console.log('📍 Step 1: Entering search term "order"');

// Line 184
await searchInput.fill('order');

// Line 185
await page.waitForTimeout(1000);

// Line 188
console.log('📍 Step 2: Opening advanced filters');

// Line 192
await filtersButton.click();

// Line 196
console.log('📍 Step 3: Applying date range filter for last 7 days');

// Line 204
console.log('📍 Step 4: Applying status filter for "resolved" conversations');

// Line 214
await applyButton.click();

// Line 219
await page.waitForTimeout(2000);

```

---

## 58. handles empty search results gracefully

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Entering search query with no expected results |
| 2 | fill | `xyzabc123nonexistentquery999` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step 2: Checking for empty state message |
| 5 | log |  |  | 📍 Step 3: Clearing search to restore all conversations |
| 6 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 235
console.log('📍 Step 1: Entering search query with no expected results');

// Line 248
await searchInput.fill('xyzabc123nonexistentquery999');

// Line 249
await page.waitForTimeout(2000);

// Line 252
console.log('📍 Step 2: Checking for empty state message');

// Line 272
console.log('📍 Step 3: Clearing search to restore all conversations');

// Line 274
await page.waitForTimeout(2000);

```

---

## 59. search with special characters and edge cases

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `testCase.query` |  |  |
| 2 | wait | `1500` |  |  |

**Code Reference:**

```typescript
// Line 307
await searchInput.fill(testCase.query);

// Line 308
await page.waitForTimeout(1500);

```

---

## 60. keyboard navigation and shortcuts in search

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Testing "/" keyboard shortcut to focus search |
| 2 | log |  |  | 📍 Step 2: Typing search query via keyboard |
| 3 | fill | `customer inquiry` |  |  |
| 4 | wait | `1500` |  |  |
| 5 | log |  |  | 📍 Step 3: Testing keyboard navigation through results |
| 6 | log |  |  | 📍 Step 4: Testing Escape key to clear search |

**Code Reference:**

```typescript
// Line 326
console.log('📍 Step 1: Testing "/" keyboard shortcut to focus search');

// Line 350
console.log('📍 Step 2: Typing search query via keyboard');

// Line 351
await page.keyboard.type('customer inquiry');

// Line 352
await page.waitForTimeout(1500);

// Line 355
console.log('📍 Step 3: Testing keyboard navigation through results');

// Line 372
console.log('📍 Step 4: Testing Escape key to clear search');

```

---

## 61. search result persistence and back navigation

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Performing initial search |
| 2 | fill | `support ticket` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step 2: Clicking on search result |
| 5 | click |  |  |  |
| 6 | wait | `2000` |  |  |
| 7 | log |  |  | 📍 Step 3: Testing browser back navigation |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step 4: Verifying search query is preserved |
| 10 | fill | `support ticket` |  |  |

**Code Reference:**

```typescript
// Line 389
console.log('📍 Step 1: Performing initial search');

// Line 401
await searchInput.fill('support ticket');

// Line 402
await page.waitForTimeout(2000);

// Line 405
console.log('📍 Step 2: Clicking on search result');

// Line 410
await conversations.first().click();

// Line 411
await page.waitForTimeout(2000);

// Line 414
console.log('📍 Step 3: Testing browser back navigation');

// Line 416
await page.waitForTimeout(2000);

// Line 419
console.log('📍 Step 4: Verifying search query is preserved');

// Line 426
await searchInput.fill('support ticket');

```

---

## 62. CSV export endpoint: verify availability and response

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Test CSV export with 7 days |

**Code Reference:**

```typescript
// Line 26
console.log('📍 Step 1: Test CSV export with 7 days');

```

---

## 63. JSON analytics endpoint: verify data structure

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Test analytics API |

**Code Reference:**

```typescript
// Line 53
console.log('📍 Step 1: Test analytics API');

```

---

## 64. Export formats: test all supported formats

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 65. Date range parameters: test different time periods

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 66. Error handling: test invalid parameters

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Test invalid format |
| 2 | log |  |  | 📍 Step 2: Test missing format |

**Code Reference:**

```typescript
// Line 149
console.log('📍 Step 1: Test invalid format');

// Line 161
console.log('📍 Step 2: Test missing format');

```

---

## 67. Export workflow documentation for AI agents

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 68. should complete demo flow from URL entry to AI chat response

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 13

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `BASE_URL` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 3 | fill | `TEST_DEMO_SITE` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `3000` |  |  |
| 6 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 7 | fill | `What can you tell me about this website?` |  |  |
| 8 | click |  |  |  |
| 9 | wait | `3000` |  |  |
| 10 | fill | `Tell me more about that` |  |  |
| 11 | click |  |  |  |
| 12 | wait | `3000` |  |  |
| 13 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 22
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 29
await demoUrlInput.waitFor({ state: 'visible', timeout: 10000 });

// Line 30
await demoUrlInput.fill(TEST_DEMO_SITE);

// Line 57
await startDemoButton.click();

// Line 58
await page.waitForTimeout(3000);

// Line 67
await chatInterface.waitFor({ state: 'visible', timeout: 10000 });

// Line 73
await chatInterface.fill('What can you tell me about this website?');

// Line 79
await sendButton.click();

// Line 80
await page.waitForTimeout(3000);

// Line 99
await chatInterface.fill('Tell me more about that');

// ... 3 more steps ...
```

---

## 69. should handle invalid URLs gracefully

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
// Line 114
await page.goto(BASE_URL, { waitUntil: 'networkidle' });

// Line 117
await demoUrlInput.waitFor({ state: 'visible', timeout: 5000 });

// Line 122
await demoUrlInput.fill(invalidUrl);

// Line 124
await startButton.click();

// Line 125
await page.waitForTimeout(500);

```

---

## 70. should enforce demo session limits

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 71. should show upgrade prompt after demo limits reached

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 72. should complete full purchase flow from chat to order confirmation

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | wait | `5000` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 4 | click |  |  |  |
| 5 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 28
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 37
await page.waitForTimeout(5000);

// Line 71
await checkoutButton.waitFor({ state: 'visible', timeout: 5000 });

// Line 72
await checkoutButton.click();

// Line 82
await productPage.screenshot({
      path: `test-results/purchase-flow-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 73. should handle purchase flow with guest checkout

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 74. should handle purchase flow with registered user

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 75. should maintain context across multiple conversation turns

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

## 76. should handle conversation with context reset

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 77. should handle very long conversations

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 78. should handle ambiguous pronouns

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 79. should complete full team invitation flow for viewer role

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1000` |  |  |
| 2 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 316
await page.waitForTimeout(1000);

// Line 336
await page.screenshot({
      path: `test-results/team-management-viewer-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 80. should handle editor role with correct permissions

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 81. should show team members list with correct roles

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 82. should allow admin to revoke member access

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 83. should handle expired invitation tokens

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 84. should complete Shopify setup and track purchases

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | wait | `1000` |  |  |
| 3 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 67
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 80
await page.waitForTimeout(1000);

// Line 86
await page.screenshot({
      path: `test-results/shopify-integration-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 85. should handle Shopify connection errors

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | click |  |  |  |
| 2 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 104
await testButton.click();

// Line 105
await page.waitForTimeout(2000);

```

---

## 86. should sync product inventory updates

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 87. should handle product out of stock scenarios

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 88. should track Shopify order fulfillment

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 89. should handle Shopify webhooks

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 90. should display real-time metrics and update without refresh

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1000` |  |  |
| 2 | wait | `3000` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | wait | `3000` |  |  |
| 5 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 280
await page.waitForTimeout(1000);

// Line 290
await page.waitForTimeout(3000);

// Line 299
await page.waitForTimeout(1000);

// Line 310
await page.waitForTimeout(3000);

// Line 323
await page.screenshot({
      path: `test-results/realtime-analytics-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 91. should handle connection interruptions gracefully

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `5000` |  |  |

**Code Reference:**

```typescript
// Line 342
await page.waitForTimeout(5000);

```

---

## 92. should show historical trend alongside real-time data

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 93. should filter real-time events by type

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 94. should export real-time data snapshot

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 95. should handle high-frequency updates efficiently

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 96. should lookup order status via chat and return accurate information

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 273
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 302
await page.screenshot({
      path: `test-results/order-lookup-chat-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 97. should handle order lookup for processing orders

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |

**Code Reference:**

```typescript
// Line 316
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

```

---

## 98. should handle invalid order numbers gracefully

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |

**Code Reference:**

```typescript
// Line 336
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

```

---

## 99. should handle multiple order lookups in same conversation

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 100. should provide order modification options

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 101. should handle orders without tracking numbers

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 102. should monitor live chat and complete agent takeover

**Source:** [`__tests__/playwright/advanced-features/live-chat-monitoring.spec.ts`](/__tests__/playwright/advanced-features/live-chat-monitoring.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1000` |  |  |
| 2 | wait | `1000` |  |  |
| 3 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 145
await page.waitForTimeout(1000);

// Line 155
await page.waitForTimeout(1000);

// Line 159
await page.screenshot({
      path: `test-results/live-chat-monitoring-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 103. should show waiting chats requiring agent attention

**Source:** [`__tests__/playwright/advanced-features/live-chat-monitoring.spec.ts`](/__tests__/playwright/advanced-features/live-chat-monitoring.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 176
await page.waitForTimeout(1000);

```

---

## 104. should complete full conversations management flow with export

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | reload |  |  |  |
| 2 | wait | `1000` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | wait | `1000` |  |  |
| 5 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 54
await page.reload({ waitUntil: 'networkidle' });

// Line 55
await page.waitForTimeout(1000);

// Line 57
await page.waitForTimeout(1000);

// Line 81
await page.waitForTimeout(1000);

// Line 87
await page.screenshot({
      path: `test-results/conversations-management-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 105. should filter conversations by date range

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1500` |  |  |

**Code Reference:**

```typescript
// Line 102
await page.waitForTimeout(1500);

```

---

## 106. should handle empty search results gracefully

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 107. should allow bulk operations on conversations

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 108. should show conversation analytics

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 109. should restore abandoned cart when customer returns

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/shop/products`` |  |  |
| 2 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 298
await page.goto(`${BASE_URL}/shop/products`, { waitUntil: 'networkidle' });

// Line 327
await page.screenshot({
      path: `test-results/cart-abandonment-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 110. should track cart abandonment analytics

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 111. should send abandonment email reminder

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 112. should handle expired cart sessions

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 113. should merge guest and authenticated user carts

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 114. should handle out-of-stock items in restored cart

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 115. complete workflow: abandoned conversation → detection → schedule → send

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 480
await page.screenshot({
      path: `test-results/follow-up-workflow-success-${Date.now()}.png`,
      fullPage: true
    });

```

---

## 116. follow-up cancelled when user returns

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 117. follow-up analytics track response rate

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 118. abandoned cart follow-up scenario

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 119. product inquiry without answer follow-up

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 3 | click |  |  |  |
| 4 | fill | `productQuestion` |  |  |
| 5 | wait | `2000` |  |  |
| 6 | navigate | ``${BASE_URL}/`` |  |  |

**Code Reference:**

```typescript
// Line 571
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 575
await inputField.waitFor({ state: 'visible', timeout: 5000 });

// Line 576
await inputField.click();

// Line 580
await inputField.fill(productQuestion);

// Line 586
await page.waitForTimeout(2000);

// Line 587
await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });

```

---

## 120. support request left hanging follow-up

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 121. low satisfaction follow-up with high priority

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 122. should handle multiple follow-up attempts limit

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 123. should handle time-based scheduling correctly

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 124. should handle email vs in-app channel selection

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 125. verify file naming convention for all formats

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `exportUrl` |  |  |
| 2 | navigate | `/dashboard/analytics` |  |  |
| 3 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 29
await page.goto(exportUrl);

// Line 64
await page.goto('/dashboard/analytics');

// Line 65
await page.waitForTimeout(1000);

```

---

## 126. PDF export with 90-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 127. Excel export validation

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 128. export with empty data: handle gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | reload |  |  |  |
| 2 | navigate | `exportUrl` |  |  |

**Code Reference:**

```typescript
// Line 59
await page.reload({ waitUntil: 'networkidle' });

// Line 67
await page.goto(exportUrl);

```

---

## 129. export with user authentication and permissions

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 130. handle invalid export format gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 131. handle missing query parameters

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 132. handle request timeout gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 133. complete export workflow: UI suggestion for missing buttons

**Source:** [`__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts)

**Total Steps:** 2

**API Endpoints Used:**
- `/api/analytics/export?format=csv&days=7`

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/api/analytics/export?format=csv&days=7` |  |  |
| 2 | navigate | `/dashboard/analytics` |  |  |

**Code Reference:**

```typescript
// Line 57
await page.goto('/api/analytics/export?format=csv&days=7');

// Line 70
await page.goto('/dashboard/analytics');

```

---

## 134. export performance: large dataset handling

**Source:** [`__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `exportUrl` |  |  |

**Code Reference:**

```typescript
// Line 85
await page.goto(exportUrl);

```

---

## 135. sequential export downloads: verify file independence

**Source:** [`__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts)

**Total Steps:** 2

**API Endpoints Used:**
- `/api/analytics/export?format=${formats[i]}&days=7``
- `/api/analytics/export?format=${formats[i]}&days=7`);`

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``/api/analytics/export?format=${formats[i]}&days=7`` |  |  |
| 2 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 118
await page.goto(`/api/analytics/export?format=${formats[i]}&days=7`);

// Line 132
await page.waitForTimeout(500);

```

---

## 136. export with custom time ranges

**Source:** [`__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/download-flows.spec.ts)

**Total Steps:** 3

**API Endpoints Used:**
- `/api/analytics/export?format=csv&days=${days}``
- `/api/analytics/export?format=csv&days=${days}`);`

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``/api/analytics/export?format=csv&days=${days}`` |  |  |
| 2 | navigate | `/dashboard/analytics` |  |  |
| 3 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 156
await page.goto(`/api/analytics/export?format=csv&days=${days}`);

// Line 172
await page.goto('/dashboard/analytics');

// Line 173
await page.waitForTimeout(500);

```

---

## 137. verify JSON analytics data structure

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 138. export with date range filter applied

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | click |  |  |  |
| 2 | click |  |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 53
await timeRangeSelector.click();

// Line 54
await page.locator('[role="option"]:has-text("Last 30 days")').click();

// Line 59
await page.waitForTimeout(2000);

```

---

## 139. validate CSV data accuracy and formatting

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 140. verify API endpoint responses

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 141. export analytics as CSV: click → download → verify

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | click |  |  |  |
| 2 | navigate | `/dashboard/analytics` |  |  |

**Code Reference:**

```typescript
// Line 33
await exportCSVButton.click();

// Line 87
await page.goto('/dashboard/analytics');

```

---

## 142. verify CSV file structure and headers

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 143. CSV export with 30-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 144. English to Spanish translation

**Source:** [`__tests__/playwright/advanced-features/multi-language/translation.spec.ts`](/__tests__/playwright/advanced-features/multi-language/translation.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Load widget test page (English) |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify UI elements are in English |
| 4 | log |  |  | 📍 Step 3: Change language to Spanish |
| 5 | log |  |  | 📍 Step 4: Verify UI elements updated to Spanish |
| 6 | log |  |  | 📍 Step 5: Send message in Spanish |
| 7 | fill | `Hola, ¿qué productos tienes disponibles?` |  |  |
| 8 | click |  |  |  |
| 9 | log |  |  | 📍 Step 6: Verify AI responds in Spanish |
| 10 | wait | `5000` |  |  |

**Code Reference:**

```typescript
// Line 35
console.log('📍 Step 1: Load widget test page (English)');

// Line 36
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 43
console.log('📍 Step 2: Verify UI elements are in English');

// Line 54
console.log('📍 Step 3: Change language to Spanish');

// Line 61
console.log('📍 Step 4: Verify UI elements updated to Spanish');

// Line 76
console.log('📍 Step 5: Send message in Spanish');

// Line 77
await spanishInput.fill('Hola, ¿qué productos tienes disponibles?');

// Line 81
await sendButton.click();

// Line 85
console.log('📍 Step 6: Verify AI responds in Spanish');

// Line 86
await page.waitForTimeout(5000);

```

---

## 145. UI updates immediately on language change

**Source:** [`__tests__/playwright/advanced-features/multi-language/translation.spec.ts`](/__tests__/playwright/advanced-features/multi-language/translation.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |

**Code Reference:**

```typescript
// Line 101
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

```

---

## 146. RTL languages display correctly (Arabic)

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Load widget |
| 2 | navigate | ``${BASE_URL}/embed`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step 2: Set language to Arabic (RTL) |
| 5 | log |  |  | 📍 Step 3: Verify RTL layout attributes |
| 6 | log |  |  | 📍 Step 4: Verify Arabic text rendering |
| 7 | fill | `مرحبا، كيف يمكنني مساعدتك؟` |  |  |
| 8 | log |  |  | 📍 Step 5: Verify UI elements aligned for RTL |

**Code Reference:**

```typescript
// Line 29
console.log('📍 Step 1: Load widget');

// Line 30
await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });

// Line 31
await page.waitForTimeout(2000);

// Line 34
console.log('📍 Step 2: Set language to Arabic (RTL)');

// Line 41
console.log('📍 Step 3: Verify RTL layout attributes');

// Line 52
console.log('📍 Step 4: Verify Arabic text rendering');

// Line 57
await inputField.fill('مرحبا، كيف يمكنني مساعدتك؟');

// Line 68
console.log('📍 Step 5: Verify UI elements aligned for RTL');

```

---

## 147. Hebrew (RTL) text rendering

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/embed`` |  |  |
| 2 | fill | `שלום, איך אני יכול לעזור?` |  |  |

**Code Reference:**

```typescript
// Line 92
await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });

// Line 102
await inputField.fill('שלום, איך אני יכול לעזור?');

```

---

## 148. RTL layout persists across language changes

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/embed`` |  |  |

**Code Reference:**

```typescript
// Line 116
await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });

```

---

## 149. locale preference persists in localStorage

**Source:** [`__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts`](/__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |

**Code Reference:**

```typescript
// Line 29
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

```

---

## 150. multiple locales can be switched

**Source:** [`__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts`](/__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |

**Code Reference:**

```typescript
// Line 52
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

```

---

## 151. invalid locale handled gracefully

**Source:** [`__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts`](/__tests__/playwright/advanced-features/multi-language/locale-formatting.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |

**Code Reference:**

```typescript
// Line 67
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

```

---

## 152. language switching preserves conversation history

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts)

**Total Steps:** 14

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Start conversation in English |
| 2 | navigate | ``${BASE_URL}/embed`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | fill | `Hello, what products do you have?` |  |  |
| 5 | click |  |  |  |
| 6 | wait | `5000` |  |  |
| 7 | log |  |  | 📍 Step 2: Count messages before language change |
| 8 | log |  |  | 📍 Step 3: Switch to Spanish mid-conversation |
| 9 | log |  |  | 📍 Step 4: Verify conversation history preserved |
| 10 | log |  |  | 📍 Step 5: Continue conversation in Spanish |
| 11 | fill | `Muéstrame los productos más populares` |  |  |
| 12 | click |  |  |  |
| 13 | wait | `5000` |  |  |
| 14 | log |  |  | 📍 Step 6: Verify mixed language conversation works |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Start conversation in English');

// Line 32
await page.goto(`${BASE_URL}/embed`, { waitUntil: 'networkidle' });

// Line 33
await page.waitForTimeout(2000);

// Line 36
await inputField.fill('Hello, what products do you have?');

// Line 39
await sendButton.click();

// Line 43
await page.waitForTimeout(5000);

// Line 46
console.log('📍 Step 2: Count messages before language change');

// Line 51
console.log('📍 Step 3: Switch to Spanish mid-conversation');

// Line 57
console.log('📍 Step 4: Verify conversation history preserved');

// Line 68
console.log('📍 Step 5: Continue conversation in Spanish');

// ... 4 more steps ...
```

---

## 153. language persists after page reload

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set language preference to Spanish |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Reload page |
| 4 | log |  |  | 📍 Step 3: Verify language preference persisted |
| 5 | log |  |  | 📍 Step 4: Verify UI shows Spanish after reload |

**Code Reference:**

```typescript
// Line 94
console.log('📍 Step 1: Set language preference to Spanish');

// Line 95
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 101
console.log('📍 Step 2: Reload page');

// Line 105
console.log('📍 Step 3: Verify language preference persisted');

// Line 115
console.log('📍 Step 4: Verify UI shows Spanish after reload');

```

---

## 154. rapid language switches handled correctly

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 2 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 138
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 145
await page.waitForTimeout(500);

```

---

## 155. browser locale auto-detection

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-detection.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-detection.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create browser context with Spanish locale |
| 2 | log |  |  | 📍 Step 2: Load widget with Spanish browser locale |
| 3 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 3: Check if language was auto-detected from browser |
| 6 | log |  |  | 📍 Step 4: Check if UI adapted to browser locale |

**Code Reference:**

```typescript
// Line 29
console.log('📍 Step 1: Create browser context with Spanish locale');

// Line 41
console.log('📍 Step 2: Load widget with Spanish browser locale');

// Line 42
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 43
await page.waitForTimeout(2000);

// Line 46
console.log('📍 Step 3: Check if language was auto-detected from browser');

// Line 57
console.log('📍 Step 4: Check if UI adapted to browser locale');

```

---

## 156. complete language workflow: English → Spanish → Arabic (RTL)

**Source:** [`__tests__/playwright/advanced-features/multi-language/complete-workflow.spec.ts`](/__tests__/playwright/advanced-features/multi-language/complete-workflow.spec.ts)

**Total Steps:** 14

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Load widget test page in default language (English) |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe to load and initialize |
| 4 | log |  |  | 📍 Step 3: Verify UI elements are in English |
| 5 | log |  |  | 📍 Step 4: Change language to Spanish |
| 6 | log |  |  | 📍 Step 5: Verify UI elements updated to Spanish |
| 7 | log |  |  | 📍 Step 6: Send a message in Spanish |
| 8 | fill | `Hola, ¿qué productos tienes disponibles?` |  |  |
| 9 | click |  |  |  |
| 10 | wait | `5000` |  |  |
| 11 | log |  |  | 📍 Step 7: Change language to Arabic (RTL) |
| 12 | log |  |  | 📍 Step 8: Verify RTL (right-to-left) layout |
| 13 | log |  |  | 📍 Step 9: Verify UI elements updated to Arabic |
| 14 | log |  |  | 📍 Step 10: Verify conversation history maintained across language changes |

**Code Reference:**

```typescript
// Line 41
console.log('📍 Step 1: Load widget test page in default language (English)');

// Line 42
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 46
console.log('📍 Step 2: Wait for widget iframe to load and initialize');

// Line 52
console.log('📍 Step 3: Verify UI elements are in English');

// Line 63
console.log('📍 Step 4: Change language to Spanish');

// Line 70
console.log('📍 Step 5: Verify UI elements updated to Spanish');

// Line 85
console.log('📍 Step 6: Send a message in Spanish');

// Line 86
await inputField.fill('Hola, ¿qué productos tienes disponibles?');

// Line 90
await sendButton.click();

// Line 94
await page.waitForTimeout(5000);

// ... 4 more steps ...
```

---

## Coverage Summary

### API Endpoints

- `/api/analytics/export?format=${formats[i]}&days=7``
- `/api/analytics/export?format=${formats[i]}&days=7`);`
- `/api/analytics/export?format=csv&days=${days}``
- `/api/analytics/export?format=csv&days=${days}`);`
- `/api/analytics/export?format=csv&days=7`

### UI Elements

<details>
<summary>Click to expand UI element catalog</summary>

- `#10b981`
- `#6366f1`
- `#8b5cf6`
- `#FF6B6B`
- `#dc2626`
- `#ef4444`
- `#f59e0b`
- `'Message ' + i`
- `(RETRY_AFTER_SECONDS + 1) * 1000`
- `/api/analytics/export?format=csv&days=7`
- `/dashboard/analytics`
- `/dashboard/telemetry`
- `1000`
- `1500`
- `2000`
- `300`
- `3000`
- `36000`
- `4000`
- `45`
- `500`
- `5000`
- `BASE_URL`
- `BASE_URL + '/cart'`
- `BASE_URL + '/checkout'`
- `BASE_URL + '/dashboard'`
- `BASE_URL + '/dashboard/domains'`
- `BASE_URL + '/dashboard/domains/test-domain-123/settings'`
- `BASE_URL + '/dashboard/installation'`
- `BASE_URL + '/dashboard/integrations'`
- `BASE_URL + '/dashboard/integrations/woocommerce/configure'`
- `BASE_URL + '/product/test-product'`
- `BASE_URL + '/shop'`
- `CustomBot`
- `DOMAIN`
- `Hello! Welcome to our customized support bot. How can I help you today?`
- `Hello, I need help`
- `Hello, what products do you have?`
- `Hola, ¿qué productos tienes disponibles?`
- `I need a hydraulic pump for my machinery`
- `Message after cooldown`
- `Muéstrame los productos más populares`
- `Show me your best products`
- `Show me your widgets`
- `TEST_DEMO_SITE`
- `TEST_DOMAIN`
- `Tell me more about that`
- `Test Input`
- `Test message for domain verification`
- `Test message for session tracking`
- `TestBot`
- `Updated by User A`
- `What can you tell me about this website?`
- `What pages are on this website?`
- ``${BASE_URL}/``
- ``${BASE_URL}/dashboard/analytics``
- ``${BASE_URL}/dashboard/customize``
- ``${BASE_URL}/dashboard/domains``
- ``${BASE_URL}/dashboard/installation``
- ``${BASE_URL}/dashboard/integrations/woocommerce``
- ``${BASE_URL}/dashboard``
- ``${BASE_URL}/embed``
- ``${BASE_URL}/pricing``
- ``${BASE_URL}/shop/products``
- ``${BASE_URL}/test-widget``
- ``${BASE_URL}/widget-test``
- ``/api/analytics/export?format=${formats[i]}&days=7``
- ``/api/analytics/export?format=csv&days=${days}``
- ``https://${TEST_DOMAIN}``
- `acme.com`
- `button[type="submit"]`
- `customer inquiry`
- `exportUrl`
- `field.value`
- `fifthMessage`
- `firstMessage`
- `fourthMessage`
- `http://localhost:3000/dashboard/analytics`
- `iframe#chat-widget-iframe`
- `invalid-domain-that-does-not-exist.xyz`
- `invalidCreds.consumerKey`
- `invalidCreds.consumerSecret`
- `invalidCreds.storeUrl`
- `invalidUrl`
- `newdomain.com`
- `nonexistent-session`
- `order`
- `productQuestion`
- `secondMessage`
- `session-123`
- `session-abc-123`
- `session-xyz-789`
- `support ticket`
- `testCase.query`
- `text=/recommendation/i`
- `thirdMessage`
- `user@acme.com`
- `validCreds.consumerKey`
- `validCreds.consumerSecret`
- `validCreds.storeUrl`
- `xyz123nonexistentproduct456abc`
- `xyzabc123nonexistentquery999`
- `{
      timeout: 10000,
    }`
- `{ state: 'attached', timeout: 10000 }`
- `{ state: 'attached', timeout: 15000 }`
- `{ state: 'visible', timeout: 10000 }`
- `{ state: 'visible', timeout: 5000 }`
- `{ timeout: 15000 }`
- `שלום, איך אני יכול לעזור?`
- `مرحبا، كيف يمكنني مساعدتك؟`

</details>

---

**Note:** This document is auto-generated from E2E tests. To update, run `npx tsx scripts/extract-workflows-from-e2e.ts`
