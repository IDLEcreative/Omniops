**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Infrastructure

# WebSocket Real-time Updates System

**Type:** Reference
**Status:** Deprecated
**Last Updated:** 2025-11-07
**Verified For:** v0.1.0
**Dependencies:** [/home/user/Omniops/ARCHIVE/deprecated-websocket-2025-11/README.md](/home/user/Omniops/ARCHIVE/deprecated-websocket-2025-11/README.md)
**Estimated Read Time:** 11 minutes

## Purpose

Provides WebSocket-based real-time communication for analytics dashboards and other real-time features. Uses Socket.IO for reliable WebSocket connections with automatic reconnection, room-based multi-tenant isolation, and event-driven architecture.

## Quick Links

- [Server Implementation](./server.ts)
- [Analytics Events](../analytics/events.ts)
- [Client Hook](../../hooks/use-realtime-analytics.ts)
- [Integration Tests](../../__tests__/integration/websocket-server.test.ts)

## Architecture

### Components

1. **WebSocket Server** (`server.ts`)
   - Socket.IO server initialization
   - Room-based multi-tenant isolation
   - Connection lifecycle management
   - Event emission infrastructure

2. **Analytics Events** (`../analytics/events.ts`)
   - High-level event emitters
   - Message, sentiment, and metrics events
   - Batch event processing

3. **Client Hook** (`../../hooks/use-realtime-analytics.ts`)
   - React hook for WebSocket connections
   - Automatic reconnection handling
   - Event subscription management

4. **Custom Next.js Server** (`../../server.ts`)
   - Integrates WebSocket with Next.js
   - HTTP + WebSocket on single port
   - Graceful shutdown handling

## Usage

### Starting the Server

```bash
# Development with WebSocket support
npm run dev:ws

# Production with WebSocket support
npm run start:ws
```

### Client-Side Integration

```tsx
import { useRealtimeAnalytics } from '@/hooks/use-realtime-analytics';

function AnalyticsDashboard() {
  const { isConnected, latestUpdate } = useRealtimeAnalytics({
    organizationId: 'org-123',
    enabled: true,
  });

  useEffect(() => {
    if (latestUpdate?.type === 'message') {
      // Refresh analytics when new message arrives
      refreshAnalytics();
    }
  }, [latestUpdate]);

  return (
    <div>
      <span>{isConnected ? 'Live' : 'Offline'}</span>
      {/* Dashboard content */}
    </div>
  );
}
```

### Server-Side Event Emission

```typescript
import { emitMessageEvent } from '@/lib/analytics/events';

// In your API route (e.g., app/api/chat/route.ts)
await emitMessageEvent(organizationId, {
  conversationId: 'conv-123',
  messageId: 'msg-456',
  role: 'assistant',
  content: 'AI response',
  responseTime: 1.2,
  timestamp: new Date(),
});
```

## Event Types

### Message Events

```typescript
emitMessageEvent(organizationId, {
  conversationId: string;
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  responseTime?: number;
  timestamp: Date;
});
```

**Triggers:** New chat messages created
**Dashboard Impact:** Updates message count, response time metrics

### Sentiment Events

```typescript
emitSentimentEvent(organizationId, {
  conversationId: string;
  messageId: string;
  score: number;
  confidence?: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  timestamp: Date;
});
```

**Triggers:** Sentiment analysis completion
**Dashboard Impact:** Updates sentiment charts, satisfaction scores

### Metrics Events

```typescript
emitMetricsEvent(organizationId, {
  totalMessages?: number;
  avgResponseTime?: number;
  satisfactionScore?: number;
  resolutionRate?: number;
  timestamp: Date;
});
```

**Triggers:** Periodic metric recalculation
**Dashboard Impact:** Updates all metric cards

## Multi-Tenant Isolation

### Room Architecture

- Each organization has a dedicated room: `org:{organizationId}`
- Clients join their organization's room on connection
- Events are only sent to clients in the target room
- No cross-organization data leakage

### Security Verification

```typescript
// Test: Multi-tenant isolation
it('should isolate events between organizations', async () => {
  const org1Client = connectToOrg('org-1');
  const org2Client = connectToOrg('org-2');

  emitMessageEvent('org-1', messageData);

  // org-1 receives event, org-2 does not
  expect(org1Received).toBe(true);
  expect(org2Received).toBe(false);
});
```

**Test Coverage:** 7/7 tests passing (100%)

## Connection Management

### Client Lifecycle

1. **Connect** - Client establishes WebSocket connection
2. **Join Room** - Client emits `join:analytics` with organization ID
3. **Receive Events** - Server pushes events to room
4. **Heartbeat** - Client sends `ping` every 30s, server responds with `pong`
5. **Disconnect** - Client leaves room and closes connection

### Reconnection Logic

- Automatic reconnection on disconnect
- Exponential backoff (1s → 5s max delay)
- Maximum 10 reconnection attempts
- Re-join organization room after reconnect

### Connection States

| State | Indicator | Description |
|-------|-----------|-------------|
| Connected | Green pulsing dot | WebSocket connected, receiving events |
| Reconnecting | "Reconnecting..." | Connection lost, attempting to reconnect |
| Offline | Red dot | Max reconnection attempts reached |

## Performance Characteristics

### Latency

- **Event Emission:** <10ms from API route to dashboard
- **Dashboard Update:** <50ms from event receipt to UI render
- **Ping/Pong RTT:** ~5-20ms typical

### Scalability

- **Max Connections:** Limited by server resources (tested up to 100)
- **Events/Second:** 100+ per organization (tested)
- **Memory Overhead:** ~2KB per connection
- **CPU Impact:** Minimal (<1% per 100 connections)

### Optimization Features

- **Room-based broadcasting** - Only send to subscribed clients
- **Event batching** - Batch multiple events (via `emitBatchEvents`)
- **Lazy emission** - Skip emission if no clients in room
- **Max payload size** - 1MB limit prevents memory issues

## Configuration

### Environment Variables

```bash
# WebSocket server URL (defaults to current origin)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Server port (defaults to 3000)
PORT=3000

# Node environment
NODE_ENV=production
```

### Socket.IO Options

```typescript
// In lib/websocket/server.ts
const io = new SocketIOServer(server, {
  cors: { origin: process.env.NEXT_PUBLIC_APP_URL || '*' },
  path: '/api/socket',
  pingTimeout: 60000,        // 60s before disconnect
  pingInterval: 25000,       // 25s between pings
  maxHttpBufferSize: 1e6,    // 1MB max payload
});
```

## Troubleshooting

### Connection Fails

**Symptom:** "Offline" indicator, no events received

**Causes:**
1. WebSocket server not running (use `npm run dev:ws` not `npm run dev`)
2. CORS issues - check `NEXT_PUBLIC_APP_URL` matches client origin
3. Firewall blocking WebSocket connections

**Solution:**
```bash
# Check server is running with WebSocket support
npm run dev:ws

# Check browser console for connection errors
# Should see: [WebSocket] Connected: <socket-id>
```

### Events Not Received

**Symptom:** Connected but dashboard doesn't update

**Causes:**
1. Not joined to organization room
2. Wrong organization ID
3. Event emission failing server-side

**Solution:**
```typescript
// Check console logs
// Client should log: [WebSocket] Joined analytics room: org-{id}
// Server should log: [WebSocket] Emitted {type} update to N clients

// Verify organization ID matches
console.log('Org ID:', organizationId);
```

### Reconnection Loops

**Symptom:** Constant reconnection attempts, never stays connected

**Causes:**
1. Server closing connections immediately
2. Authentication/authorization issues
3. Socket.IO version mismatch

**Solution:**
```bash
# Check socket.io versions match
npm ls socket.io socket.io-client

# Should both be ^4.8.0
```

## Testing

### Running Tests

```bash
# Run WebSocket integration tests
npm test -- __tests__/integration/websocket-server.test.ts

# Expected: 7/7 tests passing
```

### Test Coverage

- ✅ Server initialization
- ✅ Client connection
- ✅ Room joining
- ✅ Event emission
- ✅ Connection statistics
- ✅ Heartbeat/ping-pong
- ✅ Multi-tenant isolation

### Manual Testing

```bash
# 1. Start server with WebSocket
npm run dev:ws

# 2. Open analytics dashboard
open http://localhost:3000/dashboard/analytics

# 3. Verify "Live" indicator (green pulsing dot)

# 4. Send test message via chat widget
# Dashboard should auto-update within 1 second

# 5. Check browser console
# Should see: [WebSocket] Real-time update received: message
```

## Migration Notes

### From Polling to WebSocket

**Before (Polling):**
```typescript
// Refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(refresh, 30000);
  return () => clearInterval(interval);
}, []);
```

**After (WebSocket):**
```typescript
// Refresh on real-time events
const { latestUpdate } = useRealtimeAnalytics({ organizationId });

useEffect(() => {
  if (latestUpdate) refresh();
}, [latestUpdate]);
```

**Benefits:**
- ⚡ 30-60 second latency → <1 second latency
- 📉 2 requests/minute/client → 0 requests (push-based)
- 💰 Reduced database load (no polling queries)
- 🔋 Reduced client CPU (no interval timers)

## Future Enhancements

### Planned Features

1. **Event Filtering** - Subscribe to specific event types only
2. **Event Replay** - Request missed events after reconnection
3. **Compression** - Gzip large payloads
4. **Rate Limiting** - Prevent event flood
5. **Metrics Dashboard** - WebSocket connection monitoring
6. **Horizontal Scaling** - Redis adapter for multi-server deployments

### API Additions

```typescript
// Subscribe to specific event types
socket.emit('subscribe:events', ['message', 'sentiment']);

// Request event history
socket.emit('request:history', { since: timestamp });

// Unsubscribe from events
socket.emit('unsubscribe:events', ['metrics']);
```

## Related Documentation

- [Analytics System](../analytics/README.md)
- [Dashboard Components](../../components/dashboard/analytics/README.md)
- [Chat API Integration](../../app/api/chat/route.ts)
- [Real-time Conversations Hook](../../hooks/use-realtime-conversations.ts)

## Contributors

This WebSocket infrastructure was implemented as part of the real-time analytics enhancement project (Nov 2025).

**Key Decisions:**
- Socket.IO over raw WebSocket for reliability and reconnection
- Room-based isolation for multi-tenancy
- Custom Next.js server to run HTTP + WebSocket on single port
- Event-driven architecture for extensibility
