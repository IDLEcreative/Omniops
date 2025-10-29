# WooCommerce Tools Comprehensive Expansion Plan

**Created:** 2025-10-29
**Goal:** Expand WooCommerce integration from 6 tools to 16 tools (167% increase)
**Timeline:** 4 phases over ~40 hours of implementation
**Current Coverage:** 5.7% → **Target Coverage:** 15.2%

---

## Executive Summary

This plan systematically expands the WooCommerce integration by adding 10 new customer-facing and business intelligence tools. Each phase includes implementation, testing, and verification to ensure stability.

**Success Metrics:**
- ✅ All 10 new tools operational
- ✅ 100% test coverage for new tools
- ✅ Health monitoring updated
- ✅ Performance benchmarks established
- ✅ Documentation complete

---

## Phase 1: Customer Experience Tools (High Priority)

**Timeline:** 7 hours
**Focus:** Immediate customer value, frequently requested features

### Tool 1.1: Product Categories Browser 🌟
**Priority:** CRITICAL
**Effort:** 2 hours
**Customer Value:** HIGH

#### Implementation Steps:
1. **Add enum** (`lib/chat/woocommerce-tool-types.ts:17`)
   ```typescript
   "get_product_categories"
   ```

2. **Add parameters** to `WooCommerceOperationParams`:
   ```typescript
   categoryId?: string;
   parentCategory?: number;
   ```

3. **Create operation** (`lib/chat/woocommerce-tool-operations.ts`):
   ```typescript
   export async function getProductCategories(
     wc: any,
     params: WooCommerceOperationParams
   ): Promise<WooCommerceOperationResult>
   ```

4. **Register in switch** (`lib/chat/woocommerce-tool.ts`)

#### Test Cases:
- ✅ List all categories
- ✅ Get specific category by ID
- ✅ Filter by parent category
- ✅ Handle empty results
- ✅ Handle API errors

#### Example Usage:
```
User: "Show me all your pump categories"
AI: Uses get_product_categories → Lists hydraulic pumps, water pumps, etc.

User: "What types of tools do you sell?"
AI: Uses get_product_categories → Shows all tool categories
```

---

### Tool 1.2: Product Reviews & Ratings 🌟
**Priority:** HIGH
**Effort:** 3 hours
**Customer Value:** HIGH

#### Implementation Steps:
1. **Add enum**: `"get_product_reviews"`

2. **Add parameters**:
   ```typescript
   limit?: number;
   minRating?: number;
   ```

3. **Create operation** with formatting:
   - Star rating display (⭐⭐⭐⭐⭐)
   - Reviewer name
   - Review text (truncated if long)
   - Date formatting
   - Average rating calculation

4. **Register in switch**

#### Test Cases:
- ✅ Retrieve reviews for product with reviews
- ✅ Handle product with no reviews
- ✅ Limit results (default 5, max 10)
- ✅ Filter by minimum rating
- ✅ Format multi-line reviews
- ✅ Handle API errors

#### Example Usage:
```
User: "What do customers think of the SAG115 grinder?"
AI: Uses get_product_reviews → Shows 5 recent reviews with ratings

User: "Is this product reliable?"
AI: Uses get_product_reviews → Shows average rating + recent feedback
```

---

### Tool 1.3: Coupon Validation 🌟
**Priority:** MEDIUM-HIGH
**Effort:** 2 hours
**Customer Value:** MEDIUM

#### Implementation Steps:
1. **Add enum**: `"validate_coupon"`

2. **Add parameters**:
   ```typescript
   couponCode: string;
   ```

3. **Create operation**:
   - Check if coupon exists
   - Check expiry date
   - Show discount amount/percentage
   - Show usage restrictions
   - Check minimum spend requirements

4. **Register in switch**

#### Test Cases:
- ✅ Valid active coupon
- ✅ Expired coupon
- ✅ Non-existent coupon
- ✅ Coupon with usage limit reached
- ✅ Coupon with product restrictions
- ✅ Handle API errors

#### Example Usage:
```
User: "Does code SAVE10 still work?"
AI: Uses validate_coupon → "Yes, SAVE10 gives you 10% off orders over £50"

User: "Are there any sales right now?"
AI: Uses validate_coupon (search) → Lists active coupon codes
```

---

## Phase 2: Order Management Tools (Medium Priority)

**Timeline:** 9 hours
**Focus:** Post-purchase customer support

### Tool 2.1: Order Refund Status 🌟
**Priority:** HIGH
**Effort:** 3 hours
**Customer Value:** HIGH

#### Implementation Steps:
1. **Add enum**: `"check_refund_status"`

2. **Add parameters**:
   ```typescript
   orderId: string;
   refundId?: string;
   ```

3. **Create operation**:
   - Retrieve all refunds for order
   - Show refund amounts
   - Show refund dates
   - Show refund reasons
   - Calculate total refunded vs order total

4. **Register in switch**

#### Test Cases:
- ✅ Order with full refund
- ✅ Order with partial refund
- ✅ Order with multiple refunds
- ✅ Order with no refunds
- ✅ Invalid order ID
- ✅ Handle API errors

#### Example Usage:
```
User: "Where's my refund for order #12345?"
AI: Uses check_refund_status → "Refund of £45.99 processed on Oct 25th"

User: "Was my return approved?"
AI: Uses check_refund_status → Shows refund status and amount
```

---

### Tool 2.2: Customer Order History 🌟
**Priority:** CRITICAL
**Effort:** 4 hours
**Customer Value:** CRITICAL

#### Implementation Steps:
1. **Add enum**: `"get_customer_orders"`

2. **Add parameters**:
   ```typescript
   email: string;
   status?: string;  // 'completed', 'pending', 'processing', etc.
   limit?: number;
   dateFrom?: string;
   dateTo?: string;
   ```

3. **Create operation** (complex):
   - Look up customer by email
   - Retrieve orders for customer ID
   - Filter by status if specified
   - Sort by date (newest first)
   - Format order list with key details

4. **Register in switch**

#### Test Cases:
- ✅ Customer with multiple orders
- ✅ Customer with no orders
- ✅ Filter by status (completed only)
- ✅ Filter by date range
- ✅ Limit results
- ✅ Invalid email format
- ✅ Handle API errors

#### Example Usage:
```
User: "Show me all my orders" (email: john@example.com)
AI: Uses get_customer_orders → Lists all orders with dates, totals, status

User: "What did I order last month?"
AI: Uses get_customer_orders (dateFrom) → Shows orders from last month
```

---

### Tool 2.3: Order Notes & Communication 🌟
**Priority:** MEDIUM
**Effort:** 2 hours
**Customer Value:** MEDIUM

#### Implementation Steps:
1. **Add enum**: `"get_order_notes"`

2. **Add parameters**:
   ```typescript
   orderId: string;
   noteType?: string;  // 'customer', 'internal', 'all'
   ```

3. **Create operation**:
   - Retrieve order notes
   - Filter by type (customer-facing vs internal)
   - Show note content and dates
   - Show author (for internal notes)

4. **Register in switch**

#### Test Cases:
- ✅ Order with customer notes
- ✅ Order with internal notes
- ✅ Order with no notes
- ✅ Filter by note type
- ✅ Handle API errors

#### Example Usage:
```
User: "Did you leave any updates on my order?"
AI: Uses get_order_notes → Shows customer-facing notes

Internal: Check internal notes for order troubleshooting
```

---

## Phase 3: Advanced Product Features (Medium Priority)

**Timeline:** 8 hours
**Focus:** Product discovery and configuration

### Tool 3.1: Product Variations 🌟
**Priority:** HIGH
**Effort:** 3 hours
**Customer Value:** HIGH

#### Implementation Steps:
1. **Add enum**: `"get_product_variations"`

2. **Add parameters**:
   ```typescript
   productId: string;
   includeStock?: boolean;
   includePrice?: boolean;
   ```

3. **Create operation**:
   - Check if product has variations
   - Retrieve all variations
   - Show attributes (size, color, voltage, etc.)
   - Show stock status per variation
   - Show price per variation

4. **Register in switch**

#### Test Cases:
- ✅ Product with multiple variations
- ✅ Simple product (no variations)
- ✅ Variations with different stock levels
- ✅ Variations with different prices
- ✅ Out of stock variation
- ✅ Handle API errors

#### Example Usage:
```
User: "Do you have this pump in 24V?"
AI: Uses get_product_variations → "Yes! Available in 12V, 24V, and 110V"

User: "What sizes does this cable come in?"
AI: Uses get_product_variations → Lists all size options with prices
```

---

### Tool 3.2: Shipping Methods & Costs 🌟
**Priority:** MEDIUM
**Effort:** 3 hours
**Customer Value:** MEDIUM

#### Implementation Steps:
1. **Add enum**: `"get_shipping_methods"`

2. **Add parameters**:
   ```typescript
   zoneId?: string;
   countryCode?: string;
   ```

3. **Create operation**:
   - Retrieve shipping zones
   - Show shipping methods per zone
   - Show costs and delivery times
   - Handle location-based filtering

4. **Register in switch**

#### Test Cases:
- ✅ List all shipping methods
- ✅ Filter by zone
- ✅ Filter by country
- ✅ Show costs and delivery estimates
- ✅ Handle API errors

#### Example Usage:
```
User: "What shipping options are available?"
AI: Uses get_shipping_methods → Lists standard, express, international

User: "How much is express shipping to Scotland?"
AI: Uses get_shipping_methods (country=GB) → Shows UK shipping options
```

---

### Tool 3.3: Payment Methods 🌟
**Priority:** LOW
**Effort:** 2 hours
**Customer Value:** LOW

#### Implementation Steps:
1. **Add enum**: `"get_payment_methods"`

2. **No additional parameters needed**

3. **Create operation**:
   - Retrieve active payment gateways
   - Show method names and descriptions
   - Show which methods are enabled

4. **Register in switch**

#### Test Cases:
- ✅ List all payment methods
- ✅ Show enabled vs disabled
- ✅ Handle API errors

#### Example Usage:
```
User: "What payment methods do you accept?"
AI: Uses get_payment_methods → "We accept Visa, Mastercard, PayPal, and bank transfer"
```

---

## Phase 4: Business Intelligence Tools (Low Priority)

**Timeline:** 9 hours
**Focus:** Analytics and reporting (admin-facing)

### Tool 4.1: Low Stock Alerts 🌟
**Priority:** MEDIUM
**Effort:** 3 hours
**Customer Value:** LOW (internal)

#### Implementation Steps:
1. **Add enum**: `"get_low_stock_products"`

2. **Add parameters**:
   ```typescript
   threshold?: number;  // Default 5
   categoryId?: string;
   limit?: number;
   ```

3. **Create operation**:
   - Query products with stock tracking enabled
   - Filter by stock quantity <= threshold
   - Sort by quantity (lowest first)
   - Show product name, SKU, current stock

4. **Register in switch**

#### Test Cases:
- ✅ Products below threshold
- ✅ Custom threshold (10 units)
- ✅ Filter by category
- ✅ No low stock products
- ✅ Handle API errors

#### Example Usage:
```
Admin: "What products are running low?"
AI: Uses get_low_stock_products → Lists products with <5 units

Admin: "Show me pumps with less than 10 in stock"
AI: Uses get_low_stock_products (threshold=10, category) → Filtered list
```

---

### Tool 4.2: Sales Reports 🌟
**Priority:** MEDIUM
**Effort:** 3 hours
**Customer Value:** LOW (internal)

#### Implementation Steps:
1. **Add enum**: `"get_sales_report"`

2. **Add parameters**:
   ```typescript
   period?: string;  // 'today', 'week', 'month', 'year'
   dateFrom?: string;
   dateTo?: string;
   ```

3. **Create operation**:
   - Retrieve sales data for period
   - Calculate total sales
   - Show order count
   - Show average order value
   - Format currency properly

4. **Register in switch**

#### Test Cases:
- ✅ Today's sales
- ✅ This week's sales
- ✅ Custom date range
- ✅ No sales in period
- ✅ Handle API errors

#### Example Usage:
```
Admin: "How much did we sell today?"
AI: Uses get_sales_report (period='today') → "£1,245.67 across 15 orders"
```

---

### Tool 4.3: Top Sellers Report 🌟
**Priority:** LOW
**Effort:** 3 hours
**Customer Value:** LOW (internal)

#### Implementation Steps:
1. **Add enum**: `"get_top_sellers"`

2. **Add parameters**:
   ```typescript
   period?: string;
   limit?: number;  // Default 10
   categoryId?: string;
   ```

3. **Create operation**:
   - Retrieve top selling products
   - Show quantity sold
   - Show revenue generated
   - Sort by sales volume

4. **Register in switch**

#### Test Cases:
- ✅ Top 10 sellers this month
- ✅ Top 5 sellers this week
- ✅ Filter by category
- ✅ Handle API errors

#### Example Usage:
```
Admin: "What are our best sellers this month?"
AI: Uses get_top_sellers → Lists top 10 products with quantities
```

---

## Testing Strategy

### Per-Tool Testing Checklist

For each new tool, complete this checklist:

#### 1. Unit Tests
```bash
# Create test file: __tests__/lib/chat/woocommerce-tool-operations.test.ts
npm test -- woocommerce-tool-operations.test.ts
```

**Test Coverage:**
- ✅ Happy path (successful operation)
- ✅ Missing required parameters
- ✅ Invalid parameters
- ✅ Empty results
- ✅ API errors (401, 404, 500)
- ✅ Timeout handling
- ✅ Data formatting edge cases

#### 2. Integration Tests
```bash
# Create test file: __tests__/integration/woocommerce-[tool-name].test.ts
npm run test:integration
```

**Test Coverage:**
- ✅ Real API call (using test credentials)
- ✅ Response parsing
- ✅ Error handling
- ✅ Performance (< 3 seconds)

#### 3. Chat Integration Tests
```bash
# Create test file: test-chat-[tool-name]-integration.ts
npx tsx test-chat-[tool-name]-integration.ts
```

**Test Coverage:**
- ✅ AI correctly selects tool
- ✅ AI parses user intent
- ✅ AI formats response naturally
- ✅ AI handles errors gracefully

#### 4. Health Monitoring
```bash
# Update monitor-woocommerce.ts
npx tsx monitor-woocommerce.ts
```

**Add Check For:**
- ✅ Tool operation successful
- ✅ Response time < threshold
- ✅ Error rate < 5%

---

## Documentation Updates

### Files to Update

#### 1. Tool Types Documentation
**File:** `lib/chat/woocommerce-tool-types.ts`
- Add JSDoc comments for each new enum value
- Add TypeScript interface definitions
- Add usage examples

#### 2. Customization Guide
**File:** `docs/WOOCOMMERCE_CUSTOMIZATION.md`
- Add section for each new tool
- Include example usage
- Document parameters and return types

#### 3. Architecture Analysis
**File:** `docs/04-ANALYSIS/ANALYSIS_WOOCOMMERCE_ARCHITECTURE.md`
- Update coverage statistics
- Mark tools as implemented
- Update gap analysis

#### 4. Main CLAUDE.md
**File:** `CLAUDE.md`
- Add WooCommerce tools section if not present
- List all available tools
- Link to detailed docs

---

## Performance Benchmarks

### Target Metrics (Per Tool)

| Metric | Target | Critical |
|--------|--------|----------|
| Response Time (P50) | < 1.5s | < 3s |
| Response Time (P95) | < 3s | < 5s |
| Response Time (P99) | < 5s | < 10s |
| Success Rate | > 99% | > 95% |
| Error Rate | < 1% | < 5% |
| Timeout Rate | < 0.1% | < 1% |

### Benchmark Test
```bash
# Create test file: test-woocommerce-performance-benchmark.ts
npx tsx test-woocommerce-performance-benchmark.ts
```

**Test Each Tool:**
- 100 requests
- Measure P50, P95, P99
- Track success/error/timeout rates
- Generate performance report

---

## Implementation Timeline

### Week 1: Phase 1 - Customer Experience
**Monday (2h):** Tool 1.1 - Product Categories
- Implement operation
- Create unit tests
- Create integration tests

**Tuesday (3h):** Tool 1.2 - Product Reviews
- Implement operation
- Create unit tests
- Create integration tests

**Wednesday (2h):** Tool 1.3 - Coupon Validation
- Implement operation
- Create unit tests
- Create integration tests
- **MILESTONE: Phase 1 complete**

---

### Week 2: Phase 2 - Order Management
**Monday (3h):** Tool 2.1 - Order Refund Status
- Implement operation
- Create unit tests
- Create integration tests

**Tuesday (4h):** Tool 2.2 - Customer Order History
- Implement operation (complex)
- Create unit tests
- Create integration tests

**Wednesday (2h):** Tool 2.3 - Order Notes
- Implement operation
- Create unit tests
- Create integration tests
- **MILESTONE: Phase 2 complete**

---

### Week 3: Phase 3 - Advanced Features
**Monday (3h):** Tool 3.1 - Product Variations
- Implement operation
- Create unit tests
- Create integration tests

**Tuesday (3h):** Tool 3.2 - Shipping Methods
- Implement operation
- Create unit tests
- Create integration tests

**Wednesday (2h):** Tool 3.3 - Payment Methods
- Implement operation
- Create unit tests
- Create integration tests
- **MILESTONE: Phase 3 complete**

---

### Week 4: Phase 4 - Business Intelligence
**Monday (3h):** Tool 4.1 - Low Stock Alerts
- Implement operation
- Create unit tests
- Create integration tests

**Tuesday (3h):** Tool 4.2 - Sales Reports
- Implement operation
- Create unit tests
- Create integration tests

**Wednesday (3h):** Tool 4.3 - Top Sellers Report
- Implement operation
- Create unit tests
- Create integration tests
- **MILESTONE: Phase 4 complete**

---

### Week 5: Final Polish & Documentation
**Monday (3h):** Comprehensive Testing
- Run full test suite
- Performance benchmarking
- Load testing

**Tuesday (2h):** Documentation
- Update all docs
- Create usage examples
- Update CLAUDE.md

**Wednesday (2h):** Health Monitoring
- Update monitoring dashboard
- Create alerts for new tools
- Generate completion report

**Thursday (1h):** Final Review
- Code review
- Security review
- Performance review
- **MILESTONE: Project complete**

---

## Risk Mitigation

### Risk 1: API Rate Limiting
**Probability:** Medium
**Impact:** High
**Mitigation:**
- Implement caching for frequently requested data
- Add rate limit detection and backoff
- Monitor API usage in health dashboard

### Risk 2: Performance Degradation
**Probability:** Low
**Impact:** Medium
**Mitigation:**
- Performance benchmarking before and after
- Set response time alerts
- Optimize slow queries

### Risk 3: Breaking Changes
**Probability:** Low
**Impact:** High
**Mitigation:**
- Comprehensive test coverage
- Regression testing
- Staged rollout (phase by phase)

### Risk 4: Test Failures
**Probability:** Medium
**Impact:** Medium
**Mitigation:**
- Fix tests immediately (don't accumulate)
- Use real API in integration tests
- Mock external dependencies properly

---

## Success Criteria

### Phase Completion Criteria

Each phase is complete when:
- ✅ All tools implemented and working
- ✅ All unit tests passing (100% coverage)
- ✅ All integration tests passing
- ✅ Chat integration tests passing
- ✅ Performance benchmarks meet targets
- ✅ Documentation updated
- ✅ Health monitoring updated
- ✅ Code reviewed and approved

### Project Completion Criteria

Project is complete when:
- ✅ All 4 phases complete
- ✅ All 10 new tools operational
- ✅ Test coverage > 95%
- ✅ All performance benchmarks met
- ✅ All documentation updated
- ✅ Health monitoring dashboard updated
- ✅ Final completion report generated
- ✅ Zero critical bugs
- ✅ Zero failing tests

---

## Deliverables

### Code Files (30+)
1. Updated `lib/chat/woocommerce-tool-types.ts`
2. Updated `lib/chat/woocommerce-tool-operations.ts` (10 new functions)
3. Updated `lib/chat/woocommerce-tool.ts` (10 new case statements)
4. 10 new test files (`__tests__/lib/chat/woocommerce-*.test.ts`)
5. 10 new integration test files
6. 10 new chat integration test scripts
7. Updated `monitor-woocommerce.ts`
8. New `test-woocommerce-performance-benchmark.ts`

### Documentation (5 files)
1. Updated `docs/WOOCOMMERCE_CUSTOMIZATION.md`
2. Updated `docs/04-ANALYSIS/ANALYSIS_WOOCOMMERCE_ARCHITECTURE.md`
3. This plan document (`docs/WOOCOMMERCE_COMPREHENSIVE_EXPANSION_PLAN.md`)
4. Final completion report (`WOOCOMMERCE_EXPANSION_COMPLETION_REPORT.md`)
5. Updated `CLAUDE.md`

### Reports (3 files)
1. Performance benchmark report
2. Test coverage report
3. Final completion report

---

## Next Steps

### Immediate Actions
1. ✅ Review this plan with stakeholders
2. ✅ Approve timeline and resource allocation
3. ✅ Begin Phase 1 implementation
4. ✅ Set up monitoring and tracking

### Phase 1 Kickoff
```bash
# Start with Product Categories (easiest)
# 1. Update types
# 2. Implement operation
# 3. Create tests
# 4. Verify with health check
# 5. Move to next tool
```

---

## Questions & Decisions

### Open Questions
1. Should we prioritize certain tools over others?
2. Do we need approval for each phase, or can we proceed autonomously?
3. Should we implement customer-requested features first?
4. What's the process for emergency rollback if issues arise?

### Decisions Made
- ✅ Implement in 4 phases (not all at once)
- ✅ Full test coverage required for each tool
- ✅ Performance benchmarks must be met
- ✅ Documentation required before phase completion
- ✅ Health monitoring updated with each phase

---

## Contact & Support

**Project Lead:** Claude (AI Assistant)
**Documentation:** `docs/WOOCOMMERCE_*.md`
**Health Monitoring:** `monitor-woocommerce.ts`
**Test Suite:** `__tests__/lib/chat/woocommerce-*.test.ts`

---

## Appendix A: Quick Reference

### Tool Enum Values (All 16)

**Existing (6):**
1. `check_stock`
2. `get_stock_quantity`
3. `get_product_details`
4. `check_order`
5. `get_shipping_info`
6. `check_price`

**New (10):**
7. `get_product_categories`
8. `get_product_reviews`
9. `validate_coupon`
10. `check_refund_status`
11. `get_customer_orders`
12. `get_order_notes`
13. `get_product_variations`
14. `get_shipping_methods`
15. `get_payment_methods`
16. `get_low_stock_products`

**Optional (Future):**
17. `get_sales_report`
18. `get_top_sellers`

---

## Appendix B: File Structure

```
lib/
  chat/
    woocommerce-tool-types.ts          (UPDATE: Add 10 enums)
    woocommerce-tool-operations.ts     (UPDATE: Add 10 functions)
    woocommerce-tool.ts                 (UPDATE: Add 10 cases)

__tests__/
  lib/
    chat/
      woocommerce-tool-operations.test.ts  (UPDATE: Add 10 test suites)
  integration/
    woocommerce-categories.test.ts         (NEW)
    woocommerce-reviews.test.ts            (NEW)
    woocommerce-coupons.test.ts            (NEW)
    ... (7 more)

scripts/
  test-chat-categories-integration.ts      (NEW)
  test-chat-reviews-integration.ts         (NEW)
  ... (8 more)
  monitor-woocommerce.ts                   (UPDATE: Add tool checks)
  test-woocommerce-performance-benchmark.ts (NEW)

docs/
  WOOCOMMERCE_ARCHITECTURE_ANALYSIS.md     (UPDATE: Coverage stats)
  WOOCOMMERCE_CUSTOMIZATION.md             (UPDATE: New tool docs)
  WOOCOMMERCE_COMPREHENSIVE_EXPANSION_PLAN.md (THIS FILE)
  WOOCOMMERCE_EXPANSION_COMPLETION_REPORT.md (FUTURE)
```

---

**Ready to begin implementation? Say the word and we'll start with Phase 1, Tool 1.1: Product Categories!** 🚀
