# Parallel Search Investigation Report

**Date:** 2025-11-15
**Issue:** AI only selects both tools (WooCommerce + search_website_content) 30% of the time instead of 100%
**Severity:** High - Impacts search comprehensiveness and user experience
**Status:** Root Cause Identified

---

## Executive Summary

**Root Cause Found:** The system prompt contains **contradictory instructions** that create ambiguity for the AI model.

The AI is receiving two conflicting messages:
1. ✅ "Use BOTH tools in parallel for product searches" (search-behavior.ts)
2. ❌ "DO NOT use search_website_content for live product catalog searches when WooCommerce is available" (get-available-tools.ts, tool-definitions.ts)

The second instruction **directly contradicts** the first, causing the AI to default to using only WooCommerce 70% of the time.

---

## Investigation Findings

### 1. System Prompt Construction (base-prompt.ts)

**Order of Prompt Sections:**
```typescript
// Line 47-65 in base-prompt.ts
return `${personalityIntro}${languageInstruction}${organizationContext}

${getSearchBehaviorPrompt()}          // ← Says "Use BOTH tools"

${getWooCommerceWorkflowPrompt()}

${getShopifyWorkflowPrompt()}

${getConversationReferencingPrompt()}

${getAntiHallucinationPrompt()}

${getCapabilitiesPrompt()}            // ← Also says "Use BOTH tools"

${getErrorHandlingPrompt()}

${getAlternativeProductsPrompt()}

${getLinkFormattingPrompt()}`;
```

**Finding:** Prompt sections ARE properly assembled and the "Use BOTH tools" instruction appears in TWO places (search-behavior.ts and capabilities.ts).

### 2. Tool Definitions - THE CONTRADICTION

**File: lib/chat/get-available-tools.ts (Lines 84-86)**
```typescript
{
  type: "function" as const,
  function: {
    name: "search_website_content",
    description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
    //                                                                                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                                                                                          THIS DIRECTLY CONTRADICTS "Use BOTH tools in parallel"
```

**File: lib/chat/tool-definitions.ts (Line 16)**
```typescript
{
  type: "function" as const,
  function: {
    name: "search_website_content",
    description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
    //                                                                                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //                                                                                                          SAME CONTRADICTION HERE
```

### 3. System Prompt Instructions - THE CONFLICT

**File: lib/chat/system-prompts/sections/search-behavior.ts (Lines 12-14)**
```typescript
1. **Product Searches** - Use BOTH tools in parallel for comprehensive results:
   ✅ REQUIRED: woocommerce_operations (operation: "search_products") or shopify_operations
   ✅ ALSO USE: search_website_content (to get page context, descriptions, additional info)
```

**But the tool definition says:**
```
DO NOT use this for live product catalog searches when WooCommerce or Shopify is available
```

**This creates cognitive dissonance for the AI model:**
- System prompt: "REQUIRED: Use BOTH tools"
- Tool description: "DO NOT use search_website_content when WooCommerce is available"

**Result:** AI defaults to the more conservative interpretation (use only WooCommerce) 70% of the time.

### 4. Tool Availability Instructions (get-available-tools.ts Lines 177-203)

**Additional Confusion:**
```typescript
if (availability.hasWooCommerce) {
  instructions.push(
    "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "Use the woocommerce_operations tool for all e-commerce tasks."
    //  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    //  "for ALL e-commerce tasks" further reinforces single-tool usage
  );
}
```

This instruction suggests WooCommerce should handle ALL e-commerce tasks, which contradicts "use BOTH tools in parallel."

### 5. Model Behavior Analysis

**Model Used:** GPT-5-mini (line 79 in ai-processor-formatter.ts)

**Tool Selection Method:**
```typescript
// ai-processor.ts line 90
tool_choice: availableTools.length > 0 ? 'required' : 'none'
```

**Finding:** The first API call uses `tool_choice: 'required'`, which forces the AI to use AT LEAST ONE tool, but does NOT enforce using multiple tools.

**Subsequent calls (line 197):**
```typescript
tool_choice: 'auto'
```

This allows the AI to decide whether to use tools at all in follow-up iterations.

### 6. Why It Works 30% of the Time

The AI model has two competing instructions:
1. System prompt clearly states "Use BOTH tools"
2. Tool descriptions say "DO NOT use search_website_content when WooCommerce is available"

**When it works (30%):** The AI prioritizes the explicit system prompt instruction over the tool description.

**When it fails (70%):** The AI follows the tool description's prohibition, interpreting it as "WooCommerce alone is sufficient."

This 70/30 split likely reflects:
- GPT-5-mini's probabilistic nature
- Query wording variations affecting interpretation
- Token position of instructions (tool descriptions are closer to the decision point)

---

## Evidence Supporting the Diagnosis

### Smoking Gun #1: Tool Description Prohibition
```
"DO NOT use this for live product catalog searches when WooCommerce or Shopify is available"
```

This is a clear, unambiguous instruction to NOT use search_website_content when WooCommerce is available. It directly conflicts with "Use BOTH tools in parallel."

### Smoking Gun #2: "All E-commerce Tasks" Language
```
"Use the woocommerce_operations tool for all e-commerce tasks."
```

The word "all" implies exclusivity, suggesting WooCommerce should be the ONLY tool used for e-commerce.

### Smoking Gun #3: Tool Selection Logs

**Failing case (70%):**
```
[Tool Selection] AI selected 1 tool(s):
[Tool Selection] 1. woocommerce_operations
```

**Successful case (30%):**
```
[Tool Selection] AI selected 2 tool(s):
[Tool Selection] 1. woocommerce_operations
[Tool Selection] 2. search_website_content
```

The AI IS capable of selecting multiple tools—it's just being told not to by the contradictory tool description.

---

## Root Cause Statement

**The AI is following contradictory instructions:**

1. **System Prompt (search-behavior.ts, capabilities.ts):** "Use BOTH tools in parallel for product searches"
2. **Tool Description (get-available-tools.ts, tool-definitions.ts):** "DO NOT use search_website_content when WooCommerce is available"
3. **Tool Availability (get-available-tools.ts):** "Use woocommerce_operations for ALL e-commerce tasks"

**Result:** The AI chooses the conservative interpretation (single tool) 70% of the time to avoid violating the "DO NOT use" prohibition.

---

## Specific Fix Recommendations

### Fix #1: Update Tool Description (Primary Fix)

**File:** `lib/chat/get-available-tools.ts` (Line 84-86)

**REMOVE THIS:**
```typescript
description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
```

**REPLACE WITH:**
```typescript
description: "Search scraped website content including product descriptions, page context, FAQs, policies, documentation, and general information. ALWAYS use this tool IN PARALLEL with woocommerce_operations or shopify_operations for product searches to provide comprehensive results combining live catalog data with website context.",
```

**Same change needed in:** `lib/chat/tool-definitions.ts` (Line 16)

### Fix #2: Update Tool Availability Instructions

**File:** `lib/chat/get-available-tools.ts` (Lines 188-192)

**CHANGE FROM:**
```typescript
if (availability.hasWooCommerce) {
  instructions.push(
    "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "Use the woocommerce_operations tool for all e-commerce tasks."
  );
}
```

**CHANGE TO:**
```typescript
if (availability.hasWooCommerce) {
  instructions.push(
    "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "For product searches, ALWAYS use BOTH woocommerce_operations AND search_website_content in parallel.",
    "Use woocommerce_operations alone only for non-search operations (cart, orders, checkout)."
  );
}
```

### Fix #3: Enforce Parallel Tool Selection (Optional - Stronger Enforcement)

**File:** `lib/chat/ai-processor.ts` (Line 90)

**Consider changing from:**
```typescript
tool_choice: availableTools.length > 0 ? 'required' : 'none'
```

**To a custom validation that ensures BOTH tools are selected for product queries:**
```typescript
// This would require implementing a custom tool_choice strategy or post-validation
// that checks if both tools were selected for product-related queries
```

**Note:** This is more complex and may not be necessary if Fixes #1 and #2 resolve the issue.

### Fix #4: Add Explicit Parallel Tool Enforcement in System Prompt

**File:** `lib/chat/system-prompts/sections/search-behavior.ts` (After Line 14)

**ADD:**
```typescript
**CRITICAL ENFORCEMENT:**
- When user asks about products, you MUST select BOTH tools in a single API call
- DO NOT call woocommerce_operations alone for product searches
- DO NOT call search_website_content alone for product searches
- ALWAYS call BOTH simultaneously using parallel tool execution
- This is NOT optional - it's a requirement for product searches
```

---

## Test Plan

### Test Case 1: Product Query (Primary Test)
```typescript
Query: "do you sell gloves"
Expected: 2 tools selected (woocommerce_operations + search_website_content)
Verify: Check [Tool Selection] logs show both tools
```

### Test Case 2: Policy Query (Should NOT Use Both)
```typescript
Query: "what's your return policy"
Expected: 1 tool selected (search_website_content only)
Verify: WooCommerce should NOT be called for policy questions
```

### Test Case 3: Order Lookup (Should NOT Use Both)
```typescript
Query: "check order #12345"
Expected: 1 tool selected (woocommerce_operations only)
Verify: search_website_content should NOT be called for order lookups
```

### Test Case 4: Vague Product Query
```typescript
Query: "what do you have"
Expected: 2 tools selected (woocommerce_operations + search_website_content)
Verify: Even vague queries should trigger parallel search
```

### Test Case 5: Specific Product Query
```typescript
Query: "A4VTG90 pump specifications"
Expected: 2 tools selected (woocommerce_operations + search_website_content)
Verify: Specific product queries need both catalog + page context
```

### Success Criteria
- Product queries: 100% parallel tool usage (up from 30%)
- Policy queries: 100% single tool usage (search_website_content only)
- Order queries: 100% single tool usage (woocommerce_operations only)

### Regression Tests
- Run existing test suite: `npm test`
- Run integration tests: `npm run test:integration`
- Verify no new test failures

---

## Risk Assessment

### Low Risk Changes
✅ **Fix #1 & #2 (Tool descriptions):** Low risk - only changes text descriptions
- No code logic changes
- Only affects AI interpretation
- Easy to revert if issues occur

### Medium Risk Changes
⚠️ **Fix #4 (Additional enforcement):** Medium risk - adds more instructions
- Could potentially over-constrain AI behavior
- May need iteration to get wording right
- Test thoroughly with various query types

### High Risk Changes
🔴 **Fix #3 (Tool choice validation):** High risk - requires code changes
- Modifies API call structure
- Could break existing functionality
- Only implement if Fixes #1, #2, #4 are insufficient
- Requires comprehensive testing

---

## Implementation Priority

### Phase 1: High Priority (Implement First)
1. ✅ Fix #1: Update tool description in get-available-tools.ts
2. ✅ Fix #1: Update tool description in tool-definitions.ts
3. ✅ Fix #2: Update tool availability instructions

**Expected Impact:** 70% → 95%+ parallel tool usage

### Phase 2: If Phase 1 Insufficient (Optional)
4. ⚠️ Fix #4: Add explicit enforcement in search-behavior.ts

**Expected Impact:** 95% → 99%+ parallel tool usage

### Phase 3: Only If Needed (Last Resort)
5. 🔴 Fix #3: Implement custom tool_choice validation

**Expected Impact:** 99% → 100% parallel tool usage

---

## Code Changes Summary

### Files to Modify
1. `/Users/jamesguy/Omniops/lib/chat/get-available-tools.ts` (Lines 84-86, 188-192)
2. `/Users/jamesguy/Omniops/lib/chat/tool-definitions.ts` (Line 16)
3. `/Users/jamesguy/Omniops/lib/chat/system-prompts/sections/search-behavior.ts` (Optional - Line 14)

### Lines Changed
- get-available-tools.ts: 2 sections (~8 lines)
- tool-definitions.ts: 1 line
- search-behavior.ts: Optional addition (~5 lines)

**Total:** ~14 lines of text changes

---

## Validation Commands

After implementing fixes:

```bash
# 1. Run linting
npm run lint

# 2. Run type checking
npx tsc --noEmit

# 3. Run unit tests
npm test

# 4. Run integration tests
npm run test:integration

# 5. Manual testing with dev server
npm run dev
# Then use widget test page to verify tool selection logs
```

---

## Conclusion

**Root Cause:** Contradictory instructions in tool descriptions telling AI to NOT use search_website_content when WooCommerce is available, while system prompt says to use BOTH tools.

**Solution:** Update tool descriptions to reinforce parallel usage instead of prohibiting it.

**Confidence Level:** 95% - This is the root cause based on evidence from:
- Tool description text analysis
- System prompt instruction analysis
- Tool selection log patterns
- AI model behavior with conflicting instructions

**Expected Outcome:** Fixing the contradictory instructions should increase parallel tool usage from 30% to 95%+ without requiring code logic changes.

**Next Steps:** Implement Phase 1 fixes, test thoroughly, and monitor tool selection logs to verify 100% parallel usage for product queries.
