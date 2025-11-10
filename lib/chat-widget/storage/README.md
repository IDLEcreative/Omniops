# Storage Module

**Last Updated:** 2025-11-08
**Status:** Active
**Related:** [../README.md](../README.md), [connection-monitor.ts](../connection-monitor.ts)

## Purpose

Modular storage system for reliable localStorage access across iframe boundaries with retry logic, caching, connection monitoring, and graceful degradation.

## Architecture

The storage system is decomposed into focused modules, each under 300 LOC:

### Module Breakdown

| Module | LOC | Purpose |
|--------|-----|---------|
| **parent-storage-enhanced.ts** | 218 | Main orchestrator, coordinates all components |
| **retry-handler.ts** | 127 | Retry logic with exponential backoff |
| **message-queue.ts** | 85 | Queues messages during disconnection, replays on reconnect |
| **local-storage.ts** | 77 | Safe wrappers for localStorage and sessionStorage |
| **cache-manager.ts** | 63 | In-memory cache with TTL support |
| **types.ts** | 45 | Type definitions and interfaces |
| **index.ts** | 18 | Centralized exports |

**Total:** 633 LOC (down from 482 LOC monolithic file)

### Component Responsibilities

```
EnhancedParentStorageAdapter (Main Orchestrator)
├── CacheManager: TTL-based in-memory caching
├── LocalStorageOperations: Direct localStorage access
├── FallbackStorageOperations: sessionStorage fallback
├── RetryHandler: Request retry with exponential backoff
└── MessageQueue: Offline message queueing and replay
```

## Usage

```typescript
import { enhancedParentStorage } from '@/lib/chat-widget/parent-storage-enhanced';
// or
import { EnhancedParentStorageAdapter } from '@/lib/chat-widget/parent-storage-enhanced';

// Using singleton instance
const value = await enhancedParentStorage.getItem('key');
enhancedParentStorage.setItem('key', 'value');
enhancedParentStorage.removeItem('key');

// Creating custom instance
const storage = new EnhancedParentStorageAdapter({
  maxAttempts: 5,
  initialDelay: 200,
  maxDelay: 3000,
}, true); // debug mode
```

## Public API (Preserved)

All exports from the original file are preserved:

- `EnhancedParentStorageAdapter` class
- `enhancedParentStorage` singleton instance
- `RetryConfig` type

**No breaking changes** - all existing imports continue to work.

## Performance Features

1. **Caching**: 5-second TTL reduces redundant requests
2. **Debouncing**: 300ms delay batches frequent setItem calls
3. **Request Timeout**: 5-second timeout prevents hanging
4. **Queue Limit**: Max 100 queued messages prevents memory bloat

## Reliability Features

1. **Retry Logic**: Up to 3 attempts with exponential backoff (100ms → 200ms → 400ms)
2. **Connection Monitoring**: Integrated with connection-monitor.ts
3. **Message Queueing**: Stores operations during disconnection
4. **Graceful Degradation**: Falls back to sessionStorage on failure
5. **Auto-Replay**: Replays queued messages on reconnection

## Refactoring Benefits

**Before:**
- 482 LOC monolithic file (violates 300 LOC limit)
- Mixed concerns (caching, retry, queue, storage all in one class)
- Hard to test individual components

**After:**
- 6 focused modules, each < 300 LOC
- Single Responsibility Principle enforced
- Each component independently testable
- Main orchestrator is clean and readable (218 LOC)

## Testing

See `__tests__/integration/cross-frame-reliability.test.ts` for comprehensive tests covering:
- Retry logic with backoff
- Connection state handling
- Message queue replay
- Cache behavior
- Fallback mechanisms

## Related Documentation

- [Connection Monitor](../connection-monitor.ts) - Heartbeat monitoring
- [Chat Widget Reliability](../../docs/08-INFRASTRUCTURE/RELIABILITY_IMPROVEMENTS.md) - Overall reliability architecture
