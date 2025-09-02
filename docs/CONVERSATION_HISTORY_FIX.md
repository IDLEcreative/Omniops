# Conversation History Fix Documentation

## Problem
The chatbot was not maintaining conversation context between messages. When customers provided their email and received order information, follow-up questions like "on hold?" were not understood in context, causing the bot to respond as if it was a new conversation.

## Root Cause
The issue was caused by aggressive caching of conversation history in `/app/api/chat/route.ts`. The `QueryCache.execute()` function was caching empty conversation history for 5 minutes with the key `history_${conversationId}`. This meant:

1. First message: No history exists, caches `[]` for 5 minutes
2. Second message: Returns cached `[]` even though first message was saved to database
3. Third message: Still returns cached `[]` even though multiple messages exist

## Solution
Removed the caching layer for conversation history since it changes with every message and should always fetch fresh data from the database.

### Key Changes

#### 1. `/app/api/chat/route.ts`
- **Removed history caching**: Changed from `QueryCache.execute()` to direct database query
- **Fixed conversation creation**: Added logic to ensure conversation record exists when conversation_id is provided
- **Added error handling**: Improved error logging for message save operations
- **Enhanced debugging**: Added comprehensive logging for troubleshooting

#### 2. `/lib/woocommerce-ai-instructions.ts`
- **Improved context instructions**: Enhanced AI prompts to better understand conversation context
- **Added follow-up handling**: Specific instructions for handling questions about previously mentioned orders

#### 3. `/lib/customer-verification-simple.ts`
- **Better verification flow**: Improved customer verification to work with conversation history
- **Guest checkout support**: Enhanced handling of orders without registered customers

## Testing
The fix was verified with the following test flow:
1. User: "check my order" → Bot: "Please provide email"
2. User: "samguy@thompsonsuk.com" → Bot: Shows Order #119410 (on-hold, £155.81)
3. User: "on hold?" → Bot: Correctly explains the order status

## Impact
- Conversations now maintain proper context throughout the entire session
- Follow-up questions are understood in relation to previous messages
- Customer support quality significantly improved with natural conversation flow

## Technical Details
Before (with caching):
```typescript
const historyPromise = QueryCache.execute(
  {
    key: `history_${conversationId}`,
    ttlSeconds: 300, // 5 minutes - THIS WAS THE PROBLEM
    useMemoryCache: true,
    useDbCache: false,
    supabase: adminSupabase
  },
  async () => { /* query */ }
);
```

After (no caching):
```typescript
const historyPromise = (async () => {
  const { data, error } = await adminSupabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId!)
    .order('created_at', { ascending: true })
    .limit(10);
  
  return data || [];
})();
```

## Lessons Learned
- Not all data should be cached - conversation history is inherently dynamic
- Cache keys must consider data volatility
- Always verify that cached data matches expected freshness requirements