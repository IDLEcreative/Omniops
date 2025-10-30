# Testing & Verification Scripts

**Purpose:** Test utilities and system verification tools
**Last Updated:** 2025-10-30
**Usage:** Run tests using `npx tsx` from project root

## Overview

This directory contains scripts for testing system functionality, verifying AI accuracy, and ensuring quality standards are met. These are **NOT** Jest/unit tests - these are end-to-end verification scripts.

## Critical Testing Tools

### test-hallucination-prevention.ts
**Purpose:** Verify anti-hallucination safeguards are working correctly

**Usage:**
```bash
# Standard test run
npx tsx scripts/tests/test-hallucination-prevention.ts

# Verbose output with detailed reasoning
npx tsx scripts/tests/test-hallucination-prevention.ts --verbose
```

**What it tests:**
- AI admits uncertainty when data is missing
- No false product information generated
- Price accuracy when prices exist
- Refusal to guess about products not in database
- Appropriate handling of out-of-scope questions

**Test scenarios:**
- Products not in database → Should say "I don't have information about..."
- Prices not available → Should say "I don't have pricing information..."
- Ambiguous questions → Should ask clarifying questions
- Out-of-scope queries → Should politely redirect

**Success criteria:**
- 100% accuracy on uncertainty admission
- 0 false claims about products
- 0 fabricated prices

**⚠️ CRITICAL:** Run this after ANY changes to chat prompts or AI logic!

**Reference:** See [docs/HALLUCINATION_PREVENTION.md](../../docs/HALLUCINATION_PREVENTION.md)

---

### test-metadata-tracking.ts
**Purpose:** Test conversation metadata tracking system (86% accuracy benchmark)

**Usage:**
```bash
npx tsx scripts/tests/test-metadata-tracking.ts
```

**What it tests:**
- Conversation intent detection accuracy
- Product mention extraction
- Price quote tracking
- Contact info recognition
- Conversation outcome classification

**Accuracy targets:**
- Overall accuracy: ≥86%
- Intent classification: ≥90%
- Product extraction: ≥85%
- Price tracking: ≥80%

**Output:**
```
Conversation Metadata Tracking Test

Results:
  Total conversations: 100
  Accuracy: 86.5%

  By category:
    Intent detection: 91% ✓
    Product mentions: 87% ✓
    Price quotes: 82% ✓
    Contact info: 88% ✓
    Outcomes: 84% ✓

  Recommendations:
    - Price extraction could be improved
    - Monitor edge cases in product mentions
```

**Reference:** See [docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md](../../docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md)

---

### test-chat-accuracy.ts
**Purpose:** Test AI chat response accuracy and quality

**Usage:**
```bash
npx tsx scripts/tests/test-chat-accuracy.ts
```

**What it tests:**
- Correct product recommendations
- Accurate price quotations
- Proper use of context from scraped pages
- Response relevance
- Tone and professionalism

**Test suite:**
- 50+ predefined questions with expected responses
- Edge cases (ambiguous queries, missing data)
- Multi-turn conversation flows
- Product search accuracy

---

### test-complete-system.ts
**Purpose:** End-to-end system verification

**Usage:**
```bash
npx tsx scripts/tests/test-complete-system.ts
```

**What it tests:**
- Database connectivity
- Redis connectivity
- OpenAI API access
- Supabase functions
- Vector search functionality
- WooCommerce integration (if configured)
- Scraping functionality
- Embedding generation
- Chat API endpoints

**Health check output:**
```
Complete System Test

✓ Database: Connected (45ms)
✓ Redis: Healthy (12ms)
✓ OpenAI API: Responding (234ms)
✓ Vector Search: Working (67ms)
✓ Embeddings: Generating (1.2s)
✓ Chat API: Responding (890ms)
⚠ WooCommerce: Not configured (expected for some customers)
✓ Scraping: Functional

Overall: HEALTHY (7/8 checks passed)
```

---

## Feature-Specific Tests

### test-exact-product-match.ts
**Purpose:** Verify exact product matching logic

**Usage:**
```bash
npx tsx scripts/tests/test-exact-product-match.ts
```

**Tests:**
- SKU-based matching
- Product name matching
- Fuzzy matching behavior
- Ranking of search results

---

### test-enhanced-prompt-demo.ts & test-enhanced-prompt-example.ts
**Purpose:** Test enhanced prompt system functionality

**Usage:**
```bash
npx tsx scripts/tests/test-enhanced-prompt-demo.ts
npx tsx scripts/tests/test-enhanced-prompt-example.ts
```

**Tests:**
- Prompt template rendering
- Context injection
- Variable interpolation
- Conditional sections

---

### test-contact-info.ts
**Purpose:** Verify contact information extraction

**Usage:**
```bash
npx tsx scripts/tests/test-contact-info.ts
```

**Tests:**
- Email detection
- Phone number extraction
- Address parsing
- Business hours recognition

---

### test-embeddings.ts
**Purpose:** Test embedding generation and search

**Usage:**
```bash
npx tsx scripts/tests/test-embeddings.ts
```

**Tests:**
- Embedding generation from text
- Vector similarity search
- Embedding metadata
- Chunk optimization

---

## AI Extractor Tests

### test-ai-extractor-verification.ts (+ v2, final)
**Purpose:** Verify AI-powered content extraction

**Usage:**
```bash
npx tsx scripts/tests/test-ai-extractor-verification.ts
npx tsx scripts/tests/test-ai-extractor-verification-v2.ts
npx tsx scripts/tests/test-ai-extractor-verification-final.ts
```

**What they test:**
- FAQ extraction from web pages
- Product information extraction
- Pricing information extraction
- Contact detail extraction
- Extraction accuracy improvements (v2, final)

---

## Dashboard & Analytics Tests

### test-dashboard-analytics-verification.ts
**Purpose:** Verify dashboard analytics calculations

**Usage:**
```bash
npx tsx scripts/tests/test-dashboard-analytics-verification.ts
```

**Tests:**
- Conversation count accuracy
- Message aggregation
- Customer metrics
- Time-series data

---

### test-bulk-actions-verification.ts
**Purpose:** Test bulk operation functionality

**Usage:**
```bash
npx tsx scripts/tests/test-bulk-actions-verification.ts
```

---

### test-analytics-tracking.ts
**Purpose:** Verify analytics event tracking

**Usage:**
```bash
npx tsx scripts/tests/test-analytics-tracking.ts
```

---

## Domain-Agnostic Testing

### test-domain-agnostic-fixes.ts
**Purpose:** Ensure system works across different business types

**Usage:**
```bash
npx tsx scripts/tests/test-domain-agnostic-fixes.ts
```

**Tests:**
- No hardcoded company names
- Generic product terminology
- Multi-tenant isolation
- Brand-agnostic UI/UX

**Reference:** See CLAUDE.md section on brand-agnostic requirements

---

## Comparison & Scenario Tests

### test-comparison-scenario.ts
**Purpose:** Test product comparison scenarios

**Usage:**
```bash
npx tsx scripts/tests/test-comparison-scenario.ts
```

---

### test-currency-fix.ts
**Purpose:** Verify currency symbol fixes

**Usage:**
```bash
npx tsx scripts/tests/test-currency-fix.ts
```

---

## Test Data & Fixtures

### metadata/
**Purpose:** Test metadata and fixtures directory

Contains:
- Sample conversation data
- Test customer configurations
- Mock WooCommerce responses
- Expected output fixtures

## Running Tests in CI/CD

```yaml
# .github/workflows/test.yml
- name: Run hallucination prevention tests
  run: npx tsx scripts/tests/test-hallucination-prevention.ts

- name: Run metadata tracking tests
  run: npx tsx scripts/tests/test-metadata-tracking.ts

- name: Run complete system test
  run: npx tsx scripts/tests/test-complete-system.ts
```

## Prerequisites

Tests require:

```bash
# Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...

# Development server must be running on port 3000
npm run dev  # In separate terminal
```

## Test Development Best Practices

1. **Write tests BEFORE making changes** - TDD approach
2. **Test real scenarios** - Use actual user queries
3. **Include edge cases** - Test boundary conditions
4. **Verify, don't trust** - Always run verification after claiming success
5. **Document expected behavior** - Clear success criteria

## Troubleshooting

### "Tests timing out"
```bash
# Ensure dev server is running
lsof -i :3000

# Check if services are healthy
npx tsx scripts/tests/test-complete-system.ts
```

### "Hallucination tests failing"
```bash
# This is CRITICAL - DO NOT IGNORE
# Review recent changes to:
# - lib/agents/customer-service-agent.ts
# - Chat prompts
# - AI system messages

# Run in verbose mode to see what AI is saying
npx tsx scripts/tests/test-hallucination-prevention.ts --verbose
```

### "Accuracy below threshold"
```bash
# Run detailed metadata tracking
npx tsx scripts/tests/test-metadata-tracking.ts

# Review failed cases
# Update prompts or logic based on failures
```

## Related Scripts

- **Validation:** `scripts/validation/` - Data validation scripts
- **Monitoring:** `scripts/monitoring/simulate-production-conversations.ts` - Load testing

## Related Documentation

- [Hallucination Prevention](../../docs/HALLUCINATION_PREVENTION.md)
- [Conversation Accuracy](../../docs/CONVERSATION_ACCURACY_IMPROVEMENTS.md)
- [Testing Philosophy](../../CLAUDE.md#testing--code-quality-philosophy)
- [Main Scripts README](../README.md)
