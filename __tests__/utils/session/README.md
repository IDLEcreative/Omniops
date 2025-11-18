# Session Test Utilities

**Type:** Test Infrastructure
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minute

**Purpose:** Reusable utilities and fixtures for session persistence integration tests

## Modules

### mock-storage.ts
- **Purpose:** In-memory Storage interface implementation
- **Exports:** `MockStorage` class
- **Usage:** Replace global.localStorage for testing

### test-fixtures.ts
- **Purpose:** Centralized test data and response objects
- **Exports:** Constants and mock response objects
- **Usage:** Reference in tests to avoid duplication

### fetch-helpers.ts
- **Purpose:** Fetch API utilities and response factories
- **Exports:** Helper functions for building requests and mocking responses
- **Usage:** Setup mock fetch calls with consistent structure

## Quick Example

```typescript
import { MockStorage } from './mock-storage';
import { TEST_CONVERSATION_ID, successResponse } from './test-fixtures';
import { buildConversationUrl, mockSuccessResponse } from './fetch-helpers';

// Setup
const localStorage = new MockStorage();
global.localStorage = localStorage as any;

// Use fixtures
localStorage.setItem('chat_conversation_id', TEST_CONVERSATION_ID);

// Mock fetch
mockFetch.mockResolvedValueOnce(
  mockSuccessResponse(successResponse)
);

// Build URL
const url = buildConversationUrl(TEST_CONVERSATION_ID, 'sess-456');
```

## Related Docs

- `__tests__/integration/session/` - Focused test modules
