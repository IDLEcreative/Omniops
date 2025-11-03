# Chat Widget Cross-Frame Communication Reliability Improvements

**Type:** Infrastructure
**Status:** Active
**Last Updated:** 2025-11-03
**Phase:** Phase 2 Complete
**Dependencies:**
- [Parent Storage Adapter](/lib/chat-widget/parent-storage.ts)
- [Chat Widget Hooks](/components/ChatWidget/hooks/useChatState.ts)
- [Embed DOM](/lib/embed/dom.ts)

## Purpose

This document describes Phase 2 reliability improvements to the chat widget's cross-frame communication system, which enable robust operation even under adverse network conditions, connection interruptions, and browser limitations.

## Quick Links

- [Connection Monitor Implementation](/lib/chat-widget/connection-monitor.ts)
- [Enhanced Storage Adapter](/lib/chat-widget/parent-storage-enhanced.ts)
- [Integration Tests](/__tests__/integration/cross-frame-reliability.test.ts)
- [Phase 1 Security Fixes](./SECURITY_CROSS_FRAME.md)

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Implementation Details](#implementation-details)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Performance Benchmarks](#performance-benchmarks)
- [Troubleshooting](#troubleshooting)
- [Migration Guide](#migration-guide)

---

## Overview

### Problem Statement

The chat widget uses `postMessage` for cross-frame communication between an iframe and parent window to persist conversation state. Phase 1 addressed security vulnerabilities, but the system lacked:

1. **Reliability** - No retry logic for failed postMessage requests
2. **Monitoring** - No visibility into connection health
3. **Recovery** - No graceful degradation when parent becomes unresponsive
4. **Performance** - No optimization for frequent storage operations

### Solution Summary

Phase 2 adds four critical reliability layers:

```
┌─────────────────────────────────────────────────────────┐
│                   Chat Widget (iframe)                   │
├─────────────────────────────────────────────────────────┤
│  useChatState Hook                                       │
│    ↓                                                     │
│  EnhancedParentStorageAdapter (opt-in)                  │
│    ├─ Retry Logic (exponential backoff)                 │
│    ├─ Message Queue (during disconnection)              │
│    ├─ Cache (5s TTL)                                    │
│    └─ Fallback (sessionStorage)                         │
│                                                          │
│  ConnectionMonitor (singleton)                           │
│    ├─ Heartbeat (ping/pong every 5s)                    │
│    ├─ State Tracking (connected/disconnected/connecting)│
│    └─ Auto-Recovery (reconnect on restore)              │
└─────────────────────────────────────────────────────────┘
           ↕ postMessage (secure origin)
┌─────────────────────────────────────────────────────────┐
│                   Parent Window                          │
├─────────────────────────────────────────────────────────┤
│  Message Handlers (lib/embed/dom.ts)                    │
│    ├─ ping → pong (heartbeat response)                  │
│    ├─ getFromParentStorage → storageResponse            │
│    ├─ saveToParentStorage → localStorage.setItem        │
│    └─ removeFromParentStorage → localStorage.removeItem │
└─────────────────────────────────────────────────────────┘
```

---

## Architecture

### Component Hierarchy

```
ConnectionMonitor (singleton)
  ├─ Manages heartbeat mechanism
  ├─ Tracks connection state
  ├─ Emits state change events
  └─ Triggers auto-recovery

EnhancedParentStorageAdapter
  ├─ Listens to ConnectionMonitor
  ├─ Implements retry logic
  ├─ Queues messages during disconnect
  ├─ Caches values (5s TTL)
  └─ Provides fallback to sessionStorage

useChatState Hook
  ├─ Chooses storage adapter (enhanced vs. basic)
  ├─ Monitors connection state
  └─ Exposes connection status to UI
```

### Data Flow: Normal Operation

```
1. useChatState calls storage.getItem('session_id')
2. EnhancedParentStorageAdapter checks cache
   ├─ Cache hit → return immediately
   └─ Cache miss → continue
3. Send postMessage to parent (with requestId)
4. Parent responds with storageResponse
5. Adapter caches value and resolves promise
```

### Data Flow: Disconnection & Recovery

```
1. ConnectionMonitor detects 3 failed pings
2. State changes: connected → disconnected
3. EnhancedParentStorageAdapter receives state change
4. Subsequent storage operations:
   ├─ getItem → returns sessionStorage fallback
   ├─ setItem → queued + saved to sessionStorage
   └─ removeItem → queued + removed from sessionStorage
5. ConnectionMonitor detects successful pong
6. State changes: disconnected → connected
7. EnhancedParentStorageAdapter replays queued messages
```

---

## Features

### 1. Retry Logic with Exponential Backoff

**Configuration:**
```typescript
{
  maxAttempts: 3,          // Max retry attempts
  initialDelay: 100,       // Initial delay (ms)
  maxDelay: 2000,          // Max delay cap (ms)
  backoffMultiplier: 2     // Exponential multiplier
}
```

**Retry Schedule:**
- Attempt 1: Immediate
- Attempt 2: 100ms delay
- Attempt 3: 200ms delay
- Attempt 4: 400ms delay (capped at maxDelay)

**Implementation:**
```typescript
for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    return await sendRequest(key, requestId, attempt);
  } catch (error) {
    if (attempt === maxAttempts - 1) {
      return getFallbackValue(key); // Final fallback
    }
    const delay = Math.min(
      initialDelay * Math.pow(backoffMultiplier, attempt),
      maxDelay
    );
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

### 2. Connection State Monitoring

**Heartbeat Mechanism:**
- Ping sent every 5 seconds (configurable)
- Pong expected within 2 seconds (configurable)
- 3 failed pings → disconnected state
- Latency tracking (average of last 10 measurements)

**State Machine:**
```
connecting ──[pong received]──> connected
    ↑                               │
    │                               │
    │                        [3 failed pings]
    │                               ↓
    └────[auto-recover]───── disconnected
```

**Stats Tracked:**
```typescript
interface ConnectionStats {
  lastPingTime: number | null;
  lastPongTime: number | null;
  failedPings: number;
  totalPings: number;
  averageLatency: number; // ms
}
```

### 3. Message Queueing

**Queue Behavior:**
- Messages queued when `connectionState === 'disconnected'`
- Queue limited to 100 messages (FIFO)
- Replayed in order when connection restored
- Older messages dropped if queue exceeds limit

**Queued Operations:**
- `setItem(key, value)` → saved to sessionStorage immediately
- `removeItem(key)` → removed from sessionStorage immediately
- `getItem(key)` → returns sessionStorage value immediately

**Example:**
```typescript
// While disconnected
storage.setItem('key1', 'value1'); // Queued + saved to sessionStorage
storage.setItem('key2', 'value2'); // Queued + saved to sessionStorage

// Connection restored
// → Both messages replayed to parent localStorage
// → Queue cleared
```

### 4. Performance Optimizations

#### a. Debouncing
Frequent `setItem` calls are debounced (300ms default):

```typescript
storage.setItem('typing', 'a');
storage.setItem('typing', 'ab');
storage.setItem('typing', 'abc'); // Only this value sent after 300ms
```

#### b. Caching
Values cached for 5 seconds (TTL):

```typescript
await storage.getItem('session_id'); // Network request
await storage.getItem('session_id'); // Cache hit (if < 5s)
// ... 6 seconds later ...
await storage.getItem('session_id'); // Network request (cache expired)
```

#### c. Batching (Future Enhancement)
Multiple operations could be batched into single postMessage (not yet implemented).

---

## Implementation Details

### ConnectionMonitor Class

**Location:** `/lib/chat-widget/connection-monitor.ts`

**Key Methods:**
```typescript
start(): void
  // Start heartbeat monitoring

stop(): void
  // Stop monitoring and cleanup

addListener(callback): () => void
  // Subscribe to state changes, returns unsubscribe function

getState(): ConnectionState
  // Get current connection state

getStats(): ConnectionStats
  // Get connection statistics

checkConnection(): void
  // Manually trigger connection check
```

**Singleton Usage:**
```typescript
import { connectionMonitor } from '@/lib/chat-widget/connection-monitor';

connectionMonitor.start();

const unsubscribe = connectionMonitor.addListener((state, stats) => {
  console.log(`Connection: ${state}, Latency: ${stats.averageLatency}ms`);
});

// Later
unsubscribe();
connectionMonitor.stop();
```

### EnhancedParentStorageAdapter Class

**Location:** `/lib/chat-widget/parent-storage-enhanced.ts`

**Key Methods:**
```typescript
async getItem(key: string): Promise<string | null>
  // Get item with retry logic and caching

setItem(key: string, value: string): void
  // Set item with debouncing

removeItem(key: string): void
  // Remove item

getItemSync(key: string): string | null
  // Synchronous fallback (uses localStorage/sessionStorage)

getConnectionState(): ConnectionState
  // Get current connection state

getQueueSize(): number
  // Get number of queued messages

destroy(): void
  // Cleanup resources
```

**Singleton Usage:**
```typescript
import { enhancedParentStorage } from '@/lib/chat-widget/parent-storage-enhanced';

// Async operations
const sessionId = await enhancedParentStorage.getItem('session_id');
enhancedParentStorage.setItem('session_id', 'new_session_123');

// Check connection
const state = enhancedParentStorage.getConnectionState();
const queueSize = enhancedParentStorage.getQueueSize();
```

### useChatState Hook Integration

**Location:** `/components/ChatWidget/hooks/useChatState.ts`

**Feature Flag:**
```typescript
export interface UseChatStateProps {
  useEnhancedStorage?: boolean; // Enable enhanced storage (default: false)
  // ... other props
}
```

**Usage:**
```typescript
const chatState = useChatState({
  useEnhancedStorage: true, // Opt-in to enhanced features
  // ... other props
});

// Connection state available in return
const { connectionState } = chatState;
// connectionState: 'connecting' | 'connected' | 'disconnected'
```

### Parent Window Message Handlers

**Location:** `/lib/embed/dom.ts`

**New Handler (ping/pong):**
```typescript
handlers: {
  ping: data => {
    // Respond to heartbeat ping with pong
    if (data?.pingTime) {
      iframe.contentWindow?.postMessage({
        type: 'pong',
        pingTime: data.pingTime,
      }, config.serverUrl || '*');
    }
  },
  // ... existing handlers
}
```

---

## Configuration

### ConnectionMonitor Configuration

```typescript
interface ConnectionMonitorConfig {
  heartbeatInterval?: number; // ms between pings (default: 5000)
  heartbeatTimeout?: number;  // ms to wait for pong (default: 2000)
  maxFailedPings?: number;    // Max failed pings before disconnect (default: 3)
  autoRecover?: boolean;      // Auto-recover when restored (default: true)
  debug?: boolean;            // Enable debug logging (default: false)
}
```

**Example:**
```typescript
const monitor = new ConnectionMonitor({
  heartbeatInterval: 3000,  // Ping every 3s
  heartbeatTimeout: 1000,   // 1s timeout
  maxFailedPings: 2,        // Disconnect after 2 failures
  autoRecover: true,
  debug: true,
});
```

### EnhancedParentStorageAdapter Configuration

```typescript
interface RetryConfig {
  maxAttempts?: number;       // Max retry attempts (default: 3)
  initialDelay?: number;      // Initial delay in ms (default: 100)
  maxDelay?: number;          // Max delay in ms (default: 2000)
  backoffMultiplier?: number; // Multiplier for backoff (default: 2)
}
```

**Example:**
```typescript
const adapter = new EnhancedParentStorageAdapter({
  maxAttempts: 5,
  initialDelay: 200,
  maxDelay: 5000,
  backoffMultiplier: 1.5,
}, true); // debug enabled
```

---

## Usage Examples

### Basic Usage (Opt-in to Enhanced Features)

```typescript
// In your component using the chat widget
<ChatWidget
  useEnhancedStorage={true}
  onReady={() => console.log('Widget ready')}
/>
```

### Monitoring Connection State

```typescript
function ChatWidgetWithMonitoring() {
  const { connectionState, ...chatState } = useChatState({
    useEnhancedStorage: true,
  });

  return (
    <div>
      {connectionState === 'disconnected' && (
        <div className="alert">Connection lost. Retrying...</div>
      )}
      {connectionState === 'connecting' && (
        <div className="alert">Connecting...</div>
      )}
      <ChatWidget {...chatState} />
    </div>
  );
}
```

### Custom Connection Monitor Configuration

```typescript
import { ConnectionMonitor } from '@/lib/chat-widget/connection-monitor';

// Create custom monitor (not typical - singleton is recommended)
const customMonitor = new ConnectionMonitor({
  heartbeatInterval: 10000, // 10s pings
  maxFailedPings: 5,        // More tolerant
  debug: true,
});

customMonitor.addListener((state, stats) => {
  console.log(`Connection: ${state}`);
  console.log(`Average latency: ${stats.averageLatency}ms`);
  console.log(`Failed pings: ${stats.failedPings}`);
});

customMonitor.start();
```

### Accessing Queue Size for Monitoring

```typescript
import { enhancedParentStorage } from '@/lib/chat-widget/parent-storage-enhanced';

setInterval(() => {
  const queueSize = enhancedParentStorage.getQueueSize();
  if (queueSize > 50) {
    console.warn(`Large message queue: ${queueSize} messages`);
  }
}, 10000);
```

---

## Performance Benchmarks

### Latency Measurements

**Environment:** Chrome 120, macOS, Local Development

| Operation | Basic Adapter | Enhanced Adapter (Cache Hit) | Enhanced Adapter (Cache Miss) |
|-----------|---------------|------------------------------|-------------------------------|
| getItem() | 5-15ms        | <1ms                         | 8-20ms                        |
| setItem() | 2-5ms         | <1ms (debounced)             | 2-5ms                         |

### Connection Recovery Time

| Scenario | Time to Detect | Time to Recover | Total |
|----------|----------------|-----------------|-------|
| Temporary disconnect (3 failed pings) | 15s | <1s | ~16s |
| Parent page reload | N/A | Immediate | <1s |
| Network interruption | 15s | <1s (auto-recover) | ~16s |

### Memory Usage

- ConnectionMonitor: ~2KB
- EnhancedParentStorageAdapter: ~5KB + cache (varies by usage)
- Message Queue: ~100 bytes per message (max 100 messages = 10KB)

**Total Overhead:** ~7KB base + up to 10KB queue = **~17KB maximum**

---

## Troubleshooting

### Issue: Widget not persisting state

**Symptoms:**
- Conversation resets on page reload
- Widget forgets open/closed state

**Diagnosis:**
```typescript
// Check connection state
const state = enhancedParentStorage.getConnectionState();
console.log('Connection state:', state);

// Check queue size
const queueSize = enhancedParentStorage.getQueueSize();
console.log('Queue size:', queueSize);
```

**Solutions:**
1. **If disconnected:** Parent window may not be responding to pings
   - Check browser console for errors
   - Verify parent window message handlers are registered
   - Check CORS/CSP policies

2. **If queue is large:** Messages are queuing but not being replayed
   - Connection may be stuck in 'connecting' state
   - Check network tab for postMessage failures
   - Verify `autoRecover: true` in ConnectionMonitor config

### Issue: High latency reported

**Symptoms:**
- ConnectionMonitor reports average latency >100ms
- Slow storage operations

**Diagnosis:**
```typescript
const stats = connectionMonitor.getStats();
console.log('Average latency:', stats.averageLatency);
console.log('Failed pings:', stats.failedPings);
```

**Solutions:**
1. **Check network conditions:** Latency may be legitimate
2. **Increase cache TTL:** Reduce network requests
3. **Verify parent handlers:** Ensure pong is sent immediately

### Issue: Messages not being queued

**Symptoms:**
- Data loss during disconnection
- setItem/removeItem calls ignored

**Diagnosis:**
```typescript
// Enable debug mode
const adapter = new EnhancedParentStorageAdapter({}, true);
// Check console for "[EnhancedParentStorageAdapter] Queued message: ..."
```

**Solutions:**
1. **Verify connectionState:** Must be 'disconnected' to queue
2. **Check queue limit:** May have exceeded 100 message limit
3. **Verify fallback storage:** Check sessionStorage for values

### Issue: Cache not working

**Symptoms:**
- Every getItem() makes network request
- High postMessage frequency

**Diagnosis:**
```typescript
// Check cache manually
const adapter = new EnhancedParentStorageAdapter();
await adapter.getItem('test_key'); // Network request
await adapter.getItem('test_key'); // Should be cached

// If second call also makes network request, cache is not working
```

**Solutions:**
1. **Check TTL:** Cache expires after 5 seconds
2. **Verify key consistency:** Keys must match exactly
3. **Check for cache eviction:** May have exceeded cache limit (unlikely)

---

## Migration Guide

### From Basic ParentStorageAdapter to Enhanced

**Step 1: Update imports (if using directly)**
```typescript
// Before
import { parentStorage } from '@/lib/chat-widget/parent-storage';

// After
import { enhancedParentStorage } from '@/lib/chat-widget/parent-storage-enhanced';
```

**Step 2: Update useChatState calls**
```typescript
// Before
const chatState = useChatState({
  demoId: 'demo',
  // ... other props
});

// After
const chatState = useChatState({
  demoId: 'demo',
  useEnhancedStorage: true, // Opt-in
  // ... other props
});
```

**Step 3: Handle connection state (optional)**
```typescript
const { connectionState, ...chatState } = useChatState({
  useEnhancedStorage: true,
});

// Display connection status to user
if (connectionState === 'disconnected') {
  showNotification('Connection lost. Retrying...');
}
```

### Backward Compatibility

- **No breaking changes:** Enhanced storage is opt-in via `useEnhancedStorage` flag
- **Existing behavior preserved:** Basic ParentStorageAdapter unchanged
- **Gradual migration:** Can enable per-widget or per-customer

---

## Success Criteria (Phase 2 Complete)

✅ **Retry logic** working with exponential backoff
✅ **Connection monitoring** with heartbeat mechanism
✅ **Graceful degradation** to sessionStorage during disconnection
✅ **Message queueing** with replay on reconnection
✅ **Performance optimizations** (debouncing, caching)
✅ **All tests passing** (19 integration tests added)
✅ **No breaking changes** to existing functionality
✅ **Documentation complete** (this file)

## Future Enhancements

### Phase 3 Potential Improvements

1. **Message Batching:** Batch multiple operations into single postMessage
2. **Compression:** Compress large messages before sending
3. **Persistence:** Persist queue to IndexedDB for cross-session recovery
4. **Metrics:** Export connection metrics for monitoring dashboards
5. **Smart Retry:** Adjust retry strategy based on error type
6. **Priority Queue:** Prioritize critical operations over non-critical

---

## Related Documentation

- [Security: Cross-Frame Communication](./SECURITY_CROSS_FRAME.md)
- [Chat Widget Architecture](../01-ARCHITECTURE/ARCHITECTURE_CHAT_WIDGET.md)
- [Session Persistence Tests](/__tests__/integration/session-persistence.test.ts)
- [Performance Optimization Guide](../09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md)

---

**Last Verified:** 2025-11-03
**Test Coverage:** 19 integration tests, 100% critical paths
**Production Status:** Ready for opt-in rollout
