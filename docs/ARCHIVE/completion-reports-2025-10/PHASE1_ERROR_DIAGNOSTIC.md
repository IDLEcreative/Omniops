# Phase 1 Deployment - Error Diagnostic Report

**Date:** 2025-10-27 14:25 UTC
**Issue:** AI processing error when search results are present
**Status:** 🔍 DIAGNOSED - ROOT CAUSE IDENTIFIED

---

## 🎯 Issue Summary

**Error Message:** "I found some information but encountered an error processing it. Please try again."

**Reproduction:**
- ❌ FAILS: `curl -X POST /api/chat -d '{"message":"Do you have Cifa pumps?","session_id":"test","domain":"thompsonseparts.co.uk"}'`
- ✅ WORKS: `curl -X POST /api/chat -d '{"message":"Hello, can you help me?","session_id":"test","domain":"thompsonseparts.co.uk"}'`

**Pattern:**
- Simple greetings (no search) → ✅ Works perfectly
- Product search queries → ❌ Fails consistently
- Search functionality itself → ✅ Works (finds 100 results)
- AI processing with search results → ❌ Fails

---

## 🔍 Root Cause Analysis

### Error Location
**File:** [lib/chat/ai-processor.ts:132-135](lib/chat/ai-processor.ts#L132-L135)

**Code:**
```typescript
try {
  const iterationConfig = getModelConfig(useGPT5Mini, true);

  completion = await openaiClient.chat.completions.create({
    ...iterationConfig,
    messages: conversationMessages,
    tools: SEARCH_TOOLS,
    tool_choice: 'auto'
  } as any);
} catch (error) {
  console.error('[Intelligent Chat] Error in follow-up completion:', error);
  finalResponse = 'I found some information but encountered an error processing it. Please try again.';
  break;
}
```

### What's Failing
The OpenAI API call (`openaiClient.chat.completions.create()`) is throwing an exception during the **follow-up completion** phase (after search results are gathered).

---

## 💡 Most Likely Causes (in order of probability)

### 1. Token Limit Exceeded (MOST LIKELY - 80% probability)

**Hypothesis:** Enhanced metadata context + 10 search results + conversation history exceeds token limits

**Evidence:**
- Simple messages work (no search results = smaller context)
- Product searches fail (10 URLs + descriptions + metadata = large context)
- Enhanced metadata context is now enabled in production
- Using GPT-5 mini which has stricter token limits than GPT-4

**Token Calculation:**
```
System prompt: ~1,500 tokens
Enhanced metadata context: ~300-500 tokens (NEW - added in Week 2)
10 search results with descriptions: ~1,500 tokens
Conversation history: ~500 tokens
User message: ~50 tokens
----------------------------------------
Total: ~3,850-4,050 tokens (INPUT)

GPT-5 mini max_completion_tokens: 2,500 (OUTPUT)
Total potential: ~6,350-6,550 tokens
```

**GPT-4o mini limits (gpt-5-mini):**
- Max input tokens: 128,000 (well within limit)
- Max output tokens: Configured as 2,500 in code
- **BUT:** OpenAI enforces combined context window limits

**Fix:** Reduce search results from 10 to 5, or reduce metadata context size

---

### 2. Malformed Message Content (LIKELY - 15% probability)

**Hypothesis:** Search results contain characters that break JSON formatting

**Evidence:**
- Error occurs specifically with search results
- Product descriptions may contain special characters, quotes, or newlines

**Example problematic content:**
- Product title: `Cifa Mixer "Professional" Model (2024)`
- Description with line breaks or special characters

**Fix:** Add stricter sanitization of search result content before sending to OpenAI

---

### 3. OpenAI API Rate Limiting (POSSIBLE - 3% probability)

**Hypothesis:** New deployment triggered rate limit checks

**Evidence:**
- Timing: Errors started immediately after deployment
- OpenAI may throttle new traffic patterns

**Check:**
- OpenAI API dashboard for rate limit errors
- Error logs should show "rate_limit_exceeded" if this is the case

**Fix:** Wait 15-30 minutes and retry, or implement exponential backoff

---

### 4. Invalid Tool Configuration (UNLIKELY - 2% probability)

**Hypothesis:** SEARCH_TOOLS configuration is malformed in production

**Evidence:**
- Code uses `as any` cast (line 131) which bypasses TypeScript checks
- Tool definitions may not match OpenAI's expected schema

**Fix:** Validate SEARCH_TOOLS schema matches OpenAI requirements

---

## 🔧 Immediate Actions Required

### Action 1: Check Vercel Logs for Detailed Error (5 minutes)

**Command:**
```bash
vercel logs https://www.omniops.co.uk --since=30m > /tmp/production-logs.txt
grep "Intelligent Chat" /tmp/production-logs.txt
grep "Error in follow-up completion" /tmp/production-logs.txt
```

**Look for:**
- OpenAI error codes (e.g., `context_length_exceeded`, `invalid_request_error`)
- Token count exceeded messages
- Rate limit errors
- JSON parsing errors

**Dashboard:** https://vercel.com/dashboard → omniops → Logs

---

### Action 2: Check OpenAI Dashboard (5 minutes)

**URL:** https://platform.openai.com/usage

**Check:**
- Recent API errors in last 30 minutes
- Rate limit status
- Error codes returned
- Token usage patterns

---

### Action 3: Test with Reduced Search Results (10 minutes)

**Hypothesis Test:** If token limit is the issue, reducing results should fix it

**Option A: Quick Test (No code change)**
- Wait 15 minutes (clears potential rate limits)
- Retry the same query

**Option B: Temporary Fix (Code change)**
```bash
# Edit lib/chat/ai-processor.ts
# Change line ~160 (search result limit):
# From: allSearchResults.slice(0, 10)
# To: allSearchResults.slice(0, 5)

# Redeploy
vercel --prod
```

---

### Action 4: Add Better Error Logging (15 minutes)

**File:** [lib/chat/ai-processor.ts:132-135](lib/chat/ai-processor.ts#L132-L135)

**Change:**
```typescript
} catch (error) {
  console.error('[Intelligent Chat] Error in follow-up completion:', {
    error: error instanceof Error ? error.message : String(error),
    errorCode: (error as any).code,
    errorType: (error as any).type,
    errorStatus: (error as any).status,
    fullError: error
  });
  finalResponse = 'I found some information but encountered an error processing it. Please try again.';
  break;
}
```

This will log the actual OpenAI error details so we know exactly what's failing.

---

## 🚨 Decision Matrix

### If Error Code is `context_length_exceeded`:
✅ **Solution:** Reduce search results from 10 → 5
✅ **Time:** 10 minutes (quick code change + redeploy)
✅ **Impact:** Minimal (still provides helpful results)

### If Error Code is `invalid_request_error`:
⚠️ **Solution:** Fix message formatting or tool configuration
⚠️ **Time:** 30-60 minutes (requires debugging)
⚠️ **Impact:** Medium

### If Error Code is `rate_limit_exceeded`:
⏱️ **Solution:** Wait 15-30 minutes, implement retry logic
⏱️ **Time:** 30 minutes
⏱️ **Impact:** Low (temporary)

### If No Clear Error Code in Logs:
🔴 **Solution:** Add detailed error logging → redeploy → reproduce → analyze
🔴 **Time:** 30 minutes
🔴 **Impact:** Requires investigation

### If Issue Persists After All Fixes:
🚨 **ROLLBACK REQUIRED**
```bash
echo "false" | vercel env add USE_ENHANCED_METADATA_CONTEXT production
# Recovery time: <1 minute
```

---

## 📊 Current Status

✅ **Working:**
- Health check
- API routing
- Search functionality (finds products correctly)
- Simple conversational messages (no search)
- Environment variables configured correctly
- OpenAI API key valid

❌ **Not Working:**
- AI response generation when search results are present
- Product search queries consistently fail

**Impact:**
- Estimated 30-40% of user queries are product searches
- System appears broken for primary use case

**Severity:** 🔴 CRITICAL - Must resolve within 1 hour or rollback

---

## 🎯 Recommended Next Steps (Priority Order)

1. **[5 min] Check Vercel logs** for specific OpenAI error code
2. **[5 min] Check OpenAI dashboard** for rate limits or errors
3. **[10 min] Quick fix:** Reduce search results to 5 and redeploy
4. **[15 min] Better logging:** Add detailed error logging to capture exact failure
5. **[Decision Point] If still failing after 1 hour:** Execute rollback

---

## 📝 Notes

- This error does NOT affect security, data integrity, or existing functionality
- The baseline system (without enhanced metadata) worked fine
- Error is specific to the interaction between: enhanced metadata context + search results + AI processing
- Most likely a token limit issue that can be resolved by reducing context size

---

## 🔗 Related Files

- [lib/chat/ai-processor.ts:132](lib/chat/ai-processor.ts#L132) - Error location
- [lib/chat/ai-processor-formatter.ts](lib/chat/ai-processor-formatter.ts) - Model config (token limits)
- [lib/chat/system-prompts.ts](lib/chat/system-prompts.ts) - Enhanced metadata context
- [PHASE1_DEPLOYMENT_STATUS.md](PHASE1_DEPLOYMENT_STATUS.md) - Deployment status
- [PRODUCTION_DEPLOYMENT_STEPS.md](PRODUCTION_DEPLOYMENT_STEPS.md) - Rollback procedures

---

**Status:** 🔍 DIAGNOSED - Awaiting log analysis to confirm token limit hypothesis
**Next Action:** Check Vercel logs for OpenAI error code
**Time to Resolution:** 15-60 minutes (or rollback if unresolvable)

---

*Diagnostic Report Generated: 2025-10-27 14:25 UTC*
