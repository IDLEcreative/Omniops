# MCP Comparison Framework - Quick Reference

**Last Updated:** 2025-11-05
**Status:** Ready for Task 2.7

## TL;DR

Compare traditional tool calling vs MCP code execution side-by-side:

```bash
# Start dev server
npm run dev

# Enable MCP
export MCP_EXECUTION_ENABLED=true

# Run sample tests (5 tests, ~15 seconds)
npx tsx scripts/tests/run-mcp-comparison.ts --sample

# Run all tests (23 tests, ~70 seconds)
npx tsx scripts/tests/run-mcp-comparison.ts

# View report
cat ARCHIVE/test-results/mcp-comparison-*.md
```

---

## What This Framework Does

**Input:** Identical user queries

**Execution:**
- Query 1 → Traditional system (mcpEnabled=false)
- Query 1 → MCP system (mcpEnabled=true)
- Compare results

**Output:**
- ✅ Functional equivalence (80% threshold)
- 📊 Token savings (expected: 50-70%)
- ⚡ Speed improvement (expected: 10-30%)
- 📝 Detailed markdown report

---

## Test Cases

**23 Diverse Queries:**
- **Exact SKU** (4): `"Do you have part number A4VTG90?"`
- **Semantic Search** (5): `"I need hydraulic pumps"`
- **Multiple Results** (4): `"Show me all available pumps"`
- **Edge Cases** (5): `"Do you have flying carpets?"`
- **Error Handling** (3): `"hydrualic pumps"` (typo)

---

## Quick Commands

**Run Tests:**
```bash
# All tests
npx tsx scripts/tests/run-mcp-comparison.ts

# Sample (5 tests)
npx tsx scripts/tests/run-mcp-comparison.ts --sample

# Specific category
npx tsx scripts/tests/run-mcp-comparison.ts --category=exact_sku

# Custom output
npx tsx scripts/tests/run-mcp-comparison.ts --output=./my-report.md

# Help
npx tsx scripts/tests/run-mcp-comparison.ts --help
```

**Run Unit Tests:**
```bash
npm test __tests__/scripts/compare-mcp-traditional.test.ts
```

---

## Report Location

```
ARCHIVE/test-results/mcp-comparison-[timestamp].md
```

Example:
```
ARCHIVE/test-results/mcp-comparison-2025-11-05T14-30-00-000Z.md
```

---

## Success Criteria

**Production Ready:**
- ✅ Pass rate ≥ 95%
- ✅ Avg equivalence score ≥ 85/100
- ✅ Token savings ≥ 50%

**Nearly Ready:**
- ✓ Pass rate ≥ 85%
- ⚠️ Some failures need investigation

**Not Ready:**
- ❌ Pass rate < 85%
- ❌ Frequent functional differences

---

## Comparison Metrics

**Functional Equivalence (0-100):**
- Success status matching: 50 points
- Product equivalence: 30 points
- Semantic similarity: 20 points
- Pass threshold: 80/100

**Performance:**
- Speed improvement: `(traditional.time - mcp.time) / traditional.time * 100`
- Token savings: `(traditional.tokens - mcp.tokens) / traditional.tokens * 100`

---

## Troubleshooting

**Dev server not running:**
```bash
npm run dev
```

**MCP not enabled:**
```bash
export MCP_EXECUTION_ENABLED=true
# or add to .env.local
```

**Rate limit errors:**
```bash
# Increase delay in compare-mcp-traditional.ts
await new Promise(resolve => setTimeout(resolve, 2000));
```

**Tests failing:**
```bash
# Run unit tests first
npm test __tests__/scripts/compare-mcp-traditional.test.ts
```

---

## Adding Test Cases

Edit `scripts/tests/compare-mcp-traditional.ts`:

```typescript
export const TEST_CASES: ComparisonTestCase[] = [
  // ... existing cases ...
  {
    id: 'custom_test_1',
    description: 'My custom test',
    userQuery: 'Your query here',
    expectedBehavior: 'What should happen',
    category: 'semantic_search'
  }
];
```

---

## File Structure

```
scripts/tests/
├── compare-mcp-traditional.ts      # Core framework (873 lines)
├── run-mcp-comparison.ts           # CLI runner (208 lines)
└── README_MCP_COMPARISON.md        # This file

__tests__/scripts/
└── compare-mcp-traditional.test.ts # Unit tests (644 lines, 31 tests)

docs/10-ANALYSIS/
└── ANALYSIS_MCP_TESTING_STRATEGY.md # Full documentation (734 lines)

ARCHIVE/test-results/
└── mcp-comparison-*.md             # Generated reports
```

---

## Documentation

- **Quick Reference:** (this file)
- **Full Documentation:** [ANALYSIS_MCP_TESTING_STRATEGY.md](../../docs/10-ANALYSIS/ANALYSIS_MCP_TESTING_STRATEGY.md)
- **Completion Report:** [MCP_TEST_FRAMEWORK_COMPLETION_REPORT.md](../../ARCHIVE/completion-reports-2025-11/MCP_TEST_FRAMEWORK_COMPLETION_REPORT.md)

---

## Ready for Task 2.7

This framework is ready to validate 50 conversations for production readiness.

**To use:**
1. Expand TEST_CASES to 50+ queries (or use existing 23)
2. Run: `npx tsx scripts/tests/run-mcp-comparison.ts`
3. Review report for pass rate and metrics
4. Make production decision based on results

---

**Questions?** See full documentation or completion report above.
