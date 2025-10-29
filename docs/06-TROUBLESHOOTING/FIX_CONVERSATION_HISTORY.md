# Conversation History Fix Documentation

## Problem
The chatbot was not maintaining conversation context between messages. When users referenced previous messages (e.g., "tell me about item 10" from a numbered list), the AI couldn't access the conversation history. Additionally, when customers provided their email and received order information, follow-up questions were not understood in context.

## Root Causes

### Issue 1: Caching Problem (Previously Fixed)
The `QueryCache.execute()` function was caching empty conversation history for 5 minutes, preventing fresh data retrieval.

### Issue 2: Missing domain_id in Conversations (Fixed 2025-09-23)
- **Problem**: The `conversations` table has a NOT NULL constraint on `domain_id`, but the API was creating conversations without it
- **Impact**: Database inserts were silently failing, preventing conversation and message storage

### Issue 3: Incorrect Service Role Client
- **Problem**: Using `createServerClient` from `@supabase/ssr` for service role authentication instead of direct client
- **Impact**: The SSR client is designed for cookie-based auth, not service role keys

### Issue 4: Asynchronous Message Saving
- **Problem**: Messages were saved with `.then()` without awaiting completion
- **Impact**: Race conditions where history was loaded before messages were saved

## Solution
Multiple fixes were required to fully resolve the conversation history issues.

### Key Changes

#### 1. `/app/api/chat/route.ts` (Previous Fix)
- **Removed history caching**: Changed from `QueryCache.execute()` to direct database query
- **Fixed conversation creation**: Added logic to ensure conversation record exists when conversation_id is provided
- **Added error handling**: Improved error logging for message save operations

#### 2. `/app/api/chat-intelligent/route.ts` (2025-09-23 Fix)
- **Added domain_id handling**: Fetch or create domain before creating conversations
- **Fixed message saving**: Changed from `.then()` to proper async/await
- **Increased history limit**: From 10 to 20 messages for better context
- **Added domain validation**: Ensures domain exists before conversation creation

#### 3. `/lib/supabase/server.ts` (2025-09-23 Fix)
- **Fixed service role client**: Changed from `createServerClient` to `createSupabaseClient`
- **Removed SSR dependency**: Service role doesn't need cookie handling
- **Improved connection pooling**: Better configuration for service role operations

#### 4. `/lib/woocommerce-ai-instructions.ts`
- **Improved context instructions**: Enhanced AI prompts to better understand conversation context
- **Added follow-up handling**: Specific instructions for handling questions about previously mentioned orders

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