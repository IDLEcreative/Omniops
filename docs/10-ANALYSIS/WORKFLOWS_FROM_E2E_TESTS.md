# Application Workflows (Auto-Generated from E2E Tests)

**Generated:** 2025-11-18T23:58:39.567Z
**Source:** Playwright E2E test files in `__tests__/playwright/`

## Summary

- **Total Tests:** 370
- **Total Steps:** 1846
- **API Endpoints Documented:** 5
- **UI Elements Documented:** 181

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
22. [should display widget with default appearance](#should-display-widget-with-default-appearance)
23. [should apply bottom-right positioning](#should-apply-bottom-right-positioning)
24. [should support color customization](#should-support-color-customization)
25. [should support position customization - bottom-left](#should-support-position-customization-bottom-left)
26. [should support position customization - top-right](#should-support-position-customization-top-right)
27. [should verify widget has proper z-index for visibility](#should-verify-widget-has-proper-z-index-for-visibility)
28. [should support dark mode styling](#should-support-dark-mode-styling)
29. [should have proper accessibility attributes](#should-have-proper-accessibility-attributes)
30. [should support custom font settings](#should-support-custom-font-settings)
31. [should verify widget responsive layout indicators](#should-verify-widget-responsive-layout-indicators)
32. [should verify widget does not have accessibility violations](#should-verify-widget-does-not-have-accessibility-violations)
33. [should handle widget theme switching](#should-handle-widget-theme-switching)
34. [should load widget on iPhone SE viewport](#should-load-widget-on-iphone-se-viewport)
35. [should load widget on Android tablet viewport](#should-load-widget-on-android-tablet-viewport)
36. [should handle portrait orientation](#should-handle-portrait-orientation)
37. [should handle landscape orientation](#should-handle-landscape-orientation)
38. [should simulate orientation change](#should-simulate-orientation-change)
39. [should handle soft keyboard appearance](#should-handle-soft-keyboard-appearance)
40. [should verify touch interaction on mobile](#should-verify-touch-interaction-on-mobile)
41. [should verify mobile font sizing](#should-verify-mobile-font-sizing)
42. [should handle widget scaling on different device pixel ratios](#should-handle-widget-scaling-on-different-device-pixel-ratios)
43. [should maintain performance on mobile networks](#should-maintain-performance-on-mobile-networks)
44. [should handle double-tap zoom on mobile](#should-handle-double-tap-zoom-on-mobile)
45. [should verify widget does not block scrolling on mobile](#should-verify-widget-does-not-block-scrolling-on-mobile)
46. [should generate and display embed code](#should-generate-and-display-embed-code)
47. [should copy embed code to clipboard](#should-copy-embed-code-to-clipboard)
48. [should verify widget loads from embed code on test page](#should-verify-widget-loads-from-embed-code-on-test-page)
49. [should handle embed code with custom configuration](#should-handle-embed-code-with-custom-configuration)
50. [should support multiple widgets on same page](#should-support-multiple-widgets-on-same-page)
51. [should verify widget script loading performance](#should-verify-widget-script-loading-performance)
52. [should handle embed code installation errors gracefully](#should-handle-embed-code-installation-errors-gracefully)
53. [should verify embed code on different domain configurations](#should-verify-embed-code-on-different-domain-configurations)
54. [should verify embed code accessibility](#should-verify-embed-code-accessibility)
55. [should verify iframe is loaded from correct origin](#should-verify-iframe-is-loaded-from-correct-origin)
56. [should send message from parent to widget](#should-send-message-from-parent-to-widget)
57. [should handle message validation and filtering](#should-handle-message-validation-and-filtering)
58. [should receive and process widget response messages](#should-receive-and-process-widget-response-messages)
59. [should handle concurrent messages correctly](#should-handle-concurrent-messages-correctly)
60. [should verify postMessage security origin validation](#should-verify-postmessage-security-origin-validation)
61. [should handle iframe communication with visibility changes](#should-handle-iframe-communication-with-visibility-changes)
62. [should verify event propagation from widget iframe](#should-verify-event-propagation-from-widget-iframe)
63. [should handle widget iframe communication timeout gracefully](#should-handle-widget-iframe-communication-timeout-gracefully)
64. [product detail expansion and interaction](#product-detail-expansion-and-interaction)
65. [cart operations and state management](#cart-operations-and-state-management)
66. [accessibility and performance standards](#accessibility-and-performance-standards)
67. [user discovers products and adds to cart via mobile shopping feed](#user-discovers-products-and-adds-to-cart-via-mobile-shopping-feed)
68. [swipe navigation and gestures work smoothly](#swipe-navigation-and-gestures-work-smoothly)
69. [should complete scraping and make content searchable in chat](#should-complete-scraping-and-make-content-searchable-in-chat)
70. [should handle scraping errors gracefully](#should-handle-scraping-errors-gracefully)
71. [should show progress during long scraping jobs](#should-show-progress-during-long-scraping-jobs)
72. [submits data portability request with machine-readable format](#submits-data-portability-request-with-machine-readable-format)
73. [submits data rectification request](#submits-data-rectification-request)
74. [views personal data via access request](#views-personal-data-via-access-request)
75. [submits restriction of processing request](#submits-restriction-of-processing-request)
76. [objects to processing based on legitimate grounds](#objects-to-processing-based-on-legitimate-grounds)
77. [verifies data portability includes third-party data](#verifies-data-portability-includes-third-party-data)
78. [tracks rectification request status](#tracks-rectification-request-status)
79. [handles access request with no data found](#handles-access-request-with-no-data-found)
80. [verifies data portability - complete export format validation](#verifies-data-portability-complete-export-format-validation)
81. [executes right to be forgotten - complete data erasure](#executes-right-to-be-forgotten-complete-data-erasure)
82. [manages consent - user opts in to data collection](#manages-consent-user-opts-in-to-data-collection)
83. [manages consent - user opts out of data collection](#manages-consent-user-opts-out-of-data-collection)
84. [withdraws consent - user revokes all consent](#withdraws-consent-user-revokes-all-consent)
85. [verifies email notification sent for data export](#verifies-email-notification-sent-for-data-export)
86. [verifies database cleanup after deletion](#verifies-database-cleanup-after-deletion)
87. [enforces 30-day legal timeframe for data requests](#enforces-30-day-legal-timeframe-for-data-requests)
88. [maintains comprehensive audit trail for compliance](#maintains-comprehensive-audit-trail-for-compliance)
89. [opts out of automated decision-making](#opts-out-of-automated-decision-making)
90. [displays cookie banner on first visit](#displays-cookie-banner-on-first-visit)
91. [accepts all cookies and persists consent](#accepts-all-cookies-and-persists-consent)
92. [rejects all cookies and limits functionality](#rejects-all-cookies-and-limits-functionality)
93. [customizes cookie preferences](#customizes-cookie-preferences)
94. [persists cookie consent across sessions](#persists-cookie-consent-across-sessions)
95. [withdraws cookie consent](#withdraws-cookie-consent)
96. [links to cookie policy page](#links-to-cookie-policy-page)
97. [respects Do Not Track browser setting](#respects-do-not-track-browser-setting)
98. [provides cookie details in preferences modal](#provides-cookie-details-in-preferences-modal)
99. [handles consent banner on mobile viewport](#handles-consent-banner-on-mobile-viewport)
100. [submits Do Not Sell request](#submits-do-not-sell-request)
101. [confirms Do Not Sell opt-out status](#confirms-do-not-sell-opt-out-status)
102. [submits data disclosure request](#submits-data-disclosure-request)
103. [delivers data disclosure report](#delivers-data-disclosure-report)
104. [verifies California consumer rights information displayed](#verifies-california-consumer-rights-information-displayed)
105. [enforces Do Not Sell opt-out in chat widget](#enforces-do-not-sell-opt-out-in-chat-widget)
106. [handles Do Not Sell request with verification](#handles-do-not-sell-request-with-verification)
107. [tracks third-party data sharing disclosures](#tracks-third-party-data-sharing-disclosures)
108. [complete recommendation workflow: chat → recommendations → click → purchase tracking](#complete-recommendation-workflow-chat-recommendations-click-purchase-tracking)
109. [recommendation algorithms display correctly](#recommendation-algorithms-display-correctly)
110. [empty state when no recommendations available](#empty-state-when-no-recommendations-available)
111. [click tracking without navigation](#click-tracking-without-navigation)
112. [purchase tracking without navigation](#purchase-tracking-without-navigation)
113. [recommendation API returns valid data](#recommendation-api-returns-valid-data)
114. [invalid API requests return proper errors](#invalid-api-requests-return-proper-errors)
115. [should process order created webhook event](#should-process-order-created-webhook-event)
116. [should handle order status update webhooks](#should-handle-order-status-update-webhooks)
117. [should handle webhook delivery failures](#should-handle-webhook-delivery-failures)
118. [should trigger re-authentication flow for expired credentials](#should-trigger-re-authentication-flow-for-expired-credentials)
119. [should validate webhook signature security](#should-validate-webhook-signature-security)
120. [should sync full product catalog successfully](#should-sync-full-product-catalog-successfully)
121. [should handle incremental product updates](#should-handle-incremental-product-updates)
122. [should sync product variants correctly](#should-sync-product-variants-correctly)
123. [should handle product sync errors gracefully](#should-handle-product-sync-errors-gracefully)
124. [should display sync progress in real-time](#should-display-sync-progress-in-real-time)
125. [should complete WooCommerce setup and enable product search](#should-complete-woocommerce-setup-and-enable-product-search)
126. [should handle WooCommerce connection errors gracefully](#should-handle-woocommerce-connection-errors-gracefully)
127. [should setup cart tracking successfully](#should-setup-cart-tracking-successfully)
128. [should detect abandoned carts](#should-detect-abandoned-carts)
129. [should trigger abandoned cart email](#should-trigger-abandoned-cart-email)
130. [should track cart recovery success](#should-track-cart-recovery-success)
131. [should handle cart tracking webhook events](#should-handle-cart-tracking-webhook-events)
132. [should maintain cart session across messages](#should-maintain-cart-session-across-messages)
133. [should handle Store API failures gracefully](#should-handle-store-api-failures-gracefully)
134. [should lookup product by Shopify product ID](#should-lookup-product-by-shopify-product-id)
135. [should lookup product by SKU](#should-lookup-product-by-sku)
136. [should search products by title](#should-search-products-by-title)
137. [should sync product inventory in real-time](#should-sync-product-inventory-in-real-time)
138. [should handle product variant selection](#should-handle-product-variant-selection)
139. [should setup order tracking](#should-setup-order-tracking)
140. [should query order status](#should-query-order-status)
141. [should lookup customer information](#should-lookup-customer-information)
142. [should process Shopify webhook events](#should-process-shopify-webhook-events)
143. [should handle Shopify API rate limiting](#should-handle-shopify-api-rate-limiting)
144. [should re-authenticate with Shopify](#should-re-authenticate-with-shopify)
145. [should initialize event tracking on widget load](#should-initialize-event-tracking-on-widget-load)
146. [should track user interaction events](#should-track-user-interaction-events)
147. [should track purchase completion events](#should-track-purchase-completion-events)
148. [should create and track custom events](#should-create-and-track-custom-events)
149. [should export analytics data](#should-export-analytics-data)
150. [should enforce rate limits and allow retry after cooldown](#should-enforce-rate-limits-and-allow-retry-after-cooldown)
151. [should handle payment failure and allow retry with cart preserved](#should-handle-payment-failure-and-allow-retry-with-cart-preserved)
152. [should handle network timeout and allow successful retry](#should-handle-network-timeout-and-allow-successful-retry)
153. [should handle invalid WooCommerce credentials and allow correction](#should-handle-invalid-woocommerce-credentials-and-allow-correction)
154. [should detect concurrent edits and provide conflict resolution](#should-detect-concurrent-edits-and-provide-conflict-resolution)
155. [should prevent concurrent scraping and allow retry after completion](#should-prevent-concurrent-scraping-and-allow-retry-after-completion)
156. [should install and customize widget successfully](#should-install-and-customize-widget-successfully)
157. [should generate correct embed code for different environments](#should-generate-correct-embed-code-for-different-environments)
158. [should handle widget customization with invalid values](#should-handle-widget-customization-with-invalid-values)
159. [should add and configure domain successfully](#should-add-and-configure-domain-successfully)
160. [should handle domain editing](#should-handle-domain-editing)
161. [should handle domain deletion/disabling](#should-handle-domain-deletion-disabling)
162. [should enforce domain access control](#should-enforce-domain-access-control)
163. [should filter conversations by sentiment](#should-filter-conversations-by-sentiment)
164. [should filter conversations by domain](#should-filter-conversations-by-domain)
165. [should filter conversations by customer email](#should-filter-conversations-by-customer-email)
166. [should combine multiple filters](#should-combine-multiple-filters)
167. [should clear all filters and reset results](#should-clear-all-filters-and-reset-results)
168. [should complete full filtering user journey](#should-complete-full-filtering-user-journey)
169. [should handle filter panel interactions smoothly](#should-handle-filter-panel-interactions-smoothly)
170. [complete search workflow: search → results → view conversation with highlight](#complete-search-workflow-search-results-view-conversation-with-highlight)
171. [search with advanced filters: date range and status filtering](#search-with-advanced-filters-date-range-and-status-filtering)
172. [handles empty search results gracefully](#handles-empty-search-results-gracefully)
173. [search with special characters and edge cases](#search-with-special-characters-and-edge-cases)
174. [keyboard navigation and shortcuts in search](#keyboard-navigation-and-shortcuts-in-search)
175. [search result persistence and back navigation](#search-result-persistence-and-back-navigation)
176. [should support custom date range selection with presets](#should-support-custom-date-range-selection-with-presets)
177. [should enable comparison mode and display change indicators](#should-enable-comparison-mode-and-display-change-indicators)
178. [should display anomaly alerts with severity badges](#should-display-anomaly-alerts-with-severity-badges)
179. [should create, display, and manage metric goals](#should-create-display-and-manage-metric-goals)
180. [should create, display, and interact with chart annotations](#should-create-display-and-interact-with-chart-annotations)
181. [should use all features together in realistic workflow](#should-use-all-features-together-in-realistic-workflow)
182. [CSV export endpoint: verify availability and response](#csv-export-endpoint-verify-availability-and-response)
183. [JSON analytics endpoint: verify data structure](#json-analytics-endpoint-verify-data-structure)
184. [Export formats: test all supported formats](#export-formats-test-all-supported-formats)
185. [Date range parameters: test different time periods](#date-range-parameters-test-different-time-periods)
186. [Error handling: test invalid parameters](#error-handling-test-invalid-parameters)
187. [Export workflow documentation for AI agents](#export-workflow-documentation-for-ai-agents)
188. [should display complete page header with all controls](#should-display-complete-page-header-with-all-controls)
189. [should switch time ranges and reload data](#should-switch-time-ranges-and-reload-data)
190. [should toggle auto-refresh on and off](#should-toggle-auto-refresh-on-and-off)
191. [should manually refresh analytics data](#should-manually-refresh-analytics-data)
192. [should display all Overview Tab components](#should-display-all-overview-tab-components)
193. [should display Business Intelligence Tab components](#should-display-business-intelligence-tab-components)
194. [should open export dropdown and show all options](#should-open-export-dropdown-and-show-all-options)
195. [should handle empty data gracefully on Overview tab](#should-handle-empty-data-gracefully-on-overview-tab)
196. [should handle API errors with error alert](#should-handle-api-errors-with-error-alert)
197. [should complete full user journey through all features](#should-complete-full-user-journey-through-all-features)
198. [should maintain context across multiple conversation turns](#should-maintain-context-across-multiple-conversation-turns)
199. [should handle conversation with context reset](#should-handle-conversation-with-context-reset)
200. [should handle very long conversations](#should-handle-very-long-conversations)
201. [should handle ambiguous pronouns](#should-handle-ambiguous-pronouns)
202. [should search for products by name](#should-search-for-products-by-name)
203. [should display no results message for invalid search](#should-display-no-results-message-for-invalid-search)
204. [should show search query in results](#should-show-search-query-in-results)
205. [should select shipping method and update total](#should-select-shipping-method-and-update-total)
206. [should calculate shipping for different countries](#should-calculate-shipping-for-different-countries)
207. [should display multiple payment methods](#should-display-multiple-payment-methods)
208. [should switch between payment methods](#should-switch-between-payment-methods)
209. [should display payment instructions for selected method](#should-display-payment-instructions-for-selected-method)
210. [should display complete order confirmation details](#should-display-complete-order-confirmation-details)
211. [should show customer billing information on confirmation](#should-show-customer-billing-information-on-confirmation)
212. [should complete guest checkout with valid billing info](#should-complete-guest-checkout-with-valid-billing-info)
213. [should validate required billing fields](#should-validate-required-billing-fields)
214. [should apply discount code and complete purchase](#should-apply-discount-code-and-complete-purchase)
215. [should handle invalid discount code gracefully](#should-handle-invalid-discount-code-gracefully)
216. [should update cart item quantity successfully](#should-update-cart-item-quantity-successfully)
217. [should remove item from cart successfully](#should-remove-item-from-cart-successfully)
218. [should handle empty cart state correctly](#should-handle-empty-cart-state-correctly)
219. [should add multiple different products to cart](#should-add-multiple-different-products-to-cart)
220. [should complete demo flow from URL entry to AI chat response](#should-complete-demo-flow-from-url-entry-to-ai-chat-response)
221. [should handle invalid URLs gracefully](#should-handle-invalid-urls-gracefully)
222. [should enforce demo session limits](#should-enforce-demo-session-limits)
223. [should show upgrade prompt after demo limits reached](#should-show-upgrade-prompt-after-demo-limits-reached)
224. [should complete full purchase flow from chat to order confirmation](#should-complete-full-purchase-flow-from-chat-to-order-confirmation)
225. [should handle purchase flow with guest checkout](#should-handle-purchase-flow-with-guest-checkout)
226. [should handle purchase flow with registered user](#should-handle-purchase-flow-with-registered-user)
227. [should load chat widget successfully](#should-load-chat-widget-successfully)
228. [should toggle widget visibility](#should-toggle-widget-visibility)
229. [should display chat input field](#should-display-chat-input-field)
230. [should display send button](#should-display-send-button)
231. [should send message and receive response](#should-send-message-and-receive-response)
232. [should display user message immediately](#should-display-user-message-immediately)
233. [should show loading indicator while processing](#should-show-loading-indicator-while-processing)
234. [should maintain context across multiple messages](#should-maintain-context-across-multiple-messages)
235. [should display conversation history](#should-display-conversation-history)
236. [should scroll to latest message](#should-scroll-to-latest-message)
237. [should register new user successfully](#should-register-new-user-successfully)
238. [should validate required registration fields](#should-validate-required-registration-fields)
239. [should reject invalid email format](#should-reject-invalid-email-format)
240. [should display password reset form](#should-display-password-reset-form)
241. [should request password reset for valid email](#should-request-password-reset-for-valid-email)
242. [should validate empty email on reset request](#should-validate-empty-email-on-reset-request)
243. [should display logout link when user is logged in](#should-display-logout-link-when-user-is-logged-in)
244. [should terminate session on logout](#should-terminate-session-on-logout)
245. [should show logout confirmation message](#should-show-logout-confirmation-message)
246. [should display login form correctly](#should-display-login-form-correctly)
247. [should reject login with invalid credentials](#should-reject-login-with-invalid-credentials)
248. [should validate empty login form submission](#should-validate-empty-login-form-submission)
249. [should display remember me option](#should-display-remember-me-option)
250. [should complete full team invitation flow for viewer role](#should-complete-full-team-invitation-flow-for-viewer-role)
251. [should handle editor role with correct permissions](#should-handle-editor-role-with-correct-permissions)
252. [should show team members list with correct roles](#should-show-team-members-list-with-correct-roles)
253. [should allow admin to revoke member access](#should-allow-admin-to-revoke-member-access)
254. [should handle expired invitation tokens](#should-handle-expired-invitation-tokens)
255. [should complete Shopify setup and track purchases](#should-complete-shopify-setup-and-track-purchases)
256. [should handle Shopify connection errors](#should-handle-shopify-connection-errors)
257. [should sync product inventory updates](#should-sync-product-inventory-updates)
258. [should handle product out of stock scenarios](#should-handle-product-out-of-stock-scenarios)
259. [should track Shopify order fulfillment](#should-track-shopify-order-fulfillment)
260. [should handle Shopify webhooks](#should-handle-shopify-webhooks)
261. [should display real-time metrics and update without refresh](#should-display-real-time-metrics-and-update-without-refresh)
262. [should handle connection interruptions gracefully](#should-handle-connection-interruptions-gracefully)
263. [should show historical trend alongside real-time data](#should-show-historical-trend-alongside-real-time-data)
264. [should filter real-time events by type](#should-filter-real-time-events-by-type)
265. [should export real-time data snapshot](#should-export-real-time-data-snapshot)
266. [should handle high-frequency updates efficiently](#should-handle-high-frequency-updates-efficiently)
267. [should lookup order status via chat and return accurate information](#should-lookup-order-status-via-chat-and-return-accurate-information)
268. [should handle order lookup for processing orders](#should-handle-order-lookup-for-processing-orders)
269. [should handle invalid order numbers gracefully](#should-handle-invalid-order-numbers-gracefully)
270. [should handle multiple order lookups in same conversation](#should-handle-multiple-order-lookups-in-same-conversation)
271. [should provide order modification options](#should-provide-order-modification-options)
272. [should handle orders without tracking numbers](#should-handle-orders-without-tracking-numbers)
273. [should monitor live chat and complete agent takeover](#should-monitor-live-chat-and-complete-agent-takeover)
274. [should show waiting chats requiring agent attention](#should-show-waiting-chats-requiring-agent-attention)
275. [should complete full conversations management flow with export](#should-complete-full-conversations-management-flow-with-export)
276. [should filter conversations by date range](#should-filter-conversations-by-date-range)
277. [should handle empty search results gracefully](#should-handle-empty-search-results-gracefully)
278. [should allow bulk operations on conversations](#should-allow-bulk-operations-on-conversations)
279. [should show conversation analytics](#should-show-conversation-analytics)
280. [should track complete cart journey with analytics](#should-track-complete-cart-journey-with-analytics)
281. [should track session metrics accurately](#should-track-session-metrics-accurately)
282. [should retrieve domain-level analytics](#should-retrieve-domain-level-analytics)
283. [should identify abandoned carts](#should-identify-abandoned-carts)
284. [should filter analytics by date range](#should-filter-analytics-by-date-range)
285. [should handle API errors gracefully](#should-handle-api-errors-gracefully)
286. [should support platform filtering (WooCommerce vs Shopify)](#should-support-platform-filtering-woocommerce-vs-shopify)
287. [should track both successful and failed operations](#should-track-both-successful-and-failed-operations)
288. [should retrieve analytics quickly (< 1 second)](#should-retrieve-analytics-quickly-1-second)
289. [should restore abandoned cart when customer returns](#should-restore-abandoned-cart-when-customer-returns)
290. [should track cart abandonment analytics](#should-track-cart-abandonment-analytics)
291. [should send abandonment email reminder](#should-send-abandonment-email-reminder)
292. [should handle expired cart sessions](#should-handle-expired-cart-sessions)
293. [should merge guest and authenticated user carts](#should-merge-guest-and-authenticated-user-carts)
294. [should handle out-of-stock items in restored cart](#should-handle-out-of-stock-items-in-restored-cart)
295. [live preview updates in real-time](#live-preview-updates-in-real-time)
296. [reset button restores default settings](#reset-button-restores-default-settings)
297. [tab navigation works correctly](#tab-navigation-works-correctly)
298. [advanced color customization works](#advanced-color-customization-works)
299. [handles save errors gracefully](#handles-save-errors-gracefully)
300. [supports keyboard navigation](#supports-keyboard-navigation)
301. [appearance → behavior → save → persist](#appearance-behavior-save-persist)
302. [delete items with persistence verification](#delete-items-with-persistence-verification)
303. [delete multiple items sequentially](#delete-multiple-items-sequentially)
304. [delete items while processing](#delete-items-while-processing)
305. [list integrity after deletion](#list-integrity-after-deletion)
306. [empty state when all items deleted](#empty-state-when-all-items-deleted)
307. [delete confirmation dialog](#delete-confirmation-dialog)
308. [URL uploads generate embeddings](#url-uploads-generate-embeddings)
309. [text uploads generate embeddings](#text-uploads-generate-embeddings)
310. [Q&A uploads generate embeddings](#q-a-uploads-generate-embeddings)
311. [embeddings are searchable via RAG](#embeddings-are-searchable-via-rag)
312. [verify embedding pipeline for all upload types](#verify-embedding-pipeline-for-all-upload-types)
313. [user uploads Q&A pairs for FAQ training](#user-uploads-q-a-pairs-for-faq-training)
314. [Q&A with long answers](#q-a-with-long-answers)
315. [incomplete Q&A validation](#incomplete-q-a-validation)
316. [multiple Q&A pairs](#multiple-q-a-pairs)
317. [Q&A with special characters](#q-a-with-special-characters)
318. [user uploads text and generates embeddings](#user-uploads-text-and-generates-embeddings)
319. [short text (< 200 chars)](#short-text-200-chars)
320. [long text (> 200 chars, truncated preview)](#long-text-200-chars-truncated-preview)
321. [empty text validation](#empty-text-validation)
322. [multiple text submissions](#multiple-text-submissions)
323. [user uploads URL and processes to completion](#user-uploads-url-and-processes-to-completion)
324. [URL normalization (auto-adds https://)](#url-normalization-auto-adds-https)
325. [scraping failure handling](#scraping-failure-handling)
326. [multiple URL submissions](#multiple-url-submissions)
327. [verify file naming convention for all formats](#verify-file-naming-convention-for-all-formats)
328. [PDF export with 90-day range](#pdf-export-with-90-day-range)
329. [Excel export validation](#excel-export-validation)
330. [export with empty data: handle gracefully](#export-with-empty-data-handle-gracefully)
331. [export with user authentication and permissions](#export-with-user-authentication-and-permissions)
332. [handle invalid export format gracefully](#handle-invalid-export-format-gracefully)
333. [handle missing query parameters](#handle-missing-query-parameters)
334. [handle request timeout gracefully](#handle-request-timeout-gracefully)
335. [complete export workflow: UI suggestion for missing buttons](#complete-export-workflow-ui-suggestion-for-missing-buttons)
336. [export performance: large dataset handling](#export-performance-large-dataset-handling)
337. [sequential export downloads: verify file independence](#sequential-export-downloads-verify-file-independence)
338. [export with custom time ranges](#export-with-custom-time-ranges)
339. [verify JSON analytics data structure](#verify-json-analytics-data-structure)
340. [export with date range filter applied](#export-with-date-range-filter-applied)
341. [validate CSV data accuracy and formatting](#validate-csv-data-accuracy-and-formatting)
342. [verify API endpoint responses](#verify-api-endpoint-responses)
343. [export analytics as CSV: click → download → verify](#export-analytics-as-csv-click-download-verify)
344. [verify CSV file structure and headers](#verify-csv-file-structure-and-headers)
345. [CSV export with 30-day range](#csv-export-with-30-day-range)
346. [English to Spanish translation](#english-to-spanish-translation)
347. [UI updates immediately on language change](#ui-updates-immediately-on-language-change)
348. [RTL languages display correctly (Arabic)](#rtl-languages-display-correctly-arabic)
349. [Hebrew (RTL) text rendering](#hebrew-rtl-text-rendering)
350. [RTL layout persists across language changes](#rtl-layout-persists-across-language-changes)
351. [locale preference persists in localStorage](#locale-preference-persists-in-localstorage)
352. [multiple locales can be switched](#multiple-locales-can-be-switched)
353. [invalid locale handled gracefully](#invalid-locale-handled-gracefully)
354. [language switching preserves conversation history](#language-switching-preserves-conversation-history)
355. [language persists after page reload](#language-persists-after-page-reload)
356. [rapid language switches handled correctly](#rapid-language-switches-handled-correctly)
357. [browser locale auto-detection](#browser-locale-auto-detection)
358. [complete language workflow: English → Spanish → Arabic (RTL)](#complete-language-workflow-english-spanish-arabic-rtl)
359. [abandoned conversation → detection → schedule → send](#abandoned-conversation-detection-schedule-send)
360. [sends high-priority low-satisfaction follow-up](#sends-high-priority-low-satisfaction-follow-up)
361. [respects follow-up attempt limits](#respects-follow-up-attempt-limits)
362. [supports multiple scheduling windows](#supports-multiple-scheduling-windows)
363. [handles email vs in-app channel routing](#handles-email-vs-in-app-channel-routing)
364. [should track add-to-cart operation with full analytics](#should-track-add-to-cart-operation-with-full-analytics)
365. [should track multi-step cart journey with session continuity](#should-track-multi-step-cart-journey-with-session-continuity)
366. [should calculate accurate session duration](#should-calculate-accurate-session-duration)
367. [should track operation failures with error messages](#should-track-operation-failures-with-error-messages)
368. [should support analytics aggregation by platform](#should-support-analytics-aggregation-by-platform)
369. [pending follow-up cancelled when user returns](#pending-follow-up-cancelled-when-user-returns)
370. [tracks response metrics across channels](#tracks-response-metrics-across-channels)

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

## 22. should display widget with default appearance

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify widget visibility |
| 6 | log |  |  | 📍 Step 4: Verify widget styling |

**Code Reference:**

```typescript
// Line 33
console.log('📍 Step 1: Navigate to widget test page');

// Line 34
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 41
console.log('📍 Step 2: Wait for widget iframe');

// Line 43
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 47
console.log('📍 Step 3: Verify widget visibility');

// Line 53
console.log('📍 Step 4: Verify widget styling');

```

---

## 23. should apply bottom-right positioning

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Configure widget with bottom-right position |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify bottom-right positioning |

**Code Reference:**

```typescript
// Line 69
console.log('📍 Step 1: Configure widget with bottom-right position');

// Line 70
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 76
console.log('📍 Step 2: Wait for widget iframe');

// Line 78
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 81
console.log('📍 Step 3: Verify bottom-right positioning');

```

---

## 24. should support color customization

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Set custom primary color |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 3: Verify color application |

**Code Reference:**

```typescript
// Line 103
console.log('📍 Step 1: Navigate to widget test page');

// Line 104
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 110
console.log('📍 Step 2: Set custom primary color');

// Line 125
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 126
await page.waitForTimeout(2000);

// Line 129
console.log('📍 Step 3: Verify color application');

```

---

## 25. should support position customization - bottom-left

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Configure widget with bottom-left position |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Set bottom-left position |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 3: Verify bottom-left positioning |

**Code Reference:**

```typescript
// Line 141
console.log('📍 Step 1: Configure widget with bottom-left position');

// Line 142
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 148
console.log('📍 Step 2: Set bottom-left position');

// Line 163
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 164
await page.waitForTimeout(2000);

// Line 167
console.log('📍 Step 3: Verify bottom-left positioning');

```

---

## 26. should support position customization - top-right

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Configure widget with top-right position |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Set top-right position |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |

**Code Reference:**

```typescript
// Line 183
console.log('📍 Step 1: Configure widget with top-right position');

// Line 184
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 190
console.log('📍 Step 2: Set top-right position');

// Line 205
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

```

---

## 27. should verify widget has proper z-index for visibility

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify widget z-index |

**Code Reference:**

```typescript
// Line 219
console.log('📍 Step 1: Navigate to widget test page');

// Line 220
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 227
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 230
console.log('📍 Step 2: Verify widget z-index');

```

---

## 28. should support dark mode styling

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Enable dark mode |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify dark mode styling |

**Code Reference:**

```typescript
// Line 249
console.log('📍 Step 1: Navigate to widget test page');

// Line 250
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 256
console.log('📍 Step 2: Enable dark mode');

// Line 266
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 269
console.log('📍 Step 3: Verify dark mode styling');

```

---

## 29. should have proper accessibility attributes

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify iframe accessibility attributes |

**Code Reference:**

```typescript
// Line 281
console.log('📍 Step 1: Navigate to widget test page');

// Line 282
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 289
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 292
console.log('📍 Step 2: Verify iframe accessibility attributes');

```

---

## 30. should support custom font settings

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Configure custom font |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 309
console.log('📍 Step 1: Navigate to widget test page');

// Line 310
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 316
console.log('📍 Step 2: Configure custom font');

// Line 332
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 333
await page.waitForTimeout(2000);

```

---

## 31. should verify widget responsive layout indicators

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Get viewport dimensions |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Check widget dimensions |

**Code Reference:**

```typescript
// Line 339
console.log('📍 Step 1: Navigate to widget test page');

// Line 340
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 346
console.log('📍 Step 2: Get viewport dimensions');

// Line 358
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 361
console.log('📍 Step 3: Check widget dimensions');

```

---

## 32. should verify widget does not have accessibility violations

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Check WCAG 2.1 compliance indicators |

**Code Reference:**

```typescript
// Line 377
console.log('📍 Step 1: Navigate to widget test page');

// Line 378
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 385
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 388
console.log('📍 Step 2: Check WCAG 2.1 compliance indicators');

```

---

## 33. should handle widget theme switching

**Source:** [`__tests__/playwright/widget/widget-appearance.spec.ts`](/__tests__/playwright/widget/widget-appearance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Test light theme |
| 5 | log |  |  | 📍 Step 3: Test dark theme |
| 6 | log |  |  | 📍 Step 4: Verify widget still visible after theme switch |

**Code Reference:**

```typescript
// Line 421
console.log('📍 Step 1: Navigate to widget test page');

// Line 422
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 429
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 432
console.log('📍 Step 2: Test light theme');

// Line 446
console.log('📍 Step 3: Test dark theme');

// Line 460
console.log('📍 Step 4: Verify widget still visible after theme switch');

```

---

## 34. should load widget on iPhone SE viewport

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Configure iPhone SE viewport (375x667) |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for widget iframe |
| 5 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 6 | log |  |  | 📍 Step 4: Verify widget is responsive |

**Code Reference:**

```typescript
// Line 36
console.log('📍 Step 1: Configure iPhone SE viewport (375x667)');

// Line 41
console.log('📍 Step 2: Navigate to widget test page');

// Line 42
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 49
console.log('📍 Step 3: Wait for widget iframe');

// Line 51
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 55
console.log('📍 Step 4: Verify widget is responsive');

```

---

## 35. should load widget on Android tablet viewport

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Configure Android tablet viewport (768x1024) |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify widget dimensions on tablet |

**Code Reference:**

```typescript
// Line 63
console.log('📍 Step 1: Configure Android tablet viewport (768x1024)');

// Line 68
console.log('📍 Step 2: Navigate to widget test page');

// Line 69
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 76
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 79
console.log('📍 Step 3: Verify widget dimensions on tablet');

```

---

## 36. should handle portrait orientation

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set portrait orientation (480x800) |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify positioning in portrait mode |

**Code Reference:**

```typescript
// Line 95
console.log('📍 Step 1: Set portrait orientation (480x800)');

// Line 100
console.log('📍 Step 2: Navigate to widget test page');

// Line 101
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 108
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 111
console.log('📍 Step 3: Verify positioning in portrait mode');

```

---

## 37. should handle landscape orientation

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set landscape orientation (800x480) |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify positioning in landscape mode |

**Code Reference:**

```typescript
// Line 129
console.log('📍 Step 1: Set landscape orientation (800x480)');

// Line 134
console.log('📍 Step 2: Navigate to widget test page');

// Line 135
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 142
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 145
console.log('📍 Step 3: Verify positioning in landscape mode');

```

---

## 38. should simulate orientation change

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Start in portrait orientation |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Record portrait widget position |
| 5 | log |  |  | 📍 Step 3: Rotate to landscape orientation |
| 6 | wait | `1000` |  |  |
| 7 | log |  |  | 📍 Step 4: Record landscape widget position |

**Code Reference:**

```typescript
// Line 162
console.log('📍 Step 1: Start in portrait orientation');

// Line 165
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 171
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 174
console.log('📍 Step 2: Record portrait widget position');

// Line 183
console.log('📍 Step 3: Rotate to landscape orientation');

// Line 192
await page.waitForTimeout(1000);

// Line 195
console.log('📍 Step 4: Record landscape widget position');

```

---

## 39. should handle soft keyboard appearance

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Simulate input focus (soft keyboard trigger) |
| 5 | log |  |  | 📍 Step 3: Simulate viewport resize from soft keyboard |

**Code Reference:**

```typescript
// Line 207
console.log('📍 Step 1: Set mobile viewport');

// Line 210
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 216
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 219
console.log('📍 Step 2: Simulate input focus (soft keyboard trigger)');

// Line 227
console.log('📍 Step 3: Simulate viewport resize from soft keyboard');

```

---

## 40. should verify touch interaction on mobile

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport for touch testing |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Simulate touch events on widget |

**Code Reference:**

```typescript
// Line 240
console.log('📍 Step 1: Set mobile viewport for touch testing');

// Line 243
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 249
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 252
console.log('📍 Step 2: Simulate touch events on widget');

```

---

## 41. should verify mobile font sizing

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify font sizes are readable on mobile |

**Code Reference:**

```typescript
// Line 283
console.log('📍 Step 1: Set mobile viewport');

// Line 286
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 292
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 295
console.log('📍 Step 2: Verify font sizes are readable on mobile');

```

---

## 42. should handle widget scaling on different device pixel ratios

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport (iPhone 12 Pro - 3x pixel ratio) |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify pixel ratio handling |

**Code Reference:**

```typescript
// Line 322
console.log('📍 Step 1: Set mobile viewport (iPhone 12 Pro - 3x pixel ratio)');

// Line 326
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 332
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 335
console.log('📍 Step 2: Verify pixel ratio handling');

```

---

## 43. should maintain performance on mobile networks

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Simulate slow 3G network conditions |
| 2 | log |  |  | 📍 Step 2: Set mobile viewport |
| 3 | log |  |  | 📍 Step 3: Navigate to widget test page |
| 4 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 5 | wait | `{ state: 'visible', timeout: 15000 }` |  |  |

**Code Reference:**

```typescript
// Line 350
console.log('📍 Step 1: Simulate slow 3G network conditions');

// Line 361
console.log('📍 Step 2: Set mobile viewport');

// Line 366
console.log('📍 Step 3: Navigate to widget test page');

// Line 367
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 30000 // Extended timeout for slow network
    });

// Line 377
await iframeLocator.waitFor({ state: 'visible', timeout: 15000 });

```

---

## 44. should handle double-tap zoom on mobile

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Simulate double-tap gesture |

**Code Reference:**

```typescript
// Line 394
console.log('📍 Step 1: Set mobile viewport');

// Line 397
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 403
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 406
console.log('📍 Step 2: Simulate double-tap gesture');

```

---

## 45. should verify widget does not block scrolling on mobile

**Source:** [`__tests__/playwright/widget/mobile-responsiveness.spec.ts`](/__tests__/playwright/widget/mobile-responsiveness.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 4 | log |  |  | 📍 Step 2: Test page scrolling with widget present |

**Code Reference:**

```typescript
// Line 437
console.log('📍 Step 1: Set mobile viewport');

// Line 440
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 447
await iframeLocator.waitFor({ state: 'visible', timeout: 10000 });

// Line 450
console.log('📍 Step 2: Test page scrolling with widget present');

```

---

## 46. should generate and display embed code

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget installation page |
| 2 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify embed code block is visible |
| 4 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |

**Code Reference:**

```typescript
// Line 34
console.log('📍 Step 1: Navigate to widget installation page');

// Line 35
await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 42
console.log('📍 Step 2: Verify embed code block is visible');

// Line 47
await embedCodeBlock.waitFor({ state: 'visible', timeout: 10000 });

```

---

## 47. should copy embed code to clipboard

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to installation page |
| 2 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 3 | log |  |  | 📍 Step 2: Grant clipboard permissions |
| 4 | log |  |  | 📍 Step 3: Locate and click copy button |
| 5 | click |  |  |  |
| 6 | wait | `500` |  |  |
| 7 | log |  |  | 📍 Step 4: Verify clipboard content |

**Code Reference:**

```typescript
// Line 57
console.log('📍 Step 1: Navigate to installation page');

// Line 58
await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 64
console.log('📍 Step 2: Grant clipboard permissions');

// Line 69
console.log('📍 Step 3: Locate and click copy button');

// Line 77
await copyButton.click();

// Line 81
await page.waitForTimeout(500);

// Line 84
console.log('📍 Step 4: Verify clipboard content');

```

---

## 48. should verify widget loads from embed code on test page

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe to appear |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify iframe attributes |
| 6 | log |  |  | 📍 Step 4: Verify widget configuration |

**Code Reference:**

```typescript
// Line 97
console.log('📍 Step 1: Navigate to widget test page');

// Line 98
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 105
console.log('📍 Step 2: Wait for widget iframe to appear');

// Line 109
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 117
console.log('📍 Step 3: Verify iframe attributes');

// Line 126
console.log('📍 Step 4: Verify widget configuration');

```

---

## 49. should handle embed code with custom configuration

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to test widget page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Set custom widget configuration |
| 4 | log |  |  | 📍 Step 3: Verify custom configuration |

**Code Reference:**

```typescript
// Line 137
console.log('📍 Step 1: Navigate to test widget page');

// Line 138
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 144
console.log('📍 Step 2: Set custom widget configuration');

// Line 164
console.log('📍 Step 3: Verify custom configuration');

```

---

## 50. should support multiple widgets on same page

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify first widget |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Inject second widget |
| 6 | log |  |  | 📍 Step 4: Verify widget system supports multiple instances |

**Code Reference:**

```typescript
// Line 176
console.log('📍 Step 1: Navigate to test page');

// Line 177
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 183
console.log('📍 Step 2: Verify first widget');

// Line 185
await firstIframe.waitFor({ state: 'attached', timeout: 10000 });

// Line 190
console.log('📍 Step 3: Inject second widget');

// Line 214
console.log('📍 Step 4: Verify widget system supports multiple instances');

```

---

## 51. should verify widget script loading performance

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to test page and measure load time |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Measure embed script load time |

**Code Reference:**

```typescript
// Line 228
console.log('📍 Step 1: Navigate to test page and measure load time');

// Line 231
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 240
console.log('📍 Step 2: Measure embed script load time');

```

---

## 52. should handle embed code installation errors gracefully

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify widget handles missing config |

**Code Reference:**

```typescript
// Line 265
console.log('📍 Step 1: Navigate to test page');

// Line 266
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 272
console.log('📍 Step 2: Verify widget handles missing config');

```

---

## 53. should verify embed code on different domain configurations

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set domain-specific configuration |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Configure for different domain |
| 4 | log |  |  | 📍 Step 3: Verify configuration persistence |

**Code Reference:**

```typescript
// Line 295
console.log('📍 Step 1: Set domain-specific configuration');

// Line 296
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 302
console.log('📍 Step 2: Configure for different domain');

// Line 316
console.log('📍 Step 3: Verify configuration persistence');

```

---

## 54. should verify embed code accessibility

**Source:** [`__tests__/playwright/widget/embed-code-installation.spec.ts`](/__tests__/playwright/widget/embed-code-installation.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to installation page |
| 2 | navigate | ``${BASE_URL}/dashboard/installation`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify embed code accessibility |

**Code Reference:**

```typescript
// Line 326
console.log('📍 Step 1: Navigate to installation page');

// Line 327
await page.goto(`${BASE_URL}/dashboard/installation`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 333
console.log('📍 Step 2: Verify embed code accessibility');

```

---

## 55. should verify iframe is loaded from correct origin

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify iframe origin |

**Code Reference:**

```typescript
// Line 34
console.log('📍 Step 1: Navigate to widget test page');

// Line 35
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 42
console.log('📍 Step 2: Wait for widget iframe');

// Line 44
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 48
console.log('📍 Step 3: Verify iframe origin');

```

---

## 56. should send message from parent to widget

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Send message from parent to widget |

**Code Reference:**

```typescript
// Line 66
console.log('📍 Step 1: Navigate to widget test page');

// Line 67
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 73
console.log('📍 Step 2: Wait for widget iframe');

// Line 75
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 79
await page.waitForTimeout(3000);

// Line 82
console.log('📍 Step 3: Send message from parent to widget');

```

---

## 57. should handle message validation and filtering

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Send invalid message to widget |

**Code Reference:**

```typescript
// Line 109
console.log('📍 Step 1: Navigate to widget test page');

// Line 110
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 116
console.log('📍 Step 2: Wait for widget iframe');

// Line 118
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 119
await page.waitForTimeout(3000);

// Line 122
console.log('📍 Step 3: Send invalid message to widget');

```

---

## 58. should receive and process widget response messages

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Set up message listener and send requests |

**Code Reference:**

```typescript
// Line 147
console.log('📍 Step 1: Navigate to widget test page');

// Line 148
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 154
console.log('📍 Step 2: Wait for widget iframe');

// Line 156
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 157
await page.waitForTimeout(3000);

// Line 160
console.log('📍 Step 3: Set up message listener and send requests');

```

---

## 59. should handle concurrent messages correctly

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Send multiple concurrent messages |

**Code Reference:**

```typescript
// Line 198
console.log('📍 Step 1: Navigate to widget test page');

// Line 199
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 205
console.log('📍 Step 2: Wait for widget iframe');

// Line 207
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 208
await page.waitForTimeout(3000);

// Line 211
console.log('📍 Step 3: Send multiple concurrent messages');

```

---

## 60. should verify postMessage security origin validation

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify postMessage origin handling |

**Code Reference:**

```typescript
// Line 237
console.log('📍 Step 1: Navigate to widget test page');

// Line 238
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 244
console.log('📍 Step 2: Wait for widget iframe');

// Line 246
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 249
console.log('📍 Step 3: Verify postMessage origin handling');

```

---

## 61. should handle iframe communication with visibility changes

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Test communication through visibility changes |

**Code Reference:**

```typescript
// Line 275
console.log('📍 Step 1: Navigate to widget test page');

// Line 276
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 282
console.log('📍 Step 2: Wait for widget iframe');

// Line 284
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 287
console.log('📍 Step 3: Test communication through visibility changes');

```

---

## 62. should verify event propagation from widget iframe

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step 3: Listen for widget-originated custom events |

**Code Reference:**

```typescript
// Line 332
console.log('📍 Step 1: Navigate to widget test page');

// Line 333
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 339
console.log('📍 Step 2: Wait for widget iframe');

// Line 341
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 342
await page.waitForTimeout(3000);

// Line 345
console.log('📍 Step 3: Listen for widget-originated custom events');

```

---

## 63. should handle widget iframe communication timeout gracefully

**Source:** [`__tests__/playwright/widget/cross-domain-communication.spec.ts`](/__tests__/playwright/widget/cross-domain-communication.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/test-widget`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 10000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Test message timeout handling |

**Code Reference:**

```typescript
// Line 376
console.log('📍 Step 1: Navigate to widget test page');

// Line 377
await page.goto(`${BASE_URL}/test-widget`, {
      waitUntil: 'networkidle',
      timeout: 15000
    });

// Line 383
console.log('📍 Step 2: Wait for widget iframe');

// Line 385
await iframeLocator.waitFor({ state: 'attached', timeout: 10000 });

// Line 388
console.log('📍 Step 3: Test message timeout handling');

```

---

## 64. product detail expansion and interaction

**Source:** [`__tests__/playwright/shopping/mobile-shopping-details.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-details.spec.ts)

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
// Line 44
console.log('📍 Step 1: Setup mobile environment');

// Line 48
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 49
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 54
console.log('📍 Step 3: Wait for shopping feed');

// Line 57
console.log('📍 Step 4: Tap product card to expand details');

// Line 63
console.log('📍 Step 5: Test image gallery horizontal scroll');

// Line 69
await page.waitForTimeout(500);

// Line 76
console.log('📍 Step 6: Test variant selection');

// Line 88
console.log('📍 Step 7: Tap outside to collapse details');

// Line 90
await page.waitForTimeout(1000);

```

---

## 65. cart operations and state management

**Source:** [`__tests__/playwright/shopping/mobile-shopping-details.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-details.spec.ts)

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
// Line 107
console.log('📍 Step 1: Setup mobile environment');

// Line 111
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 112
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 117
console.log('📍 Step 3: Wait for shopping feed');

// Line 120
console.log('📍 Step 4: Add first product to cart (double-tap)');

// Line 126
await page.waitForTimeout(1000);

// Line 130
console.log('📍 Step 5: Verify cart badge shows count: 1');

// Line 135
console.log('📍 Step 6: Swipe to next product');

// Line 137
await page.waitForTimeout(1000);

// Line 139
console.log('📍 Step 7: Add second product to cart (double-tap)');

// ... 5 more steps ...
```

---

## 66. accessibility and performance standards

**Source:** [`__tests__/playwright/shopping/mobile-shopping-details.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-details.spec.ts)

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
// Line 180
console.log('📍 Step 1: Setup mobile environment');

// Line 184
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 185
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 190
console.log('📍 Step 3: Wait for shopping feed');

// Line 193
console.log('📍 Step 4: Verify touch target sizes');

// Line 216
console.log('📍 Step 5: Test animation performance during swipe');

// Line 223
console.log('📍 Step 6: Verify ARIA labels for accessibility');

// Line 231
console.log('📍 Step 7: Verify viewport is mobile');

```

---

## 67. user discovers products and adds to cart via mobile shopping feed

**Source:** [`__tests__/playwright/shopping/mobile-shopping-core.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-core.spec.ts)

**Total Steps:** 28

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport and enable touch features |
| 2 | log |  |  | 📍 Step 2: Navigate to widget test page |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Wait for chat widget iframe |
| 5 | log |  |  | 📍 Step 4: Click open button to open widget |
| 6 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 7 | wait | `1000` |  |  |
| 8 | log |  |  | 📍 Step 4a: Verify widget opened (check for input field) |
| 9 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 10 | log |  |  | 📍 Step 5: Using real Thompson's Parts API (www.thompsonseparts.co.uk) |
| 11 | log |  |  | 📍 Step 6: Send product search query that triggers shopping feed |
| 12 | log |  |  | 📍 Step 7: Wait for Browse Products button (real API response) |
| 13 | wait | `{ state: 'visible', timeout: 60000 }` |  |  |
| 14 | log |  |  | 📍 Step 8: Click Browse Products to open shopping feed |
| 15 | click |  |  |  |
| 16 | log |  |  | 📍 Step 9: Wait for shopping feed transition |
| 17 | log |  |  | 📍 Step 10: Verify product cards loaded |
| 18 | log |  |  | 📍 Step 11: Swipe down to view next product |
| 19 | wait | `1000` |  |  |
| 20 | log |  |  | 📍 Step 11: Tap product card to expand details |
| 21 | log |  |  | 📍 Step 12: Select product variant (Color: White) |
| 22 | log |  |  | 📍 Step 13: Double-tap product to add to cart |
| 23 | wait | `1000` |  |  |
| 24 | log |  |  | 📍 Step 12: Verify cart indicator shows item count |
| 25 | log |  |  | 📍 Step 13: Verify analytics event for add-to-cart |
| 26 | wait | `500` |  |  |
| 27 | log |  |  | 📍 Step 14: Capture success screenshot |
| 28 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 56
console.log('📍 Step 1: Set mobile viewport and enable touch features');

// Line 61
console.log('📍 Step 2: Navigate to widget test page');

// Line 62
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 65
console.log('📍 Step 3: Wait for chat widget iframe');

// Line 79
console.log('📍 Step 4: Click open button to open widget');

// Line 81
await openButton.waitFor({ state: 'visible', timeout: 10000 });

// Line 90
await page.waitForTimeout(1000);

// Line 93
console.log('📍 Step 4a: Verify widget opened (check for input field)');

// Line 95
await inputField.waitFor({ state: 'visible', timeout: 5000 });

// Line 98
console.log('📍 Step 5: Using real Thompson\'s Parts API (www.thompsonseparts.co.uk)');

// ... 18 more steps ...
```

---

## 68. swipe navigation and gestures work smoothly

**Source:** [`__tests__/playwright/shopping/mobile-shopping-core.spec.ts`](/__tests__/playwright/shopping/mobile-shopping-core.spec.ts)

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
// Line 191
console.log('📍 Step 1: Setup mobile environment');

// Line 195
console.log('📍 Step 2: Load widget and trigger shopping mode');

// Line 196
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 202
console.log('📍 Step 3: Wait for shopping feed');

// Line 206
console.log('📍 Step 4: Test vertical swipe down');

// Line 208
await page.waitForTimeout(1000);

// Line 211
console.log('📍 Step 5: Swipe down again (product 3)');

// Line 213
await page.waitForTimeout(1000);

// Line 216
console.log('📍 Step 6: Test vertical swipe up');

// Line 218
await page.waitForTimeout(1000);

// ... 3 more steps ...
```

---

## 69. should complete scraping and make content searchable in chat

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

## 70. should handle scraping errors gracefully

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

## 71. should show progress during long scraping jobs

**Source:** [`__tests__/playwright/scraping/scraping-flow.spec.ts`](/__tests__/playwright/scraping/scraping-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 72. submits data portability request with machine-readable format

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock data portability API |
| 2 | log |  |  | 📍 Step 2: Fill portability request form |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `user@example.com` |  |  |
| 5 | log |  |  | 📍 Step 3: Select machine-readable format |
| 6 | log |  |  | 📍 Step 4: Submit portability request |
| 7 | click |  |  |  |
| 8 | log |  |  | 📍 Step 5: Verify download initiated |
| 9 | log |  |  | 📍 Step 6: Verify success message |

**Code Reference:**

```typescript
// Line 24
console.log('📍 Step 1: Mock data portability API');

// Line 67
console.log('📍 Step 2: Fill portability request form');

// Line 68
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 69
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 71
console.log('📍 Step 3: Select machine-readable format');

// Line 74
console.log('📍 Step 4: Submit portability request');

// Line 76
await page.getByRole('button', { name: /Request Data Portability/i }).click();

// Line 78
console.log('📍 Step 5: Verify download initiated');

// Line 82
console.log('📍 Step 6: Verify success message');

```

---

## 73. submits data rectification request

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 14

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock rectification API |
| 2 | log |  |  | 📍 Step 2: Fill rectification form |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `user@example.com` |  |  |
| 5 | log |  |  | 📍 Step 3: Specify data to correct |
| 6 | fill | `email` |  |  |
| 7 | fill | `old@example.com` |  |  |
| 8 | fill | `user@example.com` |  |  |
| 9 | log |  |  | 📍 Step 4: Add reason for correction |
| 10 | fill | `Email address was updated` |  |  |
| 11 | log |  |  | 📍 Step 5: Submit rectification request |
| 12 | click |  |  |  |
| 13 | log |  |  | 📍 Step 6: Verify request submitted |
| 14 | log |  |  | 📍 Step 7: Verify request ID displayed |

**Code Reference:**

```typescript
// Line 89
console.log('📍 Step 1: Mock rectification API');

// Line 111
console.log('📍 Step 2: Fill rectification form');

// Line 112
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 113
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 115
console.log('📍 Step 3: Specify data to correct');

// Line 116
await page.getByLabel(/Field to Correct/i).fill('email');

// Line 117
await page.getByLabel(/Current Value/i).fill('old@example.com');

// Line 118
await page.getByLabel(/Correct Value/i).fill('user@example.com');

// Line 120
console.log('📍 Step 4: Add reason for correction');

// Line 121
await page.getByLabel(/Reason for Correction/i).fill('Email address was updated');

// ... 4 more steps ...
```

---

## 74. views personal data via access request

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock access request API |
| 2 | log |  |  | 📍 Step 2: Submit access request |
| 3 | fill | `user@example.com` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify personal data displayed |
| 6 | log |  |  | 📍 Step 4: Verify conversation data shown |
| 7 | log |  |  | 📍 Step 5: Verify preferences displayed |
| 8 | log |  |  | 📍 Step 6: Verify data sources listed |

**Code Reference:**

```typescript
// Line 136
console.log('📍 Step 1: Mock access request API');

// Line 169
console.log('📍 Step 2: Submit access request');

// Line 170
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 171
await page.getByRole('button', { name: /View My Data/i }).click();

// Line 173
console.log('📍 Step 3: Verify personal data displayed');

// Line 177
console.log('📍 Step 4: Verify conversation data shown');

// Line 180
console.log('📍 Step 5: Verify preferences displayed');

// Line 184
console.log('📍 Step 6: Verify data sources listed');

```

---

## 75. submits restriction of processing request

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock restriction API |
| 2 | log |  |  | 📍 Step 2: Fill restriction request form |
| 3 | fill | `user@example.com` |  |  |
| 4 | log |  |  | 📍 Step 3: Select processing activities to restrict |
| 5 | log |  |  | 📍 Step 4: Provide reason for restriction |
| 6 | fill | `Pending verification of data accuracy` |  |  |
| 7 | log |  |  | 📍 Step 5: Submit restriction request |
| 8 | click |  |  |  |
| 9 | log |  |  | 📍 Step 6: Verify restriction applied |
| 10 | log |  |  | 📍 Step 7: Verify restricted activities listed |

**Code Reference:**

```typescript
// Line 192
console.log('📍 Step 1: Mock restriction API');

// Line 217
console.log('📍 Step 2: Fill restriction request form');

// Line 218
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 220
console.log('📍 Step 3: Select processing activities to restrict');

// Line 225
console.log('📍 Step 4: Provide reason for restriction');

// Line 226
await page.getByLabel(/Reason/i).fill('Pending verification of data accuracy');

// Line 228
console.log('📍 Step 5: Submit restriction request');

// Line 229
await page.getByRole('button', { name: /Submit Restriction Request/i }).click();

// Line 231
console.log('📍 Step 6: Verify restriction applied');

// Line 234
console.log('📍 Step 7: Verify restricted activities listed');

```

---

## 76. objects to processing based on legitimate grounds

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock objection API |
| 2 | log |  |  | 📍 Step 2: Fill objection form |
| 3 | fill | `user@example.com` |  |  |
| 4 | log |  |  | 📍 Step 3: Select processing type to object to |
| 5 | log |  |  | 📍 Step 4: Provide legitimate grounds for objection |
| 6 | fill | `I object to profiling for automated decision-making as it relates to my particular situation and fundamental rights.` |  |  |
| 7 | log |  |  | 📍 Step 5: Submit objection |
| 8 | click |  |  |  |
| 9 | log |  |  | 📍 Step 6: Verify objection registered |
| 10 | log |  |  | 📍 Step 7: Verify review deadline shown |
| 11 | log |  |  | 📍 Step 8: Verify objection status |

**Code Reference:**

```typescript
// Line 243
console.log('📍 Step 1: Mock objection API');

// Line 266
console.log('📍 Step 2: Fill objection form');

// Line 267
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 269
console.log('📍 Step 3: Select processing type to object to');

// Line 272
console.log('📍 Step 4: Provide legitimate grounds for objection');

// Line 273
await page.getByLabel(/Grounds for Objection/i).fill(
      'I object to profiling for automated decision-making as it relates to my particular situation and fundamental rights.'
    );

// Line 277
console.log('📍 Step 5: Submit objection');

// Line 278
await page.getByRole('button', { name: /Submit Objection/i }).click();

// Line 280
console.log('📍 Step 6: Verify objection registered');

// Line 283
console.log('📍 Step 7: Verify review deadline shown');

// ... 1 more steps ...
```

---

## 77. verifies data portability includes third-party data

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock portability with third-party data |
| 2 | log |  |  | 📍 Step 2: Request data portability |
| 3 | fill | `user@example.com` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify third-party data inclusion notice |

**Code Reference:**

```typescript
// Line 293
console.log('📍 Step 1: Mock portability with third-party data');

// Line 328
console.log('📍 Step 2: Request data portability');

// Line 329
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 333
await page.getByRole('button', { name: /Request Data Portability/i }).click();

// Line 337
console.log('📍 Step 3: Verify third-party data inclusion notice');

```

---

## 78. tracks rectification request status

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock rectification status API |
| 2 | log |  |  | 📍 Step 2: Check rectification status |
| 3 | fill | `rect-123` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify status displayed |
| 6 | log |  |  | 📍 Step 4: Verify progress indicators |
| 7 | log |  |  | 📍 Step 5: Verify timeline shown |

**Code Reference:**

```typescript
// Line 344
console.log('📍 Step 1: Mock rectification status API');

// Line 369
console.log('📍 Step 2: Check rectification status');

// Line 370
await page.getByLabel(/Request ID/i).fill('rect-123');

// Line 371
await page.getByRole('button', { name: /Check Status/i }).click();

// Line 373
console.log('📍 Step 3: Verify status displayed');

// Line 376
console.log('📍 Step 4: Verify progress indicators');

// Line 380
console.log('📍 Step 5: Verify timeline shown');

```

---

## 79. handles access request with no data found

**Source:** [`__tests__/playwright/privacy/user-rights-requests.spec.ts`](/__tests__/playwright/privacy/user-rights-requests.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock access request with no data |
| 2 | log |  |  | 📍 Step 2: Submit access request |
| 3 | fill | `nonexistent@example.com` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify no data message |

**Code Reference:**

```typescript
// Line 388
console.log('📍 Step 1: Mock access request with no data');

// Line 402
console.log('📍 Step 2: Submit access request');

// Line 403
await page.getByLabel(/Email Address/i).fill('nonexistent@example.com');

// Line 404
await page.getByRole('button', { name: /View My Data/i }).click();

// Line 406
console.log('📍 Step 3: Verify no data message');

```

---

## 80. verifies data portability - complete export format validation

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Initiate data export request |
| 2 | log |  |  | 📍 Step 2: Fill export form |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `session-test-123` |  |  |
| 5 | log |  |  | 📍 Step 3: Submit export request |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Verify download initiated |
| 8 | log |  |  | 📍 Step 5: Verify export contains complete data structure |

**Code Reference:**

```typescript
// Line 27
console.log('📍 Step 1: Initiate data export request');

// Line 68
console.log('📍 Step 2: Fill export form');

// Line 69
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 70
await page.getByLabel(/Session ID/i).fill('session-test-123');

// Line 72
console.log('📍 Step 3: Submit export request');

// Line 74
await page.getByRole('button', { name: /Export User Data/i }).click();

// Line 76
console.log('📍 Step 4: Verify download initiated');

// Line 80
console.log('📍 Step 5: Verify export contains complete data structure');

```

---

## 81. executes right to be forgotten - complete data erasure

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock deletion API with verification |
| 2 | log |  |  | 📍 Step 2: Fill deletion form |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `session-forget-me` |  |  |
| 5 | log |  |  | 📍 Step 3: Enable confirmation toggle |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Submit deletion request |
| 8 | click |  |  |  |
| 9 | log |  |  | 📍 Step 5: Verify complete erasure confirmation |
| 10 | log |  |  | 📍 Step 6: Verify audit log updated |
| 11 | click |  |  |  |

**Code Reference:**

```typescript
// Line 89
console.log('📍 Step 1: Mock deletion API with verification');

// Line 114
console.log('📍 Step 2: Fill deletion form');

// Line 115
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 116
await page.getByLabel(/Session ID/i).fill('session-forget-me');

// Line 118
console.log('📍 Step 3: Enable confirmation toggle');

// Line 119
await page.getByLabel(/Confirm deletion request/i).click();

// Line 121
console.log('📍 Step 4: Submit deletion request');

// Line 122
await page.getByRole('button', { name: /Delete User Data/i }).click();

// Line 124
console.log('📍 Step 5: Verify complete erasure confirmation');

// Line 127
console.log('📍 Step 6: Verify audit log updated');

// ... 1 more steps ...
```

---

## 82. manages consent - user opts in to data collection

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to consent management |
| 2 | log |  |  | 📍 Step 2: Enable data collection consent |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Save consent preferences |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify consent saved |

**Code Reference:**

```typescript
// Line 135
console.log('📍 Step 1: Navigate to consent management');

// Line 155
console.log('📍 Step 2: Enable data collection consent');

// Line 157
await consentToggle.click();

// Line 159
console.log('📍 Step 3: Save consent preferences');

// Line 160
await page.getByRole('button', { name: /Save Preferences/i }).click();

// Line 162
console.log('📍 Step 4: Verify consent saved');

```

---

## 83. manages consent - user opts out of data collection

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to consent management |
| 2 | log |  |  | 📍 Step 2: Disable data collection consent |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Save consent preferences |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify consent opt-out saved |

**Code Reference:**

```typescript
// Line 169
console.log('📍 Step 1: Navigate to consent management');

// Line 189
console.log('📍 Step 2: Disable data collection consent');

// Line 193
await consentToggle.click();

// Line 196
console.log('📍 Step 3: Save consent preferences');

// Line 197
await page.getByRole('button', { name: /Save Preferences/i }).click();

// Line 199
console.log('📍 Step 4: Verify consent opt-out saved');

```

---

## 84. withdraws consent - user revokes all consent

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to consent withdrawal |
| 2 | log |  |  | 📍 Step 2: Click withdraw all consent button |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Confirm withdrawal in dialog |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify all consent withdrawn |

**Code Reference:**

```typescript
// Line 206
console.log('📍 Step 1: Navigate to consent withdrawal');

// Line 221
console.log('📍 Step 2: Click withdraw all consent button');

// Line 222
await page.getByRole('button', { name: /Withdraw All Consent/i }).click();

// Line 224
console.log('📍 Step 3: Confirm withdrawal in dialog');

// Line 225
await page.getByRole('button', { name: /Confirm Withdrawal/i }).click();

// Line 227
console.log('📍 Step 4: Verify all consent withdrawn');

```

---

## 85. verifies email notification sent for data export

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock export with email notification |
| 2 | log |  |  | 📍 Step 2: Request export with email |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `user@example.com` |  |  |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 3: Verify email notification indicator |

**Code Reference:**

```typescript
// Line 234
console.log('📍 Step 1: Mock export with email notification');

// Line 258
console.log('📍 Step 2: Request export with email');

// Line 259
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 260
await page.getByLabel(/Email Address/i).fill('user@example.com');

// Line 263
await page.getByRole('button', { name: /Export User Data/i }).click();

// Line 267
console.log('📍 Step 3: Verify email notification indicator');

```

---

## 86. verifies database cleanup after deletion

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock deletion with database verification |
| 2 | log |  |  | 📍 Step 2: Submit deletion request |
| 3 | fill | `example.com` |  |  |
| 4 | fill | `session-verify-db` |  |  |
| 5 | click |  |  |  |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 3: Verify database cleanup confirmation |

**Code Reference:**

```typescript
// Line 274
console.log('📍 Step 1: Mock deletion with database verification');

// Line 297
console.log('📍 Step 2: Submit deletion request');

// Line 298
await page.getByLabel(/Customer Domain/i).fill('example.com');

// Line 299
await page.getByLabel(/Session ID/i).fill('session-verify-db');

// Line 300
await page.getByLabel(/Confirm deletion request/i).click();

// Line 301
await page.getByRole('button', { name: /Delete User Data/i }).click();

// Line 303
console.log('📍 Step 3: Verify database cleanup confirmation');

```

---

## 87. enforces 30-day legal timeframe for data requests

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock audit log with timeframe tracking |
| 2 | log |  |  | 📍 Step 2: View audit log |
| 3 | wait | `500` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify timeframe indicators present |
| 5 | log |  |  | 📍 Step 4: Verify overdue request highlighted |

**Code Reference:**

```typescript
// Line 310
console.log('📍 Step 1: Mock audit log with timeframe tracking');

// Line 347
console.log('📍 Step 2: View audit log');

// Line 348
await page.waitForTimeout(500);

// Line 350
console.log('📍 Step 3: Verify timeframe indicators present');

// Line 354
console.log('📍 Step 4: Verify overdue request highlighted');

```

---

## 88. maintains comprehensive audit trail for compliance

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock detailed audit log |
| 2 | log |  |  | 📍 Step 2: View audit log |
| 3 | wait | `500` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify audit entry contains all required fields |
| 5 | log |  |  | 📍 Step 4: Verify audit log is immutable (no edit buttons) |

**Code Reference:**

```typescript
// Line 362
console.log('📍 Step 1: Mock detailed audit log');

// Line 389
console.log('📍 Step 2: View audit log');

// Line 390
await page.waitForTimeout(500);

// Line 392
console.log('📍 Step 3: Verify audit entry contains all required fields');

// Line 399
console.log('📍 Step 4: Verify audit log is immutable (no edit buttons)');

```

---

## 89. opts out of automated decision-making

**Source:** [`__tests__/playwright/privacy/gdpr-advanced.spec.ts`](/__tests__/playwright/privacy/gdpr-advanced.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to automated decision-making settings |
| 2 | log |  |  | 📍 Step 2: Enable opt-out toggle |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Save preferences |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify opt-out confirmed |

**Code Reference:**

```typescript
// Line 407
console.log('📍 Step 1: Navigate to automated decision-making settings');

// Line 422
console.log('📍 Step 2: Enable opt-out toggle');

// Line 424
await optOutToggle.click();

// Line 426
console.log('📍 Step 3: Save preferences');

// Line 427
await page.getByRole('button', { name: /Save Preferences/i }).click();

// Line 429
console.log('📍 Step 4: Verify opt-out confirmed');

```

---

## 90. displays cookie banner on first visit

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site without consent cookie |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify cookie banner appears |
| 4 | log |  |  | 📍 Step 3: Verify banner contains required elements |

**Code Reference:**

```typescript
// Line 25
console.log('📍 Step 1: Navigate to site without consent cookie');

// Line 26
await page.goto(BASE_URL);

// Line 28
console.log('📍 Step 2: Verify cookie banner appears');

// Line 32
console.log('📍 Step 3: Verify banner contains required elements');

```

---

## 91. accepts all cookies and persists consent

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Click Accept All button |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify banner dismissed |
| 6 | log |  |  | 📍 Step 4: Verify consent cookie set |
| 7 | log |  |  | 📍 Step 5: Reload page and verify banner stays hidden |
| 8 | reload |  |  |  |

**Code Reference:**

```typescript
// Line 42
console.log('📍 Step 1: Navigate to site');

// Line 43
await page.goto(BASE_URL);

// Line 45
console.log('📍 Step 2: Click Accept All button');

// Line 46
await page.getByRole('button', { name: /Accept All|Accept/i }).click();

// Line 48
console.log('📍 Step 3: Verify banner dismissed');

// Line 52
console.log('📍 Step 4: Verify consent cookie set');

// Line 58
console.log('📍 Step 5: Reload page and verify banner stays hidden');

// Line 59
await page.reload();

```

---

## 92. rejects all cookies and limits functionality

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Click Reject All button |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify banner dismissed |
| 6 | log |  |  | 📍 Step 4: Verify rejection cookie set |
| 7 | log |  |  | 📍 Step 5: Verify analytics cookies NOT set |
| 8 | log |  |  | 📍 Step 6: Reload page and verify banner stays hidden |
| 9 | reload |  |  |  |

**Code Reference:**

```typescript
// Line 66
console.log('📍 Step 1: Navigate to site');

// Line 67
await page.goto(BASE_URL);

// Line 69
console.log('📍 Step 2: Click Reject All button');

// Line 70
await page.getByRole('button', { name: /Reject All|Decline|Reject/i }).click();

// Line 72
console.log('📍 Step 3: Verify banner dismissed');

// Line 76
console.log('📍 Step 4: Verify rejection cookie set');

// Line 82
console.log('📍 Step 5: Verify analytics cookies NOT set');

// Line 88
console.log('📍 Step 6: Reload page and verify banner stays hidden');

// Line 89
await page.reload();

```

---

## 93. customizes cookie preferences

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Click Customize/Settings button |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify cookie categories displayed |
| 6 | log |  |  | 📍 Step 4: Verify essential cookies cannot be disabled |
| 7 | log |  |  | 📍 Step 5: Enable only analytics cookies |
| 8 | log |  |  | 📍 Step 6: Save preferences |
| 9 | click |  |  |  |
| 10 | log |  |  | 📍 Step 7: Verify banner dismissed |
| 11 | log |  |  | 📍 Step 8: Verify custom preferences saved in cookie |

**Code Reference:**

```typescript
// Line 96
console.log('📍 Step 1: Navigate to site');

// Line 97
await page.goto(BASE_URL);

// Line 99
console.log('📍 Step 2: Click Customize/Settings button');

// Line 100
await page.getByRole('button', { name: /Customize|Settings|Manage/i }).click();

// Line 102
console.log('📍 Step 3: Verify cookie categories displayed');

// Line 108
console.log('📍 Step 4: Verify essential cookies cannot be disabled');

// Line 112
console.log('📍 Step 5: Enable only analytics cookies');

// Line 121
console.log('📍 Step 6: Save preferences');

// Line 122
await page.getByRole('button', { name: /Save Preferences|Confirm/i }).click();

// Line 124
console.log('📍 Step 7: Verify banner dismissed');

// ... 1 more steps ...
```

---

## 94. persists cookie consent across sessions

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate and accept cookies |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 2: Get consent cookie value |
| 5 | log |  |  | 📍 Step 3: Close and reopen page (simulate new session) |
| 6 | navigate | `BASE_URL` |  |  |
| 7 | log |  |  | 📍 Step 4: Verify banner does not appear |
| 8 | log |  |  | 📍 Step 5: Verify consent cookie still present |

**Code Reference:**

```typescript
// Line 150
console.log('📍 Step 1: Navigate and accept cookies');

// Line 151
await page.goto(BASE_URL);

// Line 152
await page.getByRole('button', { name: /Accept All/i }).click();

// Line 154
console.log('📍 Step 2: Get consent cookie value');

// Line 159
console.log('📍 Step 3: Close and reopen page (simulate new session)');

// Line 162
await newPage.goto(BASE_URL);

// Line 164
console.log('📍 Step 4: Verify banner does not appear');

// Line 168
console.log('📍 Step 5: Verify consent cookie still present');

```

---

## 95. withdraws cookie consent

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 12

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate and accept cookies |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 2: Navigate to privacy settings |
| 5 | navigate | ``${BASE_URL}/privacy-settings`` |  |  |
| 6 | log |  |  | 📍 Step 3: Click withdraw consent button |
| 7 | click |  |  |  |
| 8 | log |  |  | 📍 Step 4: Confirm withdrawal in dialog |
| 9 | click |  |  |  |
| 10 | log |  |  | 📍 Step 5: Verify consent cookie removed |
| 11 | log |  |  | 📍 Step 6: Navigate to homepage and verify banner reappears |
| 12 | navigate | `BASE_URL` |  |  |

**Code Reference:**

```typescript
// Line 178
console.log('📍 Step 1: Navigate and accept cookies');

// Line 179
await page.goto(BASE_URL);

// Line 180
await page.getByRole('button', { name: /Accept All/i }).click();

// Line 182
console.log('📍 Step 2: Navigate to privacy settings');

// Line 183
await page.goto(`${BASE_URL}/privacy-settings`);

// Line 185
console.log('📍 Step 3: Click withdraw consent button');

// Line 186
await page.getByRole('button', { name: /Withdraw Consent|Revoke|Reset/i }).click();

// Line 188
console.log('📍 Step 4: Confirm withdrawal in dialog');

// Line 189
await page.getByRole('button', { name: /Confirm/i }).click();

// Line 191
console.log('📍 Step 5: Verify consent cookie removed');

// ... 2 more steps ...
```

---

## 96. links to cookie policy page

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Click cookie policy link in banner |
| 4 | log |  |  | 📍 Step 3: Verify cookie policy page loaded |
| 5 | log |  |  | 📍 Step 4: Verify policy content present |

**Code Reference:**

```typescript
// Line 208
console.log('📍 Step 1: Navigate to site');

// Line 209
await page.goto(BASE_URL);

// Line 211
console.log('📍 Step 2: Click cookie policy link in banner');

// Line 220
console.log('📍 Step 3: Verify cookie policy page loaded');

// Line 225
console.log('📍 Step 4: Verify policy content present');

```

---

## 97. respects Do Not Track browser setting

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set Do Not Track header |
| 2 | log |  |  | 📍 Step 2: Navigate to site |
| 3 | navigate | `BASE_URL` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify DNT notice displayed in banner |
| 5 | log |  |  | 📍 Step 4: Accept cookies |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 5: Verify analytics cookies NOT set despite acceptance |

**Code Reference:**

```typescript
// Line 233
console.log('📍 Step 1: Set Do Not Track header');

// Line 238
console.log('📍 Step 2: Navigate to site');

// Line 239
await page.goto(BASE_URL);

// Line 241
console.log('📍 Step 3: Verify DNT notice displayed in banner');

// Line 244
console.log('📍 Step 4: Accept cookies');

// Line 245
await page.getByRole('button', { name: /Accept/i }).click();

// Line 247
console.log('📍 Step 5: Verify analytics cookies NOT set despite acceptance');

```

---

## 98. provides cookie details in preferences modal

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to site |
| 2 | navigate | `BASE_URL` |  |  |
| 3 | log |  |  | 📍 Step 2: Open cookie settings |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify detailed cookie information |
| 6 | log |  |  | 📍 Step 4: Verify cookie lifespan information |

**Code Reference:**

```typescript
// Line 258
console.log('📍 Step 1: Navigate to site');

// Line 259
await page.goto(BASE_URL);

// Line 261
console.log('📍 Step 2: Open cookie settings');

// Line 262
await page.getByRole('button', { name: /Customize|Settings/i }).click();

// Line 264
console.log('📍 Step 3: Verify detailed cookie information');

// Line 276
console.log('📍 Step 4: Verify cookie lifespan information');

```

---

## 99. handles consent banner on mobile viewport

**Source:** [`__tests__/playwright/privacy/cookie-consent.spec.ts`](/__tests__/playwright/privacy/cookie-consent.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set mobile viewport |
| 2 | log |  |  | 📍 Step 2: Navigate to site |
| 3 | navigate | `BASE_URL` |  |  |
| 4 | log |  |  | 📍 Step 3: Verify banner is visible and responsive |
| 5 | log |  |  | 📍 Step 4: Verify buttons are stacked vertically (mobile layout) |
| 6 | log |  |  | 📍 Step 5: Accept cookies on mobile |
| 7 | click |  |  |  |
| 8 | log |  |  | 📍 Step 6: Verify banner dismissed |

**Code Reference:**

```typescript
// Line 283
console.log('📍 Step 1: Set mobile viewport');

// Line 286
console.log('📍 Step 2: Navigate to site');

// Line 287
await page.goto(BASE_URL);

// Line 289
console.log('📍 Step 3: Verify banner is visible and responsive');

// Line 293
console.log('📍 Step 4: Verify buttons are stacked vertically (mobile layout)');

// Line 305
console.log('📍 Step 5: Accept cookies on mobile');

// Line 306
await acceptButton.click();

// Line 308
console.log('📍 Step 6: Verify banner dismissed');

```

---

## 100. submits Do Not Sell request

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock Do Not Sell API |
| 2 | log |  |  | 📍 Step 2: Fill Do Not Sell form |
| 3 | fill | `california-business.com` |  |  |
| 4 | fill | `user@california.com` |  |  |
| 5 | log |  |  | 📍 Step 3: Submit Do Not Sell request |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Verify request submitted |
| 8 | log |  |  | 📍 Step 5: Verify confirmation sent |

**Code Reference:**

```typescript
// Line 25
console.log('📍 Step 1: Mock Do Not Sell API');

// Line 46
console.log('📍 Step 2: Fill Do Not Sell form');

// Line 47
await page.getByLabel(/Customer Domain/i).fill('california-business.com');

// Line 48
await page.getByLabel(/Email Address|Session ID/i).fill('user@california.com');

// Line 50
console.log('📍 Step 3: Submit Do Not Sell request');

// Line 51
await page.getByRole('button', { name: /Submit Do Not Sell Request/i }).click();

// Line 53
console.log('📍 Step 4: Verify request submitted');

// Line 56
console.log('📍 Step 5: Verify confirmation sent');

```

---

## 101. confirms Do Not Sell opt-out status

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock Do Not Sell status check |
| 2 | log |  |  | 📍 Step 2: Check Do Not Sell status |
| 3 | fill | `user@california.com` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Verify opt-out status displayed |

**Code Reference:**

```typescript
// Line 63
console.log('📍 Step 1: Mock Do Not Sell status check');

// Line 82
console.log('📍 Step 2: Check Do Not Sell status');

// Line 83
await page.getByLabel(/Email Address/i).fill('user@california.com');

// Line 84
await page.getByRole('button', { name: /Check Status/i }).click();

// Line 86
console.log('📍 Step 3: Verify opt-out status displayed');

```

---

## 102. submits data disclosure request

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock data disclosure API |
| 2 | log |  |  | 📍 Step 2: Fill disclosure request form |
| 3 | fill | `california-business.com` |  |  |
| 4 | fill | `user@california.com` |  |  |
| 5 | log |  |  | 📍 Step 3: Select disclosure categories |
| 6 | log |  |  | 📍 Step 4: Submit disclosure request |
| 7 | click |  |  |  |
| 8 | log |  |  | 📍 Step 5: Verify request submitted |
| 9 | log |  |  | 📍 Step 6: Verify estimated delivery time shown |

**Code Reference:**

```typescript
// Line 94
console.log('📍 Step 1: Mock data disclosure API');

// Line 120
console.log('📍 Step 2: Fill disclosure request form');

// Line 121
await page.getByLabel(/Customer Domain/i).fill('california-business.com');

// Line 122
await page.getByLabel(/Email Address/i).fill('user@california.com');

// Line 124
console.log('📍 Step 3: Select disclosure categories');

// Line 129
console.log('📍 Step 4: Submit disclosure request');

// Line 130
await page.getByRole('button', { name: /Request Data Disclosure/i }).click();

// Line 132
console.log('📍 Step 5: Verify request submitted');

// Line 135
console.log('📍 Step 6: Verify estimated delivery time shown');

```

---

## 103. delivers data disclosure report

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Mock disclosure report delivery |
| 2 | log |  |  | 📍 Step 2: Navigate to disclosure download |
| 3 | fill | `disclosure-456` |  |  |
| 4 | log |  |  | 📍 Step 3: Download disclosure report |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify download initiated |

**Code Reference:**

```typescript
// Line 142
console.log('📍 Step 1: Mock disclosure report delivery');

// Line 183
console.log('📍 Step 2: Navigate to disclosure download');

// Line 184
await page.getByLabel(/Request ID/i).fill('disclosure-456');

// Line 186
console.log('📍 Step 3: Download disclosure report');

// Line 188
await page.getByRole('button', { name: /Download Disclosure Report/i }).click();

// Line 190
console.log('📍 Step 4: Verify download initiated');

```

---

## 104. verifies California consumer rights information displayed

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to CCPA compliance tab |
| 2 | log |  |  | 📍 Step 2: Verify consumer rights header present |
| 3 | log |  |  | 📍 Step 3: Verify right to know |
| 4 | log |  |  | 📍 Step 4: Verify right to delete |
| 5 | log |  |  | 📍 Step 5: Verify right to opt-out of sale |
| 6 | log |  |  | 📍 Step 6: Verify non-discrimination notice |

**Code Reference:**

```typescript
// Line 198
console.log('📍 Step 1: Navigate to CCPA compliance tab');

// Line 201
console.log('📍 Step 2: Verify consumer rights header present');

// Line 204
console.log('📍 Step 3: Verify right to know');

// Line 208
console.log('📍 Step 4: Verify right to delete');

// Line 211
console.log('📍 Step 5: Verify right to opt-out of sale');

// Line 214
console.log('📍 Step 6: Verify non-discrimination notice');

```

---

## 105. enforces Do Not Sell opt-out in chat widget

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Set Do Not Sell opt-out status |
| 2 | log |  |  | 📍 Step 2: Load chat widget with Do Not Sell cookie |
| 3 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 4 | log |  |  | 📍 Step 3: Send chat message |
| 5 | fill | `Hello` |  |  |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Verify Do Not Sell indicator in chat |

**Code Reference:**

```typescript
// Line 222
console.log('📍 Step 1: Set Do Not Sell opt-out status');

// Line 243
console.log('📍 Step 2: Load chat widget with Do Not Sell cookie');

// Line 253
await page.goto(`${BASE_URL}/widget-test`);

// Line 256
console.log('📍 Step 3: Send chat message');

// Line 257
await iframe.locator('input[type="text"]').fill('Hello');

// Line 258
await iframe.locator('button[type="submit"]').click();

// Line 260
console.log('📍 Step 4: Verify Do Not Sell indicator in chat');

```

---

## 106. handles Do Not Sell request with verification

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Submit Do Not Sell request requiring verification |
| 2 | log |  |  | 📍 Step 2: Fill form and submit |
| 3 | fill | `california-business.com` |  |  |
| 4 | fill | `user@california.com` |  |  |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 3: Verify verification email notice |
| 7 | log |  |  | 📍 Step 4: Mock verification link click |
| 8 | navigate | ``${BASE_URL}/privacy/verify?token=verification-token-123`` |  |  |
| 9 | log |  |  | 📍 Step 5: Verify request activated |

**Code Reference:**

```typescript
// Line 267
console.log('📍 Step 1: Submit Do Not Sell request requiring verification');

// Line 283
console.log('📍 Step 2: Fill form and submit');

// Line 284
await page.getByLabel(/Customer Domain/i).fill('california-business.com');

// Line 285
await page.getByLabel(/Email Address/i).fill('user@california.com');

// Line 286
await page.getByRole('button', { name: /Submit Do Not Sell Request/i }).click();

// Line 288
console.log('📍 Step 3: Verify verification email notice');

// Line 292
console.log('📍 Step 4: Mock verification link click');

// Line 305
await page.goto(`${BASE_URL}/privacy/verify?token=verification-token-123`);

// Line 307
console.log('📍 Step 5: Verify request activated');

```

---

## 107. tracks third-party data sharing disclosures

**Source:** [`__tests__/playwright/privacy/ccpa-compliance.spec.ts`](/__tests__/playwright/privacy/ccpa-compliance.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Request third-party sharing disclosure |
| 2 | log |  |  | 📍 Step 2: View third-party sharing disclosures |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 3: Verify sharing partners listed |
| 5 | log |  |  | 📍 Step 4: Verify categories and purposes shown |

**Code Reference:**

```typescript
// Line 314
console.log('📍 Step 1: Request third-party sharing disclosure');

// Line 344
console.log('📍 Step 2: View third-party sharing disclosures');

// Line 345
await page.getByRole('button', { name: /View Third-Party Sharing/i }).click();

// Line 347
console.log('📍 Step 3: Verify sharing partners listed');

// Line 351
console.log('📍 Step 4: Verify categories and purposes shown');

```

---

## 108. complete recommendation workflow: chat → recommendations → click → purchase tracking

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

## 109. recommendation algorithms display correctly

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

## 110. empty state when no recommendations available

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

## 111. click tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 112. purchase tracking without navigation

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 113. recommendation API returns valid data

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 114. invalid API requests return proper errors

**Source:** [`__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts`](/__tests__/playwright/recommendations/product-recommendations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 115. should process order created webhook event

**Source:** [`__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts`](/__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to orders dashboard |
| 2 | navigate | ``${BASE_URL}/dashboard/woocommerce/orders`` |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 72
console.log('📍 Step: Navigate to orders dashboard');

// Line 73
await page.goto(`${BASE_URL}/dashboard/woocommerce/orders`, { waitUntil: 'networkidle' });

// Line 74
await page.waitForTimeout(2000);

```

---

## 116. should handle order status update webhooks

**Source:** [`__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts`](/__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to orders view |
| 2 | navigate | ``${BASE_URL}/dashboard/woocommerce/orders`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying order status |

**Code Reference:**

```typescript
// Line 133
console.log('📍 Step: Navigate to orders view');

// Line 134
await page.goto(`${BASE_URL}/dashboard/woocommerce/orders`, { waitUntil: 'networkidle' });

// Line 135
await page.waitForTimeout(2000);

// Line 138
console.log('📍 Step: Verifying order status');

```

---

## 117. should handle webhook delivery failures

**Source:** [`__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts`](/__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to webhook logs |
| 2 | navigate | ``${BASE_URL}/dashboard/woocommerce/webhooks`` |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 185
console.log('📍 Step: Navigate to webhook logs');

// Line 186
await page.goto(`${BASE_URL}/dashboard/woocommerce/webhooks`, { waitUntil: 'networkidle' });

// Line 187
await page.waitForTimeout(2000);

```

---

## 118. should trigger re-authentication flow for expired credentials

**Source:** [`__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts`](/__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to WooCommerce integration |
| 2 | log |  |  | 📍 Step: Clicking re-authenticate button |
| 3 | click |  |  |  |
| 4 | wait | `1000` |  |  |
| 5 | log |  |  | 📍 Step: Entering new credentials |
| 6 | click |  |  |  |
| 7 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 210
console.log('📍 Step: Navigate to WooCommerce integration');

// Line 224
console.log('📍 Step: Clicking re-authenticate button');

// Line 231
await reAuthButton.click();

// Line 232
await page.waitForTimeout(1000);

// Line 235
console.log('📍 Step: Entering new credentials');

// Line 255
await saveButton.click();

// Line 257
await page.waitForTimeout(2000);

```

---

## 119. should validate webhook signature security

**Source:** [`__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts`](/__tests__/playwright/integrations/woocommerce-webhooks-auth.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to webhook settings |
| 2 | navigate | ``${BASE_URL}/dashboard/woocommerce/webhooks/settings`` |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 316
console.log('📍 Step: Navigate to webhook settings');

// Line 317
await page.goto(`${BASE_URL}/dashboard/woocommerce/webhooks/settings`, { waitUntil: 'networkidle' });

// Line 318
await page.waitForTimeout(2000);

```

---

## 120. should sync full product catalog successfully

**Source:** [`__tests__/playwright/integrations/woocommerce-product-sync.spec.ts`](/__tests__/playwright/integrations/woocommerce-product-sync.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Clicking sync products button |
| 2 | click |  |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying sync success |

**Code Reference:**

```typescript
// Line 61
console.log('📍 Step: Clicking sync products button');

// Line 63
await syncButton.click();

// Line 66
await page.waitForTimeout(2000);

// Line 69
console.log('📍 Step: Verifying sync success');

```

---

## 121. should handle incremental product updates

**Source:** [`__tests__/playwright/integrations/woocommerce-product-sync.spec.ts`](/__tests__/playwright/integrations/woocommerce-product-sync.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Triggering incremental sync |
| 2 | click |  |  |  |
| 3 | click |  |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step: Verifying incremental sync results |

**Code Reference:**

```typescript
// Line 115
console.log('📍 Step: Triggering incremental sync');

// Line 123
await incrementalSync.click();

// Line 126
await syncButton.click();

// Line 129
await page.waitForTimeout(2000);

// Line 132
console.log('📍 Step: Verifying incremental sync results');

```

---

## 122. should sync product variants correctly

**Source:** [`__tests__/playwright/integrations/woocommerce-product-sync.spec.ts`](/__tests__/playwright/integrations/woocommerce-product-sync.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Syncing products with variants |
| 2 | click |  |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying variant sync |

**Code Reference:**

```typescript
// Line 178
console.log('📍 Step: Syncing products with variants');

// Line 180
await syncButton.click();

// Line 182
await page.waitForTimeout(2000);

// Line 185
console.log('📍 Step: Verifying variant sync');

```

---

## 123. should handle product sync errors gracefully

**Source:** [`__tests__/playwright/integrations/woocommerce-product-sync.spec.ts`](/__tests__/playwright/integrations/woocommerce-product-sync.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Triggering sync that will fail |
| 2 | click |  |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying error message displayed |

**Code Reference:**

```typescript
// Line 229
console.log('📍 Step: Triggering sync that will fail');

// Line 231
await syncButton.click();

// Line 233
await page.waitForTimeout(2000);

// Line 236
console.log('📍 Step: Verifying error message displayed');

```

---

## 124. should display sync progress in real-time

**Source:** [`__tests__/playwright/integrations/woocommerce-product-sync.spec.ts`](/__tests__/playwright/integrations/woocommerce-product-sync.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Starting sync |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step: Checking for progress indicator |
| 4 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 298
console.log('📍 Step: Starting sync');

// Line 300
await syncButton.click();

// Line 303
console.log('📍 Step: Checking for progress indicator');

// Line 313
await page.waitForTimeout(2000);

```

---

## 125. should complete WooCommerce setup and enable product search

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

## 126. should handle WooCommerce connection errors gracefully

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

## 127. should setup cart tracking successfully

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to WooCommerce integration |
| 2 | log |  |  | 📍 Step: Enabling cart tracking |
| 3 | click |  |  |  |
| 4 | wait | `1000` |  |  |
| 5 | click |  |  |  |
| 6 | wait | `2000` |  |  |
| 7 | log |  |  | 📍 Step: Verifying cart tracking enabled |

**Code Reference:**

```typescript
// Line 48
console.log('📍 Step: Navigate to WooCommerce integration');

// Line 58
console.log('📍 Step: Enabling cart tracking');

// Line 66
await cartTrackingToggle.click();

// Line 67
await page.waitForTimeout(1000);

// Line 72
await saveButton.click();

// Line 74
await page.waitForTimeout(2000);

// Line 77
console.log('📍 Step: Verifying cart tracking enabled');

```

---

## 128. should detect abandoned carts

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to abandoned carts view |
| 2 | navigate | ``${BASE_URL}/dashboard/woocommerce/abandoned-carts`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying abandoned carts displayed |

**Code Reference:**

```typescript
// Line 132
console.log('📍 Step: Navigate to abandoned carts view');

// Line 133
await page.goto(`${BASE_URL}/dashboard/woocommerce/abandoned-carts`, { waitUntil: 'networkidle' });

// Line 135
await page.waitForTimeout(2000);

// Line 138
console.log('📍 Step: Verifying abandoned carts displayed');

```

---

## 129. should trigger abandoned cart email

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/dashboard/woocommerce/abandoned-carts`` |  |  |
| 2 | wait | `2000` |  |  |
| 3 | log |  |  | 📍 Step: Clicking send recovery email button |
| 4 | click |  |  |  |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step: Verifying email sent confirmation |

**Code Reference:**

```typescript
// Line 192
await page.goto(`${BASE_URL}/dashboard/woocommerce/abandoned-carts`, { waitUntil: 'networkidle' });

// Line 193
await page.waitForTimeout(2000);

// Line 196
console.log('📍 Step: Clicking send recovery email button');

// Line 200
await sendEmailButton.click();

// Line 202
await page.waitForTimeout(2000);

// Line 205
console.log('📍 Step: Verifying email sent confirmation');

```

---

## 130. should track cart recovery success

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to cart analytics |
| 2 | navigate | ``${BASE_URL}/dashboard/analytics`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying cart recovery metrics |

**Code Reference:**

```typescript
// Line 248
console.log('📍 Step: Navigate to cart analytics');

// Line 249
await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

// Line 250
await page.waitForTimeout(2000);

// Line 253
console.log('📍 Step: Verifying cart recovery metrics');

```

---

## 131. should handle cart tracking webhook events

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-tracking.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Simulating cart creation via chat widget |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | fill | `Show me products` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step: Verifying cart tracking webhook integration |
| 7 | navigate | ``${BASE_URL}/dashboard/woocommerce/cart-tracking`` |  |  |
| 8 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 288
console.log('📍 Step: Simulating cart creation via chat widget');

// Line 289
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 306
await input.fill('Show me products');

// Line 309
await sendButton.click();

// Line 311
await page.waitForTimeout(3000);

// Line 314
console.log('📍 Step: Verifying cart tracking webhook integration');

// Line 317
await page.goto(`${BASE_URL}/dashboard/woocommerce/cart-tracking`, { waitUntil: 'networkidle' });

// Line 318
await page.waitForTimeout(1000);

```

---

## 132. should maintain cart session across messages

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

## 133. should handle Store API failures gracefully

**Source:** [`__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts`](/__tests__/playwright/integrations/woocommerce-cart-operations-e2e.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 134. should lookup product by Shopify product ID

**Source:** [`__tests__/playwright/integrations/shopify-product-operations.spec.ts`](/__tests__/playwright/integrations/shopify-product-operations.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to chat widget |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step: Query product by ID |
| 4 | fill | `Show me product ID 123456789` |  |  |
| 5 | click |  |  |  |
| 6 | wait | `3000` |  |  |
| 7 | log |  |  | 📍 Step: Verifying product details |

**Code Reference:**

```typescript
// Line 72
console.log('📍 Step: Navigate to chat widget');

// Line 73
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 93
console.log('📍 Step: Query product by ID');

// Line 95
await input.fill('Show me product ID 123456789');

// Line 98
await sendButton.click();

// Line 100
await page.waitForTimeout(3000);

// Line 103
console.log('📍 Step: Verifying product details');

```

---

## 135. should lookup product by SKU

**Source:** [`__tests__/playwright/integrations/shopify-product-operations.spec.ts`](/__tests__/playwright/integrations/shopify-product-operations.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step: Search by SKU |
| 3 | fill | `Do you have SKU TWH-BLK-001?` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step: Verifying SKU search result |

**Code Reference:**

```typescript
// Line 153
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 168
console.log('📍 Step: Search by SKU');

// Line 170
await input.fill('Do you have SKU TWH-BLK-001?');

// Line 173
await sendButton.click();

// Line 175
await page.waitForTimeout(3000);

// Line 178
console.log('📍 Step: Verifying SKU search result');

```

---

## 136. should search products by title

**Source:** [`__tests__/playwright/integrations/shopify-product-operations.spec.ts`](/__tests__/playwright/integrations/shopify-product-operations.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step: Search products by title |
| 3 | fill | `Show me headphones` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step: Verifying search results |

**Code Reference:**

```typescript
// Line 238
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 253
console.log('📍 Step: Search products by title');

// Line 255
await input.fill('Show me headphones');

// Line 258
await sendButton.click();

// Line 260
await page.waitForTimeout(3000);

// Line 263
console.log('📍 Step: Verifying search results');

```

---

## 137. should sync product inventory in real-time

**Source:** [`__tests__/playwright/integrations/shopify-product-operations.spec.ts`](/__tests__/playwright/integrations/shopify-product-operations.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to Shopify inventory dashboard |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify/inventory`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Triggering inventory sync |
| 5 | click |  |  |  |
| 6 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 295
console.log('📍 Step: Navigate to Shopify inventory dashboard');

// Line 296
await page.goto(`${BASE_URL}/dashboard/shopify/inventory`, { waitUntil: 'networkidle' });

// Line 297
await page.waitForTimeout(2000);

// Line 308
console.log('📍 Step: Triggering inventory sync');

// Line 313
await syncButton.click();

// Line 314
await page.waitForTimeout(2000);

```

---

## 138. should handle product variant selection

**Source:** [`__tests__/playwright/integrations/shopify-product-operations.spec.ts`](/__tests__/playwright/integrations/shopify-product-operations.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step: Query product with variants |
| 3 | fill | `Do you have T-Shirts?` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `3000` |  |  |
| 6 | log |  |  | 📍 Step: Verifying variant details |

**Code Reference:**

```typescript
// Line 358
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 373
console.log('📍 Step: Query product with variants');

// Line 375
await input.fill('Do you have T-Shirts?');

// Line 378
await sendButton.click();

// Line 380
await page.waitForTimeout(3000);

// Line 383
console.log('📍 Step: Verifying variant details');

```

---

## 139. should setup order tracking

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to Shopify integration |
| 2 | navigate | ``${BASE_URL}/dashboard/integrations/shopify`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Enabling order tracking |
| 5 | click |  |  |  |
| 6 | wait | `1000` |  |  |
| 7 | click |  |  |  |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step: Verifying order tracking enabled |

**Code Reference:**

```typescript
// Line 48
console.log('📍 Step: Navigate to Shopify integration');

// Line 49
await page.goto(`${BASE_URL}/dashboard/integrations/shopify`, { waitUntil: 'networkidle' });

// Line 50
await page.waitForTimeout(2000);

// Line 53
console.log('📍 Step: Enabling order tracking');

// Line 58
await orderTrackingToggle.click();

// Line 59
await page.waitForTimeout(1000);

// Line 64
await saveButton.click();

// Line 66
await page.waitForTimeout(2000);

// Line 69
console.log('📍 Step: Verifying order tracking enabled');

```

---

## 140. should query order status

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to order lookup |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify/orders`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Searching for order #1001 |
| 5 | fill | `1001` |  |  |
| 6 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 116
console.log('📍 Step: Navigate to order lookup');

// Line 117
await page.goto(`${BASE_URL}/dashboard/shopify/orders`, { waitUntil: 'networkidle' });

// Line 118
await page.waitForTimeout(2000);

// Line 121
console.log('📍 Step: Searching for order #1001');

// Line 126
await searchInput.fill('1001');

// Line 127
await page.waitForTimeout(1000);

```

---

## 141. should lookup customer information

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to customer lookup |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify/customers`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Searching for customer |
| 5 | fill | `customer@example.com` |  |  |
| 6 | click |  |  |  |
| 7 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 196
console.log('📍 Step: Navigate to customer lookup');

// Line 197
await page.goto(`${BASE_URL}/dashboard/shopify/customers`, { waitUntil: 'networkidle' });

// Line 198
await page.waitForTimeout(2000);

// Line 201
console.log('📍 Step: Searching for customer');

// Line 206
await emailInput.fill('customer@example.com');

// Line 209
await searchButton.click();

// Line 211
await page.waitForTimeout(2000);

```

---

## 142. should process Shopify webhook events

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to webhook logs |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify/webhooks`` |  |  |
| 3 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 282
console.log('📍 Step: Navigate to webhook logs');

// Line 283
await page.goto(`${BASE_URL}/dashboard/shopify/webhooks`, { waitUntil: 'networkidle' });

// Line 284
await page.waitForTimeout(2000);

```

---

## 143. should handle Shopify API rate limiting

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Triggering API request that hits rate limit |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify/products`` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step: Verifying rate limit warning |
| 6 | wait | `3000` |  |  |

**Code Reference:**

```typescript
// Line 330
console.log('📍 Step: Triggering API request that hits rate limit');

// Line 331
await page.goto(`${BASE_URL}/dashboard/shopify/products`, { waitUntil: 'networkidle' });

// Line 332
await page.waitForTimeout(1000);

// Line 338
await syncButton.click();

// Line 341
console.log('📍 Step: Verifying rate limit warning');

// Line 350
await page.waitForTimeout(3000);

```

---

## 144. should re-authenticate with Shopify

**Source:** [`__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts`](/__tests__/playwright/integrations/shopify-orders-webhooks.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to Shopify dashboard (triggers auth check) |
| 2 | navigate | ``${BASE_URL}/dashboard/shopify`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Clicking re-authenticate button |
| 5 | click |  |  |  |
| 6 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 384
console.log('📍 Step: Navigate to Shopify dashboard (triggers auth check)');

// Line 385
await page.goto(`${BASE_URL}/dashboard/shopify`, { waitUntil: 'networkidle' });

// Line 386
await page.waitForTimeout(2000);

// Line 412
console.log('📍 Step: Clicking re-authenticate button');

// Line 413
await reAuthButton.click();

// Line 415
await page.waitForTimeout(2000);

```

---

## 145. should initialize event tracking on widget load

**Source:** [`__tests__/playwright/integrations/analytics-event-tracking.spec.ts`](/__tests__/playwright/integrations/analytics-event-tracking.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Loading chat widget |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Verifying tracking initialization |

**Code Reference:**

```typescript
// Line 73
console.log('📍 Step: Loading chat widget');

// Line 74
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 79
await page.waitForTimeout(2000);

// Line 82
console.log('📍 Step: Verifying tracking initialization');

```

---

## 146. should track user interaction events

**Source:** [`__tests__/playwright/integrations/analytics-event-tracking.spec.ts`](/__tests__/playwright/integrations/analytics-event-tracking.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Loading widget and interacting |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | wait | `1000` |  |  |
| 4 | fill | `Hello, I need help` |  |  |
| 5 | wait | `500` |  |  |
| 6 | click |  |  |  |
| 7 | wait | `2000` |  |  |
| 8 | log |  |  | 📍 Step: Verifying captured events |

**Code Reference:**

```typescript
// Line 108
console.log('📍 Step: Loading widget and interacting');

// Line 109
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 114
await page.waitForTimeout(1000);

// Line 118
await input.fill('Hello, I need help');

// Line 121
await page.waitForTimeout(500);

// Line 125
await sendButton.click();

// Line 128
await page.waitForTimeout(2000);

// Line 131
console.log('📍 Step: Verifying captured events');

```

---

## 147. should track purchase completion events

**Source:** [`__tests__/playwright/integrations/analytics-event-tracking.spec.ts`](/__tests__/playwright/integrations/analytics-event-tracking.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Simulating purchase flow |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | fill | `Show me premium products` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `2000` |  |  |
| 6 | wait | `2000` |  |  |
| 7 | log |  |  | 📍 Step: Verifying purchase event captured |

**Code Reference:**

```typescript
// Line 177
console.log('📍 Step: Simulating purchase flow');

// Line 178
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 183
await input.fill('Show me premium products');

// Line 186
await sendButton.click();

// Line 188
await page.waitForTimeout(2000);

// Line 212
await page.waitForTimeout(2000);

// Line 215
console.log('📍 Step: Verifying purchase event captured');

```

---

## 148. should create and track custom events

**Source:** [`__tests__/playwright/integrations/analytics-event-tracking.spec.ts`](/__tests__/playwright/integrations/analytics-event-tracking.spec.ts)

**Total Steps:** 14

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to analytics dashboard |
| 2 | navigate | ``${BASE_URL}/dashboard/analytics/custom-events`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Creating custom event |
| 5 | click |  |  |  |
| 6 | wait | `1000` |  |  |
| 7 | fill | `newsletter_signup` |  |  |
| 8 | click |  |  |  |
| 9 | wait | `500` |  |  |
| 10 | fill | `email` |  |  |
| 11 | click |  |  |  |
| 12 | wait | `2000` |  |  |
| 13 | log |  |  | 📍 Step: Triggering custom event |
| 14 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 247
console.log('📍 Step: Navigate to analytics dashboard');

// Line 248
await page.goto(`${BASE_URL}/dashboard/analytics/custom-events`, { waitUntil: 'networkidle' });

// Line 249
await page.waitForTimeout(2000);

// Line 252
console.log('📍 Step: Creating custom event');

// Line 257
await createButton.click();

// Line 258
await page.waitForTimeout(1000);

// Line 265
await eventNameInput.fill('newsletter_signup');

// Line 279
await addPropertyButton.click();

// Line 280
await page.waitForTimeout(500);

// Line 283
await propNameInput.fill('email');

// ... 4 more steps ...
```

---

## 149. should export analytics data

**Source:** [`__tests__/playwright/integrations/analytics-event-tracking.spec.ts`](/__tests__/playwright/integrations/analytics-event-tracking.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step: Navigate to analytics dashboard |
| 2 | navigate | ``${BASE_URL}/dashboard/analytics`` |  |  |
| 3 | wait | `2000` |  |  |
| 4 | log |  |  | 📍 Step: Clicking export button |
| 5 | click |  |  |  |
| 6 | wait | `1000` |  |  |
| 7 | click |  |  |  |

**Code Reference:**

```typescript
// Line 359
console.log('📍 Step: Navigate to analytics dashboard');

// Line 360
await page.goto(`${BASE_URL}/dashboard/analytics`, { waitUntil: 'networkidle' });

// Line 361
await page.waitForTimeout(2000);

// Line 364
console.log('📍 Step: Clicking export button');

// Line 372
await exportButton.click();

// Line 373
await page.waitForTimeout(1000);

// Line 380
await csvOption.click();

```

---

## 150. should enforce rate limits and allow retry after cooldown

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

## 151. should handle payment failure and allow retry with cart preserved

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

## 152. should handle network timeout and allow successful retry

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

## 153. should handle invalid WooCommerce credentials and allow correction

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

## 154. should detect concurrent edits and provide conflict resolution

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

## 155. should prevent concurrent scraping and allow retry after completion

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

## 156. should install and customize widget successfully

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

## 157. should generate correct embed code for different environments

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

## 158. should handle widget customization with invalid values

**Source:** [`__tests__/playwright/dashboard/widget-installation.spec.ts`](/__tests__/playwright/dashboard/widget-installation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 159. should add and configure domain successfully

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

## 160. should handle domain editing

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 161. should handle domain deletion/disabling

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 162. should enforce domain access control

**Source:** [`__tests__/playwright/dashboard/domain-configuration.spec.ts`](/__tests__/playwright/dashboard/domain-configuration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 163. should filter conversations by sentiment

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 164. should filter conversations by domain

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 165. should filter conversations by customer email

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 166. should combine multiple filters

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 167. should clear all filters and reset results

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 168. should complete full filtering user journey

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 
📍 Step 1: Viewing all conversations |
| 2 | log |  |  | 
📍 Step 2: Filter by negative sentiment |
| 3 | log |  |  | 
📍 Step 3: Add domain filter |
| 4 | log |  |  | 
📍 Step 4: Clear all filters |
| 5 | log |  |  | 
📍 Step 5: Filter by email |

**Code Reference:**

```typescript
// Line 199
console.log('\n📍 Step 1: Viewing all conversations');

// Line 204
console.log('\n📍 Step 2: Filter by negative sentiment');

// Line 219
console.log('\n📍 Step 3: Add domain filter');

// Line 231
console.log('\n📍 Step 4: Clear all filters');

// Line 238
console.log('\n📍 Step 5: Filter by email');

```

---

## 169. should handle filter panel interactions smoothly

**Source:** [`__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts`](/__tests__/playwright/dashboard/conversations-advanced-filters.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 266
await page.waitForTimeout(500);

```

---

## 170. complete search workflow: search → results → view conversation with highlight

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

## 171. search with advanced filters: date range and status filtering

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

## 172. handles empty search results gracefully

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

## 173. search with special characters and edge cases

**Source:** [`__tests__/playwright/dashboard/chat-history-search.spec.ts`](/__tests__/playwright/dashboard/chat-history-search.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 174. keyboard navigation and shortcuts in search

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

## 175. search result persistence and back navigation

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

## 176. should support custom date range selection with presets

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `500` |  |  |
| 2 | wait | `300` |  |  |

**Code Reference:**

```typescript
// Line 65
await page.waitForTimeout(500);

// Line 72
await page.waitForTimeout(300);

```

---

## 177. should enable comparison mode and display change indicators

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 178. should display anomaly alerts with severity badges

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | reload |  |  |  |
| 2 | click |  |  |  |
| 3 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 120
await page.reload({ waitUntil: 'networkidle' });

// Line 150
await dismissButton.click();

// Line 151
await page.waitForTimeout(500);

```

---

## 179. should create, display, and manage metric goals

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 170
await page.waitForTimeout(1000);

```

---

## 180. should create, display, and interact with chart annotations

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `2000` |  |  |
| 2 | click |  |  |  |
| 3 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 203
await page.waitForTimeout(2000);

// Line 213
await annotationMarkers.click();

// Line 214
await page.waitForTimeout(500);

```

---

## 181. should use all features together in realistic workflow

**Source:** [`__tests__/playwright/dashboard/analytics-new-features.spec.ts`](/__tests__/playwright/dashboard/analytics-new-features.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `500` |  |  |
| 2 | wait | `500` |  |  |
| 3 | wait | `1500` |  |  |

**Code Reference:**

```typescript
// Line 248
await page.waitForTimeout(500);

// Line 269
await page.waitForTimeout(500);

// Line 278
await page.waitForTimeout(1500);

```

---

## 182. CSV export endpoint: verify availability and response

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

## 183. JSON analytics endpoint: verify data structure

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

## 184. Export formats: test all supported formats

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 185. Date range parameters: test different time periods

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 186. Error handling: test invalid parameters

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

## 187. Export workflow documentation for AI agents

**Source:** [`__tests__/playwright/dashboard/analytics-exports-simple.spec.ts`](/__tests__/playwright/dashboard/analytics-exports-simple.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 188. should display complete page header with all controls

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 189. should switch time ranges and reload data

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 190. should toggle auto-refresh on and off

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 191. should manually refresh analytics data

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 192. should display all Overview Tab components

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 193. should display Business Intelligence Tab components

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 194. should open export dropdown and show all options

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 195. should handle empty data gracefully on Overview tab

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | reload |  |  |  |

**Code Reference:**

```typescript
// Line 198
await page.reload({ waitUntil: 'networkidle' });

```

---

## 196. should handle API errors with error alert

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | reload |  |  |  |

**Code Reference:**

```typescript
// Line 238
await page.reload({ waitUntil: 'networkidle' });

```

---

## 197. should complete full user journey through all features

**Source:** [`__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts`](/__tests__/playwright/dashboard/analytics-dashboard-complete.spec.ts)

**Total Steps:** 1

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 275
await page.waitForTimeout(500);

```

---

## 198. should maintain context across multiple conversation turns

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

## 199. should handle conversation with context reset

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 200. should handle very long conversations

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 201. should handle ambiguous pronouns

**Source:** [`__tests__/playwright/chat/multi-turn-chat.spec.ts`](/__tests__/playwright/chat/multi-turn-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 202. should search for products by name

**Source:** [`__tests__/playwright/core-journeys/search-product-name.spec.ts`](/__tests__/playwright/core-journeys/search-product-name.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to shop page |
| 2 | log |  |  | 📍 Step 2: Look for search field |
| 3 | log |  |  | 📍 Step 3: Enter search term |
| 4 | fill | `pump` |  |  |
| 5 | log |  |  | 📍 Step 4: Submit search |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 5: Verify search results page |
| 8 | log |  |  | 📍 Step 6: Look for product results |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to shop page');

// Line 36
console.log('📍 Step 2: Look for search field');

// Line 45
console.log('📍 Step 3: Enter search term');

// Line 46
await searchInput.fill('pump');

// Line 48
console.log('📍 Step 4: Submit search');

// Line 53
await searchButton.click();

// Line 60
console.log('📍 Step 5: Verify search results page');

// Line 70
console.log('📍 Step 6: Look for product results');

```

---

## 203. should display no results message for invalid search

**Source:** [`__tests__/playwright/core-journeys/search-product-name.spec.ts`](/__tests__/playwright/core-journeys/search-product-name.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Search for non-existent product |
| 2 | fill | `xyz123nonexistent999` |  |  |
| 3 | log |  |  | 📍 Step 2: Look for no results message |

**Code Reference:**

```typescript
// Line 97
console.log('📍 Step 1: Search for non-existent product');

// Line 98
await searchInput.fill('xyz123nonexistent999');

// Line 102
console.log('📍 Step 2: Look for no results message');

```

---

## 204. should show search query in results

**Source:** [`__tests__/playwright/core-journeys/search-product-name.spec.ts`](/__tests__/playwright/core-journeys/search-product-name.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Perform search |
| 2 | fill | `searchTerm` |  |  |
| 3 | log |  |  | 📍 Step 2: Check if search term displayed in results |

**Code Reference:**

```typescript
// Line 129
console.log('📍 Step 1: Perform search');

// Line 131
await searchInput.fill(searchTerm);

// Line 135
console.log('📍 Step 2: Check if search term displayed in results');

```

---

## 205. should select shipping method and update total

**Source:** [`__tests__/playwright/core-journeys/purchase-shipping-variations.spec.ts`](/__tests__/playwright/core-journeys/purchase-shipping-variations.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Add product and navigate to checkout |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 2: Fill shipping address |
| 5 | log |  |  | 📍 Step 3: Look for shipping method options |
| 6 | log |  |  | 📍 Step 4: Get initial order total |
| 7 | log |  |  | 📍 Step 5: Select first shipping method |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step 6: Select alternative shipping method |
| 10 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 39
console.log('📍 Step 1: Add product and navigate to checkout');

// Line 40
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 52
await checkoutButton.click();

// Line 55
console.log('📍 Step 2: Fill shipping address');

// Line 58
console.log('📍 Step 3: Look for shipping method options');

// Line 64
console.log('📍 Step 4: Get initial order total');

// Line 69
console.log('📍 Step 5: Select first shipping method');

// Line 71
await productPage.waitForTimeout(2000);

// Line 74
console.log('📍 Step 6: Select alternative shipping method');

// Line 76
await productPage.waitForTimeout(2000);

```

---

## 206. should calculate shipping for different countries

**Source:** [`__tests__/playwright/core-journeys/purchase-shipping-variations.spec.ts`](/__tests__/playwright/core-journeys/purchase-shipping-variations.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step 1: Select international country |
| 4 | log |  |  | 📍 Step 2: Change to UK |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 3: Fill remaining address fields |
| 7 | fill | `SW1A 1AA` |  |  |
| 8 | fill | `London` |  |  |
| 9 | wait | `2000` |  |  |

**Code Reference:**

```typescript
// Line 95
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 107
await checkoutButton.click();

// Line 110
console.log('📍 Step 1: Select international country');

// Line 115
console.log('📍 Step 2: Change to UK');

// Line 117
await productPage.waitForTimeout(2000);

// Line 119
console.log('📍 Step 3: Fill remaining address fields');

// Line 120
await productPage.locator('input[name="billing_postcode"]').fill('SW1A 1AA');

// Line 121
await productPage.locator('input[name="billing_city"]').fill('London');

// Line 122
await productPage.waitForTimeout(2000);

```

---

## 207. should display multiple payment methods

**Source:** [`__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts`](/__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to checkout |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 2: Fill checkout form |
| 5 | log |  |  | 📍 Step 3: Find payment method options |
| 6 | log |  |  | 📍 Step 4: Verify payment method labels |

**Code Reference:**

```typescript
// Line 38
console.log('📍 Step 1: Navigate to checkout');

// Line 39
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 51
await checkoutButton.click();

// Line 54
console.log('📍 Step 2: Fill checkout form');

// Line 57
console.log('📍 Step 3: Find payment method options');

// Line 63
console.log('📍 Step 4: Verify payment method labels');

```

---

## 208. should switch between payment methods

**Source:** [`__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts`](/__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step 1: Select first payment method |
| 4 | log |  |  | 📍 Step 2: Select first method |
| 5 | wait | `1000` |  |  |
| 6 | log |  |  | 📍 Step 3: Switch to second method |
| 7 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 82
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 94
await checkoutButton.click();

// Line 98
console.log('📍 Step 1: Select first payment method');

// Line 103
console.log('📍 Step 2: Select first method');

// Line 105
await productPage.waitForTimeout(1000);

// Line 110
console.log('📍 Step 3: Switch to second method');

// Line 112
await productPage.waitForTimeout(1000);

```

---

## 209. should display payment instructions for selected method

**Source:** [`__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts`](/__tests__/playwright/core-journeys/purchase-payment-methods.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step 1: Select payment method |
| 4 | wait | `1000` |  |  |
| 5 | log |  |  | 📍 Step 2: Look for payment instructions |

**Code Reference:**

```typescript
// Line 129
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 141
await checkoutButton.click();

// Line 145
console.log('📍 Step 1: Select payment method');

// Line 151
await productPage.waitForTimeout(1000);

// Line 153
console.log('📍 Step 2: Look for payment instructions');

```

---

## 210. should display complete order confirmation details

**Source:** [`__tests__/playwright/core-journeys/purchase-order-confirmation.spec.ts`](/__tests__/playwright/core-journeys/purchase-order-confirmation.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1-10: Complete purchase flow |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 11: Verify order number displayed |
| 5 | log |  |  | 📍 Step 12: Check for email confirmation notice |
| 6 | log |  |  | 📍 Step 13: Verify order details section exists |

**Code Reference:**

```typescript
// Line 41
console.log('📍 Step 1-10: Complete purchase flow');

// Line 42
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 54
await checkoutButton.click();

// Line 64
console.log('📍 Step 11: Verify order number displayed');

// Line 76
console.log('📍 Step 12: Check for email confirmation notice');

// Line 86
console.log('📍 Step 13: Verify order details section exists');

```

---

## 211. should show customer billing information on confirmation

**Source:** [`__tests__/playwright/core-journeys/purchase-order-confirmation.spec.ts`](/__tests__/playwright/core-journeys/purchase-order-confirmation.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | click |  |  |  |
| 3 | log |  |  | 📍 Step 1: Look for billing address section |
| 4 | log |  |  | 📍 Step 2: Verify customer name displayed |

**Code Reference:**

```typescript
// Line 100
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 112
await checkoutButton.click();

// Line 122
console.log('📍 Step 1: Look for billing address section');

// Line 129
console.log('📍 Step 2: Verify customer name displayed');

```

---

## 212. should complete guest checkout with valid billing info

**Source:** [`__tests__/playwright/core-journeys/purchase-guest-checkout.spec.ts`](/__tests__/playwright/core-journeys/purchase-guest-checkout.spec.ts)

**Total Steps:** 21

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for chat widget to load |
| 4 | log |  |  | 📍 Step 3: Mock chat API for product query |
| 5 | log |  |  | 📍 Step 4: Send product query via chat |
| 6 | wait | `3000` |  |  |
| 7 | log |  |  | 📍 Step 5: Verify chat response received |
| 8 | log |  |  | 📍 Step 6: Click product link from chat |
| 9 | log |  |  | 📍 Step 7: Verify product page loaded |
| 10 | log |  |  | 📍 Step 8: Add product to cart |
| 11 | log |  |  | 📍 Step 9: Navigate to cart page |
| 12 | log |  |  | 📍 Step 10: Verify cart contains items |
| 13 | log |  |  | 📍 Step 11: Proceed to checkout |
| 14 | wait | `{ state: 'visible', timeout: 5000 }` |  |  |
| 15 | click |  |  |  |
| 16 | log |  |  | 📍 Step 12: Fill checkout form as guest |
| 17 | log |  |  | 📍 Step 13: Select payment method |
| 18 | log |  |  | 📍 Step 14: Place order |
| 19 | log |  |  | 📍 Step 15: Verify order confirmation |
| 20 | log |  |  | 📍 Step 16: Capture success screenshot |
| 21 | screenshot |  |  |  |

**Code Reference:**

```typescript
// Line 47
console.log('📍 Step 1: Navigate to widget test page');

// Line 48
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 50
console.log('📍 Step 2: Wait for chat widget to load');

// Line 53
console.log('📍 Step 3: Mock chat API for product query');

// Line 59
console.log('📍 Step 4: Send product query via chat');

// Line 61
await page.waitForTimeout(3000);

// Line 63
console.log('📍 Step 5: Verify chat response received');

// Line 66
console.log('📍 Step 6: Click product link from chat');

// Line 74
console.log('📍 Step 7: Verify product page loaded');

// Line 79
console.log('📍 Step 8: Add product to cart');

// ... 11 more steps ...
```

---

## 213. should validate required billing fields

**Source:** [`__tests__/playwright/core-journeys/purchase-guest-checkout.spec.ts`](/__tests__/playwright/core-journeys/purchase-guest-checkout.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to checkout page directly |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Navigate to checkout |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 3: Attempt to place order without filling form |
| 6 | click |  |  |  |
| 7 | wait | `2000` |  |  |
| 8 | log |  |  | 📍 Step 4: Verify validation errors appear |

**Code Reference:**

```typescript
// Line 124
console.log('📍 Step 1: Navigate to checkout page directly');

// Line 125
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 138
console.log('📍 Step 2: Navigate to checkout');

// Line 140
await checkoutButton.click();

// Line 143
console.log('📍 Step 3: Attempt to place order without filling form');

// Line 148
await placeOrderBtn.click();

// Line 149
await productPage.waitForTimeout(2000);

// Line 151
console.log('📍 Step 4: Verify validation errors appear');

```

---

## 214. should apply discount code and complete purchase

**Source:** [`__tests__/playwright/core-journeys/purchase-discount-code.spec.ts`](/__tests__/playwright/core-journeys/purchase-discount-code.spec.ts)

**Total Steps:** 15

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget and find product |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Add product to cart |
| 4 | log |  |  | 📍 Step 3: Navigate to cart |
| 5 | log |  |  | 📍 Step 4: Get original cart total |
| 6 | log |  |  | 📍 Step 5: Apply discount code |
| 7 | fill | `TEST10` |  |  |
| 8 | click |  |  |  |
| 9 | wait | `2000` |  |  |
| 10 | log |  |  | 📍 Step 6: Verify discount applied |
| 11 | log |  |  | 📍 Step 7: Proceed to checkout |
| 12 | click |  |  |  |
| 13 | log |  |  | 📍 Step 8: Complete checkout form |
| 14 | log |  |  | 📍 Step 9: Place order |
| 15 | log |  |  | 📍 Step 10: Verify order confirmation |

**Code Reference:**

```typescript
// Line 42
console.log('📍 Step 1: Navigate to widget and find product');

// Line 43
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 55
console.log('📍 Step 2: Add product to cart');

// Line 58
console.log('📍 Step 3: Navigate to cart');

// Line 61
console.log('📍 Step 4: Get original cart total');

// Line 66
console.log('📍 Step 5: Apply discount code');

// Line 71
await couponInput.fill('TEST10');

// Line 73
await applyButton.click();

// Line 74
await productPage.waitForTimeout(2000);

// Line 76
console.log('📍 Step 6: Verify discount applied');

// ... 5 more steps ...
```

---

## 215. should handle invalid discount code gracefully

**Source:** [`__tests__/playwright/core-journeys/purchase-discount-code.spec.ts`](/__tests__/playwright/core-journeys/purchase-discount-code.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Attempt to apply invalid coupon |
| 3 | fill | `INVALID_CODE_12345` |  |  |
| 4 | click |  |  |  |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 2: Verify error message displayed |

**Code Reference:**

```typescript
// Line 111
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 122
console.log('📍 Step 1: Attempt to apply invalid coupon');

// Line 127
await couponInput.fill('INVALID_CODE_12345');

// Line 129
await applyButton.click();

// Line 130
await productPage.waitForTimeout(2000);

// Line 132
console.log('📍 Step 2: Verify error message displayed');

```

---

## 216. should update cart item quantity successfully

**Source:** [`__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts`](/__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Add product to cart |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Find quantity input |
| 4 | log |  |  | 📍 Step 3: Update quantity to 2 |
| 5 | fill | `2` |  |  |
| 6 | log |  |  | 📍 Step 4: Click update cart button |
| 7 | click |  |  |  |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step 5: Verify quantity updated |

**Code Reference:**

```typescript
// Line 37
console.log('📍 Step 1: Add product to cart');

// Line 38
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 49
console.log('📍 Step 2: Find quantity input');

// Line 54
console.log('📍 Step 3: Update quantity to 2');

// Line 55
await quantityInput.fill('2');

// Line 57
console.log('📍 Step 4: Click update cart button');

// Line 62
await updateButton.click();

// Line 63
await productPage.waitForTimeout(2000);

// Line 65
console.log('📍 Step 5: Verify quantity updated');

```

---

## 217. should remove item from cart successfully

**Source:** [`__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts`](/__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Add product to cart |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Count initial cart items |
| 4 | log |  |  | 📍 Step 3: Click remove button |
| 5 | click |  |  |  |
| 6 | wait | `2000` |  |  |
| 7 | log |  |  | 📍 Step 4: Verify item removed |

**Code Reference:**

```typescript
// Line 82
console.log('📍 Step 1: Add product to cart');

// Line 83
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 94
console.log('📍 Step 2: Count initial cart items');

// Line 100
console.log('📍 Step 3: Click remove button');

// Line 105
await removeButton.click();

// Line 106
await productPage.waitForTimeout(2000);

// Line 108
console.log('📍 Step 4: Verify item removed');

```

---

## 218. should handle empty cart state correctly

**Source:** [`__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts`](/__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate directly to cart page |
| 2 | navigate | ``${BASE_URL}/cart`` |  |  |
| 3 | log |  |  | 📍 Step 2: Check for empty cart message |
| 4 | log |  |  | 📍 Step 3: Verify return to shop button exists |

**Code Reference:**

```typescript
// Line 126
console.log('📍 Step 1: Navigate directly to cart page');

// Line 127
await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' });

// Line 129
console.log('📍 Step 2: Check for empty cart message');

// Line 142
console.log('📍 Step 3: Verify return to shop button exists');

```

---

## 219. should add multiple different products to cart

**Source:** [`__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts`](/__tests__/playwright/core-journeys/purchase-cart-operations.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Add first product |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Navigate back and add another product |
| 4 | wait | `1000` |  |  |
| 5 | log |  |  | 📍 Step 3: Click second product link |
| 6 | click |  |  |  |
| 7 | log |  |  | 📍 Step 4: Add second product to cart |
| 8 | log |  |  | 📍 Step 5: Navigate to cart |
| 9 | log |  |  | 📍 Step 6: Verify multiple items in cart |

**Code Reference:**

```typescript
// Line 156
console.log('📍 Step 1: Add first product');

// Line 157
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 167
console.log('📍 Step 2: Navigate back and add another product');

// Line 169
await productPage.waitForTimeout(1000);

// Line 175
console.log('📍 Step 3: Click second product link');

// Line 176
await productLinks.nth(1).click();

// Line 179
console.log('📍 Step 4: Add second product to cart');

// Line 182
console.log('📍 Step 5: Navigate to cart');

// Line 185
console.log('📍 Step 6: Verify multiple items in cart');

```

---

## 220. should complete demo flow from URL entry to AI chat response

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

## 221. should handle invalid URLs gracefully

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

## 222. should enforce demo session limits

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 223. should show upgrade prompt after demo limits reached

**Source:** [`__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts`](/__tests__/playwright/core-journeys/landing-page-demo-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 224. should complete full purchase flow from chat to order confirmation

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

## 225. should handle purchase flow with guest checkout

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 226. should handle purchase flow with registered user

**Source:** [`__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts`](/__tests__/playwright/core-journeys/complete-purchase-flow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 227. should load chat widget successfully

**Source:** [`__tests__/playwright/core-journeys/chat-widget-state.spec.ts`](/__tests__/playwright/core-journeys/chat-widget-state.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for widget iframe |
| 4 | wait | `{ state: 'attached', timeout: 15000 }` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify iframe loaded |

**Code Reference:**

```typescript
// Line 32
console.log('📍 Step 1: Navigate to widget test page');

// Line 33
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 35
console.log('📍 Step 2: Wait for widget iframe');

// Line 37
await iframe.waitFor({ state: 'attached', timeout: 15000 });

// Line 39
console.log('📍 Step 3: Verify iframe loaded');

```

---

## 228. should toggle widget visibility

**Source:** [`__tests__/playwright/core-journeys/chat-widget-state.spec.ts`](/__tests__/playwright/core-journeys/chat-widget-state.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Look for widget toggle button |
| 3 | log |  |  | 📍 Step 2: Click toggle to open widget |
| 4 | click |  |  |  |
| 5 | wait | `1000` |  |  |
| 6 | log |  |  | 📍 Step 3: Verify widget opened |
| 7 | log |  |  | 📍 Step 4: Click toggle again to close |
| 8 | click |  |  |  |
| 9 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 49
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 51
console.log('📍 Step 1: Look for widget toggle button');

// Line 58
console.log('📍 Step 2: Click toggle to open widget');

// Line 59
await toggleButton.first().click();

// Line 60
await page.waitForTimeout(1000);

// Line 62
console.log('📍 Step 3: Verify widget opened');

// Line 69
console.log('📍 Step 4: Click toggle again to close');

// Line 70
await toggleButton.first().click();

// Line 71
await page.waitForTimeout(1000);

```

---

## 229. should display chat input field

**Source:** [`__tests__/playwright/core-journeys/chat-widget-state.spec.ts`](/__tests__/playwright/core-journeys/chat-widget-state.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Look for input field |
| 3 | log |  |  | 📍 Step 2: Verify input is editable |
| 4 | fill | `Test input` |  |  |

**Code Reference:**

```typescript
// Line 85
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 88
console.log('📍 Step 1: Look for input field');

// Line 96
console.log('📍 Step 2: Verify input is editable');

// Line 97
await inputField.fill('Test input');

```

---

## 230. should display send button

**Source:** [`__tests__/playwright/core-journeys/chat-widget-state.spec.ts`](/__tests__/playwright/core-journeys/chat-widget-state.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Look for send button |
| 3 | log |  |  | 📍 Step 2: Verify button is clickable |

**Code Reference:**

```typescript
// Line 112
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 115
console.log('📍 Step 1: Look for send button');

// Line 125
console.log('📍 Step 2: Verify button is clickable');

```

---

## 231. should send message and receive response

**Source:** [`__tests__/playwright/core-journeys/chat-simple-query.spec.ts`](/__tests__/playwright/core-journeys/chat-simple-query.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to widget test page |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Wait for chat widget to load |
| 4 | log |  |  | 📍 Step 3: Mock chat API response |
| 5 | log |  |  | 📍 Step 4: Send simple query |
| 6 | log |  |  | 📍 Step 5: Wait for response |
| 7 | wait | `2000` |  |  |
| 8 | log |  |  | 📍 Step 6: Verify response received |
| 9 | log |  |  | 📍 Step 7: Verify message displayed in chat |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to widget test page');

// Line 32
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 34
console.log('📍 Step 2: Wait for chat widget to load');

// Line 37
console.log('📍 Step 3: Mock chat API response');

// Line 43
console.log('📍 Step 4: Send simple query');

// Line 46
console.log('📍 Step 5: Wait for response');

// Line 47
await page.waitForTimeout(2000);

// Line 49
console.log('📍 Step 6: Verify response received');

// Line 53
console.log('📍 Step 7: Verify message displayed in chat');

```

---

## 232. should display user message immediately

**Source:** [`__tests__/playwright/core-journeys/chat-simple-query.spec.ts`](/__tests__/playwright/core-journeys/chat-simple-query.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Send message |
| 3 | log |  |  | 📍 Step 2: Look for user message in chat |
| 4 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 70
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 78
console.log('📍 Step 1: Send message');

// Line 82
console.log('📍 Step 2: Look for user message in chat');

// Line 83
await page.waitForTimeout(1000);

```

---

## 233. should show loading indicator while processing

**Source:** [`__tests__/playwright/core-journeys/chat-simple-query.spec.ts`](/__tests__/playwright/core-journeys/chat-simple-query.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Send message |
| 3 | fill | `Test query` |  |  |
| 4 | click |  |  |  |
| 5 | log |  |  | 📍 Step 2: Look for loading indicator |
| 6 | wait | `500` |  |  |

**Code Reference:**

```typescript
// Line 100
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 109
console.log('📍 Step 1: Send message');

// Line 111
await inputField.fill('Test query');

// Line 114
await sendButton.click();

// Line 116
console.log('📍 Step 2: Look for loading indicator');

// Line 117
await page.waitForTimeout(500);

```

---

## 234. should maintain context across multiple messages

**Source:** [`__tests__/playwright/core-journeys/chat-multi-turn.spec.ts`](/__tests__/playwright/core-journeys/chat-multi-turn.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Load chat widget |
| 2 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 3 | log |  |  | 📍 Step 2: Send first message |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 3: Send follow-up question |
| 6 | wait | `2000` |  |  |
| 7 | log |  |  | 📍 Step 4: Send third question |
| 8 | wait | `2000` |  |  |
| 9 | log |  |  | 📍 Step 5: Verify multiple messages in chat |
| 10 | log |  |  | 📍 Step 6: Verify API called multiple times |

**Code Reference:**

```typescript
// Line 32
console.log('📍 Step 1: Load chat widget');

// Line 33
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 54
console.log('📍 Step 2: Send first message');

// Line 56
await page.waitForTimeout(2000);

// Line 58
console.log('📍 Step 3: Send follow-up question');

// Line 60
await page.waitForTimeout(2000);

// Line 62
console.log('📍 Step 4: Send third question');

// Line 64
await page.waitForTimeout(2000);

// Line 66
console.log('📍 Step 5: Verify multiple messages in chat');

// Line 73
console.log('📍 Step 6: Verify API called multiple times');

```

---

## 235. should display conversation history

**Source:** [`__tests__/playwright/core-journeys/chat-multi-turn.spec.ts`](/__tests__/playwright/core-journeys/chat-multi-turn.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Send two messages |
| 3 | wait | `2000` |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 2: Verify both messages visible |

**Code Reference:**

```typescript
// Line 83
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 91
console.log('📍 Step 1: Send two messages');

// Line 93
await page.waitForTimeout(2000);

// Line 95
await page.waitForTimeout(2000);

// Line 97
console.log('📍 Step 2: Verify both messages visible');

```

---

## 236. should scroll to latest message

**Source:** [`__tests__/playwright/core-journeys/chat-multi-turn.spec.ts`](/__tests__/playwright/core-journeys/chat-multi-turn.spec.ts)

**Total Steps:** 4

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/widget-test`` |  |  |
| 2 | log |  |  | 📍 Step 1: Send multiple messages to create scrollable history |
| 3 | wait | `1500` |  |  |
| 4 | log |  |  | 📍 Step 2: Verify latest message is visible |

**Code Reference:**

```typescript
// Line 118
await page.goto(`${BASE_URL}/widget-test`, { waitUntil: 'networkidle' });

// Line 126
console.log('📍 Step 1: Send multiple messages to create scrollable history');

// Line 129
await page.waitForTimeout(1500);

// Line 132
console.log('📍 Step 2: Verify latest message is visible');

```

---

## 237. should register new user successfully

**Source:** [`__tests__/playwright/core-journeys/auth-registration.spec.ts`](/__tests__/playwright/core-journeys/auth-registration.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to registration page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Look for registration form |
| 4 | log |  |  | 📍 Step 3: Generate unique test email |
| 5 | log |  |  | 📍 Step 4: Fill registration form |
| 6 | fill | `testEmail` |  |  |
| 7 | fill | `testPassword` |  |  |
| 8 | log |  |  | 📍 Step 5: Submit registration |
| 9 | click |  |  |  |
| 10 | wait | `3000` |  |  |
| 11 | log |  |  | 📍 Step 6: Check for success indicators |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to registration page');

// Line 32
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 34
console.log('📍 Step 2: Look for registration form');

// Line 43
console.log('📍 Step 3: Generate unique test email');

// Line 48
console.log('📍 Step 4: Fill registration form');

// Line 52
await emailInput.fill(testEmail);

// Line 53
await passwordInput.fill(testPassword);

// Line 55
console.log('📍 Step 5: Submit registration');

// Line 57
await submitButton.click();

// Line 58
await page.waitForTimeout(3000);

// ... 1 more steps ...
```

---

## 238. should validate required registration fields

**Source:** [`__tests__/playwright/core-journeys/auth-registration.spec.ts`](/__tests__/playwright/core-journeys/auth-registration.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to registration page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Submit empty form |
| 4 | click |  |  |  |
| 5 | wait | `2000` |  |  |
| 6 | log |  |  | 📍 Step 3: Check for validation errors |

**Code Reference:**

```typescript
// Line 79
console.log('📍 Step 1: Navigate to registration page');

// Line 80
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 90
console.log('📍 Step 2: Submit empty form');

// Line 92
await submitButton.click();

// Line 93
await page.waitForTimeout(2000);

// Line 95
console.log('📍 Step 3: Check for validation errors');

```

---

## 239. should reject invalid email format

**Source:** [`__tests__/playwright/core-journeys/auth-registration.spec.ts`](/__tests__/playwright/core-journeys/auth-registration.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 2 | log |  |  | 📍 Step 1: Enter invalid email |
| 3 | fill | `invalid-email-format` |  |  |
| 4 | fill | `TestPassword123!` |  |  |
| 5 | log |  |  | 📍 Step 2: Submit form |
| 6 | click |  |  |  |
| 7 | wait | `2000` |  |  |
| 8 | log |  |  | 📍 Step 3: Verify email validation error |

**Code Reference:**

```typescript
// Line 112
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 122
console.log('📍 Step 1: Enter invalid email');

// Line 123
await emailInput.fill('invalid-email-format');

// Line 129
await passwordInput.fill('TestPassword123!');

// Line 132
console.log('📍 Step 2: Submit form');

// Line 134
await submitButton.click();

// Line 135
await page.waitForTimeout(2000);

// Line 137
console.log('📍 Step 3: Verify email validation error');

```

---

## 240. should display password reset form

**Source:** [`__tests__/playwright/core-journeys/auth-password-reset.spec.ts`](/__tests__/playwright/core-journeys/auth-password-reset.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to login page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Look for forgot password link |
| 4 | log |  |  | 📍 Step 3: Click forgot password link |
| 5 | click |  |  |  |
| 6 | log |  |  | 📍 Step 4: Verify reset form displayed |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to login page');

// Line 32
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 34
console.log('📍 Step 2: Look for forgot password link');

// Line 41
console.log('📍 Step 3: Click forgot password link');

// Line 42
await forgotPasswordLink.click();

// Line 45
console.log('📍 Step 4: Verify reset form displayed');

```

---

## 241. should request password reset for valid email

**Source:** [`__tests__/playwright/core-journeys/auth-password-reset.spec.ts`](/__tests__/playwright/core-journeys/auth-password-reset.spec.ts)

**Total Steps:** 8

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account/lost-password`` |  |  |
| 2 | log |  |  | 📍 Step 1: Look for email input |
| 3 | log |  |  | 📍 Step 2: Enter test email |
| 4 | fill | `test@example.com` |  |  |
| 5 | log |  |  | 📍 Step 3: Submit reset request |
| 6 | click |  |  |  |
| 7 | wait | `3000` |  |  |
| 8 | log |  |  | 📍 Step 4: Check for confirmation message |

**Code Reference:**

```typescript
// Line 63
await page.goto(`${BASE_URL}/my-account/lost-password`, { waitUntil: 'networkidle' });

// Line 65
console.log('📍 Step 1: Look for email input');

// Line 74
console.log('📍 Step 2: Enter test email');

// Line 75
await emailInput.fill('test@example.com');

// Line 77
console.log('📍 Step 3: Submit reset request');

// Line 79
await submitButton.click();

// Line 80
await page.waitForTimeout(3000);

// Line 82
console.log('📍 Step 4: Check for confirmation message');

```

---

## 242. should validate empty email on reset request

**Source:** [`__tests__/playwright/core-journeys/auth-password-reset.spec.ts`](/__tests__/playwright/core-journeys/auth-password-reset.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account/lost-password`` |  |  |
| 2 | log |  |  | 📍 Step 1: Submit empty form |
| 3 | click |  |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 2: Check for validation error |

**Code Reference:**

```typescript
// Line 99
await page.goto(`${BASE_URL}/my-account/lost-password`, { waitUntil: 'networkidle' });

// Line 109
console.log('📍 Step 1: Submit empty form');

// Line 110
await submitButton.click();

// Line 111
await page.waitForTimeout(2000);

// Line 113
console.log('📍 Step 2: Check for validation error');

```

---

## 243. should display logout link when user is logged in

**Source:** [`__tests__/playwright/core-journeys/auth-logout.spec.ts`](/__tests__/playwright/core-journeys/auth-logout.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to account page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Look for logout link |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to account page');

// Line 32
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 34
console.log('📍 Step 2: Look for logout link');

```

---

## 244. should terminate session on logout

**Source:** [`__tests__/playwright/core-journeys/auth-logout.spec.ts`](/__tests__/playwright/core-journeys/auth-logout.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 2 | log |  |  | 📍 Step 1: Click logout link |
| 3 | click |  |  |  |
| 4 | log |  |  | 📍 Step 2: Verify redirected to login page |
| 5 | log |  |  | 📍 Step 3: Verify login form displayed (session terminated) |

**Code Reference:**

```typescript
// Line 51
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 61
console.log('📍 Step 1: Click logout link');

// Line 62
await logoutLink.click();

// Line 65
console.log('📍 Step 2: Verify redirected to login page');

// Line 74
console.log('📍 Step 3: Verify login form displayed (session terminated)');

```

---

## 245. should show logout confirmation message

**Source:** [`__tests__/playwright/core-journeys/auth-logout.spec.ts`](/__tests__/playwright/core-journeys/auth-logout.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 2 | log |  |  | 📍 Step 1: Click logout |
| 3 | click |  |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 2: Look for logout confirmation |

**Code Reference:**

```typescript
// Line 89
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 99
console.log('📍 Step 1: Click logout');

// Line 100
await logoutLink.click();

// Line 101
await page.waitForTimeout(2000);

// Line 103
console.log('📍 Step 2: Look for logout confirmation');

```

---

## 246. should display login form correctly

**Source:** [`__tests__/playwright/core-journeys/auth-login.spec.ts`](/__tests__/playwright/core-journeys/auth-login.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to login page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify login form exists |
| 4 | log |  |  | 📍 Step 3: Verify username field |
| 5 | log |  |  | 📍 Step 4: Verify password field |
| 6 | log |  |  | 📍 Step 5: Verify login button |

**Code Reference:**

```typescript
// Line 31
console.log('📍 Step 1: Navigate to login page');

// Line 32
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 34
console.log('📍 Step 2: Verify login form exists');

// Line 42
console.log('📍 Step 3: Verify username field');

// Line 47
console.log('📍 Step 4: Verify password field');

// Line 52
console.log('📍 Step 5: Verify login button');

```

---

## 247. should reject login with invalid credentials

**Source:** [`__tests__/playwright/core-journeys/auth-login.spec.ts`](/__tests__/playwright/core-journeys/auth-login.spec.ts)

**Total Steps:** 9

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Navigate to login page |
| 2 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 3 | log |  |  | 📍 Step 2: Enter invalid credentials |
| 4 | fill | `invalid_user_12345` |  |  |
| 5 | fill | `wrong_password_12345` |  |  |
| 6 | log |  |  | 📍 Step 3: Submit login form |
| 7 | click |  |  |  |
| 8 | wait | `3000` |  |  |
| 9 | log |  |  | 📍 Step 4: Verify error message displayed |

**Code Reference:**

```typescript
// Line 68
console.log('📍 Step 1: Navigate to login page');

// Line 69
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 80
console.log('📍 Step 2: Enter invalid credentials');

// Line 81
await usernameInput.fill('invalid_user_12345');

// Line 82
await passwordInput.fill('wrong_password_12345');

// Line 84
console.log('📍 Step 3: Submit login form');

// Line 86
await loginButton.click();

// Line 87
await page.waitForTimeout(3000);

// Line 89
console.log('📍 Step 4: Verify error message displayed');

```

---

## 248. should validate empty login form submission

**Source:** [`__tests__/playwright/core-journeys/auth-login.spec.ts`](/__tests__/playwright/core-journeys/auth-login.spec.ts)

**Total Steps:** 5

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 2 | log |  |  | 📍 Step 1: Submit empty login form |
| 3 | click |  |  |  |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 2: Check for validation errors |

**Code Reference:**

```typescript
// Line 108
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 118
console.log('📍 Step 1: Submit empty login form');

// Line 119
await loginButton.click();

// Line 120
await page.waitForTimeout(2000);

// Line 122
console.log('📍 Step 2: Check for validation errors');

```

---

## 249. should display remember me option

**Source:** [`__tests__/playwright/core-journeys/auth-login.spec.ts`](/__tests__/playwright/core-journeys/auth-login.spec.ts)

**Total Steps:** 3

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | navigate | ``${BASE_URL}/my-account`` |  |  |
| 2 | log |  |  | 📍 Step 1: Look for remember me checkbox |
| 3 | log |  |  | 📍 Step 2: Verify checkbox is toggleable |

**Code Reference:**

```typescript
// Line 139
await page.goto(`${BASE_URL}/my-account`, { waitUntil: 'networkidle' });

// Line 141
console.log('📍 Step 1: Look for remember me checkbox');

// Line 149
console.log('📍 Step 2: Verify checkbox is toggleable');

```

---

## 250. should complete full team invitation flow for viewer role

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

## 251. should handle editor role with correct permissions

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 252. should show team members list with correct roles

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 253. should allow admin to revoke member access

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 254. should handle expired invitation tokens

**Source:** [`__tests__/playwright/advanced-features/team-management.spec.ts`](/__tests__/playwright/advanced-features/team-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 255. should complete Shopify setup and track purchases

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

## 256. should handle Shopify connection errors

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

## 257. should sync product inventory updates

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 258. should handle product out of stock scenarios

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 259. should track Shopify order fulfillment

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 260. should handle Shopify webhooks

**Source:** [`__tests__/playwright/advanced-features/shopify-integration.spec.ts`](/__tests__/playwright/advanced-features/shopify-integration.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 261. should display real-time metrics and update without refresh

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

## 262. should handle connection interruptions gracefully

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

## 263. should show historical trend alongside real-time data

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 264. should filter real-time events by type

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 265. should export real-time data snapshot

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 266. should handle high-frequency updates efficiently

**Source:** [`__tests__/playwright/advanced-features/realtime-analytics.spec.ts`](/__tests__/playwright/advanced-features/realtime-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 267. should lookup order status via chat and return accurate information

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

## 268. should handle order lookup for processing orders

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

## 269. should handle invalid order numbers gracefully

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

## 270. should handle multiple order lookups in same conversation

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 271. should provide order modification options

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 272. should handle orders without tracking numbers

**Source:** [`__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts`](/__tests__/playwright/advanced-features/order-lookup-via-chat.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 273. should monitor live chat and complete agent takeover

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

## 274. should show waiting chats requiring agent attention

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

## 275. should complete full conversations management flow with export

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

## 276. should filter conversations by date range

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

## 277. should handle empty search results gracefully

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 278. should allow bulk operations on conversations

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 279. should show conversation analytics

**Source:** [`__tests__/playwright/advanced-features/conversations-management.spec.ts`](/__tests__/playwright/advanced-features/conversations-management.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 280. should track complete cart journey with analytics

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

## 281. should track session metrics accurately

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

## 282. should retrieve domain-level analytics

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

## 283. should identify abandoned carts

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

## 284. should filter analytics by date range

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

## 285. should handle API errors gracefully

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

## 286. should support platform filtering (WooCommerce vs Shopify)

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

## 287. should track both successful and failed operations

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

## 288. should retrieve analytics quickly (< 1 second)

**Source:** [`__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts`](/__tests__/playwright/advanced-features/cart-analytics-tracking.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 289. should restore abandoned cart when customer returns

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

## 290. should track cart abandonment analytics

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 291. should send abandonment email reminder

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 292. should handle expired cart sessions

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 293. should merge guest and authenticated user carts

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 294. should handle out-of-stock items in restored cart

**Source:** [`__tests__/playwright/advanced-features/cart-abandonment.spec.ts`](/__tests__/playwright/advanced-features/cart-abandonment.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 295. live preview updates in real-time

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

## 296. reset button restores default settings

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

## 297. tab navigation works correctly

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

## 298. advanced color customization works

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

## 299. handles save errors gracefully

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

## 300. supports keyboard navigation

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

## 301. appearance → behavior → save → persist

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

## 302. delete items with persistence verification

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

## 303. delete multiple items sequentially

**Source:** [`__tests__/playwright/dashboard/training/05-delete-data.spec.ts`](/__tests__/playwright/dashboard/training/05-delete-data.spec.ts)

**Total Steps:** 7

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Create multiple test items |
| 2 | wait | `1000` |  |  |
| 3 | log |  |  | 📍 Step 2: Verify all items appear |
| 4 | wait | `2000` |  |  |
| 5 | log |  |  | 📍 Step 3: Delete items one by one |
| 6 | wait | `500` |  |  |
| 7 | log |  |  | 📍 Step 4: Verify all items are deleted |

**Code Reference:**

```typescript
// Line 77
console.log('📍 Step 1: Create multiple test items');

// Line 80
await page.waitForTimeout(1000);

// Line 83
console.log('📍 Step 2: Verify all items appear');

// Line 89
await page.waitForTimeout(2000);

// Line 97
console.log('📍 Step 3: Delete items one by one');

// Line 100
await page.waitForTimeout(500);

// Line 103
console.log('📍 Step 4: Verify all items are deleted');

```

---

## 304. delete items while processing

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
// Line 121
console.log('📍 Step 1: Create item that will be processing');

// Line 125
console.log('📍 Step 2: Delete item immediately (may still be processing)');

// Line 127
await page.waitForTimeout(1000);

// Line 130
console.log('📍 Step 3: Verify item is removed from list');

// Line 133
console.log('📍 Step 4: Verify no orphaned data after reload');

```

---

## 305. list integrity after deletion

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
// Line 150
console.log('📍 Step 1: Create items to keep and one to delete');

// Line 153
await page.waitForTimeout(500);

// Line 156
await page.waitForTimeout(500);

// Line 158
console.log('📍 Step 2: Verify all items appear');

// Line 167
console.log('📍 Step 3: Delete one item');

// Line 170
console.log('📍 Step 4: Verify deleted item is gone');

// Line 173
console.log('📍 Step 5: Verify other items remain intact');

```

---

## 306. empty state when all items deleted

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
// Line 190
console.log('📍 Step 1: Check if any items exist');

// Line 195
console.log('📍 Step 2: Create some test items to delete');

// Line 203
await page.waitForTimeout(500);

// Line 210
console.log('📍 Step 3: Delete all items');

// Line 223
await deleteButton.click();

// Line 227
await confirmButton.click();

// Line 230
await page.waitForTimeout(1000);

// Line 233
console.log('📍 Step 4: Verify empty state is displayed');

// Line 236
console.log('📍 Step 5: Verify item count is 0');

```

---

## 307. delete confirmation dialog

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
// Line 249
console.log('📍 Step 1: Create test item');

// Line 253
console.log('📍 Step 2: Click delete button');

// Line 256
await deleteButton.click();

// Line 258
console.log('📍 Step 3: Check if confirmation dialog appears');

// Line 267
console.log('📍 Step 4: Click cancel');

// Line 269
await cancelButton.click();

// Line 270
await page.waitForTimeout(1000);

// Line 272
console.log('📍 Step 5: Verify item is still in list');

// Line 276
console.log('📍 Step 6: Delete again and confirm');

// Line 277
await deleteButton.click();

// ... 3 more steps ...
```

---

## 308. URL uploads generate embeddings

**Source:** [`__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts`](/__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload URL |
| 2 | log |  |  | 📍 Step 2: Wait for URL to appear in list |
| 3 | log |  |  | 📍 Step 3: Wait for processing to complete |
| 4 | log |  |  | 📍 Step 4: Wait for embeddings to be generated (5s) |
| 5 | wait | `5000` |  |  |
| 6 | log |  |  | 📍 Step 5: Query database for embeddings |

**Code Reference:**

```typescript
// Line 54
console.log('📍 Step 1: Upload URL');

// Line 57
console.log('📍 Step 2: Wait for URL to appear in list');

// Line 60
console.log('📍 Step 3: Wait for processing to complete');

// Line 63
console.log('📍 Step 4: Wait for embeddings to be generated (5s)');

// Line 64
await page.waitForTimeout(5000);

// Line 66
console.log('📍 Step 5: Query database for embeddings');

```

---

## 309. text uploads generate embeddings

**Source:** [`__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts`](/__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload text content |
| 2 | log |  |  | 📍 Step 2: Wait for text to appear in list |
| 3 | log |  |  | 📍 Step 3: Wait for processing to complete |
| 4 | log |  |  | 📍 Step 4: Wait for embeddings to be generated (5s) |
| 5 | wait | `5000` |  |  |
| 6 | log |  |  | 📍 Step 5: Query database for text embeddings |

**Code Reference:**

```typescript
// Line 106
console.log('📍 Step 1: Upload text content');

// Line 109
console.log('📍 Step 2: Wait for text to appear in list');

// Line 112
console.log('📍 Step 3: Wait for processing to complete');

// Line 115
console.log('📍 Step 4: Wait for embeddings to be generated (5s)');

// Line 116
await page.waitForTimeout(5000);

// Line 118
console.log('📍 Step 5: Query database for text embeddings');

```

---

## 310. Q&A uploads generate embeddings

**Source:** [`__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts`](/__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts)

**Total Steps:** 6

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload Q&A pair |
| 2 | log |  |  | 📍 Step 2: Wait for Q&A to appear in list |
| 3 | log |  |  | 📍 Step 3: Wait for processing to complete |
| 4 | log |  |  | 📍 Step 4: Wait for embeddings to be generated (5s) |
| 5 | wait | `5000` |  |  |
| 6 | log |  |  | 📍 Step 5: Query database for Q&A embeddings |

**Code Reference:**

```typescript
// Line 152
console.log('📍 Step 1: Upload Q&A pair');

// Line 155
console.log('📍 Step 2: Wait for Q&A to appear in list');

// Line 158
console.log('📍 Step 3: Wait for processing to complete');

// Line 161
console.log('📍 Step 4: Wait for embeddings to be generated (5s)');

// Line 162
await page.waitForTimeout(5000);

// Line 164
console.log('📍 Step 5: Query database for Q&A embeddings');

```

---

## 311. embeddings are searchable via RAG

**Source:** [`__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts`](/__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts)

**Total Steps:** 14

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload text with unique searchable content |
| 2 | log |  |  | 📍 Step 2: Wait for text to appear and process |
| 3 | log |  |  | 📍 Step 3: Wait for embeddings to be generated and indexed (10s) |
| 4 | wait | `10000` |  |  |
| 5 | log |  |  | 📍 Step 4: Verify embeddings exist in database |
| 6 | log |  |  | 📍 Step 5: Navigate to widget test page |
| 7 | navigate | `/widget-test` |  |  |
| 8 | log |  |  | 📍 Step 6: Open chat widget |
| 9 | wait | `{ state: 'visible', timeout: 10000 }` |  |  |
| 10 | log |  |  | 📍 Step 7: Send query asking about our unique content |
| 11 | fill | `searchQuery` |  |  |
| 12 | log |  |  | 📍 Step 8: Wait for AI response |
| 13 | wait | `8000` |  |  |
| 14 | log |  |  | 📍 Step 9: Verify AI response mentions our content |

**Code Reference:**

```typescript
// Line 202
console.log('📍 Step 1: Upload text with unique searchable content');

// Line 205
console.log('📍 Step 2: Wait for text to appear and process');

// Line 209
console.log('📍 Step 3: Wait for embeddings to be generated and indexed (10s)');

// Line 210
await page.waitForTimeout(10000);

// Line 212
console.log('📍 Step 4: Verify embeddings exist in database');

// Line 223
console.log('📍 Step 5: Navigate to widget test page');

// Line 224
await page.goto('/widget-test');

// Line 227
console.log('📍 Step 6: Open chat widget');

// Line 229
await iframe.locator('body').waitFor({ state: 'visible', timeout: 10000 });

// Line 231
console.log('📍 Step 7: Send query asking about our unique content');

// ... 4 more steps ...
```

---

## 312. verify embedding pipeline for all upload types

**Source:** [`__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts`](/__tests__/playwright/dashboard/training/04-verify-embeddings.spec.ts)

**Total Steps:** 10

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Upload URL |
| 2 | wait | `3000` |  |  |
| 3 | log |  |  | 📍 Step 2: Upload text |
| 4 | wait | `3000` |  |  |
| 5 | log |  |  | 📍 Step 3: Upload Q&A |
| 6 | log |  |  | 📍 Step 4: Wait for all embeddings to be generated (15s) |
| 7 | wait | `15000` |  |  |
| 8 | log |  |  | 📍 Step 5: Verify embeddings exist for URL upload |
| 9 | log |  |  | 📍 Step 6: Verify embeddings exist for text upload |
| 10 | log |  |  | 📍 Step 7: Verify embeddings exist for Q&A upload |

**Code Reference:**

```typescript
// Line 278
console.log('📍 Step 1: Upload URL');

// Line 281
await page.waitForTimeout(3000);

// Line 283
console.log('📍 Step 2: Upload text');

// Line 286
await page.waitForTimeout(3000);

// Line 288
console.log('📍 Step 3: Upload Q&A');

// Line 292
console.log('📍 Step 4: Wait for all embeddings to be generated (15s)');

// Line 293
await page.waitForTimeout(15000);

// Line 295
console.log('📍 Step 5: Verify embeddings exist for URL upload');

// Line 304
console.log('📍 Step 6: Verify embeddings exist for text upload');

// Line 313
console.log('📍 Step 7: Verify embeddings exist for Q&A upload');

```

---

## 313. user uploads Q&A pairs for FAQ training

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

## 314. Q&A with long answers

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

## 315. incomplete Q&A validation

**Source:** [`__tests__/playwright/dashboard/training/03-upload-qa.spec.ts`](/__tests__/playwright/dashboard/training/03-upload-qa.spec.ts)

**Total Steps:** 11

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 1: Switch to Q&A tab |
| 2 | wait | `500` |  |  |
| 3 | log |  |  | 📍 Step 2: Try to submit with only question (no answer) |
| 4 | fill | `Test question without answer?` |  |  |
| 5 | log |  |  | 📍 Step 3: Verify validation prevents submission |
| 6 | click |  |  |  |
| 7 | wait | `1000` |  |  |
| 8 | log |  |  | 📍 Step 4: Try to submit with only answer (no question) |
| 9 | fill | `Test answer without question.` |  |  |
| 10 | click |  |  |  |
| 11 | wait | `1000` |  |  |

**Code Reference:**

```typescript
// Line 84
console.log('📍 Step 1: Switch to Q&A tab');

// Line 86
await page.waitForTimeout(500);

// Line 88
console.log('📍 Step 2: Try to submit with only question (no answer)');

// Line 93
await questionInput.fill('Test question without answer?');

// Line 101
console.log('📍 Step 3: Verify validation prevents submission');

// Line 108
await submitButton.click();

// Line 109
await page.waitForTimeout(1000);

// Line 121
console.log('📍 Step 4: Try to submit with only answer (no question)');

// Line 123
await answerInput.fill('Test answer without question.');

// Line 130
await submitButton.click();

// ... 1 more steps ...
```

---

## 316. multiple Q&A pairs

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
// Line 164
console.log('📍 Step 1: Submit multiple Q&A pairs');

// Line 167
await page.waitForTimeout(1000);

// Line 170
console.log('📍 Step 2: Verify all Q&A pairs appear in list');

// Line 176
console.log('📍 Step 3: Verify list contains at least 3 items');

```

---

## 317. Q&A with special characters

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
// Line 191
console.log('📍 Step 1: Upload Q&A with special characters');

// Line 194
console.log('📍 Step 2: Verify Q&A appears in list with special chars intact');

// Line 197
console.log('📍 Step 3: Verify special characters are properly encoded');

```

---

## 318. user uploads text and generates embeddings

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

## 319. short text (< 200 chars)

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

## 320. long text (> 200 chars, truncated preview)

**Source:** [`__tests__/playwright/dashboard/training/02-upload-text.spec.ts`](/__tests__/playwright/dashboard/training/02-upload-text.spec.ts)

**Total Steps:** 2

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|
| 1 | log |  |  | 📍 Step 2: Verify text appears with preview |
| 2 | log |  |  | 📍 Step 3: Verify text is present (CSS truncate handles overflow) |

**Code Reference:**

```typescript
// Line 84
console.log('📍 Step 2: Verify text appears with preview');

// Line 89
console.log('📍 Step 3: Verify text is present (CSS truncate handles overflow)');

```

---

## 321. empty text validation

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

## 322. multiple text submissions

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

## 323. user uploads URL and processes to completion

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

## 324. URL normalization (auto-adds https://)

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

## 325. scraping failure handling

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

## 326. multiple URL submissions

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

## 327. verify file naming convention for all formats

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

## 328. PDF export with 90-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 329. Excel export validation

**Source:** [`__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/pdf-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 330. export with empty data: handle gracefully

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

## 331. export with user authentication and permissions

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 332. handle invalid export format gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 333. handle missing query parameters

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 334. handle request timeout gracefully

**Source:** [`__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/error-handling.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 335. complete export workflow: UI suggestion for missing buttons

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

## 336. export performance: large dataset handling

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

## 337. sequential export downloads: verify file independence

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

## 338. export with custom time ranges

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

## 339. verify JSON analytics data structure

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 340. export with date range filter applied

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

## 341. validate CSV data accuracy and formatting

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 342. verify API endpoint responses

**Source:** [`__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/data-validation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 343. export analytics as CSV: click → download → verify

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

## 344. verify CSV file structure and headers

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 345. CSV export with 30-day range

**Source:** [`__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts`](/__tests__/playwright/dashboard/analytics-exports/csv-export.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 346. English to Spanish translation

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

## 347. UI updates immediately on language change

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

## 348. RTL languages display correctly (Arabic)

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

## 349. Hebrew (RTL) text rendering

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

## 350. RTL layout persists across language changes

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

## 351. locale preference persists in localStorage

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

## 352. multiple locales can be switched

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

## 353. invalid locale handled gracefully

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

## 354. language switching preserves conversation history

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

## 355. language persists after page reload

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

## 356. rapid language switches handled correctly

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

## 357. browser locale auto-detection

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

## 358. complete language workflow: English → Spanish → Arabic (RTL)

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

## 359. abandoned conversation → detection → schedule → send

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/workflow.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/workflow.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 360. sends high-priority low-satisfaction follow-up

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/priority-follow-ups.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/priority-follow-ups.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 361. respects follow-up attempt limits

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 362. supports multiple scheduling windows

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 363. handles email vs in-app channel routing

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/edge-cases.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 364. should track add-to-cart operation with full analytics

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

## 365. should track multi-step cart journey with session continuity

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

## 366. should calculate accurate session duration

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

## 367. should track operation failures with error messages

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

## 368. should support analytics aggregation by platform

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cart-operations-with-analytics.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 369. pending follow-up cancelled when user returns

**Source:** [`__tests__/playwright/advanced-features/automated-follow-ups/cancellation.spec.ts`](/__tests__/playwright/advanced-features/automated-follow-ups/cancellation.spec.ts)

**Total Steps:** 0

**Workflow Steps:**

| Step | Action | Target | Value | Expected Outcome |
|------|--------|--------|-------|------------------|

**Code Reference:**

```typescript
```

---

## 370. tracks response metrics across channels

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
- `10000`
- `1001`
- `1500`
- `15000`
- `2`
- `2000`
- `300`
- `3000`
- `36000`
- `4000`
- `45`
- `500`
- `5000`
- `8000`
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
- `Do you have SKU TWH-BLK-001?`
- `Do you have T-Shirts?`
- `Email address was updated`
- `Hello`
- `Hello, I need help`
- `Hello, what products do you have?`
- `Hola, ¿qué productos tienes disponibles?`
- `I need a hydraulic pump for my machinery`
- `I object to profiling for automated decision-making as it relates to my particular situation and fundamental rights.`
- `INVALID_CODE_12345`
- `London`
- `Message after cooldown`
- `Muéstrame los productos más populares`
- `Pending verification of data accuracy`
- `SW1A 1AA`
- `Show cart again`
- `Show me headphones`
- `Show me hydraulic pumps`
- `Show me my cart`
- `Show me premium products`
- `Show me product A4VTG90 and add it to my cart`
- `Show me product ID 123456789`
- `Show me products`
- `Show me your best products`
- `Show me your widgets`
- `TEST10`
- `TEST_DEMO_SITE`
- `TEST_DOMAIN`
- `Tell me more about that`
- `Test Input`
- `Test answer without question.`
- `Test input`
- `Test message for domain verification`
- `Test message for session tracking`
- `Test query`
- `Test question without answer?`
- `TestBot`
- `TestPassword123!`
- `Updated by User A`
- `View cart`
- `What can you tell me about this website?`
- `What pages are on this website?`
- ``${BASE_URL}/cart``
- ``${BASE_URL}/dashboard/analytics/custom-events``
- ``${BASE_URL}/dashboard/analytics``
- ``${BASE_URL}/dashboard/customize``
- ``${BASE_URL}/dashboard/domains``
- ``${BASE_URL}/dashboard/installation``
- ``${BASE_URL}/dashboard/integrations/shopify``
- ``${BASE_URL}/dashboard/integrations/woocommerce``
- ``${BASE_URL}/dashboard/shopify/customers``
- ``${BASE_URL}/dashboard/shopify/inventory``
- ``${BASE_URL}/dashboard/shopify/orders``
- ``${BASE_URL}/dashboard/shopify/products``
- ``${BASE_URL}/dashboard/shopify/webhooks``
- ``${BASE_URL}/dashboard/shopify``
- ``${BASE_URL}/dashboard/woocommerce/abandoned-carts``
- ``${BASE_URL}/dashboard/woocommerce/cart-tracking``
- ``${BASE_URL}/dashboard/woocommerce/orders``
- ``${BASE_URL}/dashboard/woocommerce/webhooks/settings``
- ``${BASE_URL}/dashboard/woocommerce/webhooks``
- ``${BASE_URL}/dashboard``
- ``${BASE_URL}/embed?open=true``
- ``${BASE_URL}/embed``
- ``${BASE_URL}/my-account/lost-password``
- ``${BASE_URL}/my-account``
- ``${BASE_URL}/pricing``
- ``${BASE_URL}/privacy-settings``
- ``${BASE_URL}/privacy/verify?token=verification-token-123``
- ``${BASE_URL}/shop/products``
- ``${BASE_URL}/test-widget``
- ``${BASE_URL}/widget-test``
- ``/api/analytics/export?format=${formats[i]}&days=7``
- ``/api/analytics/export?format=csv&days=${days}``
- ``https://${TEST_DOMAIN}``
- `acme.com`
- `button[type="submit"]`
- `california-business.com`
- `customer inquiry`
- `customer@example.com`
- `disclosure-456`
- `email`
- `example.com`
- `exportUrl`
- `field.value`
- `fifthMessage`
- `firstMessage`
- `fourthMessage`
- `http://localhost:3000/dashboard/analytics`
- `iframe#chat-widget-iframe`
- `invalid-domain-that-does-not-exist.xyz`
- `invalid-email-format`
- `invalidCreds.consumerKey`
- `invalidCreds.consumerSecret`
- `invalidCreds.storeUrl`
- `invalidUrl`
- `invalid_user_12345`
- `newdomain.com`
- `newsletter_signup`
- `nonexistent-session`
- `nonexistent@example.com`
- `old@example.com`
- `order`
- `pump`
- `rect-123`
- `searchQuery`
- `searchTerm`
- `secondMessage`
- `session-123`
- `session-abc-123`
- `session-forget-me`
- `session-test-123`
- `session-verify-db`
- `session-xyz-789`
- `support ticket`
- `test@example.com`
- `testEmail`
- `testPassword`
- `text=/recommendation/i`
- `thirdMessage`
- `user@acme.com`
- `user@california.com`
- `user@example.com`
- `validCreds.consumerKey`
- `validCreds.consumerSecret`
- `validCreds.storeUrl`
- `wrong_password_12345`
- `xyz123nonexistent999`
- `xyz123nonexistentproduct456abc`
- `xyzabc123nonexistentquery999`
- `{
      timeout: 10000,
    }`
- `{ state: 'attached', timeout: 10000 }`
- `{ state: 'attached', timeout: 15000 }`
- `{ state: 'visible', timeout: 10000 }`
- `{ state: 'visible', timeout: 15000 }`
- `{ state: 'visible', timeout: 5000 }`
- `{ state: 'visible', timeout: 60000 }`
- `{ timeout: 15000 }`
- `שלום, איך אני יכול לעזור?`
- `مرحبا، كيف يمكنني مساعدتك؟`

</details>

---

**Note:** This document is auto-generated from E2E tests. To update, run `npx tsx scripts/extract-workflows-from-e2e.ts`
