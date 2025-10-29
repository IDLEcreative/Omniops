# Chat API Model Configuration

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v2.1.0
**Dependencies:**
- [app/api/chat/route.ts](../../app/api/chat/route.ts)
- [.env.local](.env.local)
**Estimated Read Time:** 8 minutes

## Purpose
Technical configuration guide for AI model selection covering GPT-5-mini primary model (2500 tokens, low reasoning effort, 6-14s response time, $0.01/1K tokens), GPT-4.1 fallback model (500 tokens, 0.7 temperature), reasoning effort levels (minimal/low/medium/high), performance benchmarks, token usage monitoring, and automatic fallback mechanism with testing commands and troubleshooting procedures.

## Quick Links
- [Current Setup](#current-setup-)
- [Reasoning Effort Explained](#reasoning-effort-explained)
- [Performance Characteristics](#performance-characteristics)
- [Quick Commands](#quick-commands)
- [Configuration Location](#configuration-location)
- [Troubleshooting](#troubleshooting)

## Keywords
GPT-5-mini configuration, AI model selection, reasoning effort levels, max_completion_tokens, GPT-4.1 fallback, token usage monitoring, response time optimization, USE_GPT5_MINI, reasoning tokens, temperature settings, model benchmarks, automatic fallback, chat API configuration, low reasoning effort, performance tuning

## Aliases
- "GPT-5-mini" (also known as: primary model, main AI model, GPT5 mini)
- "reasoning effort" (also known as: thinking level, analysis depth, reasoning intensity)
- "max_completion_tokens" (also known as: output limit, completion length, response tokens)
- "fallback model" (also known as: backup model, secondary AI, GPT-4.1)
- "reasoning tokens" (also known as: thinking tokens, analysis tokens, internal reasoning)
- "low reasoning" (also known as: balanced mode, standard reasoning, moderate thinking)

---

## Current Setup ✅

### Primary Model: GPT-5-mini
- **Model ID:** `gpt-5-mini`
- **Max Completion Tokens:** 2500
- **Reasoning Effort:** `low` (balanced reasoning and speed)
- **Temperature:** Default (1.0, not configurable)
- **Environment Variable:** `USE_GPT5_MINI=true`

### Fallback Model: GPT-4.1
- **Model ID:** `gpt-4.1`
- **Max Tokens:** 500
- **Temperature:** 0.7
- **Activates when:** GPT-5-mini fails or `USE_GPT5_MINI=false`

## Reasoning Effort Explained

### Understanding GPT-5 Reasoning Levels

| Effort Level | Reasoning Tokens | Response Time | Use Case |
|-------------|-----------------|---------------|-----------|
| `minimal` | 0% (none) | 2-8 seconds | Simple queries, pure output generation |
| `low` | ~20% of tokens | 6-14 seconds | **Balanced quality and speed (CURRENT)** |
| `medium` | ~33% of tokens | 12-17 seconds | Complex technical issues |
| `high` | ~50%+ of tokens | 15-30 seconds | Deep analysis tasks |

### Why We Use 'low' Reasoning

After extensive testing, `low` reasoning effort provides:
- ✅ **Thoughtful responses** for technical questions
- ✅ **Better problem diagnosis** for customer issues
- ✅ **Still fast enough** for real-time chat (<10s average)
- ✅ **~20% reasoning tokens** ensures quality thinking

## Performance Characteristics

### GPT-5-mini with Low Reasoning
- **Response Time:** 6-14 seconds typical
- **Token Usage:** 
  - Reasoning: ~200-400 tokens
  - Output: ~600-1000 tokens
  - Total: ~800-1400 tokens
- **Cost:** ~$0.01 per 1K tokens (estimate)
- **Quality:** Excellent with thoughtful reasoning
- **Best For:** 
  - Technical troubleshooting
  - Product recommendations
  - Complex customer queries
  - Warranty and return issues

### Comparison: GPT-5-mini vs GPT-5 vs GPT-4.1

| Model | Speed | Cost | Quality | Reasoning |
|-------|-------|------|---------|-----------|
| GPT-5-mini (low) | 6-14s | $ | Excellent | ✅ Active |
| GPT-5 (minimal) | 5-47s | $$$$$ | Excellent | Variable |
| GPT-4.1 | 3-8s | $$ | Good | N/A |

### Why This Configuration?

Based on extensive testing:
1. **2.5x faster** than GPT-5 full model
2. **5x cheaper** while maintaining quality
3. **Low reasoning** provides thoughtful responses
4. **Perfect quality scores** for customer service tasks
5. **Consistent performance** without outliers

## Quick Commands

### Switch Models
```bash
# Use GPT-5-mini (default)
sed -i '' 's/USE_GPT5_MINI=.*/USE_GPT5_MINI=true/' .env.local

# Use GPT-4.1 fallback
sed -i '' 's/USE_GPT5_MINI=.*/USE_GPT5_MINI=false/' .env.local
```

### Test Current Configuration
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test message",
    "session_id": "test-session",
    "domain": "thompsonseparts.co.uk"
  }'
```

## Configuration Location

The model configuration is in:
- **File:** `/app/api/chat/route.ts`
- **Lines:** 771-819
- **Environment:** `.env.local`

## Testing & Monitoring

### Test Response Quality
```javascript
// Test script to check reasoning activation
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "My hydraulic pump is making noise. What should I check?",
    session_id: "test-" + Date.now(),
    domain: "thompsonseparts.co.uk"
  })
});
```

### Monitor Token Usage
Check server logs for reasoning token usage:
```bash
# View reasoning tokens in responses
grep "reasoning_tokens" /path/to/logs

# Expected output with 'low' reasoning:
# reasoning_tokens: 192-400 (should be >0)
```

### Performance Benchmarks

| Query Type | Expected Response Time | Reasoning Tokens |
|------------|----------------------|------------------|
| Simple (e.g., "hours?") | 6-8 seconds | 50-150 |
| Medium (e.g., "return policy") | 8-10 seconds | 150-300 |
| Complex (e.g., "troubleshooting") | 10-14 seconds | 300-500 |

## Important Notes

- **GPT-5-mini requires `max_completion_tokens`** (not `max_tokens`)
- **No custom temperature** support in GPT-5 models (always 1.0)
- **'low' reasoning effort** is optimal for customer service (not 'minimal')
- **Automatic fallback** to GPT-4.1 ensures reliability
- **Reasoning tokens** should be >0 to ensure quality responses

## Troubleshooting

### If responses are poor quality:
1. Check reasoning tokens in logs (should be >0)
2. Verify `reasoning_effort: 'low'` is set
3. Ensure `max_completion_tokens` is ≥2500

### If responses are too slow:
1. Consider reducing to `reasoning_effort: 'minimal'` for simple queries
2. Check if complex system prompts are causing delays
3. Monitor for API rate limiting

### If GPT-5-mini fails:
- Automatic fallback to GPT-4.1 should occur
- Check logs for error messages
- Verify OpenAI API key and quota

Last updated: September 5, 2025