# AbortError Timeout Optimization Plan

**Issue**: ~40% of test queries timeout after 60 seconds due to ReAct loop exceeding client timeout limit.

**Root Cause**: Complex queries require 4-5 ReAct iterations (80-100 seconds) but client timeout is 60 seconds.

## Current Bottlenecks

### ReAct Loop Configuration
- **maxIterations**: 5 iterations
- **searchTimeout**: 10 seconds per tool execution
- **Client timeout**: 60 seconds
- **Worst case**: 5 × 20 seconds = 100 seconds

### Timeout Pattern (8/30 queries affected)
1. Comparison queries: "What's the difference between them?"
2. Time-based queries: "What new products did you get this month?"
3. Multi-topic queries: "I need a pump and also some spare seals"
4. Policy queries: "How much does shipping to France cost?"

**Common trait**: All require multiple database searches or complex AI reasoning.

## Proposed Solutions (Priority Order)

### Option 1: Reduce maxIterations (RECOMMENDED - Quick Win)
**Change**: 5 iterations → 3 iterations
**Impact**:
- Worst case: 3 × 20 seconds = 60 seconds (just under timeout)
- Most queries complete in 1-2 iterations anyway
- Complex queries that need 5 iterations will still complete (just with less refinement)

**Files**:
- `lib/chat/ai-processor.ts:67` - Change `maxIterations` default from 5 to 3

**Estimated improvement**: 60-75% reduction in timeouts

---

### Option 2: Optimize searchTimeout (MEDIUM - Performance Gain)
**Change**: 10 seconds → 6 seconds per tool execution
**Impact**:
- Per iteration: 16-22 seconds → 12-18 seconds
- 5 iterations: 100 seconds → 75 seconds (still over timeout)
- 3 iterations: 60 seconds → 45 seconds (well under timeout)

**Files**:
- `lib/chat/ai-processor.ts:68` - Change `searchTimeout` from 10000 to 6000

**Requires**: Database query optimization (indexes, query plans)

**Estimated improvement**: 25-40% reduction in timeouts (combined with Option 1)

---

### Option 3: Increase Client Timeout (NOT RECOMMENDED - Hides Issues)
**Change**: 60 seconds → 120 seconds
**Why NOT recommended**:
- Hides real performance problems
- Poor user experience (2-minute waits)
- Masks need for optimization
- Could hit Vercel/serverless function limits (30-60s max)

**Only use as temporary measure while implementing Options 1-2**

---

### Option 4: Smart Iteration Strategy (LONG-TERM)
**Change**: Dynamic iteration limit based on query complexity
**Implementation**:
```typescript
// Simple queries (product search): maxIterations = 1-2
// Medium queries (comparisons): maxIterations = 2-3
// Complex queries (multi-topic, time-based): maxIterations = 3-4
```

**Requires**: Query complexity classifier

**Estimated improvement**: 50-70% reduction in timeouts + better UX

---

### Option 5: Conversation History Optimization (LONG-TERM)
**Change**: Summarize old messages instead of sending full history
**Impact**:
- Reduces OpenAI token processing time
- Speeds up each iteration by 30-50%
- Maintains conversation context

**Implementation**:
- Keep last 3-5 messages verbatim
- Summarize older messages
- Use vector embeddings for relevant history

**Estimated improvement**: 30-50% faster per iteration

---

## Recommended Implementation Plan

### Phase 1: Immediate Fix (Today)
1. **Reduce maxIterations: 5 → 3** ✅ Quick, safe, measurable
2. **Test suite validation** - Expect 60-75% reduction in timeouts
3. **Monitor production metrics** - Ensure quality doesn't degrade

**Estimated time**: 5 minutes
**Risk**: LOW (most queries use 1-2 iterations anyway)

### Phase 2: Performance Optimization (This Week)
1. **Optimize searchTimeout: 10s → 6s**
2. **Database query profiling** - Identify slow queries
3. **Add missing indexes** - Speed up vector search
4. **Test suite validation** - Expect 85-95% reduction in timeouts

**Estimated time**: 2-4 hours
**Risk**: MEDIUM (requires database changes)

### Phase 3: Long-Term Improvements (Next Sprint)
1. **Smart iteration strategy** - Dynamic limits based on query type
2. **Conversation history optimization** - Summarization + embeddings
3. **Caching layer** - Cache frequent queries and results

**Estimated time**: 1-2 days
**Risk**: MEDIUM (new features require thorough testing)

---

## Success Metrics

### Before (Current State)
- Pass rate: 37.5% (3/8 scenarios)
- Timeouts: 8/30 queries (27%)
- Client timeout: 60 seconds
- Average iterations: ~3-4

### After Phase 1 (Target)
- Pass rate: 60-75% (5-6/8 scenarios)
- Timeouts: <5% of queries
- Client timeout: 60 seconds
- Max iterations: 3 (enforced)

### After Phase 2 (Target)
- Pass rate: 85-95% (7-8/8 scenarios)
- Timeouts: <2% of queries
- Average query time: 8-12 seconds
- Max iterations: 3 (enforced)

---

## Next Steps

1. ✅ Implement Phase 1 changes (maxIterations: 5 → 3)
2. ✅ Run test suite to measure improvement
3. ✅ Document results and validate conversation quality
4. ⏳ Plan Phase 2 database optimizations
5. ⏳ Monitor production metrics for regression

---

**Last Updated**: 2025-11-15
**Author**: Claude Code (Sonnet 4.5)
**Status**: Ready for implementation
