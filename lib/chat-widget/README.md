**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active (Phase 3)
**Type:** Reference

# Chat Widget Library

**Purpose:** Core client-side libraries for advanced chat widget features including multi-tab synchronization and performance optimization for large conversations.

**Last Updated:** 2025-11-03
**Status:** Active (Phase 3)
**Related:** [Phase 3 Documentation](../../docs/PHASE3_ENHANCEMENTS.md)

## Overview

This directory contains Phase 3 enhancements that provide:
- Real-time multi-tab synchronization via BroadcastChannel
- Performance optimization for 500+ message conversations
- Memory management and virtual scrolling
- DOM batching and lazy loading utilities

## Files

### tab-sync.ts

**Multi-tab synchronization manager** using BroadcastChannel API with localStorage fallback.

**Key Features:**
- Real-time message synchronization across browser tabs
- Typing indicator coordination
- Tab focus/visibility management
- Graceful fallback for older browsers
- <50ms sync latency

**Usage:**
```typescript
import { getTabSyncManager } from '@/lib/chat-widget/tab-sync';

const tabSync = getTabSyncManager();

// Subscribe to messages
const unsubscribe = tabSync.subscribe((message) => {
  console.log('Received sync message:', message.type);
});

// Send message to other tabs
tabSync.send('NEW_MESSAGE', {
  conversation_id: 'conv-123',
  message: { ... }
});

// Cleanup
unsubscribe();
tabSync.destroy();
```

**Message Types:**
- `NEW_MESSAGE` - New chat message
- `CONVERSATION_STATE_UPDATE` - State changed
- `TYPING_INDICATOR` - Typing status
- `TAB_FOCUS_CHANGE` - Focus changed
- `TAB_CLOSE` - Tab closing

**Browser Support:**
- BroadcastChannel: Chrome 54+, Firefox 38+, Edge 79+
- localStorage fallback: All browsers

### performance-optimizer.ts

**Performance optimization toolkit** for handling large conversations efficiently.

**Components:**

1. **VirtualScrollManager** - Virtual scrolling for smooth 60fps
2. **MessagePaginator** - On-demand message loading
3. **MemoryManager** - LRU cache with automatic cleanup
4. **DOMBatchManager** - Batched DOM updates
5. **PerformanceMonitor** - Metrics tracking

**Usage:**
```typescript
import { PerformanceOptimizer } from '@/lib/chat-widget/performance-optimizer';

const optimizer = new PerformanceOptimizer({
  virtualScrolling: { enabled: true, threshold: 100 },
  pagination: { enabled: true, pageSize: 50 },
  memoryManagement: { maxMessagesInMemory: 500 },
});

// Get recommendations
const recommendations = optimizer.getRecommendations(messageCount);

// Use virtual scrolling
if (recommendations.useVirtualScroll) {
  const range = optimizer.virtualScroll.calculateVisibleRange(
    scrollTop,
    containerHeight,
    totalMessages
  );
}

// Monitor performance
optimizer.monitor.recordRenderTime(12);
optimizer.monitor.recordScrollPerformance(60);
const report = optimizer.monitor.getReport();
```

**Performance Targets:**
- Render time: <16ms (60fps)
- Scroll FPS: >55fps
- Memory: <50MB for 500 messages
- Initial load: <2 seconds

## Integration Example

```typescript
import { getTabSyncManager } from '@/lib/chat-widget/tab-sync';
import { PerformanceOptimizer } from '@/lib/chat-widget/performance-optimizer';

// Component setup
useEffect(() => {
  // Initialize tab sync
  const tabSync = getTabSyncManager();

  const unsubscribe = tabSync.subscribe((message) => {
    if (message.type === 'NEW_MESSAGE') {
      handleNewMessage(message.payload);
    }
  });

  // Initialize performance optimization
  const optimizer = new PerformanceOptimizer();

  return () => {
    unsubscribe();
    tabSync.destroy();
    optimizer.destroy();
  };
}, []);

// Send messages to other tabs
const sendMessage = (content: string) => {
  const message = createMessage(content);

  // Update local state
  setMessages(prev => [...prev, message]);

  // Sync to other tabs
  tabSync.send('NEW_MESSAGE', {
    conversation_id: conversationId,
    message,
  });
};

// Handle large message lists
const displayedMessages = useMemo(() => {
  const optimizer = new PerformanceOptimizer();

  if (messages.length > 100) {
    // Use virtual scrolling
    const range = optimizer.virtualScroll.calculateVisibleRange(
      scrollTop,
      containerHeight,
      messages.length
    );
    return messages.slice(range.start, range.end);
  }

  return messages;
}, [messages, scrollTop, containerHeight]);
```

## Testing

**Unit Tests:** `__tests__/integration/phase3-enhancements.test.ts`
**E2E Tests:** `__tests__/e2e/multi-tab-sync.test.ts`

Run tests:
```bash
npm test phase3-enhancements
npm run test:e2e multi-tab-sync
```

## Performance Benchmarks

| Scenario | Messages | Load Time | Memory | FPS |
|----------|----------|-----------|--------|-----|
| Small | 10-50 | ~200ms | ~5MB | 60fps |
| Medium | 50-200 | ~800ms | ~15MB | 60fps |
| Large | 200-500 | ~1.8s | ~35MB | 60fps |
| Extra Large | 500+ | <2s | <50MB | 60fps |

## Configuration

```typescript
export const DEFAULT_PERFORMANCE_CONFIG = {
  virtualScrolling: {
    enabled: true,
    itemHeight: 80,
    overscan: 5,
    threshold: 100,
  },
  pagination: {
    enabled: true,
    pageSize: 50,
    initialLoad: 30,
    threshold: 50,
  },
  memoryManagement: {
    enabled: true,
    maxMessagesInMemory: 500,
    cleanupThreshold: 600,
  },
  batching: {
    enabled: true,
    batchSize: 10,
    debounceMs: 100,
  },
};
```

## Troubleshooting

### Tab Sync Not Working

**Check BroadcastChannel support:**
```typescript
console.log('Supported:', typeof BroadcastChannel !== 'undefined');
```

**Verify localStorage fallback:**
```typescript
const data = localStorage.getItem('omniops-tab-sync-messages');
console.log('Fallback data:', data);
```

### Performance Issues

**Check if optimizations are enabled:**
```typescript
const optimizer = new PerformanceOptimizer();
const recommendations = optimizer.getRecommendations(messageCount);
console.log('Recommendations:', recommendations);
```

**Monitor performance:**
```typescript
optimizer.monitor.recordRenderTime(renderTime);
const targets = optimizer.monitor.meetsTargets();
console.log('Targets met:', targets);
```

## Related Documentation

- [Phase 3 Enhancements](../../docs/PHASE3_ENHANCEMENTS.md) - Complete implementation guide
- [Performance Optimization](../../docs/09-REFERENCE/REFERENCE_PERFORMANCE_OPTIMIZATION.md) - General performance guide
- [Type Definitions](../../types/analytics.ts) - TypeScript types

## Future Enhancements

- WebWorker for background processing
- IndexedDB for large message storage
- Streaming message rendering
- Advanced compression algorithms
