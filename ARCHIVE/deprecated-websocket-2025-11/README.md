# WebSocket to Supabase Realtime Migration

**Type:** Guide
**Status:** Deprecated
**Last Updated:** 2025-11-09
**Verified For:** v0.1.0
**Dependencies:** [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
**Estimated Read Time:** 4 minutes

## Purpose

Migration guide for transitioning from custom Socket.IO WebSocket server to Supabase Realtime Broadcast channels, necessitated by Vercel serverless platform limitations.

**Date**: 2025-11-09
**Reason**: Vercel serverless platform doesn't support custom HTTP servers or long-running WebSocket connections
**Replacement**: Supabase Realtime Broadcast channels

## What Was Deprecated

The custom Socket.IO WebSocket server infrastructure that powered real-time analytics updates.

### Files Moved to Archive:
- `server.ts` - Custom HTTP server with Socket.IO (doesn't work on Vercel)
- `lib/websocket/server.ts` - WebSocket server implementation
- `lib/analytics/events.ts` - Old event emitters using WebSocket
- `hooks/use-realtime-analytics.ts` - Old client hook using Socket.IO
- `__tests__/integration/websocket-server.test.ts` - WebSocket tests

### Package.json Scripts Removed:
- `dev:ws` - Start dev server with WebSocket (no longer needed)
- `start:ws` - Start production server with WebSocket (didn't work on Vercel anyway)

## New Implementation

### Server-Side (Event Emission)
**Old**: `lib/analytics/events.ts`
```typescript
import { emitMessageEvent } from '@/lib/analytics/events';

await emitMessageEvent(organizationId, {
  conversationId: '...',
  messageId: '...',
  role: 'assistant',
  content: '...',
  timestamp: new Date(),
});
```

**New**: `lib/analytics/supabase-events.ts`
```typescript
import { emitMessageEvent } from '@/lib/analytics/supabase-events';

await emitMessageEvent(organizationId, {
  conversationId: '...',
  messageId: '...',
  role: 'assistant',
  content: '...',
  timestamp: new Date(),
});
```

### Client-Side (Event Receiving)
**Old**: `hooks/use-realtime-analytics.ts`
```typescript
import { useRealtimeAnalytics } from '@/hooks/use-realtime-analytics';

const { isConnected, latestUpdate } = useRealtimeAnalytics({
  organizationId: 'org-123',
  enabled: true,
});
```

**New**: `hooks/use-supabase-realtime-analytics.ts`
```typescript
import { useSupabaseRealtimeAnalytics } from '@/hooks/use-supabase-realtime-analytics';

const { isConnected, latestUpdate } = useSupabaseRealtimeAnalytics({
  organizationId: 'org-123',
  enabled: true,
});
```

## Benefits of Supabase Realtime

### ✅ Works on Vercel
- No custom server needed
- Fully serverless compatible
- Uses Supabase infrastructure

### ✅ Scalable by Default
- Handled by Supabase
- No server management
- Auto-scaling included

### ✅ Same API Surface
- Drop-in replacement
- Minimal code changes
- Same functionality

### ✅ Better Reliability
- Managed infrastructure
- Built-in reconnection
- Lower latency (Supabase edge network)

## Migration Checklist

- [x] Create Supabase Realtime event emitters
- [x] Create Supabase Realtime client hook
- [x] Update analytics dashboard to use new hook
- [x] Update chat response handler to use new emitters
- [x] Remove WebSocket scripts from package.json
- [x] Archive old WebSocket files
- [ ] Remove old files after testing
- [ ] Update documentation

## Testing

### Local Development
```bash
npm run dev  # Uses Supabase Realtime (no custom server needed)
```

### Production
Supabase Realtime works seamlessly on Vercel without any configuration changes.

## Rollback Plan

If issues arise:
1. Restore files from this archive
2. Add back package.json scripts
3. Use `npm run dev:ws` for local development
4. Note: Production (Vercel) will still not have real-time features

## Technical Details

### Old Architecture (Broken on Vercel)
```
API Route → WebSocket Server (server.ts) → Socket.IO → Client
                     ↑
                 Doesn't exist on Vercel!
```

### New Architecture (Works Everywhere)
```
API Route → Supabase Realtime Channel → Supabase → Client
                                          ↑
                              Managed infrastructure
```

### Supabase Broadcast Channels
- Channel naming: `analytics:{organizationId}`
- Events:
  - `analytics:new-message` - New chat messages
  - `analytics:sentiment-update` - Sentiment analysis results
  - `analytics:metrics-update` - Aggregated metrics
- Ephemeral (no database storage)
- Organization-based multi-tenancy

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Vercel Serverless Limitations](https://vercel.com/docs/functions/limitations)
- [Migration Commit](https://github.com/IDLEcreative/Omniops/commit/[hash])
