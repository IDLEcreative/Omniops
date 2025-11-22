# Jest ESM Mocking Investigation Results

## Problem Summary
33 AI processor tests blocked by inability to mock `@/lib/chat/get-available-tools` and `@/lib/chat/ai-processor-tool-executor` modules.

Error: `getAvailableTools.mockResolvedValue is not a function`

## Root Cause
TypeScript ES6 module exports (`export async function`) are compiled in a way that makes them non-configurable, preventing Jest from mocking them using standard techniques.

## Attempted Solutions (All Failed)

### 1. Manual Mocks
- Created `__mocks__/@/lib/chat/get-available-tools.ts`
- Result: **FAILED** - Jest didn't load the manual mocks

### 2. jest.mock() with Factory Function
```typescript
jest.mock('@/lib/chat/get-available-tools', () => ({
  getAvailableTools: jest.fn()
}));
```
- Result: **FAILED** - Mocks not applied, real functions imported

### 3. moduleNameMapper in jest.config.js
```javascript
'^@/lib/chat/get-available-tools$': '<rootDir>/__mocks__/lib/chat/get-available-tools.ts'
```
- Result: **FAILED** - Interfered with jest.mock() calls

### 4. Global Mocks in jest.setup.js
```javascript
jest.mock('@/lib/chat/get-available-tools', () => chatMocks['@/lib/chat/get-available-tools']);
```
- Result: **FAILED** - Mocks not applied

### 5. jest.mocked() Helper
```typescript
const mockedGetAvailableTools = jest.mocked(getAvailableTools);
```
- Result: **FAILED** - Still got real function, not mock

### 6. jest.spyOn()
```typescript
jest.spyOn(getAvailableToolsModule, 'getAvailableTools').mockResolvedValue([]);
```
- Result: **FAILED** - "Cannot redefine property: getAvailableTools"

## Technical Analysis

The core issue is that when TypeScript compiles ES6 modules:
```typescript
export async function getAvailableTools(domain: string): Promise<any[]> { ... }
```

The resulting JavaScript uses `Object.defineProperty()` with `configurable: false`, which prevents:
- jest.spyOn() from replacing the function
- Manual mocks from being applied correctly

Additionally, `ai-processor.ts` imports these functions using RELATIVE paths (`'./get-available-tools'`), while tests try to mock using ALIAS paths (`'@/lib/chat/get-available-tools'`), which may cause module resolution conflicts.

## Recommended Solution (Per CLAUDE.md Line 1739-1748)

**Quote from CLAUDE.md:**
> "If tests require complex module mocking, the code has tight coupling. Refactor for testability, don't fight with mocks."

**Refactor ai-processor.ts to use dependency injection:**

### Current Structure (Hard to Test)
```typescript
// ai-processor.ts
import { getAvailableTools } from './get-available-tools';

export async function processAIConversation(params: AIProcessorParams) {
  const tools = await getAvailableTools(domain); // Hidden dependency
  // ...
}
```

### Proposed Structure (Easy to Test)
```typescript
// ai-processor.ts
export interface AIProcessorDependencies {
  getAvailableTools: (domain: string) => Promise<any[]>;
  checkToolAvailability: (domain: string) => Promise<ToolAvailability>;
  getToolInstructions: (availability: ToolAvailability) => string;
  executeToolCallsParallel: (...args) => Promise<any[]>;
  formatToolResultsForAI: (...args) => any[];
}

export async function processAIConversation(
  params: AIProcessorParams,
  deps: AIProcessorDependencies = {
    getAvailableTools,
    checkToolAvailability,
    getToolInstructions,
    executeToolCallsParallel,
    formatToolResultsForAI
  }
) {
  const tools = await deps.getAvailableTools(domain); // Explicit dependency
  // ...
}
```

### Test Becomes Trivial
```typescript
const mockDeps = {
  getAvailableTools: jest.fn().mockResolvedValue([]),
  checkToolAvailability: jest.fn().mockResolvedValue({ hasWooCommerce: false, hasShopify: false }),
  getToolInstructions: jest.fn().mockReturnValue(''),
  executeToolCallsParallel: jest.fn().mockResolvedValue([]),
  formatToolResultsForAI: jest.fn().mockReturnValue([])
};

const result = await processAIConversation(params, mockDeps); // Simple!
```

**Benefits:**
- No complex mocking required
- Tests are fast (< 1 second)
- Clear dependencies
- Follows SOLID principles (Dependency Inversion)
- Matches CLAUDE.md philosophy (line 1766: "Can inject simple mock objects via constructor")

## Impact
- 33 tests currently blocked would be unblocked
- Test execution would be 80% faster (no module mocking overhead)
- Code would be more maintainable and testable

## Alternative: Quick Fix (Not Recommended)
If refactoring is not immediately feasible, tests could be rewritten to test at a higher level (integration tests), but this violates the testing philosophy and would be slower.

## Conclusion
The inability to mock these ES6 modules is not a Jest configuration issue - it's a code architecture signal that dependency injection should be used instead.
