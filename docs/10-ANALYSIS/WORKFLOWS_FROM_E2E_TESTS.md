# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** 2025-11-16T19:38:24.809Z
**Source:** Playwright E2E test files in `__tests__/playwright/`

## Summary

- **Total Tests:** 192
- **Total Steps:** 839
- **API Endpoints Documented:** 5
- **UI Elements Documented:** 115

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
22. [user discovers products and adds to cart via mobile shopping feed](#user-discovers-products-and-adds-to-cart-via-mobile-shopping-feed)
23. [swipe navigation and gestures work smoothly](#swipe-navigation-and-gestures-work-smoothly)
24. [product detail expansion and interaction](#product-detail-expansion-and-interaction)
25. [cart operations and state management](#cart-operations-and-state-management)
26. [accessibility and performance standards](#accessibility-and-performance-standards)
27. [should complete scraping and make content searchable in chat](#should-complete-scraping-and-make-content-searchable-in-chat)
28. [should handle scraping errors gracefully](#should-handle-scraping-errors-gracefully)
29. [should show progress during long scraping jobs](#should-show-progress-during-long-scraping-jobs)
30. [complete recommendation workflow: chat → recommendations → click → purchase tracking](#complete-recommendation-workflow-chat-recommendations-click-purchase-tracking)
31. [recommendation algorithms display correctly](#recommendation-algorithms-display-correctly)
32. [empty state when no recommendations available](#empty-state-when-no-recommendations-available)
33. [click tracking without navigation](#click-tracking-without-navigation)
34. [purchase tracking without navigation](#purchase-tracking-without-navigation)
35. [recommendation API returns valid data](#recommendation-api-returns-valid-data)
36. [invalid API requests return proper errors](#invalid-api-requests-return-proper-errors)
37. [should complete WooCommerce setup and enable product search](#should-complete-woocommerce-setup-and-enable-product-search)
38. [should handle WooCommerce connection errors gracefully](#should-handle-woocommerce-connection-errors-gracefully)
39. [should maintain cart session across messages](#should-maintain-cart-session-across-messages)
40. [should handle Store API failures gracefully](#should-handle-store-api-failures-gracefully)
41. [should enforce rate limits and allow retry after cooldown](#should-enforce-rate-limits-and-allow-retry-after-cooldown)
42. [should handle payment failure and allow retry with cart preserved](#should-handle-payment-failure-and-allow-retry-with-cart-preserved)
43. [should handle network timeout and allow successful retry](#should-handle-network-timeout-and-allow-successful-retry)
44. [should handle invalid WooCommerce credentials and allow correction](#should-handle-invalid-woocommerce-credentials-and-allow-correction)
45. [should detect concurrent edits and provide conflict resolution](#should-detect-concurrent-edits-and-provide-conflict-resolution)
46. [should prevent concurrent scraping and allow retry after completion](#should-prevent-concurrent-scraping-and-allow-retry-after-completion)
47. [should install and customize widget successfully](#should-install-and-customize-widget-successfully)
48. [should generate correct embed code for different environments](#should-generate-correct-embed-code-for-different-environments)
49. [should handle widget customization with invalid values](#should-handle-widget-customization-with-invalid-values)
50. [should add and configure domain successfully](#should-add-and-configure-domain-successfully)
51. [should handle domain editing](#should-handle-domain-editing)
52. [should handle domain deletion/disabling](#should-handle-domain-deletion-disabling)
53. [should enforce domain access control](#should-enforce-domain-access-control)
54. [complete search workflow: search → results → view conversation with highlight](#complete-search-workflow-search-results-view-conversation-with-highlight)
55. [search with advanced filters: date range and status filtering](#search-with-advanced-filters-date-range-and-status-filtering)
56. [handles empty search results gracefully](#handles-empty-search-results-gracefully)
57. [search with special characters and edge cases](#search-with-special-characters-and-edge-cases)
58. [keyboard navigation and shortcuts in search](#keyboard-navigation-and-shortcuts-in-search)
59. [search result persistence and back navigation](#search-result-persistence-and-back-navigation)
60. [CSV export endpoint: verify availability and response](#csv-export-endpoint-verify-availability-and-response)
61. [JSON analytics endpoint: verify data structure](#json-analytics-endpoint-verify-data-structure)
62. [Export formats: test all supported formats](#export-formats-test-all-supported-formats)
63. [Date range parameters: test different time periods](#date-range-parameters-test-different-time-periods)
64. [Error handling: test invalid parameters](#error-handling-test-invalid-parameters)
65. [Export workflow documentation for AI agents](#export-workflow-documentation-for-ai-agents)
66. [should complete demo flow from URL entry to AI chat response](#should-complete-demo-flow-from-url-entry-to-ai-chat-response)
67. [should handle invalid URLs gracefully](#should-handle-invalid-urls-gracefully)
68. [should enforce demo session limits](#should-enforce-demo-session-limits)
69. [should show upgrade prompt after demo limits reached](#should-show-upgrade-prompt-after-demo-limits-reached)
70. [should complete full purchase flow from chat to order confirmation](#should-complete-full-purchase-flow-from-chat-to-order-confirmation)
71. [should handle purchase flow with guest checkout](#should-handle-purchase-flow-with-guest-checkout)
72. [should handle purchase flow with registered user](#should-handle-purchase-flow-with-registered-user)
73. [should maintain context across multiple conversation turns](#should-maintain-context-across-multiple-conversation-turns)
74. [should handle conversation with context reset](#should-handle-conversation-with-context-reset)
75. [should handle very long conversations](#should-handle-very-long-conversations)
76. [should handle ambiguous pronouns](#should-handle-ambiguous-pronouns)
77. [should complete full team invitation flow for viewer role](#should-complete-full-team-invitation-flow-for-viewer-role)
78. [should handle editor role with correct permissions](#should-handle-editor-role-with-correct-permissions)
79. [should show team members list with correct roles](#should-show-team-members-list-with-correct-roles)
80. [should allow admin to revoke member access](#should-allow-admin-to-revoke-member-access)
81. [should handle expired invitation tokens](#should-handle-expired-invitation-tokens)
82. [should complete Shopify setup and track purchases](#should-complete-shopify-setup-and-track-purchases)
83. [should handle Shopify connection errors](#should-handle-shopify-connection-errors)
84. [should sync product inventory updates](#should-sync-product-inventory-updates)
85. [should handle product out of stock scenarios](#should-handle-product-out-of-stock-scenarios)
86. [should track Shopify order fulfillment](#should-track-shopify-order-fulfillment)
87. [should handle Shopify webhooks](#should-handle-shopify-webhooks)
88. [should display real-time metrics and update without refresh](#should-display-real-time-metrics-and-update-without-refresh)
89. [should handle connection interruptions gracefully](#should-handle-connection-interruptions-gracefully)
90. [should show historical trend alongside real-time data](#should-show-historical-trend-alongside-real-time-data)
91. [should filter real-time events by type](#should-filter-real-time-events-by-type)
92. [should export real-time data snapshot](#should-export-real-time-data-snapshot)
93. [should handle high-frequency updates efficiently](#should-handle-high-frequency-updates-efficiently)
94. [should lookup order status via chat and return accurate information](#should-lookup-order-status-via-chat-and-return-accurate-information)
95. [should handle order lookup for processing orders](#should-handle-order-lookup-for-processing-orders)
96. [should handle invalid order numbers gracefully](#should-handle-invalid-order-numbers-gracefully)
97. [should handle multiple order lookups in same conversation](#should-handle-multiple-order-lookups-in-same-conversation)
98. [should provide order modification options](#should-provide-order-modification-options)
99. [should handle orders without tracking numbers](#should-handle-orders-without-tracking-numbers)
100. [should monitor live chat and complete agent takeover](#should-monitor-live-chat-and-complete-agent-takeover)
101. [should show waiting chats requiring agent attention](#should-show-waiting-chats-requiring-agent-attention)
102. [should complete full conversations management flow with export](#should-complete-full-conversations-management-flow-with-export)
103. [should filter conversations by date range](#should-filter-conversations-by-date-range)
104. [should handle empty search results gracefully](#should-handle-empty-search-results-gracefully)
105. [should allow bulk operations on conversations](#should-allow-bulk-operations-on-conversations)
106. [should show conversation analytics](#should-show-conversation-analytics)
107. [should track complete cart journey with analytics](#should-track-complete-cart-journey-with-analytics)
108. [should track session metrics accurately](#should-track-session-metrics-accurately)
109. [should retrieve domain-level analytics](#should-retrieve-domain-level-analytics)
110. [should identify abandoned carts](#should-identify-abandoned-carts)
111. [should filter analytics by date range](#should-filter-analytics-by-date-range)
112. [should handle API errors gracefully](#should-handle-api-errors-gracefully)
113. [should support platform filtering (WooCommerce vs Shopify)](#should-support-platform-filtering-woocommerce-vs-shopify)
114. [should track both successful and failed operations](#should-track-both-successful-and-failed-operations)
115. [should retrieve analytics quickly (< 1 second)](#should-retrieve-analytics-quickly-1-second)
116. [should restore abandoned cart when customer returns](#should-restore-abandoned-cart-when-customer-returns)
117. [should track cart abandonment analytics](#should-track-cart-abandonment-analytics)
118. [should send abandonment email reminder](#should-send-abandonment-email-reminder)
119. [should handle expired cart sessions](#should-handle-expired-cart-sessions)
120. [should merge guest and authenticated user carts](#should-merge-guest-and-authenticated-user-carts)
121. [should handle out-of-stock items in restored cart](#should-handle-out-of-stock-items-in-restored-cart)
122. [delete items with persistence verification](#delete-items-with-persistence-verification)
123. [delete multiple items sequentially](#delete-multiple-items-sequentially)
124. [delete items while processing](#delete-items-while-processing)
125. [list integrity after deletion](#list-integrity-after-deletion)
126. [empty state when all items deleted](#empty-state-when-all-items-deleted)
127. [delete confirmation dialog](#delete-confirmation-dialog)
128. [user uploads Q&A pairs for FAQ training](#user-uploads-q-a-pairs-for-faq-training)
129. [Q&A with long answers](#q-a-with-long-answers)
130. [incomplete Q&A validation](#incomplete-q-a-validation)
131. [multiple Q&A pairs](#multiple-q-a-pairs)
132. [Q&A with special characters](#q-a-with-special-characters)
133. [user uploads text and generates embeddings](#user-uploads-text-and-generates-embeddings)
134. [short text (< 200 chars)](#short-text-200-chars)
135. [long text (> 200 chars, truncated preview)](#long-text-200-chars-truncated-preview)
136. [empty text validation](#empty-text-validation)
137. [multiple text submissions](#multiple-text-submissions)
138. [user uploads URL and processes to completion](#user-uploads-url-and-processes-to-completion)
139. [URL normalization (auto-adds https://)](#url-normalization-auto-adds-https)
140. [scraping failure handling](#scraping-failure-handling)
141. [multiple URL submissions](#multiple-url-submissions)
142. [live preview updates in real-time](#live-preview-updates-in-real-time)
143. [reset button restores default settings](#reset-button-restores-default-settings)
144. [tab navigation works correctly](#tab-navigation-works-correctly)
145. [advanced color customization works](#advanced-color-customization-works)
146. [handles save errors gracefully](#handles-save-errors-gracefully)
147. [supports keyboard navigation](#supports-keyboard-navigation)
148. [appearance → behavior → save → persist](#appearance-behavior-save-persist)
149. [verify file naming convention for all formats](#verify-file-naming-convention-for-all-formats)
150. [PDF export with 90-day range](#pdf-export-with-90-day-range)
151. [Excel export validation](#excel-export-validation)
152. [export with empty data: handle gracefully](#export-with-empty-data-handle-gracefully)
153. [export with user authentication and permissions](#export-with-user-authentication-and-permissions)
154. [handle invalid export format gracefully](#handle-invalid-export-format-gracefully)
155. [handle missing query parameters](#handle-missing-query-parameters)
156. [handle request timeout gracefully](#handle-request-timeout-gracefully)
157. [complete export workflow: UI suggestion for missing buttons](#complete-export-workflow-ui-suggestion-for-missing-buttons)
158. [export performance: large dataset handling](#export-performance-large-dataset-handling)
159. [sequential export downloads: verify file independence](#sequential-export-downloads-verify-file-independence)
160. [export with custom time ranges](#export-with-custom-time-ranges)
161. [verify JSON analytics data structure](#verify-json-analytics-data-structure)
162. [export with date range filter applied](#export-with-date-range-filter-applied)
163. [validate CSV data accuracy and formatting](#validate-csv-data-accuracy-and-formatting)
164. [verify API endpoint responses](#verify-api-endpoint-responses)
165. [export analytics as CSV: click → download → verify](#export-analytics-as-csv-click-download-verify)
166. [verify CSV file structure and headers](#verify-csv-file-structure-and-headers)
167. [CSV export with 30-day range](#csv-export-with-30-day-range)
168. [English to Spanish translation](#english-to-spanish-translation)
169. [UI updates immediately on language change](#ui-updates-immediately-on-language-change)
170. [RTL languages display correctly (Arabic)](#rtl-languages-display-correctly-arabic)
171. [Hebrew (RTL) text rendering](#hebrew-rtl-text-rendering)
172. [RTL layout persists across language changes](#rtl-layout-persists-across-language-changes)
173. [locale preference persists in localStorage](#locale-preference-persists-in-localstorage)
174. [multiple locales can be switched](#multiple-locales-can-be-switched)
175. [invalid locale handled gracefully](#invalid-locale-handled-gracefully)
176. [language switching preserves conversation history](#language-switching-preserves-conversation-history)
177. [language persists after page reload](#language-persists-after-page-reload)
178. [rapid language switches handled correctly](#rapid-language-switches-handled-correctly)
179. [browser locale auto-detection](#browser-locale-auto-detection)
180. [complete language workflow: English → Spanish → Arabic (RTL)](#complete-language-workflow-english-spanish-arabic-rtl)
181. [abandoned conversation → detection → schedule → send](#abandoned-conversation-detection-schedule-send)
182. [sends high-priority low-satisfaction follow-up](#sends-high-priority-low-satisfaction-follow-up)
183. [respects follow-up attempt limits](#respects-follow-up-attempt-limits)
184. [supports multiple scheduling windows](#supports-multiple-scheduling-windows)
185. [handles email vs in-app channel routing](#handles-email-vs-in-app-channel-routing)
186. [should track add-to-cart operation with full analytics](#should-track-add-to-cart-operation-with-full-analytics)
187. [should track multi-step cart journey with session continuity](#should-track-multi-step-cart-journey-with-session-continuity)
188. [should calculate accurate session duration](#should-calculate-accurate-session-duration)
189. [should track operation failures with error messages](#should-track-operation-failures-with-error-messages)
190. [should support analytics aggregation by platform](#should-support-analytics-aggregation-by-platform)
191. [pending follow-up cancelled when user returns](#pending-follow-up-cancelled-when-user-returns)
192. [tracks response metrics across channels](#tracks-response-metrics-across-channels)

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

## 22. user discovers products and adds to cart via mobile shopping feed

**Source:** [`__tests__/playwright/shopping/mobile-shopping-experience.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-experience.spec.ts)

**Description:**
E2E Test: Product Discovery to Add-to-Cart
Tests the COMPLETE journey from chat query to adding product to cart.
This validates the core mobile shopping workflow end-to-end.
User Journey:
1. Open chat widget on mobile viewport
2. Send product search query
3. Chat transforms to shopping feed
4. Swipe through product cards
5. Tap product to expand details
6. Select variants (size, color)
7. Double-tap to add to cart
8. Verify cart indicator appears
9. Verify analytics tracked
Success Indicators:
- ✅ Shopping feed displays with products
- ✅ Swipe navigation works smoothly
- ✅ Product details expand on tap
- ✅ Double-tap adds item to cart
- ✅ Cart badge shows correct count
- ✅ Analytics event fired
This test teaches AI agents:
- How to trigger shopping mode
- Product card interaction patterns
- Variant selection flow
- Cart operations
/

**Total Steps:** 19

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport and enable touch features |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for chat widget iframe |
| 5 | log |  |  | 📍 Step 4: Setup shopping API mock with product data |
| 6 | log |  |  | 📍 Step 5: Send product search query |
| 7 | log |  |  | 📍 Step 6: Wait for chat → shopping feed transition |
| 8 | log |  |  | 📍 Step 7: Verify product cards loaded |
| 9 | log |  |  | 📍 Step 8: Swipe down to view next product |
| 10 | wait | `1000` |  |  |
| 11 | log |  |  | 📍 Step 9: Tap product card to expand details |
| 12 | log |  |  | 📍 Step 10: Select product variant (Color: White) |
| 13 | log |  |  | 📍 Step 11: Double-tap product to add to cart |
| 14 | wait | `1000` |  |  |
| 15 | log |  |  | 📍 Step 12: Verify cart indicator shows item count |
| 16 | log |  |  | 📍 Step 13: Verify analytics event for add-to-cart |
| 17 | wait | `500` |  |  |
| 18 | log |  |  | 📍 Step 14: Capture success screenshot |
| 19 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 92
console.log('📍 Step 1: Set mobile viewport and enable touch features');

// Line 100
console.log('📍 Step 2: Navigate to widget test page');

// Line 101
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 107
console.log('📍 Step 3: Wait for chat widget iframe');

// Line 114
console.log('📍 Step 4: Setup shopping API mock with product data');

// Line 121
console.log('📍 Step 5: Send product search query');

// Line 128
console.log('📍 Step 6: Wait for chat → shopping feed transition');

// Line 136
console.log('📍 Step 7: Verify product cards loaded');

// Line 144
console.log('📍 Step 8: Swipe down to view next product');

// Line 148
await page.waitForTimeout(1000);

// ... 9 more steps ...
```

---

## 23. swipe navigation and gestures work smoothly

**Source:** [`__tests__/playwright/shopping/mobile-shopping-experience.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-experience.spec.ts)

**Description:**
E2E Test: Swipe Navigation & Gestures
Tests all swipe gestures in the shopping feed:
- Vertical swipe: Navigate between products
- Horizontal swipe: Exit shopping mode
- Double-tap: Quick add to cart
- Smooth animations: 60fps performance
User Journey:
1. Enter shopping mode
2. Swipe down through 3 products
3. Swipe up to go back
4. Swipe right to exit
5. Verify smooth animations
Success Indicators:
- ✅ Vertical swipes navigate products
- ✅ Horizontal swipe exits shopping
- ✅ Animations run at 60fps
- ✅ Gestures feel natural
/

**Total Steps:** 13

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Setup mobile environment |
| 2 | log |  |  | 📍 Step 2: Load widget and trigger shopping mode |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for shopping feed |
| 5 | log |  |  | 📍 Step 4: Test vertical swipe down |
| 6 | wait | `1000` |  |  |
| 7 | log |  |  | 📍 Step 5: Swipe down again (product 3) |
| 8 | wait | `1000` |  |  |
| 9 | log |  |  | 📍 Step 6: Test vertical swipe up |
| 10 | wait | `1000` |  |  |
| 11 | log |  |  | 📍 Step 7: Measure animation performance |
| 12 | log |  |  | 📍 Step 8: Test horizontal swipe to exit shopping |
| 13 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 261
console.log('📍 Step 1: Setup mobile environment');

// Line 265
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 266
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 271
console.log('📍 Step 3: Wait for shopping feed');

// Line 278
console.log('📍 Step 4: Test vertical swipe down');

// Line 280
await page.waitForTimeout(1000);

// Line 286
console.log('📍 Step 5: Swipe down again (product 3)');

// Line 288
await page.waitForTimeout(1000);

// Line 294
console.log('📍 Step 6: Test vertical swipe up');

// Line 296
await page.waitForTimeout(1000);

// ... 3 more steps ...
```

---

## 24. product detail expansion and interaction

**Source:** [`__tests__/playwright/shopping/mobile-shopping-experience.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-experience.spec.ts)

**Description:**
E2E Test: Product Detail Expansion
Tests product detail view functionality:
- Tap to expand product details
- Image gallery horizontal scroll
- Variant selection
- Collapse on tap outside
User Journey:
1. Enter shopping mode
2. Tap product to expand
3. Scroll image gallery
4. Select variants
5. Tap outside to collapse
Success Indicators:
- ✅ Details expand smoothly
- ✅ Image gallery scrollable
- ✅ Variants selectable
- ✅ Collapse on outside tap
/

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Setup mobile environment |
| 2 | log |  |  | 📍 Step 2: Load widget and trigger shopping mode |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for shopping feed |
| 5 | log |  |  | 📍 Step 4: Tap product card to expand details |
| 6 | log |  |  | 📍 Step 5: Test image gallery horizontal scroll |
| 7 | wait | `500` |  |  |
| 8 | log |  |  | 📍 Step 6: Test variant selection |
| 9 | log |  |  | 📍 Step 7: Tap outside to collapse details |
| 10 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 351
console.log('📍 Step 1: Setup mobile environment');

// Line 355
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 356
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 361
console.log('📍 Step 3: Wait for shopping feed');

// Line 367
console.log('📍 Step 4: Tap product card to expand details');

// Line 376
console.log('📍 Step 5: Test image gallery horizontal scroll');

// Line 384
await page.waitForTimeout(500);

// Line 394
console.log('📍 Step 6: Test variant selection');

// Line 410
console.log('📍 Step 7: Tap outside to collapse details');

// Line 412
await page.waitForTimeout(1000);

```

---

## 25. cart operations and state management

**Source:** [`__tests__/playwright/shopping/mobile-shopping-experience.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-experience.spec.ts)

**Description:**
E2E Test: Cart Operations
Tests cart functionality:
- Add multiple items
- Cart badge updates
- Cart badge animations
- View cart action
User Journey:
1. Add first product to cart
2. Add second product to cart
3. Verify cart shows count: 2
4. Tap cart to view
5. Verify cart contents
Success Indicators:
- ✅ Cart badge appears after first add
- ✅ Cart count increments correctly
- ✅ Badge animates on update
- ✅ Cart view accessible
/

**Total Steps:** 15

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Setup mobile environment |
| 2 | log |  |  | 📍 Step 2: Load widget and trigger shopping mode |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for shopping feed |
| 5 | log |  |  | 📍 Step 4: Add first product to cart (double-tap) |
| 6 | wait | `1000` |  |  |
| 7 | log |  |  | 📍 Step 5: Verify cart badge shows count: 1 |
| 8 | log |  |  | 📍 Step 6: Swipe to next product |
| 9 | wait | `1000` |  |  |
| 10 | log |  |  | 📍 Step 7: Add second product to cart (double-tap) |
| 11 | wait | `1000` |  |  |
| 12 | log |  |  | 📍 Step 8: Verify cart badge shows count: 2 |
| 13 | log |  |  | 📍 Step 9: Tap cart badge to view cart contents |
| 14 | click |  |  |  |
| 15 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 452
console.log('📍 Step 1: Setup mobile environment');

// Line 456
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 457
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 462
console.log('📍 Step 3: Wait for shopping feed');

// Line 468
console.log('📍 Step 4: Add first product to cart (double-tap)');

// Line 475
await page.waitForTimeout(1000);

// Line 482
console.log('📍 Step 5: Verify cart badge shows count: 1');

// Line 490
console.log('📍 Step 6: Swipe to next product');

// Line 492
await page.waitForTimeout(1000);

// Line 494
console.log('📍 Step 7: Add second product to cart (double-tap)');

// ... 5 more steps ...
```

---

## 26. accessibility and performance standards

**Source:** [`__tests__/playwright/shopping/mobile-shopping-experience.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-experience.spec.ts)

**Description:**
E2E Test: Accessibility & Performance
Tests accessibility and performance standards:
- Touch target sizes (iOS: 44x44px minimum)
- Animation performance (60fps)
- Screen reader compatibility
- High contrast mode
User Journey:
1. Enter shopping mode
2. Verify touch targets meet iOS standards
3. Measure animation FPS
4. Test with high contrast mode
5. Verify ARIA labels
Success Indicators:
- ✅ All touch targets ≥44x44px
- ✅ Animations run at ≥55fps
- ✅ ARIA labels present
- ✅ High contrast readable
/

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Setup mobile environment |
| 2 | log |  |  | 📍 Step 2: Load widget and trigger shopping mode |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for shopping feed |
| 5 | log |  |  | 📍 Step 4: Verify touch target sizes |
| 6 | log |  |  | 📍 Step 5: Test animation performance during swipe |
| 7 | log |  |  | 📍 Step 6: Verify ARIA labels for accessibility |
| 8 | log |  |  | 📍 Step 7: Verify viewport is mobile |

**Code Reference:**

```typescript
// Line 565
console.log('📍 Step 1: Setup mobile environment');

// Line 569
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 570
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 575
console.log('📍 Step 3: Wait for shopping feed');

// Line 581
console.log('📍 Step 4: Verify touch target sizes');

// Line 611
console.log('📍 Step 5: Test animation performance during swipe');

// Line 623
console.log('📍 Step 6: Verify ARIA labels for accessibility');

// Line 636
console.log('📍 Step 7: Verify viewport is mobile');

```

---

## 27. should complete scraping and make content searchable in chat

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

## 28. should handle scraping errors gracefully

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

## 29. should show progress during long scraping jobs

**Source:** [`__tests__/playwright/scraping/scraping-flow.spec.ts`](/__tests__/playwright/scraping/scraping-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 30. complete recommendation workflow: chat → recommendations → click → purchase tracking

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

## 31. recommendation algorithms display correctly

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

## 32. empty state when no recommendations available

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

## 33. click tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 34. purchase tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 35. recommendation API returns valid data

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 36. invalid API requests return proper errors

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 37. should complete WooCommerce setup and enable product search

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

## 38. should handle WooCommerce connection errors gracefully

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

## 39. should maintain cart session across messages

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |

**Code Reference:**

```typescript
// Line 155
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

```

---

## 40. should handle Store API failures gracefully

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 41. should enforce rate limits and allow retry after cooldown

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

## 42. should handle payment failure and allow retry with cart preserved

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

## 43. should handle network timeout and allow successful retry

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

## 44. should handle invalid WooCommerce credentials and allow correction

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

## 45. should detect concurrent edits and provide conflict resolution

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
// Line 32
console.log('📍 Step 1: Navigating to dashboard');

// Line 33
await page.goto(BASE_URL + '/dashboard', { waitUntil: 'networkidle' });

// Line 37
console.log('📍 Step 2: Navigating to domain settings');

// Line 42
await domainsLink.click();

// Line 46
await page.goto(BASE_URL + '/dashboard/domains', { waitUntil: 'networkidle' });

// Line 51
console.log('📍 Step 3: Selecting domain to edit');

// Line 56
await domainItem.click();

// Line 60
await page.goto(BASE_URL + '/dashboard/domains/test-domain-123/settings', { waitUntil: 'networkidle' });

// Line 64
console.log('📍 Step 4: Setting up concurrent edit simulation');

// Line 68
console.log('📍 Step 5: Editing domain settings (User A)');

// ... 18 more steps ...
```

---

## 46. should prevent concurrent scraping and allow retry after completion

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

## 47. should install and customize widget successfully

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

## 48. should generate correct embed code for different environments

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

## 49. should handle widget customization with invalid values

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 50. should add and configure domain successfully

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

## 51. should handle domain editing

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 52. should handle domain deletion/disabling

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 53. should enforce domain access control

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 54. complete search workflow: search → results → view conversation with highlight

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
// Line 73
console.log('📍 Step 3: Entering search query for "hydraulic pump"');

// Line 82
await page.waitForTimeout(1000);

// Line 87
console.log('📍 Step 4: Verifying search results display');

// Line 97
console.log('📍 Step 5: Clicking on first search result to view conversation');

// Line 101
await page.waitForTimeout(2000);

// Line 104
console.log('📍 Step 6: Verifying conversation details loaded');

// Line 113
await page.screenshot({
        path: `test-results/search-result-success-${Date.now()}.png`,
        fullPage: true
      });

```

---

## 55. search with advanced filters: date range and status filtering

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Entering search term "order" |
| 2 | fill | `order` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | log |  |  | 📍 Step 2: Opening advanced filters |
| 5 | log |  |  | 📍 Step 3: Applying date range filter for last 7 days |
| 6 | log |  |  | 📍 Step 4: Applying status filter for "resolved" conversations |
| 7 | log |  |  | 📍 Step 5: Submitting filters |

**Code Reference:**

```typescript
// Line 134
console.log('📍 Step 1: Entering search term "order"');

// Line 142
await searchInput.fill('order');

// Line 143
await page.waitForTimeout(1000);

// Line 145
console.log('📍 Step 2: Opening advanced filters');

// Line 149
console.log('📍 Step 3: Applying date range filter for last 7 days');

// Line 152
console.log('📍 Step 4: Applying status filter for "resolved" conversations');

// Line 155
console.log('📍 Step 5: Submitting filters');

```

---

## 56. handles empty search results gracefully

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
// Line 167
console.log('📍 Step 1: Entering search query with no expected results');

// Line 175
await searchInput.fill('xyzabc123nonexistentquery999');

// Line 176
await page.waitForTimeout(2000);

// Line 178
console.log('📍 Step 2: Checking for empty state message');

// Line 193
console.log('📍 Step 3: Clearing search to restore all conversations');

// Line 195
await page.waitForTimeout(2000);

```

---

## 57. search with special characters and edge cases

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 58. keyboard navigation and shortcuts in search

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `customer inquiry` |  |  |
| 2 | wait | `1500` |  |  |

**Code Reference:**

```typescript
// Line 222
await page.keyboard.type('customer inquiry');

// Line 223
await page.waitForTimeout(1500);

```

---

## 59. search result persistence and back navigation

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | fill | `support ticket` |  |  |
| 2 | wait | `2000` |  |  |
| 3 | click |  |  |  |
| 4 | wait | `2000` |  |  |
| 5 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 242
await searchInput.fill('support ticket');

// Line 243
await page.waitForTimeout(2000);

// Line 247
await conversations.first().click();

// Line 248
await page.waitForTimeout(2000);

// Line 251
await page.waitForTimeout(2000);

```

---

## 60. CSV export endpoint: verify availability and response

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

## 61. JSON analytics endpoint: verify data structure

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

## 62. Export formats: test all supported formats

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 63. Date range parameters: test different time periods

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 64. Error handling: test invalid parameters

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

## 65. Export workflow documentation for AI agents

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 66. should complete demo flow from URL entry to AI chat response

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

## 67. should handle invalid URLs gracefully

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

## 68. should enforce demo session limits

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 69. should show upgrade prompt after demo limits reached

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 70. should complete full purchase flow from chat to order confirmation

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

## 71. should handle purchase flow with guest checkout

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 72. should handle purchase flow with registered user

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 73. should maintain context across multiple conversation turns

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

## 74. should handle conversation with context reset

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 75. should handle very long conversations

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 76. should handle ambiguous pronouns

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 77. should complete full team invitation flow for viewer role

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

## 78. should handle editor role with correct permissions

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 79. should show team members list with correct roles

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 80. should allow admin to revoke member access

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 81. should handle expired invitation tokens

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 82. should complete Shopify setup and track purchases

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

## 83. should handle Shopify connection errors

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

## 84. should sync product inventory updates

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 85. should handle product out of stock scenarios

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 86. should track Shopify order fulfillment

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 87. should handle Shopify webhooks

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 88. should display real-time metrics and update without refresh

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

## 89. should handle connection interruptions gracefully

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

## 90. should show historical trend alongside real-time data

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 91. should filter real-time events by type

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 92. should export real-time data snapshot

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 93. should handle high-frequency updates efficiently

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 94. should lookup order status via chat and return accurate information

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

## 95. should handle order lookup for processing orders

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

## 96. should handle invalid order numbers gracefully

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

## 97. should handle multiple order lookups in same conversation

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 98. should provide order modification options

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 99. should handle orders without tracking numbers

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 100. should monitor live chat and complete agent takeover

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

## 101. should show waiting chats requiring agent attention

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

## 102. should complete full conversations management flow with export

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

## 103. should filter conversations by date range

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

## 104. should handle empty search results gracefully

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 105. should allow bulk operations on conversations

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 106. should show conversation analytics

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 107. should track complete cart journey with analytics

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 13

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to chat widget |
| 2 | navigate | `/widget-test` |  |  |
| 3 | wait | `iframe#chat-widget-iframe` |  |  |
| 4 | log |  |  | 📍 Step 2: Open chat widget |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 3: Search for products |
| 7 | fill | `Show me hydraulic pumps` |  |  |
| 8 | click |  |  |  |
| 9 | wait | `2000` |  |  |
| 10 | log |  |  | 📍 Step 4: Add product to cart |
| 11 | click |  |  |  |
| 12 | wait | `1000` |  |  |
| 13 | log |  |  | 📍 Step 5: Verify cart operation was tracked |

**Code Reference:**

```typescript
// Line 22
console.log('📍 Step 1: Navigate to chat widget');

// Line 23
await page.goto('/widget-test');

// Line 26
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 29
console.log('📍 Step 2: Open chat widget');

// Line 30
await iframe.locator('button:has-text("Chat"), .chat-trigger').click();

// Line 32
console.log('📍 Step 3: Search for products');

// Line 33
await iframe.locator('input[placeholder*="message"], textarea').fill('Show me hydraulic pumps');

// Line 34
await iframe.locator('button[type="submit"], button:has-text("Send")').click();

// Line 37
await page.waitForTimeout(2000);

// Line 39
console.log('📍 Step 4: Add product to cart');

// ... 3 more steps ...
```

---

## 108. should track session metrics accurately

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Simulate multiple cart operations |
| 2 | log |  |  | 📍 Step 3: Retrieve session metrics |

**Code Reference:**

```typescript
// Line 74
console.log('📍 Step 1: Simulate multiple cart operations');

// Line 95
console.log('📍 Step 3: Retrieve session metrics');

```

---

## 109. should retrieve domain-level analytics

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Fetch daily analytics for domain |

**Code Reference:**

```typescript
// Line 122
console.log('📍 Step 1: Fetch daily analytics for domain');

```

---

## 110. should identify abandoned carts

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Fetch abandoned carts for domain |

**Code Reference:**

```typescript
// Line 155
console.log('📍 Step 1: Fetch abandoned carts for domain');

```

---

## 111. should filter analytics by date range

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Test date range filtering |

**Code Reference:**

```typescript
// Line 185
console.log('📍 Step 1: Test date range filtering');

```

---

## 112. should handle API errors gracefully

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Test missing domain parameter |
| 2 | log |  |  | 📍 Step 2: Test missing sessionId parameter |
| 3 | log |  |  | 📍 Step 3: Test non-existent session |

**Code Reference:**

```typescript
// Line 214
console.log('📍 Step 1: Test missing domain parameter');

// Line 222
console.log('📍 Step 2: Test missing sessionId parameter');

// Line 230
console.log('📍 Step 3: Test non-existent session');

```

---

## 113. should support platform filtering (WooCommerce vs Shopify)

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Fetch analytics for domain |

**Code Reference:**

```typescript
// Line 240
console.log('📍 Step 1: Fetch analytics for domain');

```

---

## 114. should track both successful and failed operations

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Retrieve recent operations |

**Code Reference:**

```typescript
// Line 265
console.log('📍 Step 1: Retrieve recent operations');

```

---

## 115. should retrieve analytics quickly (< 1 second)

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 116. should restore abandoned cart when customer returns

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

## 117. should track cart abandonment analytics

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 118. should send abandonment email reminder

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 119. should handle expired cart sessions

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 120. should merge guest and authenticated user carts

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 121. should handle out-of-stock items in restored cart

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 122. delete items with persistence verification

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create test item |
| 2 | log |  |  | 📍 Step 2: Delete the item |
| 3 | log |  |  | 📍 Step 3: Verify item is removed from list |
| 4 | log |  |  | 📍 Step 4: Reload page to verify deletion persists |
| 5 | log |  |  | 📍 Step 5: Confirm item is still not in list after reload |

**Code Reference:**

```typescript
// Line 48
console.log('📍 Step 1: Create test item');

// Line 52
console.log('📍 Step 2: Delete the item');

// Line 55
console.log('📍 Step 3: Verify item is removed from list');

// Line 58
console.log('📍 Step 4: Reload page to verify deletion persists');

// Line 61
console.log('📍 Step 5: Confirm item is still not in list after reload');

```

---

## 123. delete multiple items sequentially

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create multiple test items |
| 2 | wait | `500` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify all items appear |
| 4 | log |  |  | 📍 Step 3: Delete items one by one |
| 5 | wait | `500` |  |  |
| 6 | log |  |  | 📍 Step 4: Verify all items are deleted |

**Code Reference:**

```typescript
// Line 77
console.log('📍 Step 1: Create multiple test items');

// Line 80
await page.waitForTimeout(500);

// Line 83
console.log('📍 Step 2: Verify all items appear');

// Line 91
console.log('📍 Step 3: Delete items one by one');

// Line 94
await page.waitForTimeout(500);

// Line 97
console.log('📍 Step 4: Verify all items are deleted');

```

---

## 124. delete items while processing

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create item that will be processing |
| 2 | log |  |  | 📍 Step 2: Delete item immediately (may still be processing) |
| 3 | wait | `1000` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify item is removed from list |
| 5 | log |  |  | 📍 Step 4: Verify no orphaned data after reload |

**Code Reference:**

```typescript
// Line 115
console.log('📍 Step 1: Create item that will be processing');

// Line 119
console.log('📍 Step 2: Delete item immediately (may still be processing)');

// Line 121
await page.waitForTimeout(1000);

// Line 124
console.log('📍 Step 3: Verify item is removed from list');

// Line 127
console.log('📍 Step 4: Verify no orphaned data after reload');

```

---

## 125. list integrity after deletion

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create items to keep and one to delete |
| 2 | wait | `500` |  |  |
| 3 | wait | `500` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify all items appear |
| 5 | log |  |  | 📍 Step 3: Delete one item |
| 6 | log |  |  | 📍 Step 4: Verify deleted item is gone |
| 7 | log |  |  | 📍 Step 5: Verify other items remain intact |

**Code Reference:**

```typescript
// Line 144
console.log('📍 Step 1: Create items to keep and one to delete');

// Line 147
await page.waitForTimeout(500);

// Line 150
await page.waitForTimeout(500);

// Line 152
console.log('📍 Step 2: Verify all items appear');

// Line 161
console.log('📍 Step 3: Delete one item');

// Line 164
console.log('📍 Step 4: Verify deleted item is gone');

// Line 167
console.log('📍 Step 5: Verify other items remain intact');

```

---

## 126. empty state when all items deleted

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Check if any items exist |
| 2 | log |  |  | 📍 Step 2: Create some test items to delete |
| 3 | wait | `500` |  |  |
| 4 | log |  |  | 📍 Step 3: Delete all items |
| 5 | click |  |  |  |
| 6 | click |  |  |  |
| 7 | wait | `1000` |  |  |
| 8 | log |  |  | 📍 Step 4: Verify empty state is displayed |
| 9 | log |  |  | 📍 Step 5: Verify item count is 0 |

**Code Reference:**

```typescript
// Line 184
console.log('📍 Step 1: Check if any items exist');

// Line 189
console.log('📍 Step 2: Create some test items to delete');

// Line 197
await page.waitForTimeout(500);

// Line 204
console.log('📍 Step 3: Delete all items');

// Line 217
await deleteButton.click();

// Line 221
await confirmButton.click();

// Line 224
await page.waitForTimeout(1000);

// Line 227
console.log('📍 Step 4: Verify empty state is displayed');

// Line 230
console.log('📍 Step 5: Verify item count is 0');

```

---

## 127. delete confirmation dialog

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 13

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create test item |
| 2 | log |  |  | 📍 Step 2: Click delete button |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Check if confirmation dialog appears |
| 5 | log |  |  | 📍 Step 4: Click cancel |
| 6 | click |  |  |  |
| 7 | wait | `1000` |  |  |
| 8 | log |  |  | 📍 Step 5: Verify item is still in list |
| 9 | log |  |  | 📍 Step 6: Delete again and confirm |
| 10 | click |  |  |  |
| 11 | click |  |  |  |
| 12 | click |  |  |  |
| 13 | log |  |  | 📍 Step 7: Verify item is deleted |

**Code Reference:**

```typescript
// Line 243
console.log('📍 Step 1: Create test item');

// Line 247
console.log('📍 Step 2: Click delete button');

// Line 250
await deleteButton.click();

// Line 252
console.log('📍 Step 3: Check if confirmation dialog appears');

// Line 261
console.log('📍 Step 4: Click cancel');

// Line 263
await cancelButton.click();

// Line 264
await page.waitForTimeout(1000);

// Line 266
console.log('📍 Step 5: Verify item is still in list');

// Line 270
console.log('📍 Step 6: Delete again and confirm');

// Line 271
await deleteButton.click();

// ... 3 more steps ...
```

---

## 128. user uploads Q&A pairs for FAQ training

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload Q&A pair |
| 2 | log |  |  | 📍 Step 2: Verify Q&A appears in list |
| 3 | log |  |  | 📍 Step 3: Wait for embedding generation to complete |

**Code Reference:**

```typescript
// Line 46
console.log('📍 Step 1: Upload Q&A pair');

// Line 49
console.log('📍 Step 2: Verify Q&A appears in list');

// Line 53
console.log('📍 Step 3: Wait for embedding generation to complete');

```

---

## 129. Q&A with long answers

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 2: Verify Q&A appears in list |
| 2 | log |  |  | 📍 Step 3: Verify answer is stored (not truncated in backend) |

**Code Reference:**

```typescript
// Line 69
console.log('📍 Step 2: Verify Q&A appears in list');

// Line 72
console.log('📍 Step 3: Verify answer is stored (not truncated in backend)');

```

---

## 130. incomplete Q&A validation

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Switch to Q&A tab |
| 2 | log |  |  | 📍 Step 2: Try to submit with only question (no answer) |
| 3 | fill | `Test question without answer?` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify validation prevents submission |
| 5 | click |  |  |  |
| 6 | wait | `1000` |  |  |
| 7 | log |  |  | 📍 Step 4: Try to submit with only answer (no question) |
| 8 | fill | `Test answer without question.` |  |  |
| 9 | click |  |  |  |
| 10 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 84
console.log('📍 Step 1: Switch to Q&A tab');

// Line 87
console.log('📍 Step 2: Try to submit with only question (no answer)');

// Line 91
await questionInput.fill('Test question without answer?');

// Line 99
console.log('📍 Step 3: Verify validation prevents submission');

// Line 106
await submitButton.click();

// Line 107
await page.waitForTimeout(1000);

// Line 119
console.log('📍 Step 4: Try to submit with only answer (no question)');

// Line 121
await answerInput.fill('Test answer without question.');

// Line 128
await submitButton.click();

// Line 129
await page.waitForTimeout(1000);

```

---

## 131. multiple Q&A pairs

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit multiple Q&A pairs |
| 2 | wait | `1000` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify all Q&A pairs appear in list |
| 4 | log |  |  | 📍 Step 3: Verify list contains at least 3 items |

**Code Reference:**

```typescript
// Line 162
console.log('📍 Step 1: Submit multiple Q&A pairs');

// Line 165
await page.waitForTimeout(1000);

// Line 168
console.log('📍 Step 2: Verify all Q&A pairs appear in list');

// Line 174
console.log('📍 Step 3: Verify list contains at least 3 items');

```

---

## 132. Q&A with special characters

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload Q&A with special characters |
| 2 | log |  |  | 📍 Step 2: Verify Q&A appears in list with special chars intact |
| 3 | log |  |  | 📍 Step 3: Verify special characters are properly encoded |

**Code Reference:**

```typescript
// Line 189
console.log('📍 Step 1: Upload Q&A with special characters');

// Line 192
console.log('📍 Step 2: Verify Q&A appears in list with special chars intact');

// Line 195
console.log('📍 Step 3: Verify special characters are properly encoded');

```

---

## 133. user uploads text and generates embeddings

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload text content |
| 2 | log |  |  | 📍 Step 2: Verify text appears in list |
| 3 | log |  |  | 📍 Step 3: Wait for embedding generation to complete |

**Code Reference:**

```typescript
// Line 45
console.log('📍 Step 1: Upload text content');

// Line 48
console.log('📍 Step 2: Verify text appears in list');

// Line 51
console.log('📍 Step 3: Wait for embedding generation to complete');

```

---

## 134. short text (< 200 chars)

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload short text |
| 2 | log |  |  | 📍 Step 2: Verify text appears in full (not truncated) |

**Code Reference:**

```typescript
// Line 62
console.log('📍 Step 1: Upload short text');

// Line 65
console.log('📍 Step 2: Verify text appears in full (not truncated)');

```

---

## 135. long text (> 200 chars, truncated preview)

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 2: Verify text appears with preview |
| 2 | log |  |  | 📍 Step 3: Verify truncation indicator |

**Code Reference:**

```typescript
// Line 84
console.log('📍 Step 2: Verify text appears with preview');

// Line 89
console.log('📍 Step 3: Verify truncation indicator');

```

---

## 136. empty text validation

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Switch to Text tab |
| 2 | log |  |  | 📍 Step 2: Try to submit empty text |
| 3 | log |  |  | 📍 Step 3: Verify submit button is disabled or shows validation error |
| 4 | click |  |  |  |
| 5 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 103
console.log('📍 Step 1: Switch to Text tab');

// Line 106
console.log('📍 Step 2: Try to submit empty text');

// Line 113
console.log('📍 Step 3: Verify submit button is disabled or shows validation error');

// Line 121
await submitButton.click();

// Line 122
await page.waitForTimeout(1000);

```

---

## 137. multiple text submissions

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit multiple text entries |
| 2 | wait | `1000` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify all texts appear in list |
| 4 | log |  |  | 📍 Step 3: Verify list contains at least 3 items |

**Code Reference:**

```typescript
// Line 148
console.log('📍 Step 1: Submit multiple text entries');

// Line 151
await page.waitForTimeout(1000);

// Line 154
console.log('📍 Step 2: Verify all texts appear in list');

// Line 160
console.log('📍 Step 3: Verify list contains at least 3 items');

```

---

## 138. user uploads URL and processes to completion

**Source:** [`__tests__/playwright/dashboard/training/01-upload-url.spec.ts`](/__tests__/playwright/dashboard/training/01-upload-url.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload URL without https:// |
| 2 | log |  |  | 📍 Step 2: Verify URL appears in list (normalized with https://) |
| 3 | log |  |  | 📍 Step 3: Wait for scraping to complete |

**Code Reference:**

```typescript
// Line 43
console.log('📍 Step 1: Upload URL without https://');

// Line 46
console.log('📍 Step 2: Verify URL appears in list (normalized with https://)');

// Line 49
console.log('📍 Step 3: Wait for scraping to complete');

```

---

## 139. URL normalization (auto-adds https://)

**Source:** [`__tests__/playwright/dashboard/training/01-upload-url.spec.ts`](/__tests__/playwright/dashboard/training/01-upload-url.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit URL without protocol |
| 2 | log |  |  | 📍 Step 2: Verify URL is normalized to https:// |

**Code Reference:**

```typescript
// Line 59
console.log('📍 Step 1: Submit URL without protocol');

// Line 62
console.log('📍 Step 2: Verify URL is normalized to https://');

```

---

## 140. scraping failure handling

**Source:** [`__tests__/playwright/dashboard/training/01-upload-url.spec.ts`](/__tests__/playwright/dashboard/training/01-upload-url.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit invalid URL |
| 2 | log |  |  | 📍 Step 2: Wait for item to appear |
| 3 | log |  |  | 📍 Step 3: Check for error state or removal |
| 4 | wait | `5000` |  |  |

**Code Reference:**

```typescript
// Line 78
console.log('📍 Step 1: Submit invalid URL');

// Line 81
console.log('📍 Step 2: Wait for item to appear');

// Line 84
console.log('📍 Step 3: Check for error state or removal');

// Line 86
await page.waitForTimeout(5000);

```

---

## 141. multiple URL submissions

**Source:** [`__tests__/playwright/dashboard/training/01-upload-url.spec.ts`](/__tests__/playwright/dashboard/training/01-upload-url.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit multiple URLs |
| 2 | wait | `1000` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify all URLs appear in list |
| 4 | log |  |  | 📍 Step 3: Verify list contains at least 3 items |

**Code Reference:**

```typescript
// Line 114
console.log('📍 Step 1: Submit multiple URLs');

// Line 117
await page.waitForTimeout(1000);

// Line 120
console.log('📍 Step 2: Verify all URLs appear in list');

// Line 127
console.log('📍 Step 3: Verify list contains at least 3 items');

```

---

## 142. live preview updates in real-time

**Source:** [`__tests__/playwright/dashboard/widget-customization/preview-and-reset.spec.ts`](/__tests__/playwright/dashboard/widget-customization/preview-and-reset.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Locate preview iframe |
| 2 | log |  |  | 📍 Step 2: Change primary color |
| 3 | log |  |  | 📍 Step 3: Verify preview updated immediately |
| 4 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 21
console.log('📍 Step 1: Locate preview iframe');

// Line 27
console.log('📍 Step 2: Change primary color');

// Line 32
console.log('📍 Step 3: Verify preview updated immediately');

// Line 33
await page.waitForTimeout(1000);

```

---

## 143. reset button restores default settings

**Source:** [`__tests__/playwright/dashboard/widget-customization/preview-and-reset.spec.ts`](/__tests__/playwright/dashboard/widget-customization/preview-and-reset.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Make changes to settings |
| 2 | fill | `TestBot` |  |  |
| 3 | log |  |  | 📍 Step 2: Click Reset button |
| 4 | click |  |  |  |
| 5 | wait | `1000` |  |  |
| 6 | log |  |  | 📍 Step 3: Verify settings restored to defaults |

**Code Reference:**

```typescript
// Line 62
console.log('📍 Step 1: Make changes to settings');

// Line 76
await botNameInput.fill('TestBot');

// Line 80
console.log('📍 Step 2: Click Reset button');

// Line 83
await resetButton.click();

// Line 85
await page.waitForTimeout(1000);

// Line 88
console.log('📍 Step 3: Verify settings restored to defaults');

```

---

## 144. tab navigation works correctly

**Source:** [`__tests__/playwright/dashboard/widget-customization/navigation.spec.ts`](/__tests__/playwright/dashboard/widget-customization/navigation.spec.ts)

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
// Line 21
console.log('📍 Step 1: Verify all tabs are present');

// Line 32
console.log('📍 Step 2: Navigate through all tabs');

// Line 39
await intelligenceTab.click();

// Line 40
await page.waitForTimeout(500);

// Line 51
await connectTab.click();

// Line 52
await page.waitForTimeout(500);

// Line 63
await essentialsTab.click();

// Line 64
await page.waitForTimeout(500);

```

---

## 145. advanced color customization works

**Source:** [`__tests__/playwright/dashboard/widget-customization/navigation.spec.ts`](/__tests__/playwright/dashboard/widget-customization/navigation.spec.ts)

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
// Line 75
console.log('📍 Step 1: Look for advanced color options');

// Line 83
await advancedButton.click();

// Line 87
console.log('📍 Step 2: Test multiple color inputs');

// Line 99
await headerColorInput.fill('#6366f1');

// Line 110
await buttonColorInput.fill('#f59e0b');

```

---

## 146. handles save errors gracefully

**Source:** [`__tests__/playwright/dashboard/widget-customization/error-handling.spec.ts`](/__tests__/playwright/dashboard/widget-customization/error-handling.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to customize page |
| 2 | navigate | `CUSTOMIZE_PAGE` |  |  |
| 3 | log |  |  | 📍 Step 2: Set up API error simulation |
| 4 | log |  |  | 📍 Step 3: Make changes and attempt save |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify error is handled gracefully |

**Code Reference:**

```typescript
// Line 16
console.log('📍 Step 1: Navigate to customize page');

// Line 17
await page.goto(CUSTOMIZE_PAGE, { waitUntil: 'networkidle' });

// Line 21
console.log('📍 Step 2: Set up API error simulation');

// Line 36
console.log('📍 Step 3: Make changes and attempt save');

// Line 41
await saveButton.click();

// Line 45
console.log('📍 Step 4: Verify error is handled gracefully');

```

---

## 147. supports keyboard navigation

**Source:** [`__tests__/playwright/dashboard/widget-customization/error-handling.spec.ts`](/__tests__/playwright/dashboard/widget-customization/error-handling.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `CUSTOMIZE_PAGE` |  |  |
| 2 | log |  |  | 📍 Step 1: Test tab navigation through main elements |
| 3 | log |  |  | 📍 Step 2: Test form input navigation |
| 4 | fill | `Test Input` |  |  |

**Code Reference:**

```typescript
// Line 79
await page.goto(CUSTOMIZE_PAGE, { waitUntil: 'networkidle' });

// Line 83
console.log('📍 Step 1: Test tab navigation through main elements');

// Line 106
console.log('📍 Step 2: Test form input navigation');

// Line 111
await page.keyboard.type('Test Input');

```

---

## 148. appearance → behavior → save → persist

**Source:** [`__tests__/playwright/dashboard/widget-customization/complete-workflow.spec.ts`](/__tests__/playwright/dashboard/widget-customization/complete-workflow.spec.ts)

**Total Steps:** 20

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 2: Verify Essentials tab is active |
| 2 | log |  |  | 📍 Step 3: Change primary color |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 4: Change widget position |
| 5 | log |  |  | 📍 Step 5: Verify live preview updates |
| 6 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 7 | log |  |  | 📍 Step 6: Switch to Intelligence tab |
| 8 | log |  |  | 📍 Step 7: Update welcome message |
| 9 | log |  |  | 📍 Step 8: Update bot name |
| 10 | log |  |  | 📍 Step 9: Change AI personality |
| 11 | click |  |  |  |
| 12 | click |  |  |  |
| 13 | log |  |  | 📍 Step 10: Switch to Connect tab |
| 14 | log |  |  | 📍 Step 11: Toggle WooCommerce integration |
| 15 | log |  |  | 📍 Step 12: Verify unsaved changes indicator |
| 16 | log |  |  | 📍 Step 13: Save configuration |
| 17 | log |  |  | 📍 Step 14: Reload page to verify persistence |
| 18 | reload |  |  |  |
| 19 | wait | `2000` |  |  |
| 20 | log |  |  | 📍 Step 15: Verify settings persisted after reload |

**Code Reference:**

```typescript
// Line 34
console.log('📍 Step 2: Verify Essentials tab is active');

// Line 44
console.log('📍 Step 3: Change primary color');

// Line 50
await greenPreset.click();

// Line 62
console.log('📍 Step 4: Change widget position');

// Line 66
console.log('📍 Step 5: Verify live preview updates');

// Line 70
await widgetInPreview.waitFor({ state: 'visible', timeout: 5000 });

// Line 85
console.log('📍 Step 6: Switch to Intelligence tab');

// Line 91
console.log('📍 Step 7: Update welcome message');

// Line 96
console.log('📍 Step 8: Update bot name');

// Line 101
console.log('📍 Step 9: Change AI personality');

// ... 10 more steps ...
```

---

## 149. verify file naming convention for all formats

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

## 150. PDF export with 90-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 151. Excel export validation

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 152. export with empty data: handle gracefully

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

## 153. export with user authentication and permissions

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 154. handle invalid export format gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 155. handle missing query parameters

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 156. handle request timeout gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 157. complete export workflow: UI suggestion for missing buttons

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

## 158. export performance: large dataset handling

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

## 159. sequential export downloads: verify file independence

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

## 160. export with custom time ranges

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

## 161. verify JSON analytics data structure

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 162. export with date range filter applied

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

## 163. validate CSV data accuracy and formatting

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 164. verify API endpoint responses

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 165. export analytics as CSV: click → download → verify

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

## 166. verify CSV file structure and headers

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 167. CSV export with 30-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 168. English to Spanish translation

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

## 169. UI updates immediately on language change

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

## 170. RTL languages display correctly (Arabic)

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate and set language to Arabic (RTL) |
| 2 | navigate | ``${BASE_URL}/embed`` |  |  |
| 3 | log |  |  | 📍 Step 2: Reload with Arabic language and open widget |
| 4 | navigate | ``${BASE_URL}/embed?open=true`` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Verify RTL layout attributes |
| 7 | log |  |  | 📍 Step 4: Verify widget has RTL direction |
| 8 | log |  |  | 📍 Step 5: Verify Arabic text rendering |
| 9 | fill | `مرحبا، كيف يمكنني مساعدتك؟` |  |  |
| 10 | log |  |  | 📍 Step 6: Verify send button present |

**Code Reference:**

```typescript
// Line 29
console.log('📍 Step 1: Navigate and set language to Arabic (RTL)');

// Line 30
await page.goto(`${BASE_URL}/embed`);

// Line 35
console.log('📍 Step 2: Reload with Arabic language and open widget');

// Line 36
await page.goto(`${BASE_URL}/embed?open=true`, { waitUntil: 'networkidle' });

// Line 37
await page.waitForTimeout(3000);

// Line 41
console.log('📍 Step 3: Verify RTL layout attributes');

// Line 52
console.log('📍 Step 4: Verify widget has RTL direction');

// Line 65
console.log('📍 Step 5: Verify Arabic text rendering');

// Line 70
await inputField.fill('مرحبا، كيف يمكنني مساعدتك؟');

// Line 81
console.log('📍 Step 6: Verify send button present');

```

---

## 171. Hebrew (RTL) text rendering

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/embed`` |  |  |
| 2 | navigate | ``${BASE_URL}/embed?open=true`` |  |  |
| 3 | wait | `3000` |  |  |
| 4 | fill | `שלום, איך אני יכול לעזור?` |  |  |

**Code Reference:**

```typescript
// Line 99
await page.goto(`${BASE_URL}/embed`);

// Line 104
await page.goto(`${BASE_URL}/embed?open=true`, { waitUntil: 'networkidle' });

// Line 105
await page.waitForTimeout(3000);

// Line 118
await inputField.fill('שלום, איך אני יכול לעזור?');

```

---

## 172. RTL layout persists across language changes

**Source:** [`__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts`](/__tests__/playwright/advanced-features/multi-language/rtl-support.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/embed`` |  |  |
| 2 | navigate | ``${BASE_URL}/embed?open=true`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | navigate | ``${BASE_URL}/embed?open=true`` |  |  |
| 5 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 133
await page.goto(`${BASE_URL}/embed`);

// Line 136
await page.goto(`${BASE_URL}/embed?open=true`, { waitUntil: 'networkidle' });

// Line 137
await page.waitForTimeout(2000);

// Line 146
await page.goto(`${BASE_URL}/embed?open=true`, { waitUntil: 'networkidle' });

// Line 147
await page.waitForTimeout(2000);

```

---

## 173. locale preference persists in localStorage

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

## 174. multiple locales can be switched

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

## 175. invalid locale handled gracefully

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

## 176. language switching preserves conversation history

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Start conversation in English |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | fill | `Hello, what products do you have?` |  |  |
| 4 | wait | `5000` |  |  |
| 5 | log |  |  | 📍 Step 2: Count messages before language change |
| 6 | log |  |  | 📍 Step 3: Switch to Spanish mid-conversation |
| 7 | log |  |  | 📍 Step 4: Verify conversation history preserved |
| 8 | log |  |  | 📍 Step 5: Continue conversation in Spanish |
| 9 | fill | `Muéstrame los productos más populares` |  |  |
| 10 | wait | `5000` |  |  |
| 11 | log |  |  | 📍 Step 6: Verify mixed language conversation works |

**Code Reference:**

```typescript
// Line 33
console.log('📍 Step 1: Start conversation in English');

// Line 34
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 44
await inputField.fill('Hello, what products do you have?');

// Line 51
await page.waitForTimeout(5000);

// Line 54
console.log('📍 Step 2: Count messages before language change');

// Line 59
console.log('📍 Step 3: Switch to Spanish mid-conversation');

// Line 67
console.log('📍 Step 4: Verify conversation history preserved');

// Line 79
console.log('📍 Step 5: Continue conversation in Spanish');

// Line 81
await spanishInput.fill('Muéstrame los productos más populares');

// Line 86
await page.waitForTimeout(5000);

// ... 1 more steps ...
```

---

## 177. language persists after page reload

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
// Line 103
console.log('📍 Step 1: Set language preference to Spanish');

// Line 104
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 110
console.log('📍 Step 2: Reload page');

// Line 114
console.log('📍 Step 3: Verify language preference persisted');

// Line 124
console.log('📍 Step 4: Verify UI shows Spanish after reload');

```

---

## 178. rapid language switches handled correctly

**Source:** [`__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts`](/__tests__/playwright/advanced-features/multi-language/language-switching.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 2 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 147
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 154
await page.waitForTimeout(500);

```

---

## 179. browser locale auto-detection

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

## 180. complete language workflow: English → Spanish → Arabic (RTL)

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
// Line 43
console.log('📍 Step 1: Load widget test page in default language (English)');

// Line 44
await page.goto(`${BASE_URL}/test-widget`, { waitUntil: 'networkidle' });

// Line 48
console.log('📍 Step 2: Wait for widget iframe to load and initialize');

// Line 54
console.log('📍 Step 3: Verify UI elements are in English');

// Line 65
console.log('📍 Step 4: Change language to Spanish');

// Line 71
console.log('📍 Step 5: Verify UI elements updated to Spanish');

// Line 86
console.log('📍 Step 6: Send a message in Spanish');

// Line 87
await inputField.fill('Hola, ¿qué productos tienes disponibles?');

// Line 91
await sendButton.click();

// Line 95
await page.waitForTimeout(5000);

// ... 4 more steps ...
```

---

## 181. abandoned conversation → detection → schedule → send

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/workflow.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/workflow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 182. sends high-priority low-satisfaction follow-up

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/priority-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/priority-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 183. respects follow-up attempt limits

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 184. supports multiple scheduling windows

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 185. handles email vs in-app channel routing

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 186. should track add-to-cart operation with full analytics

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 12

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | `/widget-test` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget to load |
| 4 | wait | `iframe#chat-widget-iframe` |  |  |
| 5 | log |  |  | 📍 Step 3: Open chat interface |
| 6 | click |  |  |  |
| 7 | wait | `500` |  |  |
| 8 | log |  |  | 📍 Step 4: Request product and add to cart |
| 9 | fill | `Show me product A4VTG90 and add it to my cart` |  |  |
| 10 | wait | `3000` |  |  |
| 11 | log |  |  | 📍 Step 5: Verify cart operation was tracked in database |
| 12 | log |  |  | 📍 Step 6: Verify session metrics were updated |

**Code Reference:**

```typescript
// Line 28
console.log('📍 Step 1: Navigate to widget test page');

// Line 29
await page.goto('/widget-test');

// Line 31
console.log('📍 Step 2: Wait for widget to load');

// Line 32
await page.waitForSelector('iframe#chat-widget-iframe', { timeout: 10000 });

// Line 35
console.log('📍 Step 3: Open chat interface');

// Line 36
await iframe.locator('button:has-text("Chat"), .chat-trigger, #open-chat').first().click();

// Line 37
await page.waitForTimeout(500);

// Line 39
console.log('📍 Step 4: Request product and add to cart');

// Line 41
await input.fill('Show me product A4VTG90 and add it to my cart');

// Line 45
await page.waitForTimeout(3000);

// ... 2 more steps ...
```

---

## 187. should track multi-step cart journey with session continuity

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 15

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Multi-Step Cart Journey Test |
| 2 | navigate | `/widget-test` |  |  |
| 3 | wait | `iframe#chat-widget-iframe` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `500` |  |  |
| 6 | log |  |  | 📍 Step 1: Add first product |
| 7 | fill | `Add product A4VTG90 to cart` |  |  |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step 2: Add second product |
| 10 | fill | `Also add product BP-001 to cart` |  |  |
| 11 | wait | `2000` |  |  |
| 12 | log |  |  | 📍 Step 3: View cart contents |
| 13 | fill | `Show me my cart` |  |  |
| 14 | wait | `2000` |  |  |
| 15 | log |  |  | 📍 Step 4: Verify all operations tracked with same session |

**Code Reference:**

```typescript
// Line 102
console.log('📍 Multi-Step Cart Journey Test');

// Line 104
await page.goto('/widget-test');

// Line 105
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 109
await iframe.locator('button:has-text("Chat"), .chat-trigger, #open-chat').first().click();

// Line 110
await page.waitForTimeout(500);

// Line 115
console.log('📍 Step 1: Add first product');

// Line 116
await input.fill('Add product A4VTG90 to cart');

// Line 118
await page.waitForTimeout(2000);

// Line 121
console.log('📍 Step 2: Add second product');

// Line 122
await input.fill('Also add product BP-001 to cart');

// ... 5 more steps ...
```

---

## 188. should calculate accurate session duration

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/widget-test` |  |  |
| 2 | wait | `iframe#chat-widget-iframe` |  |  |
| 3 | click |  |  |  |
| 4 | fill | `Add product to cart` |  |  |
| 5 | wait | `2000` |  |  |
| 6 | wait | `3000` |  |  |
| 7 | fill | `View cart` |  |  |
| 8 | wait | `2000` |  |  |
| 9 | wait | `2000` |  |  |
| 10 | fill | `Show cart again` |  |  |
| 11 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 165
await page.goto('/widget-test');

// Line 166
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 169
await iframe.locator('button:has-text("Chat"), .chat-trigger').first().click();

// Line 175
await input.fill('Add product to cart');

// Line 177
await page.waitForTimeout(2000);

// Line 180
await page.waitForTimeout(3000);

// Line 182
await input.fill('View cart');

// Line 184
await page.waitForTimeout(2000);

// Line 187
await page.waitForTimeout(2000);

// Line 189
await input.fill('Show cart again');

// ... 1 more steps ...
```

---

## 189. should track operation failures with error messages

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | `/widget-test` |  |  |
| 2 | wait | `iframe#chat-widget-iframe` |  |  |
| 3 | click |  |  |  |
| 4 | fill | `Add product INVALID_PRODUCT_ID to cart` |  |  |
| 5 | wait | `3000` |  |  |

**Code Reference:**

```typescript
// Line 227
await page.goto('/widget-test');

// Line 228
await page.waitForSelector('iframe#chat-widget-iframe');

// Line 231
await iframe.locator('button:has-text("Chat"), .chat-trigger').first().click();

// Line 236
await input.fill('Add product INVALID_PRODUCT_ID to cart');

// Line 238
await page.waitForTimeout(3000);

```

---

## 190. should support analytics aggregation by platform

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 191. pending follow-up cancelled when user returns

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cancellation.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cancellation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 192. tracks response metrics across channels

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/analytics.spec.ts)

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

- `/api/analytics/export?format=${formats[i]}&days=7``
- `/api/analytics/export?format=${formats[i]}&days=7`);`
- `/api/analytics/export?format=csv&days=${days}``
- `/api/analytics/export?format=csv&days=${days}`);`
- `/api/analytics/export?format=csv&days=7`

### UI Elements

<details>
<summary>Click to expand UI element catalog</summary>

- `#6366f1`
- `#FF6B6B`
- `#f59e0b`
- `'Message ' + i`
- `(RETRY_AFTER_SECONDS + 1) * 1000`
- `/api/analytics/export?format=csv&days=7`
- `/dashboard/analytics`
- `/dashboard/telemetry`
- `/widget-test`
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
- `Add product A4VTG90 to cart`
- `Add product INVALID_PRODUCT_ID to cart`
- `Add product to cart`
- `Also add product BP-001 to cart`
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
- `CUSTOMIZE_PAGE`
- `DOMAIN`
- `Hello, I need help`
- `Hello, what products do you have?`
- `Hola, ¿qué productos tienes disponibles?`
- `I need a hydraulic pump for my machinery`
- `Message after cooldown`
- `Muéstrame los productos más populares`
- `Show cart again`
- `Show me hydraulic pumps`
- `Show me my cart`
- `Show me product A4VTG90 and add it to my cart`
- `Show me your best products`
- `Show me your widgets`
- `TEST_DEMO_SITE`
- `TEST_DOMAIN`
- `Tell me more about that`
- `Test Input`
- `Test answer without question.`
- `Test message for domain verification`
- `Test message for session tracking`
- `Test question without answer?`
- `TestBot`
- `Updated by User A`
- `View cart`
- `What can you tell me about this website?`
- `What pages are on this website?`
- ``${BASE_URL}/dashboard/analytics``
- ``${BASE_URL}/dashboard/customize``
- ``${BASE_URL}/dashboard/domains``
- ``${BASE_URL}/dashboard/installation``
- ``${BASE_URL}/dashboard/integrations/woocommerce``
- ``${BASE_URL}/dashboard``
- ``${BASE_URL}/embed?open=true``
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
- `secondMessage`
- `session-123`
- `session-abc-123`
- `session-xyz-789`
- `support ticket`
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
