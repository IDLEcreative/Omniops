# Hallucination Prevention in Chat System

## Overview

This document describes the anti-hallucination measures implemented in the Omniops customer service chat system to ensure the AI provides accurate information and admits uncertainty when appropriate.

## Problem Statement

The chat AI was previously making incorrect assumptions about products, specifically:
- Claiming products included components they didn't include
- Inventing technical specifications
- Providing stock availability without real-time data
- Making compatibility claims without verification

### Example of Previous Issue

**User:** "Does the Cifa Mixer Hydraulic Pump A4VTG90 include a chute pump?"

**AI (Before):** "Yes, the A4VTG90 includes a chute pump assembly."

**Problem:** The AI made this claim without having specific information about what's included with the product.

## Solution Implementation

### 1. Enhanced Product Context

**File:** `app/api/chat/route.ts:789`

Increased product content snippet from 400 to 600 characters to provide more context to the AI:

```typescript
systemContext += `   Content: ${r.content.substring(0, 600)}...\n`;
```

### 2. Strict Accuracy Rules

**File:** `app/api/chat/route.ts:701-721`

Added explicit rules for non-customer queries:

```typescript
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
```

### 3. Anti-Hallucination Instructions for RAG Results

**File:** `app/api/chat/route.ts:819-834`

When embedding search results are available, additional rules apply:

```typescript
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
```

## Standard Responses for Missing Information

The AI should use these templates when information is not available:

### Technical Specifications
**Query:** "What is the horsepower rating of [product]?"
**Response:** "I don't have specific technical specifications for this product. Please contact customer service for detailed specs."

### Product Inclusions
**Query:** "Does [product A] include [component B]?"
**Response:** "I don't have specific details about what's included with this product. Please contact customer service for confirmation."

### Stock Availability
**Query:** "How many [product] do you have in stock?"
**Response:** "I don't have real-time stock information. Please contact customer service to check current availability."

### Warranty Information
**Query:** "What warranty comes with [product]?"
**Response:** "I don't have warranty details available. Please contact customer service for warranty terms and coverage."

### Compatibility
**Query:** "Will [product] work with my [equipment]?"
**Response:** "I don't have specific compatibility information. Please contact customer service with your equipment model for verification."

## Testing

### Test Scripts

Two comprehensive test scripts are available:

1. **`test-chat-accuracy.ts`** - Basic accuracy testing
2. **`test-hallucination-prevention.ts`** - Comprehensive hallucination detection

### Running Tests

```bash
# Start the development server on port 3000
PORT=3000 npm run dev

# Run accuracy tests
npx tsx test-chat-accuracy.ts

# Run comprehensive hallucination tests
npx tsx test-hallucination-prevention.ts
```

### Test Coverage

The test suite covers these hallucination-prone scenarios:

1. **Technical Specifications** - Horsepower, dimensions, capacity
2. **Product Compatibility** - Will X fit Y model
3. **Stock Availability** - Quantity in stock
4. **Delivery Times** - When will it arrive
5. **Price Comparisons** - Which is cheaper
6. **Installation Instructions** - How to install
7. **Warranty Information** - Coverage periods
8. **Product Origin** - Where manufactured
9. **Alternative Products** - What can replace X
10. **Bulk Discounts** - Volume pricing

### Expected Test Results

All tests should show the AI:
- ✅ Admitting uncertainty when information is missing
- ✅ Directing to customer service for specific details
- ✅ NOT inventing specifications or claims
- ✅ NOT providing specific numbers without data

## Monitoring and Maintenance

### Key Metrics to Track

1. **False Positive Rate** - How often the AI makes claims without data
2. **Customer Service Referrals** - Frequency of directing to human support
3. **User Satisfaction** - Whether users prefer accuracy over speculation

### Regular Audits

Monthly review of chat logs to identify:
- New hallucination patterns
- Areas where more specific data could be provided
- Balance between helpfulness and accuracy

### Continuous Improvement

1. **Expand Product Data** - Add more detailed product descriptions
2. **Structured Data** - Store specifications in structured format
3. **Real-time Integration** - Connect to inventory/pricing systems
4. **Feedback Loop** - Learn from customer service resolutions

## Configuration

### Environment Variables

No specific environment variables needed for hallucination prevention.

### Feature Flags

Hallucination prevention is always enabled and cannot be disabled.

## Troubleshooting

### Issue: AI Still Making False Claims

1. Check if system prompts are being properly applied
2. Verify content length limits aren't truncating instructions
3. Review specific query patterns that bypass rules
4. Add more explicit forbidden response patterns

### Issue: AI Too Conservative

If the AI refuses to provide information it actually has:
1. Review the product content quality
2. Ensure embeddings are properly indexed
3. Adjust similarity thresholds in search
4. Add positive examples to system prompt

## Best Practices

1. **Prefer Accuracy Over Helpfulness** - It's better to admit uncertainty than provide wrong information
2. **Use Structured Data** - Store specifications in database fields rather than free text
3. **Clear Documentation** - Ensure product descriptions explicitly state what's included
4. **Regular Testing** - Run hallucination tests after any prompt changes
5. **User Education** - Make it clear the AI has limitations and human support is available

## Related Files

- `/app/api/chat/route.ts` - Main chat endpoint with anti-hallucination rules
- `/lib/embeddings.ts` - Content search and retrieval
- `/test-chat-accuracy.ts` - Accuracy test suite
- `/test-hallucination-prevention.ts` - Comprehensive hallucination tests
- `/components/chat/MessageContent.tsx` - Message rendering component

## Version History

- **2024-01-06** - Initial implementation of anti-hallucination measures
  - Increased context window to 600 characters
  - Added forbidden response patterns
  - Implemented strict accuracy rules
  - Created comprehensive test suite

## Contact

For questions or improvements to hallucination prevention, please:
- Review this documentation first
- Run the test suite to verify behavior
- Contact the development team with specific examples