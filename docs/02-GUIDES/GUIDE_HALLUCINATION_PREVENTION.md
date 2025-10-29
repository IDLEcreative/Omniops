# Hallucination Prevention in Chat System

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Search Architecture](../../01-ARCHITECTURE/ARCHITECTURE_SEARCH_SYSTEM.md) - Result grounding
- [Performance Optimization](docs/07-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - System prompts
**Estimated Read Time:** 12 minutes

## Purpose
Comprehensive anti-hallucination measures for the AI chat system ensuring accurate information delivery and proper uncertainty admission through multi-layered prevention including system prompt rules, context grounding, response validation, and a comprehensive testing suite across 10 hallucination-prone categories.

## Quick Links
- [Solution Architecture](#solution-architecture) - Multi-layered prevention approach
- [Implementation Details](#implementation-details) - Enhanced context and strict rules
- [Standard Response Templates](#standard-response-templates) - Handling unknown information
- [Testing](#testing) - Comprehensive hallucination detection tests
- [Best Practices](#best-practices) - Accuracy over helpfulness

## Keywords
hallucination, AI safety, accuracy, validation, testing, anti-hallucination, RAG, retrieval augmented generation, system prompts, context grounding, response validation, false claims, uncertainty admission, product accuracy, technical specifications, GPT-4o-mini

## Aliases
- "hallucination" (also known as: false information, AI confabulation, invented facts, made-up data)
- "context grounding" (also known as: RAG, retrieval augmented generation, source-based responses)
- "uncertainty admission" (also known as: confidence thresholds, I don't know responses, information gaps)
- "response validation" (also known as: fact checking, accuracy verification, claim validation)

---

## Overview

This document describes the comprehensive anti-hallucination measures implemented in the OmniOps customer service chat system to ensure the AI provides accurate information and admits uncertainty when appropriate.

## Problem Statement

### Previous Issues

The chat AI was previously making incorrect assumptions about products:
- Claiming products included components they didn't include
- Inventing technical specifications
- Providing stock availability without real-time data
- Making compatibility claims without verification
- Suggesting products that don't exist in the catalog

### Example of Previous Issue

**User:** "Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?"

**AI (Before):** "Yes, the A4VTG90 includes a chute pump assembly."

**Problem:** The AI made this claim without having specific information about what's included with the product.

**AI (After):** "I don't have specific details about what's included with the A4VTG90. Please contact customer service for detailed product specifications."

## Solution Architecture

### Multi-Layered Prevention

The system implements hallucination prevention at multiple levels:

1. **System Prompt Rules** - Explicit instructions to the AI
2. **Context Grounding** - Only use information from search results
3. **Response Validation** - Check responses against source data
4. **Testing Suite** - Comprehensive hallucination detection tests

## Implementation Details

### 1. Enhanced Product Context

**File**: `app/api/chat/route.ts`

Increased product content snippet from 400 to 600 characters to provide more context:

```typescript
// Provide more context to the AI
systemContext += `   Content: ${r.content.substring(0, 600)}...\n`;
```

**Rationale**: More context reduces the need for the AI to "fill in gaps" with assumptions.

### 2. Strict Accuracy Rules

**File**: `app/api/chat/route.ts` (System Prompt)

Explicit rules for non-customer queries:

```typescript
const ACCURACY_RULES = `
Product Information Accuracy - MANDATORY:
- NEVER make assumptions about product relationships or what's included
- Only state facts that are explicitly in the product information provided
- If asked "does X include Y", only answer if you have clear information
- When uncertain, say "I don't have specific details about what's included with this product"
- Suggest contacting customer service for detailed specifications when information is unclear

FORBIDDEN RESPONSES - NEVER provide these without explicit data:
- Specific technical specifications (horsepower, dimensions, weight, capacity)
- Stock quantities or availability numbers
- Delivery timeframes or shipping dates
- Warranty terms or guarantee periods
- Compatibility claims between products
- Price comparisons or discount amounts
- Manufacturing locations or origins
- Installation instructions or procedures
`;
```

### 3. Anti-Hallucination Instructions for RAG Results

**File**: `app/api/chat/route.ts` (Context System Message)

When embedding search results are available:

```typescript
const RAG_ANTI_HALLUCINATION = `
PRODUCT INFORMATION ACCURACY:
- NEVER make assumptions about what a product includes or doesn't include
- If asked about product components or what's included:
  * Only state what you can see in the product content/description
  * If the information isn't clear, say "I don't have specific details about what's included with this product"
  * Suggest contacting customer service for detailed product specifications
- Do NOT guess or infer product relationships unless explicitly stated
- Treat each product as a separate item unless the description clearly states otherwise

CRITICAL ANTI-HALLUCINATION RULES:
- If you don't see specific information in the content provided, DO NOT make it up
- NEVER invent technical specifications, measurements, or capabilities
- NEVER claim compatibility between products unless explicitly stated
- NEVER provide stock levels, lead times, or availability dates
- When asked for information not in the content, respond with:
  "I don't have that specific information in our current data. Please contact customer service for [details requested]."

ONLY mention products that appear in your search results:
- Each product mentioned MUST have a corresponding search result
- If searching returns no results, clearly state it's not available
- Never invent or assume products exist
`;
```

### 4. Search Result Grounding

```typescript
// Ensure AI has access to search results
const systemContext = `
AVAILABLE INFORMATION:
${searchResults.map((r, i) => `
${i + 1}. ${r.title}
   URL: ${r.url}
   Content: ${r.content.substring(0, 600)}...
   Similarity: ${r.similarity}
`).join('\n')}

You MUST ONLY use information from the above search results.
If information is not in the results, admit you don't have it.
`;
```

## Standard Response Templates

The AI uses these templates when information is not available:

### Technical Specifications

**Query:** "What is the horsepower rating of [product]?"

**Response Template:**
```
I don't have specific technical specifications for this product in our current data.
Please contact customer service for detailed specifications.
```

### Product Inclusions

**Query:** "Does [product A] include [component B]?"

**Response Template:**
```
I don't have specific details about what's included with this product.
Please contact customer service for confirmation on included components.
```

### Stock Availability

**Query:** "How many [product] do you have in stock?"

**Response Template:**
```
I don't have real-time stock information available. Please contact customer
service to check current availability and stock levels.
```

### Warranty Information

**Query:** "What warranty comes with [product]?"

**Response Template:**
```
I don't have warranty details available in our current data. Please contact
customer service for warranty terms and coverage information.
```

### Compatibility

**Query:** "Will [product] work with my [equipment]?"

**Response Template:**
```
I don't have specific compatibility information for this combination. Please
contact customer service with your equipment model for verification.
```

### Price Information

**Query:** "How much does [product] cost?"

**Response Template:**
```
I can see [product name] in our catalog, but I don't have current pricing
available. Please contact customer service for the latest pricing.
```

### Installation Instructions

**Query:** "How do I install [product]?"

**Response Template:**
```
Installation instructions should come with the product. For detailed installation
guidance, please contact customer service or refer to the product manual.
```

## Testing

### Test Suite

Two comprehensive test scripts validate hallucination prevention:

#### 1. Basic Accuracy Testing
**File**: `test-chat-accuracy.ts`

```bash
npx tsx test-chat-accuracy.ts
```

Tests basic accuracy scenarios:
- Known products vs unknown products
- Specifications available vs not available
- Price information handling

#### 2. Comprehensive Hallucination Detection
**File**: `test-hallucination-prevention.ts`

```bash
npx tsx test-hallucination-prevention.ts
```

Tests hallucination-prone scenarios across 10 categories:
1. Technical specifications
2. Product compatibility
3. Stock availability
4. Delivery times
5. Price comparisons
6. Installation instructions
7. Warranty information
8. Product origin
9. Alternative products
10. Bulk discounts

### Running Tests

```bash
# Start the development server (required)
PORT=3000 npm run dev

# In another terminal, run tests
npx tsx test-hallucination-prevention.ts
```

### Test Coverage

The test suite validates:

| Scenario | Expected Behavior | Status |
|----------|-------------------|--------|
| Unknown specifications | Admits uncertainty | ✅ Pass |
| Unknown stock levels | Defers to inventory system | ✅ Pass |
| Unknown compatibility | Suggests verification | ✅ Pass |
| Unknown warranty | Directs to customer service | ✅ Pass |
| Unknown pricing | Acknowledges missing data | ✅ Pass |
| Non-existent products | States product not found | ✅ Pass |
| Installation instructions | Defers to manuals/support | ✅ Pass |
| Delivery timeframes | Admits no real-time data | ✅ Pass |

### Expected Test Results

All tests should show the AI:
- ✅ Admitting uncertainty when information is missing
- ✅ Directing to customer service for specific details
- ✅ NOT inventing specifications or claims
- ✅ NOT providing specific numbers without data
- ✅ NOT making compatibility claims without evidence
- ✅ NOT suggesting products that don't exist

### Example Test Case

```typescript
{
  scenario: "Technical Specifications",
  query: "What's the horsepower of the Cifa hydraulic pump?",
  shouldNotContain: [
    /\d+\s*hp/i,           // Specific horsepower numbers
    /\d+\s*kw/i,           // Power in kilowatts
    /\d+\s*watts/i,        // Power in watts
    "horsepower",          // Unless admitting uncertainty
  ],
  shouldContain: [
    /don't have|not available|contact/i,  // Admission of uncertainty
  ]
}
```

## Monitoring & Maintenance

### Key Metrics to Track

1. **False Positive Rate**
   - How often the AI makes claims without supporting data
   - Target: <1% of responses

2. **Customer Service Referrals**
   - Frequency of directing to human support
   - Target: 10-20% of queries (balanced helpfulness vs accuracy)

3. **User Satisfaction**
   - Whether users prefer accuracy over speculation
   - Target: >80% satisfaction with response accuracy

4. **Hallucination Detection**
   - Automated scanning for hallucination patterns
   - Alert on suspected false information

### Regular Audits

**Monthly Review:**
1. Sample 100 random conversations
2. Identify any hallucinations
3. Categorize by type (specs, stock, compatibility, etc.)
4. Update prevention rules if patterns emerge

**Quarterly Analysis:**
1. Analyze customer service escalations
2. Identify information gaps
3. Prioritize data enrichment efforts
4. Update system prompts based on findings

### Continuous Improvement

#### 1. Expand Product Data

```sql
-- Add structured product data
ALTER TABLE products ADD COLUMN specifications JSONB;
ALTER TABLE products ADD COLUMN included_items TEXT[];
ALTER TABLE products ADD COLUMN compatibility_list TEXT[];

-- Populate from existing descriptions
UPDATE products SET specifications = extract_specs(description);
```

#### 2. Structured Data Storage

```typescript
interface ProductSpecifications {
  dimensions?: { length: number; width: number; height: number; unit: string };
  weight?: { value: number; unit: string };
  power?: { value: number; unit: string };
  capacity?: { value: number; unit: string };
  included_items?: string[];
  compatibility?: string[];
  warranty?: { duration: number; unit: string; terms: string };
}
```

#### 3. Real-time Integration

```typescript
// Connect to live inventory system
const stockLevel = await inventoryAPI.getStock(productId);

// Include in AI context
const context = `
Current stock level: ${stockLevel.quantity} units
Stock status: ${stockLevel.status}
`;
```

#### 4. Feedback Loop

```typescript
// Learn from customer service resolutions
interface CustomerServiceResolution {
  original_query: string;
  ai_response: string;
  customer_service_correction: string;
  hallucination_detected: boolean;
}

// Use to improve system prompts
```

## Configuration

### Environment Variables

Hallucination prevention is always enabled. No configuration needed.

### Feature Flags

```typescript
// In code - cannot be disabled
const HALLUCINATION_PREVENTION_ENABLED = true; // Always true
```

## Troubleshooting

### Issue: AI Still Making False Claims

**Symptoms:**
- AI provides specific numbers without source data
- AI claims compatibility without evidence
- AI invents product features

**Diagnostic Steps:**
1. Check system prompts are properly applied:
   ```typescript
   console.log('System prompt:', systemPrompt);
   ```

2. Verify content length limits aren't truncating instructions:
   ```typescript
   console.log('Prompt length:', systemPrompt.length);
   ```

3. Review specific query patterns:
   ```bash
   # Search logs for hallucination keywords
   grep -i "horsepower\|dimensions\|warranty" logs/chat.log
   ```

4. Add more explicit forbidden patterns:
   ```typescript
   const FORBIDDEN_PATTERNS = [
     /\d+\s*hp/i,
     /\d+\s*inches/i,
     /\d+\s*year warranty/i,
     // Add more as discovered
   ];
   ```

### Issue: AI Too Conservative

**Symptoms:**
- AI refuses to provide information it actually has
- Too many customer service referrals
- Users frustrated with lack of helpfulness

**Diagnostic Steps:**
1. Review product content quality:
   ```sql
   SELECT title, LENGTH(content) as content_length
   FROM scraped_pages
   WHERE content_length < 200;
   ```

2. Ensure embeddings are properly indexed:
   ```sql
   SELECT COUNT(*) FROM page_embeddings WHERE domain_id = 'xxx';
   ```

3. Adjust similarity thresholds:
   ```typescript
   // Lower threshold to get more results
   const searchResults = await searchSimilarContent(
     query,
     domain,
     100,
     0.10  // Lower from 0.15
   );
   ```

4. Add positive examples to system prompt:
   ```typescript
   const POSITIVE_EXAMPLES = `
   Good examples:
   - "Based on the product description, this pump includes..."
   - "According to our specifications, the dimensions are..."
   - "The product page indicates this is compatible with..."
   `;
   ```

### Issue: Inconsistent Behavior

**Symptoms:**
- Same query gets different responses
- Sometimes admits uncertainty, sometimes doesn't

**Cause:** Temperature setting too high or non-deterministic behavior

**Solution:**
```typescript
// Use lower temperature for consistency
const config = {
  model: 'gpt-5-mini',
  temperature: 0.3,  // Lower = more consistent (was 0.7)
  max_completion_tokens: 1000
};
```

## Best Practices

### 1. Prefer Accuracy Over Helpfulness

```typescript
// GOOD: Honest admission
"I don't have specific dimensions for this product."

// BAD: Helpful but inaccurate
"This pump is approximately 12 inches long." // (without source data)
```

### 2. Use Structured Data

```typescript
// Store specifications in database fields
interface Product {
  id: string;
  name: string;
  specifications: {
    weight: number;
    dimensions: { length: number; width: number; height: number };
    power: number;
  };
}

// Rather than free text
interface Product {
  id: string;
  name: string;
  description: string; // "Weight: 50 lbs, Size: 12x8x6, Power: 2 HP"
}
```

### 3. Clear Documentation

Ensure product descriptions explicitly state:
- What's included in the box
- What's sold separately
- Compatibility information
- Specifications and measurements
- Warranty terms

### 4. Regular Testing

```bash
# Run tests after any prompt changes
npm run test:chat

# Run hallucination tests specifically
npx tsx test-hallucination-prevention.ts

# Check for regressions
git diff app/api/chat/route.ts
```

### 5. User Education

Make it clear to users:
- The AI has limitations
- Human support is available for complex questions
- Real-time data (stock, pricing) requires verification

```typescript
// Include in chat widget
const DISCLAIMER = `
This AI assistant provides general information based on our product catalog.
For real-time stock, pricing, and technical specifications, please contact
our customer service team.
`;
```

## Related Files

### Implementation
- `/app/api/chat/route.ts` - Main chat endpoint with anti-hallucination rules
- `/lib/embeddings.ts` - Content search and retrieval
- `/lib/chat/ai-processor.ts` - AI response generation

### Testing
- `/test-chat-accuracy.ts` - Basic accuracy test suite
- `/test-hallucination-prevention.ts` - Comprehensive hallucination tests
- `/__tests__/api/chat/route.test.ts` - Unit tests

### Documentation
- `/docs/02-FEATURES/chat-system/README.md` - Main chat system docs
- `/docs/SEARCH_ARCHITECTURE.md` - Search and embeddings internals
- `/docs/SUPABASE_SCHEMA.md` - Database schema reference

## Version History

### 2024-01-06 - Initial Implementation
- Increased context window to 600 characters
- Added forbidden response patterns
- Implemented strict accuracy rules
- Created comprehensive test suite

### 2024-08-15 - Enhanced Grounding
- Added search result grounding
- Implemented response validation
- Expanded test coverage to 10 scenarios

### 2024-12-10 - Refinements
- Simplified prompt mode with preserved accuracy
- Improved category matching to reduce false positives
- Enhanced WooCommerce schema validation

## Contact

For questions or improvements to hallucination prevention:
1. Review this documentation first
2. Run the test suite to verify behavior
3. Check logs for specific hallucination examples
4. Contact the development team with reproducible cases

---

**Last Updated**: October 2024
**Maintained by**: OmniOps Development Team
