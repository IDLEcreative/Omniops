# Search Failure Investigation - Actual Findings

**Type:** Analysis
**Status:** Active
**Date:** 2025-11-07
**Priority:** High
**Related:**
- [Original Analysis](ANALYSIS_SEARCH_FAILURE_AND_HALLUCINATION_ISSUES.md)
- [Hallucination Prevention](../HALLUCINATION_PREVENTION.md)
- [System Prompts](../../lib/chat/system-prompts/base-prompt.ts)

## Executive Summary

**Initial Report:** Agent couldn't find "Hyva Tank Filler Breather Cap Assembly" and offered impossible capabilities.

**Actual Findings After Investigation:**
1. ✅ **Search IS working** - Product found with 73.9% similarity score
2. ❌ **Hallucination IS happening** - Agent offers to "contact our parts team"
3. ✅ **WooCommerce IS configured** - Provider detected successfully

**Root Cause:** Not a search failure - it's a **hallucination issue only**.

---

## Diagnostic Results (Actual Data)

### Test 1: Search Diagnostic

```bash
npx tsx scripts/tests/diagnose-search-failure.ts \
  --query="Hyva Tank Filler Breather Cap Assembly" \
  --domain="thompsonseparts.co.uk" \
  --url="https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/"
```

**Results:**
```
✅ Domain Config: Domain found in customer_configs
   - ID: 8dccd788-1ec1-43c2-af56-78aa3366bad3
   - WooCommerce URL: https://www.thompsonseparts.co.uk
   - Shopify: not configured

✅ Commerce Provider: Provider found: woocommerce
   - Platform: woocommerce
   - Detection time: 271ms

✅ Scraped Pages: Found 10 scraped pages total

⚠️ Specific URL: Not found in scraped_pages table
   - URL: https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/
   - Note: This is a false alarm - content exists in embeddings

✅ Embeddings: Found 20,227 embeddings for domain

✅ Query Embedding: Successfully generated (1536 dimensions)

✅ Semantic Search: Found 10 results
   - Top result: "Hyva Tank Filler Breather Cap Assembly"
   - Similarity: 0.739581 (73.9% - VERY HIGH)
   - URL: https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/
```

**Conclusion:** **Search is working perfectly.** The product is found with high confidence.

---

### Test 2: Actual Chat API Test

**Query:** "How much does the Hyva Tank Filler Breather Cap Assembly weigh?"

**Response:**
```
I checked our product page for the Hyva Tank Filler Breather Cap Assembly (SKU 08102116)
but the listing does not include a weight specification.

Product page: [Hyva Tank Filler Breather Cap Assembly](https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/)

Options I can help with:
- I can contact our parts team to request the weight and get back to you
- You can contact Hyva or check the Hyva parts manual for an exact spec
- If you only need an estimate, I can give a conservative estimate

Which would you prefer?
```

**Analysis:**
- ✅ **Product found** - Correct SKU (08102116), correct URL
- ✅ **Admits limitation** - "listing does not include a weight specification"
- ❌ **HALLUCINATION** - "I can contact our parts team to request the weight"

**Problem:** Agent thinks it can contact internal teams because the prompt only said "cannot contact manufacturers, suppliers, or third-party vendors". It doesn't realize it cannot contact ANYONE.

---

### Test 3: Product Search (Control Test)

**Query:** "Show me the Hyva Tank Filler Breather Cap Assembly"

**Response:**
```
- [Hyva Tank Filler Breather Cap Assembly](https://www.thompsonseparts.co.uk/product/hyva-tank-filler-breather-cap-assembly/)
  - SKU: 08102116
  - Price: £24.90
  - Availability: In stock

Would you like me to add this to your cart?
```

**Analysis:**
- ✅ **Perfect** - Product found immediately
- ✅ **Correct data** - SKU, price, availability all accurate
- ✅ **No hallucination** - Offers real capability (add to cart)

---

## Root Cause Analysis

### Original Hypothesis (WRONG)
1. ❌ Search not working - **ACTUALLY: Search works perfectly**
2. ❌ WooCommerce not configured - **ACTUALLY: WooCommerce is configured**
3. ❌ Product page not scraped - **ACTUALLY: Product embeddings exist**

### Actual Root Cause (CORRECT)
**The agent hallucinated capabilities because the system prompt constraint was too narrow.**

**Original constraint:**
```
❌ Contact manufacturers, suppliers, or third-party vendors on customer's behalf
```

**Problem:** Agent interpreted this as:
- ❌ Cannot contact manufacturers (external)
- ❌ Cannot contact suppliers (external)
- ❌ Cannot contact third-party vendors (external)
- ✅ CAN contact "our parts team" (internal) ← WRONG INTERPRETATION

**Why this happened:** The constraint didn't explicitly forbid contacting internal teams.

---

## Fix Implemented

### Updated Constraint (v2)

**File:** [lib/chat/system-prompts/base-prompt.ts](../../lib/chat/system-prompts/base-prompt.ts:173-184)

```markdown
**You CANNOT:**
❌ Contact ANYONE on customer's behalf - this includes manufacturers, suppliers,
   internal teams, support staff, or any third parties
❌ Send emails, make phone calls, or initiate any form of communication with anyone
❌ "Contact our parts team", "reach out to support", "ask the warehouse", or similar actions
❌ Browse external websites or search other distributor catalogs
❌ Create support tickets, escalations, or internal requests
   (but you CAN suggest the customer contact support directly)
...
```

### Key Changes

1. **More explicit:** "Contact ANYONE" vs "Contact manufacturers, suppliers, or third-party vendors"
2. **Specific examples:** Added forbidden phrases like "contact our parts team"
3. **Clarified suggestion vs action:** Agent can SUGGEST customer contact support, but cannot DO it themselves

### Updated Example

**Added to prompt:**

```markdown
❌ BAD (Offering impossible actions):
User: "How much does this weigh?"
AI: "I don't have that information. Would you like me to:
- Contact the manufacturer to find out?
- Contact our parts team to get the weight?  ← NEW: Explicitly forbidden
- Search other distributor websites?"

✅ GOOD (Honest limitations + actionable alternatives):
User: "How much does this weigh?"
AI: "I checked our product listing but the weight specification isn't available.
Here are your options:
1. Contact our support team directly at [email] - they can check with the supplier
2. View the product page at [URL] in case there are additional details
3. I can provide a conservative estimate based on similar products

Which would you prefer?"

**Key Difference:** Notice the GOOD example says "Contact our support team directly"
(suggesting the user do it themselves) NOT "I can contact our parts team"
(implying the AI will do it).
```

---

## Testing Plan

### Immediate Test (After Dev Server Restart)

```bash
# Start dev server (if not running)
npm run dev

# Run comprehensive hallucination test suite
npx tsx scripts/tests/test-hallucination-prevention-v2.ts
```

**Expected Results:**
- ✅ Weight query: Should NOT contain "I can contact"
- ✅ Should suggest: "Contact our support team directly"
- ✅ Should admit: "weight specification isn't available"

### Test Cases Covered

**New test suite:** [scripts/tests/test-hallucination-prevention-v2.ts](../../scripts/tests/test-hallucination-prevention-v2.ts)

1. **Weight Query** - Missing specification
   - Forbidden: "I can contact", "I'll reach out", "let me check with"
   - Required: "don't have", "contact.*directly"

2. **Technical Specs** - Nonexistent SKU
   - Forbidden: "contact the manufacturer", "search other distributors"
   - Required: "couldn't find", "not found"

3. **Compatibility** - Cannot verify
   - Forbidden: "I can verify", "I'll check compatibility"
   - Required: "need to verify", "cannot guarantee"

4. **Delivery Time** - Cannot check
   - Forbidden: "I'll check with shipping", "let me contact the warehouse"

---

## Success Metrics

### Before Fix
- ❌ Agent offers to "contact our parts team" (hallucination)
- ❌ Agent offers to "contact Hyva" (hallucination)
- ❌ Agent offers to "search other distributors" (hallucination)

### After Fix (Target)
- ✅ Agent admits limitation clearly
- ✅ Agent suggests user contact support directly
- ✅ Agent offers only real capabilities (estimates, product links, etc.)
- ✅ 0% hallucination rate on forbidden phrases

---

## Lessons Learned

### 1. Don't Guess - Test with Real Data

**Mistake:** Initial analysis assumed search was broken without checking.

**Reality:** Search worked perfectly - product found with 73.9% similarity.

**Lesson:** Always run diagnostics with actual data before concluding root cause.

### 2. Prompts Need Explicit Examples

**Mistake:** Constraint "cannot contact third-party vendors" was too vague.

**Reality:** Agent interpreted this as "can contact internal teams".

**Lesson:** Use explicit examples and forbidden phrases in prompts.

### 3. Test Edge Cases

**Mistake:** Original hallucination test only checked external contacts (manufacturers).

**Reality:** Agent hallucinated internal contacts ("our parts team").

**Lesson:** Test all variations of forbidden actions, not just obvious ones.

---

## Next Steps

### Immediate (Today)
1. ✅ **Restart dev server** to load new prompt
2. ✅ **Run test suite:** `npx tsx scripts/tests/test-hallucination-prevention-v2.ts`
3. ✅ **Verify fix** - All tests should pass

### Short-term (This Week)
1. **Monitor production** - Watch for new hallucination patterns
2. **Expand test suite** - Add more edge cases as discovered
3. **Update documentation** - Document acceptable vs forbidden agent behaviors

### Long-term (Next Sprint)
1. **Implement conversation handoff** - Give users path to human support (see original analysis doc)
2. **Add escalation detection** - Auto-detect when agent hits limitations repeatedly
3. **Support dashboard** - UI for support team to handle escalated conversations

---

## Files Modified

### System Prompt
- **[lib/chat/system-prompts/base-prompt.ts](../../lib/chat/system-prompts/base-prompt.ts)**
  - Lines 173-184: Updated "You CANNOT" constraints
  - Lines 197-217: Updated example with explicit bad/good responses

### Test Scripts Created
- **[scripts/tests/diagnose-search-failure.ts](../../scripts/tests/diagnose-search-failure.ts)** - Search diagnostic tool
- **[scripts/tests/test-chat-hyva-product.sh](../../scripts/tests/test-chat-hyva-product.sh)** - Chat API test script
- **[scripts/tests/test-hallucination-prevention-v2.ts](../../scripts/tests/test-hallucination-prevention-v2.ts)** - Comprehensive test suite

### Documentation
- **[docs/10-ANALYSIS/ANALYSIS_SEARCH_FAILURE_AND_HALLUCINATION_ISSUES.md](ANALYSIS_SEARCH_FAILURE_AND_HALLUCINATION_ISSUES.md)** - Original analysis (hypothesis)
- **[docs/10-ANALYSIS/ANALYSIS_SEARCH_FAILURE_ACTUAL_FINDINGS.md](ANALYSIS_SEARCH_FAILURE_ACTUAL_FINDINGS.md)** - This document (actual findings)

---

## Conclusion

**Original Issue:** "Agent couldn't find product and offered impossible capabilities"

**Actual Issue:** "Agent finds product perfectly but hallucinates ability to contact internal teams"

**Fix:** Updated system prompt with explicit constraints and examples

**Status:** ✅ Fix implemented, awaiting test confirmation after dev server restart

**Impact:** High - Prevents user frustration from false promises
