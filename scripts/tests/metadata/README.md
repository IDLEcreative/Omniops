# Conversation Competency Test Suite

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Conversation Metadata System](/home/user/Omniops/lib/chat/conversation-metadata.ts), [Response Parser](/home/user/Omniops/lib/chat/response-parser.ts), [Testing README](/home/user/Omniops/scripts/tests/README.md)
**Estimated Read Time:** 4 minutes

## Purpose

Tests for measuring real-world conversation accuracy improvements through the metadata tracking system covering correction tracking, list references, and pronoun resolution.

## Quick Links

- [Testing README](/home/user/Omniops/scripts/tests/README.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
- [Conversation Metadata System](/home/user/Omniops/lib/chat/conversation-metadata.ts)
- [Response Parser](/home/user/Omniops/lib/chat/response-parser.ts)

## Keywords

conversation accuracy, metadata tracking, pronoun resolution, correction tracking, list references, competency testing, AI accuracy

This directory contains tests for measuring real-world conversation accuracy improvements through the metadata tracking system.

## Overview

The conversation competency test suite measures accuracy improvements in three key areas:

1. **Correction Tracking** - How well the system handles user corrections like "I meant X not Y"
2. **Numbered List References** - Resolution of "item 2", "the first one", etc.
3. **Pronoun Resolution** - Tracking "it", "that", "this", "my order" across conversation turns

## Baseline vs. Target Accuracy

| Category | Baseline | Current | Target | Status |
|----------|----------|---------|--------|--------|
| Correction Tracking | 33% | 50% | 90% | ❌ Not Met |
| List Reference | 33% | 100% | 85% | ✅ Met |
| Pronoun Resolution | 50% | 83% | 85% | ❌ Not Met |
| **Overall** | **71.4%** | **79%** | **90%** | ❌ Not Met |

## Running the Tests

```bash
# Run the full competency test suite
npx tsx scripts/tests/test-metadata-tracking.ts

# Run with verbose output
npx tsx scripts/tests/test-metadata-tracking.ts --verbose
```

## Test Categories

### 1. Correction Tracking Competency (Target: 90%)

Tests the system's ability to detect and track user corrections:

- **"I meant X not Y"** pattern
- **"X → Y"** arrow notation
- **"not Y but X"** pattern
- **Multiple corrections** in a single conversation

**Current Status:** 50% (2/4 tests passing)

**Failing Tests:**
- Correction with arrow notation
- Multiple corrections in one conversation

### 2. Numbered List Reference Competency (Target: 85%)

Tests resolution of numbered items from AI-generated lists:

- **"item 2"** - Direct numeric reference
- **"the first one"** - Ordinal reference
- **"the second one"** - Ordinal reference
- **"item 3"** - Multi-item list navigation

**Current Status:** 100% (4/4 tests passing) ✅

### 3. Pronoun Resolution Competency (Target: 85%)

Tests pronoun tracking across conversation turns:

- **"it"** refers to mentioned product
- **Pronoun chains** - "it" persists across multiple turns
- **"that"** refers to recent entity
- **"one"** after alternatives
- **"my order"** for order tracking
- **Context switching** - pronoun references update

**Current Status:** 83% (5/6 tests passing)

**Failing Tests:**
- Pronoun: "one" after alternatives

## Test Architecture

### ConversationTester Class

Simulates real conversation flows without requiring full API integration:

```typescript
const tester = new ConversationTester();

// Turn 1
await tester.sendMessage(
  "I need parts for ZF5 pump",
  "I can help you find ZF5 pump parts..."
);

// Turn 2 - Correction
await tester.sendMessage(
  "Sorry, I meant ZF4 not ZF5",
  "Got it! I understand you need ZF4 pump parts..."
);

// Verify correction was tracked
const context = tester.getContextSummary();
expect(context.includes('ZF4') && context.includes('corrected')).toBe(true);
```

### Test Flow

1. **Setup** - Initialize fresh conversation state
2. **Execute** - Run conversation with user/AI message pairs
3. **Verify** - Check metadata manager state and context summary
4. **Report** - Calculate accuracy and compare to baseline/target

## Understanding the Results

### Report Structure

```
ACCURACY BY CATEGORY:
- Correction Tracking:    50% (baseline: 33%, target: 90%)
                          ↑ 17% improvement
- List Reference:         100% (baseline: 33%, target: 85%)
                          ↑ 67% improvement
- Pronoun Resolution:     83% (baseline: 50%, target: 85%)
                          ↑ 33% improvement
- OVERALL ACCURACY:       79% (baseline: 71.4%, target: 90%)
                          ↑ 7.6% improvement
```

### Success Criteria

- ✅ **Test Passes** - Metadata system correctly tracks and resolves the reference
- ❌ **Test Fails** - Resolution fails or context is incomplete

### Exit Codes

- `0` - All target accuracies achieved (≥90% overall)
- `1` - Some targets not met (continues development)

## Improving Test Results

### For Correction Tracking

**Issue:** Arrow notation and multiple corrections not properly detected

**Solution Areas:**
1. Enhance `ResponseParser.detectCorrections()` to handle `→` pattern
2. Improve correction tracking to maintain multiple corrections
3. Update context summary to show all corrections clearly

### For Pronoun Resolution

**Issue:** "one" after alternatives not resolving correctly

**Solution Areas:**
1. Improve entity tracking for alternative products
2. Enhance pronoun resolution for "one" to check recent entities
3. Consider recency bias for pronoun resolution

## Integration with Main System

This test suite validates the core metadata tracking components:

- `lib/chat/conversation-metadata.ts` - ConversationMetadataManager
- `lib/chat/response-parser.ts` - ResponseParser
- Integration in `app/api/chat/route.ts` - Real chat flow

**To deploy improvements:**

1. Run this test suite to establish baseline
2. Make improvements to metadata/parser modules
3. Re-run tests to measure improvement
4. Once targets met, deploy to production

## Adding New Tests

To add a test case:

```typescript
{
  name: 'Test description',
  category: 'correction' | 'list_reference' | 'pronoun',
  setup: async () => {
    // Optional setup logic
  },
  execute: async () => {
    const tester = new ConversationTester();

    // Simulate conversation
    await tester.sendMessage("User message", "AI response");

    // Verify behavior
    const context = tester.getContextSummary();
    return context.includes('expected value');
  }
}
```

Add to the `testCases` array in `test-metadata-tracking.ts`.

## Dependencies

- `lib/chat/conversation-metadata.ts` - Metadata tracking system
- `lib/chat/response-parser.ts` - Entity extraction
- TypeScript 5.x
- tsx for execution

## File Structure

```
scripts/tests/
├── metadata/
│   └── README.md (this file)
└── test-metadata-tracking.ts (685 LOC)
```

## Next Steps

1. **Fix failing correction tests** to achieve 90% accuracy
2. **Improve "one" pronoun resolution** to achieve 85% accuracy
3. **Add edge case tests** for complex scenarios
4. **Integrate with CI/CD** for automatic testing
5. **Monitor production accuracy** against these benchmarks

## Related Documentation

- [Expert Level Improvement Plan](/home/user/Omniops/docs/EXPERT_LEVEL_IMPROVEMENT_PLAN.md)
- [Conversation Metadata System](/home/user/Omniops/lib/chat/conversation-metadata.ts)
- [Response Parser](/home/user/Omniops/lib/chat/response-parser.ts)
- [Testing README](/home/user/Omniops/scripts/tests/README.md)
- [Main Scripts README](/home/user/Omniops/scripts/README.md)
