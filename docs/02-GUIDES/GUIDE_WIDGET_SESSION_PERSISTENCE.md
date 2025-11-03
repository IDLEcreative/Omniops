# Widget Session Persistence Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-03
**Verified For:** v0.1.0
**Dependencies:**
- [Chat API Reference](../03-API/CHAT_API.md) - Chat endpoint documentation
- [API Endpoints Reference](../03-API/REFERENCE_API_ENDPOINTS.md) - Messages endpoint documentation
**Estimated Read Time:** 8 minutes

## Purpose
Complete guide to the chat widget's session persistence feature, which automatically saves and restores conversations across page refreshes and navigation, providing seamless multi-page conversation continuity.

## Quick Links
- [How It Works](#how-it-works)
- [User Experience](#user-experience)
- [Technical Implementation](#technical-implementation)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## Keywords
session persistence, conversation history, localStorage, conversation restoration, message loading, cross-page conversations, widget state, browser storage, session management

## Aliases
- "session persistence" (also known as: conversation persistence, message history, state restoration)
- "localStorage" (also known as: browser storage, local storage, client-side storage)
- "conversation restoration" (also known as: history loading, session recovery, conversation resumption)

---

## Overview

The chat widget includes automatic session persistence that saves conversations to the browser's localStorage and restores them when the widget reopens. This provides a seamless experience where users can:

- **Continue conversations** after refreshing the page
- **Resume chats** when navigating between pages on the same website
- **Maintain context** across multiple browsing sessions
- **Never lose their conversation history** due to accidental page reloads

## How It Works

### Architecture Flow

```
1. User sends message
   ↓
2. Widget saves conversation ID to localStorage
   ↓
3. Message sent to API with conversation ID
   ↓
4. API stores message in database
   ↓
5. Page refresh/navigation occurs
   ↓
6. Widget checks localStorage for conversation ID
   ↓
7. If found, fetches messages from API
   ↓
8. Messages restored and displayed
```

### Storage Keys

The widget uses three localStorage keys:

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `chat_conversation_id` | Unique conversation identifier | `"550e8400-e29b-41d4-a716-446655440000"` |
| `chat_session_id` | Browser session identifier | `"session_1699024800000_abc123xyz"` |
| `chat_widget_open` | Widget open/closed state | `"true"` or `"false"` |

### API Endpoint

**Endpoint:** `GET /api/conversations/[conversationId]/messages`

**Query Parameters:**
- `session_id` (optional): Session ID for security verification
- `limit` (optional): Maximum messages to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "conversation": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "created_at": "2025-11-03T10:00:00Z"
  },
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "What are your business hours?",
      "created_at": "2025-11-03T10:00:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "We're open Monday-Friday 9am-5pm EST.",
      "created_at": "2025-11-03T10:00:05Z"
    }
  ],
  "count": 2
}
```

## User Experience

### Typical User Journey

**Scenario 1: Page Refresh**
1. User asks: "What are your shipping rates?"
2. Bot responds with shipping information
3. User accidentally refreshes the page
4. Widget reopens with **full conversation history intact**
5. User can continue: "Do you ship internationally?"

**Scenario 2: Multi-Page Navigation**
1. User starts chat on homepage: "Do you have product X?"
2. Bot provides product details
3. User navigates to product page
4. Widget **restores conversation automatically**
5. User continues: "What's the warranty on this?"

**Scenario 3: Return Visit**
1. User has conversation and closes widget
2. User navigates to different page
3. User reopens widget
4. **Previous conversation is restored**
5. Context maintained throughout session

### Visual Behavior

When restoring a conversation:

1. **Loading State**: Brief spinner/skeleton screen while fetching messages
2. **Message Restoration**: Messages fade in from top to bottom
3. **Scroll Position**: Automatically scrolls to most recent message
4. **Seamless Continuation**: Input field ready for next message

## Technical Implementation

### Frontend (React Hook)

The `useChatState` hook manages session persistence:

```typescript
// Load conversation ID from localStorage on mount
useEffect(() => {
  const storedConversationId = localStorage.getItem('chat_conversation_id');
  if (storedConversationId) {
    setConversationId(storedConversationId);
  }
}, []);

// Fetch messages when conversation ID is restored
const loadPreviousMessages = async (convId: string, sessId: string) => {
  const response = await fetch(
    `/api/conversations/${convId}/messages?session_id=${sessId}`
  );

  if (response.ok) {
    const data = await response.json();
    if (data.success && data.messages) {
      setMessages(data.messages);
    }
  }
};

// Save conversation ID when it changes
useEffect(() => {
  if (conversationId) {
    localStorage.setItem('chat_conversation_id', conversationId);
  }
}, [conversationId]);
```

### Backend (API Route)

The messages endpoint handles conversation restoration:

```typescript
// app/api/conversations/[conversationId]/messages/route.ts
export async function GET(request: NextRequest) {
  const { conversationId } = await params;
  const { session_id, limit } = queryParams;

  // Verify conversation exists and matches session
  const conversation = await supabase
    .from('conversations')
    .select('id, session_id, created_at')
    .eq('id', conversationId)
    .eq('session_id', session_id) // Security: verify session ownership
    .single();

  if (!conversation) {
    return { success: false, messages: [] };
  }

  // Fetch messages for the conversation
  const messages = await supabase
    .from('messages')
    .select('id, role, content, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  return { success: true, messages, conversation };
}
```

### Security Considerations

**Session Verification:**
- Conversation ID is public, but session ID acts as a secret
- API verifies that session ID matches the conversation
- Prevents users from accessing other users' conversations

**Privacy Protection:**
- Conversations stored with user's session ID only
- No personal information in localStorage
- GDPR-compliant data retention (default: 30 days)

**Error Handling:**
- If conversation not found, clears localStorage and starts fresh
- If API error occurs, widget still functions without history
- Graceful degradation if localStorage is disabled

## Configuration

### Dashboard Settings

Session persistence is controlled via dashboard:

**Settings → Widget Configuration → Behavior**

| Setting | Default | Description |
|---------|---------|-------------|
| `persistConversation` | `true` | Enable/disable session persistence |
| `retentionDays` | `30` | Days to retain conversation data |

**Example Configuration:**
```javascript
{
  behavior: {
    persistConversation: true,  // Enable persistence
    // ... other settings
  },
  privacy: {
    retentionDays: 30  // Auto-delete after 30 days
  }
}
```

### Programmatic Control

**Disable for specific pages:**
```javascript
// In embed code
window.ChatWidgetConfig = {
  serverUrl: "https://omniops.co.uk",
  behavior: {
    persistConversation: false  // Disable on this page
  }
};
```

**Clear conversation programmatically:**
```javascript
// Via window.ChatWidget API
window.ChatWidget.privacy.clearData();

// Or manually clear localStorage
localStorage.removeItem('chat_conversation_id');
localStorage.removeItem('chat_session_id');
```

## Browser Compatibility

### Supported Browsers

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 4+ | ✅ Full support |
| Firefox | 3.5+ | ✅ Full support |
| Safari | 4+ | ✅ Full support |
| Edge | All versions | ✅ Full support |
| IE | 8+ | ✅ Full support |

### localStorage Availability

**When localStorage is unavailable:**
- Private/Incognito browsing mode
- Browser settings disable storage
- Storage quota exceeded
- CSP policy restrictions

**Fallback Behavior:**
- Widget functions normally without persistence
- Each page refresh starts new conversation
- Warning logged to console (not visible to user)
- No impact on core functionality

## Troubleshooting

### Messages Not Restoring

**Symptom:** Conversation disappears after refresh

**Possible Causes:**
1. localStorage disabled (private mode)
2. Conversation expired (past retention period)
3. Session ID mismatch
4. API endpoint not accessible

**Solutions:**
```javascript
// Check if localStorage is working
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log('localStorage available');
} catch (e) {
  console.error('localStorage unavailable:', e);
}

// Check stored conversation ID
const convId = localStorage.getItem('chat_conversation_id');
console.log('Stored conversation ID:', convId);

// Test API endpoint directly
fetch(`/api/conversations/${convId}/messages?session_id=${sessionId}`)
  .then(r => r.json())
  .then(data => console.log('API response:', data));
```

### Stale Conversations

**Symptom:** Old conversation restored unexpectedly

**Solution:** Implement conversation expiry in widget:

```javascript
// Check conversation age before restoring
const convId = localStorage.getItem('chat_conversation_id');
const convTimestamp = localStorage.getItem('chat_conversation_timestamp');

const ONE_HOUR = 60 * 60 * 1000;
const isRecent = Date.now() - parseInt(convTimestamp) < ONE_HOUR;

if (!isRecent) {
  localStorage.removeItem('chat_conversation_id');
  localStorage.removeItem('chat_conversation_timestamp');
}
```

### Cross-Domain Issues

**Symptom:** Conversations not persisting across subdomains

**Explanation:** localStorage is domain-specific:
- `shop.example.com` and `blog.example.com` have separate storage
- Conversations cannot be shared across domains

**Workaround:**
- Use consistent subdomain (always `www.example.com`)
- Or implement server-side session tokens

### Performance Impact

**Question:** Does loading messages slow down widget?

**Answer:** Minimal impact:
- Message fetch: ~100-300ms (concurrent with widget load)
- localStorage read: <1ms
- Messages render: ~50ms for 50 messages
- **Total overhead:** ~150-350ms on reopens only

**Optimization:**
```javascript
// Limit messages loaded
const messages = await fetch(
  `/api/conversations/${convId}/messages?limit=20`
);

// Load more on scroll if needed
```

## Data Retention & Privacy

### Automatic Cleanup

Conversations are automatically deleted after the retention period:

**Default:** 30 days
**Configurable:** 1-365 days via dashboard

**Cleanup Process:**
1. Daily cron job checks conversation ages
2. Conversations past retention period are marked for deletion
3. Associated messages, metadata deleted
4. User's localStorage remains (for session continuity)

### GDPR Compliance

**Right to Access:**
```javascript
// User can export their data
window.ChatWidget.privacy.requestDataExport({
  userId: 'user@example.com'
});
```

**Right to Deletion:**
```javascript
// User can delete their data
window.ChatWidget.privacy.requestDataDeletion({
  userId: 'user@example.com'
});
```

### Privacy-First Design

- **No tracking cookies**: Only localStorage (user-controlled)
- **No cross-site tracking**: Data isolated per domain
- **No PII in storage**: Only conversation/session IDs
- **User control**: Can clear data anytime via browser

## Best Practices

### For Developers

**✅ Do:**
- Test persistence with page refreshes during development
- Implement error handling for localStorage failures
- Set appropriate retention periods for your use case
- Monitor conversation storage size
- Log persistence events for debugging

**❌ Don't:**
- Store sensitive data in localStorage
- Rely on persistence for critical state (have fallbacks)
- Set retention periods longer than necessary
- Ignore browser compatibility issues
- Skip testing in private/incognito modes

### For Users

**User Education:**
- Explain persistence in widget welcome message
- Provide option to start new conversation
- Show privacy policy link
- Allow manual conversation clearing

**Example Welcome Message:**
```
"Hi! Your conversation will be saved so you can continue
where you left off, even if you refresh the page.
[Privacy Policy] [Start New Chat]"
```

## Related Documentation

- [Chat API Documentation](../03-API/CHAT_API.md) - Chat endpoint details
- [API Endpoints Reference](../03-API/REFERENCE_API_ENDPOINTS.md) - Full API documentation
- [Privacy & GDPR Compliance](../PRIVACY_COMPLIANCE.md) - Data protection policies
- [Widget Configuration Guide](../02-GUIDES/GUIDE_WIDGET_CONFIGURATION.md) - All widget settings

## Support

For issues with session persistence:
1. Check browser console for errors
2. Verify localStorage is enabled
3. Test API endpoint directly
4. Review [Troubleshooting](#troubleshooting) section
5. Open GitHub issue with reproduction steps

---

**Last Updated:** 2025-11-03
