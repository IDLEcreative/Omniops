# GPT-5-mini Quick Reference Card

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 4 minutes

## Purpose
model: 'gpt-5-mini' max_completion_tokens: 2500 reasoning_effort: 'low' // NOT 'minimal' - that disables reasoning!

## Quick Links
- [⚡ Current Production Settings](#-current-production-settings)
- [🎯 Key Insights from Testing](#-key-insights-from-testing)
- [🔍 Quick Debugging](#-quick-debugging)
- [📊 Model Comparison](#-model-comparison)
- [🚀 Quick Test Command](#-quick-test-command)

## Keywords
command, comparison, current, debugging, insights, model, production, quick, reference, remember

---


## ⚡ Current Production Settings

```typescript
model: 'gpt-5-mini'
max_completion_tokens: 2500
reasoning_effort: 'low'  // NOT 'minimal' - that disables reasoning!
```

## 🎯 Key Insights from Testing

### Reasoning Effort Levels
- **`minimal`** = 0 reasoning tokens ❌ (straight to output, no thinking)
- **`low`** = ~20% reasoning ✅ (CURRENT - best balance)
- **`medium`** = ~33% reasoning (slower, not needed for chat)
- **`high`** = ~50%+ reasoning (for complex analysis only)

### Performance Metrics
- **Average Response Time:** 6-14 seconds
- **Reasoning Tokens:** 200-400 (should never be 0!)
- **Output Tokens:** 600-1000
- **Total Cost:** ~$0.01 per 1K tokens

## 🔍 Quick Debugging

### Check if Reasoning is Active
Look for this in server logs:
```javascript
reasoning_tokens: 256  // ✅ Good - reasoning is active
reasoning_tokens: 0    // ❌ Bad - no reasoning happening
```

### Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| Poor quality answers | Check reasoning_effort is 'low' not 'minimal' |
| Responses too slow | Consider 'minimal' for simple queries only |
| Empty responses | Increase max_completion_tokens to 3000+ |
| Model errors | Check fallback to GPT-4.1 is working |

## 📊 Model Comparison

| Setting | Speed | Quality | Cost | When to Use |
|---------|-------|---------|------|-------------|
| GPT-5-mini (low) | Medium | High | $ | **DEFAULT** - Customer service |
| GPT-5-mini (minimal) | Fast | Medium | $ | Simple lookups only |
| GPT-5 (low) | Slow | Highest | $$$$$ | Complex technical analysis |
| GPT-4.1 | Fast | Good | $$ | Fallback when GPT-5 fails |

## 🚀 Quick Test Command

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Test: What products do you offer?",
    "session_id": "test-'$(date +%s)'",
    "domain": "thompsonseparts.co.uk"
  }' | jq '.message'
```

## 💡 Remember

1. **'low' reasoning is the sweet spot** - not too fast, not too slow
2. **Reasoning tokens should be >0** - if not, quality suffers
3. **GPT-5-mini at 'low'** beats GPT-5 at 'minimal' for customer service
4. **Monitor reasoning tokens** in production logs regularly

---
*For full documentation, see MODEL_CONFIGURATION.md*
