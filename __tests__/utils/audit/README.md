**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Audit Test Utilities

**Status:** Active
**Last Updated:** 2025-11-10

## Purpose

Provides shared utilities, mocks, and test data for audit logger test suite.

## Modules

### mock-supabase.ts
Mock Supabase client for testing database operations

**Exports:**
- `createMockQuery()` - Creates a chainable mock query builder with all standard Supabase methods
- `createMockSupabaseClient()` - Creates a mock client with `from()` method
- `MockSupabaseClient` - TypeScript type for mock client

**Usage:**
```typescript
import { createMockSupabaseClient } from '@/__tests__/utils/audit/mock-supabase';

const mockClient = createMockSupabaseClient();
const logger = new AuditLogger(mockClient as any);
```

### test-data.ts
Reusable test fixtures and builders

**Fixtures:**
- `validStepData` - Standard successful step data
- `failedStepData` - Standard failed step data
- `stepWithScreenshot` - Step including screenshot URL
- `stepWithAI` - Step including AI response

**Builders:**
- `createMockLogResponse(stepData, id?)` - Creates mock single log response
- `createMockMultipleLogsResponse()` - Creates mock multi-step response with 3 logs

**Usage:**
```typescript
import { validStepData, createMockLogResponse } from '@/__tests__/utils/audit/test-data';

// Use fixture directly
await auditLogger.logStep(validStepData);

// Use builder for mock response
const response = createMockLogResponse(validStepData, 'custom-id');
mockSupabaseClient.from.mockReturnValue({
  insert: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue(response)
});
```

## Benefits

- **DRY Principle:** Shared data eliminates duplication across test modules
- **Maintainability:** Changes to mock structure propagate to all tests
- **Consistency:** All tests use identical fixtures and builders
- **Type Safety:** Full TypeScript support for all utilities

## Related Files

- Test modules: `__tests__/lib/autonomous/security/audit-logger/`
- AuditLogger source: `lib/autonomous/security/audit-logger.ts`
- Type definitions: `lib/autonomous/security/audit-logger-types.ts`
