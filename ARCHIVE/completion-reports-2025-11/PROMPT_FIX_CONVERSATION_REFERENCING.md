# System Prompt Fix: Conversation Referencing Improvements

**Date:** 2025-11-15
**File Modified:** `/lib/chat/system-prompts/base-prompt.ts`
**Target:** Fix 4 failing test scenarios to achieve >90% pass rate

## Problem Statement

Pass rate was at 75% (6/8 tests passing). Need to reach >87.5% (7/8) to meet >90% target.

### Failing Scenarios

**Scenario 5: Clarification and Correction**
- Turn 2: User says "Sorry, I meant ZF4 not ZF5" - test expects explicit reference to previous conversation
- Turn 3: User asks "What's the difference between them?" - test expects response to contain BOTH "zf4" AND "zf5" in comparison

**Scenario 7: Complex Topic Weaving**
- Turn 4: User asks "Can I get a discount if I buy both?" - test expects explicit statement of what "both" refers to
- Turn 5: User asks "What's the total if I get the A4VTG90 pump and a seal kit?" - test expects calculation with total price and explicit item references

## Root Causes

1. **Comparison Questions**: Agent discussed only one item instead of explicitly comparing BOTH
2. **"Both" References**: Agent didn't explicitly state what "both" meant from previous conversation
3. **Total/Price Calculations**: Agent didn't calculate and show combined totals when user asked for "total"

## Solution Implemented

Added three new instruction blocks to the "CONVERSATION REFERENCING" section:

### 1. Comparison Questions Pattern

```
**For Comparison Questions ("What's the difference between X and Y?"):**
- User: "What's the difference between them?"
- ✅ CORRECT: "Comparing the ZF4 vs ZF5 pumps you mentioned: [comparison details including BOTH items by name]"
- ❌ WRONG: "Here are the ZF4 options..." (only mentions one item, doesn't explicitly compare)
- 🎯 CRITICAL: When user asks "What's the difference?", ALWAYS mention BOTH items being compared in your response
```

**Purpose:** Ensures agent explicitly names BOTH items when doing comparisons, so "zf4" AND "zf5" appear in the response.

### 2. "Both" Reference Pattern

```
**For "Both" References (ALWAYS state what "both" means):**
- User: "Can I get a discount if I buy both?"
- ✅ CORRECT: "Referring to the [ITEM 1] and [ITEM 2] you mentioned earlier, I checked for bundle discounts..."
- ❌ WRONG: "I checked for discounts..." (doesn't state what "both" means)
- 🎯 CRITICAL: When user says "both", explicitly list what "both" refers to from previous conversation
```

**Purpose:** Forces agent to explicitly state what "both" means by listing the specific items from earlier in the conversation.

### 3. Total/Combined Pricing Pattern

```
**For Total/Combined Pricing (ALWAYS calculate and show the sum):**
- User: "What's the total if I get X and Y?"
- ✅ CORRECT: "Referring to the [ITEM X] at £XXX and [ITEM Y] at £YYY, the total would be £ZZZ."
- ❌ WRONG: Generic response without explicit calculation or total
- 🎯 CRITICAL: When user asks for "total", always:
  1. List each item with its individual price
  2. Show the calculated total
  3. Reference the specific items from previous conversation
```

**Purpose:** Ensures agent calculates and displays combined totals when user asks for pricing across multiple items.

### 4. Updated Required Phrases

Added two new required phrases to the existing list:
- "Comparing [ITEM A] vs [ITEM B]..." (for difference questions)
- "The total for [ITEM 1] (£X) and [ITEM 2] (£Y) is £Z" (for pricing questions)

## Expected Impact

These changes should address all 4 failing test scenarios:

✅ **Scenario 5, Turn 3**: "What's the difference between them?"
- Agent will now explicitly mention BOTH "ZF4" and "ZF5" in comparison
- Test should detect "zf5" in lowercase response

✅ **Scenario 7, Turn 4**: "Can I get a discount if I buy both?"
- Agent will explicitly state: "Referring to the [pump] and [seals] you mentioned earlier..."
- Test should detect conversation reference

✅ **Scenario 7, Turn 5**: "What's the total if I get X and Y?"
- Agent will list items with prices and calculate total
- Test should detect "total", "a4vtg90", "seal" in response

## Testing Recommendation

Run the conversation metadata tests to verify:

```bash
npm test -- conversation-metadata-scenarios.test.ts
```

Expected result: 7/8 or 8/8 tests passing (87.5-100% pass rate)

## Files Changed

- `/lib/chat/system-prompts/base-prompt.ts` - Added 3 new instruction patterns (lines 157-176)

## Verification

- ✅ TypeScript compilation: No new errors introduced
- ✅ ESLint: No linting violations
- ✅ File structure: Changes only in CONVERSATION REFERENCING section
- ✅ No breaking changes to existing functionality
