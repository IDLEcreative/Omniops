# Chat Observability & Tracing Guide

## Current State: Partial Observability ⚠️

The intelligent chat route currently has **basic console logging** but lacks comprehensive observability. Here's what exists and what's needed:

## What Currently Exists ✅

### 1. Console Logging
```typescript
console.log(`[Intelligent Chat] Starting conversation with ${conversationMessages.length} messages`);
console.log(`[Function Call] search_products: "${query}" (limit: ${limit})`);
console.log(`[Intelligent Chat] Tool ${toolName} completed in ${executionTime}ms: ${result.results.length} results`);
```

### 2. Search Metadata (Returned to Client)
```json
{
  "searchMetadata": {
    "iterations": 2,
    "totalSearches": 5,
    "searchLog": [
      {
        "tool": "search_products",
        "query": "Cifa mixer pump",
        "resultCount": 18,
        "source": "woocommerce"
      }
    ]
  }
}
```

## What's Missing ❌

1. **Structured Logging** - Logs are unstructured console.log statements
2. **Persistent Storage** - Nothing saved to database for analysis
3. **Performance Metrics** - No aggregated metrics or trends
4. **Error Tracking** - Errors logged but not categorized
5. **User Journey Tracking** - Can't follow a user across sessions
6. **Cost Tracking** - No tracking of API costs (OpenAI, embeddings)

## Proposed Telemetry System 🎯

### Benefits of Full Observability

✅ **Debug Issues Faster**
- See exact search queries and results
- Track which searches failed/succeeded
- Identify performance bottlenecks

✅ **Improve AI Performance**
- Analyze common query patterns
- Identify where AI struggles
- Optimize search strategies

✅ **Monitor Costs**
- Track OpenAI API usage
- Monitor embedding generation costs
- Identify expensive queries

✅ **User Experience Insights**
- See what users actually search for
- Identify common frustrations
- Track success rates

### Is It Too Much? Balance Considerations

**Not Too Much If:**
- Logs are structured and queryable
- Old logs are automatically cleaned up
- Sensitive data is redacted
- Performance impact is minimal (<5ms)

**Too Much If:**
- Every token is logged
- Logs slow down responses
- Storage costs exceed value
- Privacy is compromised

## Recommended Logging Levels

### Production (Default)
```typescript
{
  logLevel: 'info',
  logCategories: ['search', 'ai', 'error'],
  persistToDatabase: true,
  redactSensitiveData: true
}
```
**Logs:**
- Search operations and results count
- AI iterations and tool usage
- Errors and warnings
- Performance summaries

### Development
```typescript
{
  logLevel: 'debug',
  logCategories: ['all'],
  persistToDatabase: false,
  detailedLogging: true
}
```
**Logs:**
- Everything above PLUS
- Full search queries
- Complete AI responses
- Token counts
- Detailed timings

### Debug Mode (Troubleshooting)
```typescript
{
  logLevel: 'trace',
  logCategories: ['all'],
  persistToDatabase: true,
  includeFullContext: true
}
```
**Logs:**
- Complete request/response payloads
- All embeddings generated
- Full database queries
- Memory usage

## Implementation Plan

### Phase 1: Basic Telemetry (Quick Win) ⚡
```typescript
// Add to route-intelligent.ts
import { ChatTelemetry } from '@/lib/chat-telemetry';

const telemetry = new ChatTelemetry(sessionId, 'gpt-5-mini');
telemetry.trackSearch({ tool: 'search_products', query, resultCount, source });
await telemetry.complete(finalResponse);
```

### Phase 2: Database Persistence 💾
```sql
CREATE TABLE chat_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  model TEXT,
  duration_ms INTEGER,
  search_count INTEGER,
  total_results INTEGER,
  searches JSONB,
  success BOOLEAN,
  error TEXT
);

CREATE INDEX idx_telemetry_session ON chat_telemetry(session_id);
CREATE INDEX idx_telemetry_created ON chat_telemetry(created_at);
```

### Phase 3: Monitoring Dashboard 📊
```typescript
// app/api/monitoring/chat/route.ts
export async function GET() {
  const metrics = await getAggregatedMetrics();
  return NextResponse.json({
    avgResponseTime: metrics.avgResponseTime,
    searchSuccessRate: metrics.searchSuccessRate,
    topQueries: metrics.topQueries,
    errorRate: metrics.errorRate,
    costEstimate: metrics.costEstimate
  });
}
```

## Privacy & Compliance 🔒

### What NOT to Log
- ❌ User personal information
- ❌ Full email addresses
- ❌ Payment information
- ❌ Passwords or API keys

### What to Redact
```typescript
function redactSensitive(text: string): string {
  return text
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
    .replace(/Bearer\s+[A-Za-z0-9\-._~+\/]+=*/g, 'Bearer [TOKEN]');
}
```

## Sample Telemetry Output

```json
{
  "sessionId": "chat-1234567890",
  "model": "gpt-5-mini",
  "totalDuration": "15234ms",
  "iterations": 2,
  "searches": {
    "total": 5,
    "totalResults": 84,
    "avgTime": "523ms",
    "breakdown": {
      "woocommerce": 3,
      "semantic": 2
    }
  },
  "success": true,
  "timeline": [
    { "time": 0, "event": "session_start" },
    { "time": 234, "event": "search_start", "tool": "search_products" },
    { "time": 756, "event": "search_complete", "results": 18 },
    { "time": 1234, "event": "ai_reasoning" },
    { "time": 5678, "event": "response_generated" }
  ]
}
```

## Quick Start

### Enable Basic Telemetry Now
```bash
# Set environment variable
export CHAT_TELEMETRY_ENABLED=true
export CHAT_TELEMETRY_LEVEL=info
```

### View Current Logs
```bash
# In development
npm run dev
# Watch console for [INTELLIGENT CHAT] logs

# In production
# Check your logging service (Vercel, CloudWatch, etc.)
```

### Analyze Search Patterns
```sql
-- Most common searches
SELECT 
  searches->>'query' as query,
  COUNT(*) as count
FROM chat_telemetry
GROUP BY searches->>'query'
ORDER BY count DESC
LIMIT 20;

-- Average response time by model
SELECT 
  model,
  AVG(duration_ms) as avg_duration,
  COUNT(*) as total_sessions
FROM chat_telemetry
GROUP BY model;
```

## Conclusion

**Current State**: Basic logging exists but isn't sufficient for production monitoring

**Recommendation**: Implement Phase 1 telemetry immediately for:
- Better debugging
- Performance monitoring  
- Usage insights
- Cost tracking

**Balance**: The proposed system provides valuable insights without being overwhelming. Key is structured, queryable logs with appropriate retention policies.

---

*Guide created: 2025-09-17*  
*Telemetry system ready for implementation*  
*Estimated implementation time: 2-4 hours for Phase 1*