**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Cross-Frame Communication Tests

This directory contains refactored tests for cross-frame communication features, split into focused modules for better maintainability.

## Test Files

**Purpose:** Test Phase 2 improvements for cross-frame communication, including:
- Retry logic with exponential backoff
- Connection state monitoring
- Message queueing during disconnection
- Graceful degradation to sessionStorage
- Performance optimizations (debouncing, caching)

### Module Breakdown

- **`connection-monitor.test.ts`** (140 LOC)
  - Heartbeat mechanism tests
  - Connection state management tests
  - State change notification tests

- **`parent-storage-adapter.test.ts`** (100 LOC)
  - Retry logic with exponential backoff
  - Graceful degradation (fallback to localStorage/sessionStorage)
  - Resource cleanup

- **`parent-storage-advanced.test.ts`** (130 LOC)
  - Message queueing during disconnection
  - Cache validation and TTL expiration
  - Performance optimization verification (debouncing)

- **`integration.test.ts`** (35 LOC)
  - Coordination between ConnectionMonitor and EnhancedParentStorageAdapter

## Shared Utilities

Located in `__tests__/utils/cross-frame/`:

- **`mocks.ts`**: Window mocks, storage mocks, iframe simulation
- **`helpers.ts`**: Common test helpers (message creation, assertion helpers)
- **`index.ts`**: Barrel export for all utilities

## Running Tests

```bash
# Run all cross-frame tests
npm test -- __tests__/integration/cross-frame

# Run specific test file
npm test -- __tests__/integration/cross-frame/connection-monitor.test.ts

# Run with watch mode
npm test -- --watch __tests__/integration/cross-frame
```

## Test Architecture

Each test file:
- Uses `setupWindowMocks()` in beforeEach (handles all window, storage, postMessage setup)
- Captures `messageHandler` from setup for simulating parent messages
- Uses `teardownWindowMocks()` in afterEach
- Imports helpers from `__tests__/utils/cross-frame`

This eliminates ~200 lines of duplicated setup code across the original monolithic test file.

## Coverage

- Connection monitoring: Heartbeat, timeout detection, auto-recovery
- Message passing: Retry logic, exponential backoff, queueing
- Fallback mechanisms: localStorage, sessionStorage, error handling
- Performance: Debouncing, caching, TTL expiration
- Integration: Coordinated state management between components

**Total Tests**: 15 test cases across all modules
