**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Real Scenarios Test Suite

**Purpose:** End-to-end testing of AI agent behavior in realistic user conversations.

**Structure:** Scenario-based testing framework (refactored from 322 LOC to 123 LOC orchestrator + 249 LOC scenarios).

## Files

### Orchestrator
- **test-ai-agent-real-scenarios.test.ts** (123 LOC) - Main entry point that runs all scenarios

### Scenario Definitions
- **scenario-definitions.ts** (249 LOC) - Defines 5 test scenarios with validation logic

## Test Scenarios

### 1. Simple Product Query
- **Test:** "Do you have 10mtr extension cables?"
- **Validates:** Tool selection, product search, pricing, availability

### 2. Comparison Request
- **Test:** "Compare 10mtr vs 20mtr extension cables for me"
- **Validates:** Breadth strategy (search_products), depth strategy (get_complete_page_details), comparison logic

### 3. Upselling Opportunity
- **Test:** "I need 10mtr cables"
- **Validates:** Related product suggestions, breadth-first search, alternative offerings

### 4. Deep Technical Query
- **Test:** "Tell me everything about the 10mtr extension cables - full specifications, compatibility, installation"
- **Validates:** Depth strategy recognition, comprehensive information retrieval, detailed responses

### 5. Browsing Behavior
- **Test:** "What cables do you have?"
- **Validates:** Broad search, variety display, follow-up invitation

## Running Tests

```bash
# Ensure dev server is running
npm run dev

# Run all real-world scenario tests
npx tsx __tests__/agents/test-ai-agent-real-scenarios.test.ts
```

## Architecture

### Dual Strategy Validation
Tests validate the AI agent's dual strategy:
1. **Breadth First:** Uses `search_products` to see 15 scattered chunks (enables comparisons, upselling)
2. **Depth When Needed:** Optionally calls `get_complete_page_details` for comprehensive information

### Test Structure
Each scenario includes:
- **Name:** Descriptive test name
- **User Message:** Realistic user query
- **Expected Behavior:** List of expected agent actions
- **Expected Tools:** Tools the agent should call
- **Check Response:** Validation function that returns `{ passed, issues, strengths }`

## Success Criteria

- **Tool Selection:** Agent calls appropriate tools for each scenario
- **Response Quality:** Responses contain expected information
- **Strategy Intelligence:** Agent switches between breadth and depth appropriately
- **Upselling:** Agent suggests related products when relevant
- **Comparison:** Agent compares multiple products effectively

**Last Updated:** 2025-11-15
