**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Edge Cases Test Suite

**Purpose:** Tests unusual scenarios, error handling, and boundary conditions for AI agent conversations.

**Structure:** Modular test suite with orchestrator pattern (refactored from 393 LOC monolith).

## Files

### Orchestrator
- **test-agent-edge-cases.test.ts** (105 LOC) - Main entry point that runs all edge case tests

### Test Modules
- **input-validation.ts** (48 LOC) - Empty messages, very long messages, special characters
- **concurrency.ts** (58 LOC) - Rapid fire messages, multilingual input
- **conversation-context.ts** (173 LOC) - Conversation recovery, invalid IDs, numbered lists, circular references, ambiguous pronouns
- **memory-stress.ts** (51 LOC) - Long conversations with 50+ messages
- **edge-case-tester.ts** (55 LOC) - HTTP testing utility class

### Index
- **index.ts** (16 LOC) - Exports all test functions and utilities

## Running Tests

```bash
# Run all edge case tests
npx tsx __tests__/agents/test-agent-edge-cases.test.ts

# Set custom API URL and domain
API_URL=http://localhost:3000/api/chat TEST_DOMAIN=example.com npx tsx __tests__/agents/test-agent-edge-cases.test.ts
```

## Test Coverage

**11 Edge Case Tests:**
1. Empty Message Handling
2. Very Long Message (10,000 chars)
3. Special Characters & XSS Prevention
4. Rapid Fire Messages (10 concurrent)
5. Multilingual Input (4 languages)
6. Conversation Recovery After Interruption
7. Invalid Conversation ID Handling
8. Numbered List Memory
9. Circular References
10. Ambiguous Pronoun Resolution
11. Memory Overflow (50+ messages)

## Success Criteria

- **Pass Rate Target:** 100%
- **Timeout:** 30 seconds per test
- **Concurrency:** ≥8/10 rapid fire messages successful
- **Multilingual:** ≥3/4 languages supported

## Architecture

This suite uses an orchestrator pattern where:
- **Orchestrator** (`test-agent-edge-cases.test.ts`) defines test scenarios and runs them
- **Test modules** export individual test functions
- **EdgeCaseTester** provides HTTP client functionality
- **All tests** are standalone and can be run independently

**Last Updated:** 2025-11-15
