# Parallel Search Fix - Quick Reference

**Issue:** AI only uses both tools 30% of the time instead of 100%
**Root Cause:** Contradictory instructions in tool descriptions
**Fix Complexity:** Simple text changes (14 lines)
**Risk Level:** Low

---

## The Problem in 30 Seconds

The system prompt says:
> "Use BOTH tools in parallel for product searches"

But the tool description says:
> "DO NOT use this for live product catalog searches when WooCommerce is available"

**Result:** AI follows the prohibition 70% of the time, using only WooCommerce.

---

## The Fix (Copy-Paste Ready)

### Change 1: lib/chat/get-available-tools.ts (Line 85)

**FIND:**
```typescript
description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
```

**REPLACE WITH:**
```typescript
description: "Search scraped website content including product descriptions, page context, FAQs, policies, documentation, and general information. ALWAYS use this tool IN PARALLEL with woocommerce_operations or shopify_operations for product searches to provide comprehensive results combining live catalog data with website context.",
```

---

### Change 2: lib/chat/tool-definitions.ts (Line 16)

**FIND:**
```typescript
description: "Search scraped website content including FAQs, policies, documentation, and general information. Use this for questions about company policies, help articles, guides, and non-product information. DO NOT use this for live product catalog searches when WooCommerce or Shopify is available - use their respective tools instead.",
```

**REPLACE WITH:**
```typescript
description: "Search scraped website content including product descriptions, page context, FAQs, policies, documentation, and general information. ALWAYS use this tool IN PARALLEL with woocommerce_operations or shopify_operations for product searches to provide comprehensive results combining live catalog data with website context.",
```

---

### Change 3: lib/chat/get-available-tools.ts (Lines 188-192)

**FIND:**
```typescript
if (availability.hasWooCommerce) {
  instructions.push(
    "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "Use the woocommerce_operations tool for all e-commerce tasks."
  );
}
```

**REPLACE WITH:**
```typescript
if (availability.hasWooCommerce) {
  instructions.push(
    "✅ WooCommerce is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "For product searches, ALWAYS use BOTH woocommerce_operations AND search_website_content in parallel.",
    "Use woocommerce_operations alone only for non-search operations (cart, orders, checkout)."
  );
}
```

---

### Change 4 (SAME for Shopify): lib/chat/get-available-tools.ts (Lines 195-200)

**FIND:**
```typescript
if (availability.hasShopify) {
  instructions.push(
    "✅ Shopify is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "Use the shopify_operations tool for all Shopify e-commerce tasks."
  );
}
```

**REPLACE WITH:**
```typescript
if (availability.hasShopify) {
  instructions.push(
    "✅ Shopify is configured - you can perform cart operations, check orders, and manage the shopping experience.",
    "For product searches, ALWAYS use BOTH shopify_operations AND search_website_content in parallel.",
    "Use shopify_operations alone only for non-search operations (cart, orders, checkout)."
  );
}
```

---

## Quick Test

After making changes, test with:

```bash
# Start dev server
npm run dev

# In another terminal, run test
npx tsx __tests__/integration/test-search-first-behavior.ts
```

**Expected output:**
```
[Tool Selection] AI selected 2 tool(s):
[Tool Selection] 1. woocommerce_operations
[Tool Selection] 2. search_website_content
```

**Not this:**
```
[Tool Selection] AI selected 1 tool(s):
[Tool Selection] 1. woocommerce_operations
```

---

## Files Modified
1. `lib/chat/get-available-tools.ts` - 2 sections
2. `lib/chat/tool-definitions.ts` - 1 section

**Total Changes:** 3 text replacements (14 lines)

---

## Expected Outcome
- Before: 30% parallel tool usage
- After: 95-100% parallel tool usage

## Verification
Check server logs for `[Tool Selection]` entries - should show 2 tools for product queries.
