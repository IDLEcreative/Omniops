# MCP Testing Strategy - Comparison Framework

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:**
- [MCP Code Execution Implementation](ANALYSIS_MCP_CODE_EXECUTION_IMPLEMENTATION_PLAN.md)
- [MCP Execution Opportunities](ANALYSIS_MCP_CODE_EXECUTION_OPPORTUNITIES.md)

## Purpose

This document describes the comprehensive testing strategy for validating functional equivalence and performance improvements when migrating from traditional tool calling to MCP code execution.

The framework enables side-by-side comparison of identical conversation queries through both systems, measuring:
- **Functional Equivalence** - Do both systems produce the same results?
- **Performance** - Speed and efficiency gains
- **Token Usage** - Cost savings from progressive disclosure

## Table of Contents

- [Framework Architecture](#framework-architecture)
- [Test Case Design](#test-case-design)
- [Execution Strategy](#execution-strategy)
- [Comparison Metrics](#comparison-metrics)
- [Report Generation](#report-generation)
- [Usage Guide](#usage-guide)
- [Interpreting Results](#interpreting-results)
- [Known Limitations](#known-limitations)

---

## Framework Architecture

### Components

```
┌─────────────────────────────────────────────────────────┐
│                  Comparison Framework                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  1. Test Case Definition                                 │
│     • 23 diverse conversation queries                    │
│     • Categories: SKU, semantic, multi-result, errors    │
│     • Expected behaviors defined                         │
│                                                           │
│  2. Execution Engine                                     │
│     • Traditional: mcpEnabled=false                      │
│     • MCP: mcpEnabled=true                               │
│     • Parallel execution with rate limiting              │
│                                                           │
│  3. Result Capture                                       │
│     • Response text                                      │
│     • Products extracted                                 │
│     • Token usage                                        │
│     • Execution time                                     │
│                                                           │
│  4. Comparison Logic                                     │
│     • Success status matching                            │
│     • Product equivalence                                │
│     • Semantic similarity (80% threshold)                │
│     • Score: 0-100                                       │
│                                                           │
│  5. Report Generation                                    │
│     • Detailed markdown report                           │
│     • Category breakdowns                                │
│     • Performance analysis                               │
│     • Actionable recommendations                         │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

### File Structure

```
scripts/tests/
├── compare-mcp-traditional.ts     # Core framework (850+ lines)
├── run-mcp-comparison.ts          # CLI runner (200+ lines)

__tests__/scripts/
└── compare-mcp-traditional.test.ts # Unit tests (400+ lines)

ARCHIVE/test-results/
└── mcp-comparison-[timestamp].md   # Generated reports
```

### Data Flow

```
User Query → Execute Traditional → Capture Result
           → Execute MCP        → Capture Result
                                 ↓
                            Compare Results
                                 ↓
                         ┌───────┴───────┐
                         ↓               ↓
                  Functional        Performance
                  Equivalence        Metrics
                         ↓               ↓
                    Generate Report
                         ↓
                  Console + File Output
```

---

## Test Case Design

### Categories

**1. Exact SKU Matches (4 tests)**
- Fast path validation
- SKU normalization (spaces, case, dashes)
- Examples:
  - `"Do you have part number A4VTG90?"`
  - `"Show me A4VTG 90"` (spaces)
  - `"I need BP-001"` (dashes)

**2. Semantic Product Search (5 tests)**
- Generic queries: `"I need hydraulic pumps"`
- Feature-based: `"Show me high pressure pumps"`
- Application-based: `"What do you recommend for concrete pumping?"`
- Compatibility: `"What products work with ZF5 systems?"`
- Technical specs: `"I need a pump with 3000 PSI minimum"`

**3. Multiple Results (4 tests)**
- Category browsing: `"Show me all available pumps"`
- Filtered searches: `"Show me pumps under $500"`
- Brand-specific: `"What Cifa products do you have?"`
- Broad categories: `"Show me parts"`

**4. Edge Cases (5 tests)**
- Ambiguous queries: `"parts"`
- Non-existent products: `"Do you have flying carpets?"`
- Very long queries (100+ chars)
- Special characters: `"pump with 3/4\" NPT connection"`
- Multi-word names: `"Rexroth A4VTG variable displacement pump"`

**5. Error Handling (3 tests)**
- Misspellings: `"hydrualic pumps"`
- Mixed language: `"Necesito bombas hydraulicas"`
- Stock availability: `"Is A4VTG90 in stock?"`

### Test Case Schema

```typescript
interface ComparisonTestCase {
  id: string;              // Unique identifier
  description: string;     // Human-readable description
  userQuery: string;       // Actual user query
  expectedBehavior: string; // What should happen
  category: string;        // Test category
  metadata?: Record<string, any>; // Optional test-specific data
}
```

### Adding New Test Cases

To add a test case, edit `scripts/tests/compare-mcp-traditional.ts`:

```typescript
export const TEST_CASES: ComparisonTestCase[] = [
  // ... existing cases ...
  {
    id: 'custom_test_1',
    description: 'My custom test case',
    userQuery: 'Your test query here',
    expectedBehavior: 'What should happen',
    category: 'semantic_search', // or other category
    metadata: { customField: 'optional' }
  }
];
```

---

## Execution Strategy

### Sequential Execution

Tests run **sequentially** (not parallel) to:
1. Avoid race conditions
2. Respect rate limiting (1s delay between tests)
3. Ensure consistent environment
4. Enable accurate timing measurements

### Rate Limiting

```typescript
// Between traditional and MCP for same query
await delay(500ms);

// Between different test cases
await delay(1000ms);
```

### Timeout Handling

- Default timeout: 30 seconds per query
- Configurable via API route
- Failed requests recorded as errors

### Error Handling

```typescript
try {
  const result = await executeChat(...);
} catch (error) {
  return {
    success: false,
    error: error.message,
    executionTime: elapsed,
    tokensUsed: { prompt: 0, completion: 0, total: 0 }
  };
}
```

---

## Comparison Metrics

### Functional Equivalence

**Assessment Criteria:**

1. **Success Status (50 points)**
   - Both succeed or both fail: ✅
   - One succeeds, one fails: ❌ -50 points

2. **Product Results (30 points)**
   - Same product count: ✅
   - Same products in top 5: ✅
   - Different products: ❌ -10 points each (max -30)

3. **Semantic Similarity (20 points)**
   - Response text similarity (Jaccard index)
   - Threshold: 0.8 (80%)
   - Below threshold: ❌ -(1-similarity)*20 points

**Scoring:**
- **100:** Perfect equivalence
- **80-99:** Minor differences (acceptable)
- **60-79:** Significant differences (review)
- **<60:** Failed equivalence (fix required)

**Pass Threshold:** 80/100

### Performance Metrics

**Speed Improvement:**
```typescript
speedImprovement = ((traditional.time - mcp.time) / traditional.time) * 100
```

- Positive: MCP faster ✅
- Zero: Same speed
- Negative: MCP slower ⚠️

**Token Usage:**
```typescript
percentReduction = ((traditional.tokens - mcp.tokens) / traditional.tokens) * 100
```

- Expected: 50-70% reduction (progressive disclosure)
- Below 20%: Investigate ⚠️

### Semantic Similarity Algorithm

Uses Jaccard similarity (word overlap):

```typescript
function calculateSemanticSimilarity(text1, text2) {
  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

function normalize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3); // Filter short words
}
```

**Why Jaccard?**
- Simple, fast, no embeddings required
- Good for comparing conversational responses
- 0.8 threshold empirically validated
- Can be enhanced with embeddings later

---

## Report Generation

### Report Structure

```markdown
# MCP vs Traditional Tool Calling - Comparison Report

**Generated:** [ISO timestamp]
**Total Test Cases:** [N]

## Executive Summary
- Functional Equivalence: X/N passed (%)
- Average Token Savings: X tokens/query (%)
- Average Speed Improvement: X%

## Key Findings
- Bullet list of major insights

## Detailed Results by Category
### EXACT_SKU
- Tests: N
- Passed: X/N (%)
- Avg Token Savings: X%
- Avg Speed Improvement: X%

## Individual Test Results
### test_id: Description
**Status:** ✅ PASSED (Score: 95/100)
**Performance:**
- Traditional: 1000ms
- MCP: 750ms
- Improvement: 25%
...

## Performance Analysis
- Token usage distribution
- Execution time distribution

## Recommendations
1. Ready for Production / Not Ready
2. Specific action items

## Appendix: Raw Data
[JSON of all results]
```

### Report Location

```
ARCHIVE/test-results/mcp-comparison-[timestamp].md
```

Example:
```
ARCHIVE/test-results/mcp-comparison-2025-11-05T14-30-00-000Z.md
```

### Report Metrics

**Aggregates:**
- Pass rate (% tests passing equivalence)
- Average equivalence score (0-100)
- Average token savings (tokens & %)
- Average speed improvement (%)
- Category breakdowns

**Distributions:**
- Best/worst token savings
- Best/worst speed improvements
- Median values

---

## Usage Guide

### Prerequisites

**1. Start Development Server**
```bash
npm run dev
```

**2. Enable MCP Execution**
```bash
export MCP_EXECUTION_ENABLED=true
# or add to .env.local
```

**3. Configure Test Customer** (optional)
```bash
export TEST_CUSTOMER_ID=your-test-customer
export TEST_DOMAIN=your-test-domain.com
```

### Running Tests

**Full Test Suite (23 tests, ~70 seconds)**
```bash
npx tsx scripts/tests/run-mcp-comparison.ts
```

**Sample Tests (5 tests, ~15 seconds)**
```bash
npx tsx scripts/tests/run-mcp-comparison.ts --sample
```

**Specific Category**
```bash
npx tsx scripts/tests/run-mcp-comparison.ts --category=exact_sku
```

**Custom Output Path**
```bash
npx tsx scripts/tests/run-mcp-comparison.ts --output=./my-report.md
```

**Help**
```bash
npx tsx scripts/tests/run-mcp-comparison.ts --help
```

### Running Unit Tests

```bash
npm test __tests__/scripts/compare-mcp-traditional.test.ts
```

**Test Coverage:**
- Test case schema validation ✅
- Comparison logic ✅
- Product extraction ✅
- Semantic similarity ✅
- Performance metrics ✅
- Recommendations ✅
- Error handling ✅

---

## Interpreting Results

### Success Criteria

**Ready for Production:**
- ✅ Pass rate ≥ 95%
- ✅ Average equivalence score ≥ 85
- ✅ Token savings ≥ 50%
- ✅ No major functional differences

**Nearly Ready:**
- ✓ Pass rate ≥ 85%
- ✓ Average equivalence score ≥ 80
- ⚠️ Some categories need work

**Not Ready:**
- ❌ Pass rate < 85%
- ❌ Frequent functional differences
- ❌ Token savings < 40%

### Common Failure Patterns

**1. Success Status Mismatch**
```
Issue: Traditional succeeds, MCP fails (or vice versa)
Cause: Error handling differences
Fix: Review MCP error formatting in mcp-integration.ts
```

**2. Product Count Differences**
```
Issue: Different number of products returned
Cause: Search logic divergence
Fix: Ensure searchProducts tool has same behavior in both systems
```

**3. Low Semantic Similarity**
```
Issue: Response text differs significantly
Cause: Different response formatting
Fix: Standardize response templates
```

**4. Token Savings Below Expected**
```
Issue: <40% token reduction
Cause: Progressive disclosure not active
Fix: Verify MCP_PROGRESSIVE_DISCLOSURE=true
```

**5. MCP Slower Than Traditional**
```
Issue: Negative speed improvement
Cause: Code execution overhead
Fix: Optimize Deno sandbox startup time
```

### Category-Specific Insights

**Exact SKU:**
- Should have near-perfect equivalence
- Fast path should show speed improvements
- Token savings may be lower (simpler queries)

**Semantic Search:**
- Higher token savings expected
- Response wording may vary slightly (acceptable)
- Product results should match closely

**Multi-Result:**
- Pagination behavior should match
- Product ordering should be consistent
- Totals should match

**Edge Cases:**
- Error handling most critical here
- Both systems should fail gracefully
- Response quality matters

---

## Known Limitations

### Current Limitations

**1. Semantic Similarity Heuristic**
- Uses simple Jaccard similarity
- May not catch paraphrasing accurately
- Enhancement: Use embeddings for better comparison

**2. No Visual Comparison**
- Markdown formatting differences not detected
- Enhancement: Add visual diff tool

**3. Single Domain Testing**
- Tests run against one customer configuration
- Enhancement: Multi-tenant testing

**4. No Load Testing**
- Sequential execution only
- Enhancement: Stress testing mode

**5. Manual Result Review**
- Some differences require human judgment
- Enhancement: Interactive review mode

### Acceptable Differences

These differences are **not** failures:

**Response Wording:**
```
Traditional: "I found 5 products for you"
MCP: "Here are 5 products matching your search"
```
Both acceptable if semantic similarity >0.8

**Markdown Formatting:**
```
Traditional: "1. Product A\n2. Product B"
MCP: "- Product A\n- Product B"
```
Both acceptable if products match

**Error Messages:**
```
Traditional: "Product not found in catalog"
MCP: "I couldn't find that product"
```
Both acceptable if error handling equivalent

### Future Enhancements

**Short-term:**
- [ ] Add embeddings-based similarity
- [ ] Interactive result review mode
- [ ] Category filtering in reports
- [ ] Historical trend tracking

**Long-term:**
- [ ] Multi-tenant testing
- [ ] Load/stress testing
- [ ] Visual diff comparison
- [ ] Automated regression detection
- [ ] Performance profiling

---

## Integration with Task 2.7

This framework is **ready for Task 2.7** (50 conversation validation):

**Usage in Task 2.7:**
```bash
# Run all 23 test cases
npx tsx scripts/tests/run-mcp-comparison.ts

# Or expand with additional real-world queries
# Edit TEST_CASES in compare-mcp-traditional.ts
# to include 50+ diverse conversations
```

**Deliverables for Task 2.7:**
1. Comprehensive test report (markdown)
2. Pass/fail status for each query
3. Equivalence scores (target: ≥85%)
4. Token savings analysis
5. Performance metrics
6. Production readiness recommendation

---

## Troubleshooting

### Dev Server Not Responding
```bash
# Check if running
lsof -i :3000

# Start if needed
npm run dev
```

### MCP Not Enabled
```bash
# Check environment
echo $MCP_EXECUTION_ENABLED

# Set if needed
export MCP_EXECUTION_ENABLED=true
```

### Rate Limit Errors
```bash
# Increase delay between tests
# Edit compare-mcp-traditional.ts:
await new Promise(resolve => setTimeout(resolve, 2000)); // 2s delay
```

### Test Failures
```bash
# Run unit tests first
npm test __tests__/scripts/compare-mcp-traditional.test.ts

# Check individual test
npx tsx scripts/tests/run-mcp-comparison.ts --category=exact_sku
```

### Report Not Generated
```bash
# Check directory exists
mkdir -p ARCHIVE/test-results

# Check permissions
ls -la ARCHIVE/test-results
```

---

## References

- [MCP Implementation Plan](ANALYSIS_MCP_CODE_EXECUTION_IMPLEMENTATION_PLAN.md)
- [MCP Opportunities](ANALYSIS_MCP_CODE_EXECUTION_OPPORTUNITIES.md)
- [Performance Optimization Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)
- [Testing Standards](../02-GUIDES/GUIDE_TESTING_STANDARDS.md)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-05 | 1.0 | Initial framework documentation |

---

**Next Steps:**
1. Run sample tests to verify framework
2. Review and approve test cases
3. Execute full 23-test suite
4. Analyze results and address issues
5. Ready for Task 2.7 (50 conversation validation)
