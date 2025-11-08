# Prompt Size Limits - Rationale & Guidelines

**Last Updated:** 2025-11-08
**Status:** Active
**Related Tests:** `system-prompts-enhanced.test.ts`

## Current Limits

| Prompt Type | Size Limit | Test Location | Rationale |
|-------------|------------|---------------|-----------|
| **Base Prompt** | <20KB | `system-prompts-enhanced.test.ts:21` | Accommodates WooCommerce + Shopify workflows |
| **Enhanced Prompt** | <25KB | `system-prompts-enhanced.test.ts:29` | Base + conversation metadata (10 entities, 5 list items) |

---

## Why These Limits Matter

### 1. Model Token Constraints

**Token Calculation:**
- **1 token ≈ 4 characters** (English text average)
- **20KB = ~20,000 characters**
- **20,000 chars ÷ 4 = ~5,000 tokens**

**Model Limits (as of 2025-01):**
| Model | Context Window | System Prompt Budget | Our Usage |
|-------|----------------|---------------------|-----------|
| GPT-4 Turbo | 128K tokens | ~10K recommended | 5K (50%) ✅ |
| GPT-3.5 Turbo | 16K tokens | ~4K recommended | 5K (125%) ⚠️ |
| Claude 3 Opus | 200K tokens | ~20K recommended | 5K (25%) ✅ |
| Claude 3 Sonnet | 200K tokens | ~20K recommended | 5K (25%) ✅ |

**Impact:**
- ✅ Safe for GPT-4 Turbo, Claude models (50% budget or less)
- ⚠️ **GPT-3.5 Turbo at risk** - may need compression if we support it
- 🎯 Leaves 3K-15K tokens for conversation history depending on model

### 2. Cost Optimization

**Token Pricing (OpenAI GPT-4 Turbo, Nov 2024):**
- Input: $0.01 / 1K tokens
- Output: $0.03 / 1K tokens

**Cost per Conversation Turn (5K token system prompt):**
```
System prompt: 5,000 tokens × $0.01/1K = $0.05 per turn
User message: 100 tokens × $0.01/1K = $0.001
AI response: 500 tokens × $0.03/1K = $0.015
──────────────────────────────────────────────
Total per turn: $0.066 (~7¢)
```

**At scale:**
- 1,000 conversations/day = $66/day = $1,980/month
- **System prompt = 75% of input cost** (optimization target)

### 3. Response Latency

**Processing Time Impact:**
- Larger prompts = longer first-token time (TTFT)
- **~5K tokens ≈ 200-400ms additional latency** vs baseline
- Acceptable for most use cases (<1s total)

---

## Historical Context

### Evolution of Limits

| Date | Base Limit | Enhanced Limit | Reason for Change |
|------|------------|----------------|-------------------|
| **2024-10-15** | <10KB | <15KB | Initial limits (WooCommerce only) |
| **2025-11-08** | <20KB | <25KB | Added Shopify workflows (+9KB) |

### Why We Increased Limits (Nov 2025)

**Before refactoring:**
- Base prompt: 325 lines, ~10KB
- WooCommerce workflows only

**After refactoring + Shopify:**
- Base prompt: 198 lines, **19.35KB**
- WooCommerce: 92 lines
- Shopify: 97 lines
- **Total growth: +9KB (90%)**

**Decision rationale:**
1. **Multi-platform support required** - Can't sacrifice Shopify to save KB
2. **Still within safe limits** for target models (GPT-4 Turbo, Claude)
3. **Modular architecture** allows future optimization
4. **Business value > prompt size** - Comprehensive workflows improve accuracy

---

## Warning Thresholds

### When to Review Prompt Size

**Yellow Alert (>18KB base, >23KB enhanced):**
- ⚠️ Approaching limits
- Consider: Can any sections be compressed?
- Action: Review for redundancy

**Red Alert (>22KB base, >28KB enhanced):**
- 🚨 Over budget for GPT-3.5 Turbo
- 🚨 Risk of poor performance
- Action Required: **Refactor or split prompts**

### Mitigation Strategies

If limits are exceeded:

1. **Compression Techniques:**
   - Remove redundant examples
   - Abbreviate common patterns
   - Use references instead of duplication

2. **Dynamic Loading:**
   - Load platform-specific workflows on-demand
   - Only include WooCommerce OR Shopify, not both
   - Conditional sections based on customer config

3. **Prompt Splitting:**
   - Core instructions (always loaded)
   - Platform workflows (lazy loaded)
   - Advanced features (opt-in)

4. **Model-Specific Prompts:**
   - Full prompt for GPT-4 Turbo / Claude
   - Compressed prompt for GPT-3.5 Turbo
   - Auto-detect and switch

---

## Testing Strategy

### Size Validation Tests

**Purpose:** Prevent prompt bloat through CI/CD

**Test 1: Base Prompt Size**
```typescript
test('base prompt should be reasonable size (<20KB)', () => {
  const prompt = getCustomerServicePrompt();
  const sizeInKB = new Blob([prompt]).size / 1024;
  expect(sizeInKB).toBeLessThan(20);
});
```

**Test 2: Enhanced Prompt Size**
```typescript
test('enhanced prompt with complex data should be <25KB', () => {
  // Simulate complex metadata (10 entities, 5 list items, corrections)
  const enhanced = getEnhancedCustomerServicePrompt(manager);
  const sizeInKB = new Blob([enhanced]).size / 1024;
  expect(sizeInKB).toBeLessThan(25);
});
```

### How to Update Limits

**When to increase:**
1. Adding new platform (e.g., BigCommerce, Magento)
2. Critical functionality that improves accuracy
3. Model context windows increase

**Process:**
1. Document reason in this file
2. Update test expectations
3. Verify impact on target models
4. Calculate cost impact
5. Get approval for >30KB changes

---

## Future Considerations

### Model Improvements (2025-2026)

**Expected developments:**
- Context windows will grow (GPT-5 rumored at 1M tokens)
- Prompt caching (Anthropic already supports)
- Semantic compression techniques
- Cost reductions

**Impact on limits:**
- May **increase limits to 30-40KB** safely
- Prompt caching could make size less critical
- But efficiency still matters for latency

### Platform Expansion

**Planned integrations:**
- BigCommerce (est. +8KB)
- Magento (est. +8KB)
- Custom e-commerce (est. +6KB)

**Potential solutions:**
- Dynamic workflow loading (per customer)
- Shared workflow templates (already implemented!)
- On-demand documentation retrieval

---

## Monitoring & Alerts

### Recommended Metrics

**Track in production:**
```typescript
// Add to analytics/telemetry
{
  promptSize: blob.size,
  platform: 'woocommerce' | 'shopify',
  model: 'gpt-4-turbo',
  tokensUsed: completionTokens,
  costPerTurn: calculatedCost,
  latencyMs: responseTime
}
```

**Alert conditions:**
- Average prompt size >22KB for 7 days → Review
- 95th percentile >25KB → Investigate outliers
- Cost per turn >$0.10 → Optimization needed

---

## References

- **Test File:** `__tests__/lib/chat/system-prompts-enhanced.test.ts`
- **Base Prompt:** `lib/chat/system-prompts/base-prompt.ts`
- **Workflow Template:** `lib/chat/system-prompts/commerce-workflow-template.ts`
- **OpenAI Pricing:** https://openai.com/pricing
- **Token Estimation:** 1 token ≈ 4 characters (English)

---

**Questions or concerns about prompt size? Update this document and notify the team.**
