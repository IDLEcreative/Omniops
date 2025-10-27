# Phase 1 Investigation - Key Findings

**Date:** 2025-10-27 15:00 UTC
**Investigation Status:** 🔍 IN PROGRESS
**Critical Discovery:** Production vs Local Environment Difference

---

## 🎯 Key Finding: Environment-Specific Issue

### Test Results Summary

| Environment | Query | Result | Status |
|-------------|-------|--------|--------|
| **Local Development** | "Do you have Cifa hydraulic pumps?" | ✅ Perfect response with 10 results | WORKS |
| **Production (Phase 1)** | "Do you have Cifa pumps?" | ❌ "I found some information but encountered an error..." | FAILS |
| **Production (Enhanced Logging)** | "Do you stock hydraulic fittings?" | ❌ "Failed to process chat message" | FAILS (Different error) |

---

## 💡 Critical Insight

**The same code with the same metadata context works perfectly in local development but fails in production.**

This rules out:
- ❌ Token limit issues (would fail locally too)
- ❌ Code logic bugs (same code works locally)
- ❌ Metadata context size problems (identical context in both environments)

This suggests:
- ✅ Production environment variable differences
- ✅ OpenAI API key behavior differences
- ✅ Vercel-specific runtime constraints
- ✅ Production-specific rate limiting

---

## 🔍 Local vs Production Comparison

### Local Environment (.env.local)
```bash
OPENAI_API_KEY=sk-proj-[REDACTED]
USE_GPT5_MINI=true
USE_ENHANCED_METADATA_CONTEXT=true
```

### Production Environment (Vercel)
```bash
OPENAI_API_KEY=Encrypted (set 60d ago)
USE_GPT5_MINI=true (added today)
USE_ENHANCED_METADATA_CONTEXT=true (added today)
ENABLE_METADATA_ROLLOUT_PERCENTAGE=10 (added today)
```

**Question:** Are we using the same OpenAI API key in both environments?

---

## 🚨 Error Evolution Timeline

### Error 1: AI Processing Error (Before Enhanced Logging)
**Message:** "I found some information but encountered an error processing it. Please try again."
**Source:** [lib/chat/ai-processor.ts:147](lib/chat/ai-processor.ts#L147)
**Behavior:**
- Search works (finds 100 results)
- Returns 10 relevant sources
- AI fails to generate response from those sources

**Pattern:**
- Simple messages: ✅ Work
- Product searches: ❌ Fail consistently

---

### Error 2: Chat Processing Error (After Enhanced Logging)
**Message:** "Failed to process chat message - An unexpected error occurred"
**Source:** Outer error handler in [app/api/chat/route.ts](app/api/chat/route.ts)
**Behavior:**
- Request fails earlier in the pipeline
- Error occurs before AI processing
- Different error message

**Possible Cause:** Enhanced logging code introduced a bug (JSON.stringify on model config?)

---

## 🔧 Investigation Actions Taken

1. ✅ **Deployed to Production** - Phase 1 with 10% traffic
2. ✅ **Confirmed Error** - Product searches failing
3. ✅ **Tested Locally** - Same query works perfectly
4. ✅ **Enhanced Error Logging** - Added detailed OpenAI error capture
5. ✅ **Redeployed** - New version with enhanced logging
6. ⚠️ **New Error** - Enhanced logging may have introduced bug

---

## 🎯 Next Steps (Priority Order)

### Immediate (Next 15 minutes)

1. **Rollback Enhanced Logging**
   - Remove the enhanced error logging changes
   - Redeploy to get back to original error
   - Enhanced logging might have broken JSON.stringify on model config

2. **Check Production OPENAI_API_KEY**
   - Verify it's the same key as local
   - Check OpenAI dashboard for production key
   - Look for rate limiting or quota issues

3. **Alternative Logging Approach**
   - Instead of JSON.stringify(errorDetails), log fields individually
   - Avoid serializing model config (may have circular refs)

---

### If Still Failing After Above

4. **Test Production with Simple Message**
   - Confirm simple messages still work
   - Isolate if it's search-specific

5. **Compare OpenAI API Keys**
   - Different keys may have different quotas/limits
   - Production key might be rate-limited

6. **Check Vercel Runtime Constraints**
   - Memory limits
   - Execution time limits
   - Environment differences

---

## 📊 Hypothesis Ranking (Updated)

### MOST LIKELY (60% confidence)
**OpenAI API Key Differences**
- Production uses older API key (set 60d ago)
- Different quota or rate limits
- Key might be from different OpenAI organization

**Evidence:**
- Same code works locally
- Same configuration
- Only difference is environment

**Test:**
```bash
# Check which OpenAI organization/project the keys belong to
# Compare production vs local API key quotas
```

---

### LIKELY (25% confidence)
**Enhanced Logging Bug**
- JSON.stringify(modelConfig) causing serialization error
- Circular reference in modelConfig object
- Breaking the error handler itself

**Evidence:**
- Error changed after deploying enhanced logging
- Now getting outer error handler message
- Different error pattern

**Fix:**
- Rollback enhanced logging
- Use simpler logging without JSON.stringify

---

### POSSIBLE (10% confidence)
**Vercel-Specific Runtime Issue**
- Edge runtime behaving differently than Node runtime
- Memory constraints in production
- Timeout differences

**Evidence:**
- Works locally (Node.js)
- Fails in production (Vercel)

---

### UNLIKELY (5% confidence)
**Token Limits**
- Would fail locally too
- Ruled out by local testing

---

## 🔑 Key Questions to Answer

1. **Are we using the same OpenAI API key in local vs production?**
   - Action: Check Vercel environment variable value
   - Action: Check OpenAI dashboard for both keys

2. **Did enhanced logging break the error handler?**
   - Action: Rollback logging changes
   - Action: Test if original error returns

3. **Is there rate limiting on the production API key?**
   - Action: Check OpenAI usage dashboard
   - Action: Look for 429 errors in logs

4. **Are there Vercel-specific constraints we're hitting?**
   - Action: Check Vercel function logs for memory/timeout errors
   - Action: Compare runtime configurations

---

## 📝 Technical Details

### Error Handler Location
[app/api/chat/route.ts](app/api/chat/route.ts) - Outer try/catch
[lib/chat/ai-processor.ts:132-149](lib/chat/ai-processor.ts#L132-L149) - Inner try/catch for OpenAI calls

### Enhanced Logging Code (May Be Problematic)
```typescript
const errorDetails = {
  message: error instanceof Error ? error.message : String(error),
  code: (error as any)?.code,
  type: (error as any)?.type,
  status: (error as any)?.status,
  param: (error as any)?.param,
  iteration,
  messageCount: conversationMessages.length,
  hasTools: !!SEARCH_TOOLS,
  modelConfig: iterationConfig  // ⚠️ This might have circular references
};
console.error('[Intelligent Chat] Error in follow-up completion:', JSON.stringify(errorDetails, null, 2));
```

**Potential Issue:** `modelConfig` might contain circular references or non-serializable objects, causing JSON.stringify to fail, which breaks the error handler itself.

---

## 🚨 Recommended Action Plan

### Plan A: Quick Rollback (15 minutes)
1. Remove enhanced logging (or fix JSON.stringify issue)
2. Redeploy
3. Confirm we get back to original error
4. Then investigate OpenAI API key differences

### Plan B: Investigate API Keys (30 minutes)
1. Get actual production OPENAI_API_KEY value from Vercel
2. Compare with local key
3. Check OpenAI dashboard for quota/rate limits
4. Test production with local API key

### Plan C: Rollback Phase 1 (1 minute)
If we can't resolve within 1 hour:
```bash
echo "false" | vercel env add USE_ENHANCED_METADATA_CONTEXT production
```

---

## 📈 Current Status

**Time Invested:** 50 minutes
**Issues Resolved:** 0
**Issues Discovered:** 2 (original error + new error from enhanced logging)
**Blocking Issue:** Cannot capture exact OpenAI error due to enhanced logging bug

**Recommendation:** Execute Plan A (quick rollback of enhanced logging) immediately

---

*Investigation Report Updated: 2025-10-27 15:00 UTC*
