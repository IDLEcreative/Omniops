# Chat System Quick Start Guide

**Type:** Setup
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Estimated Read Time:** 12 minutes

## Purpose
git clone [repository] cd customer-service-agent npm install

## Quick Links
- [🚀 5-Minute Setup](#-5-minute-setup)
- [📝 Essential Code Snippets](#-essential-code-snippets)
- [🧪 Testing Commands](#-testing-commands)
- [📊 Key Files Reference](#-key-files-reference)
- [🔧 Common Tasks](#-common-tasks)

## Keywords
code, commands, common, essential, files, fixes, important, more, notes, quick

---


## 🚀 5-Minute Setup

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account (free tier works)
- OpenAI API key

### 2. Clone & Install
```bash
git clone [repository]
cd customer-service-agent
npm install
```

### 3. Configure Environment
Copy `.env.example` to `.env` and add your keys:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://birugqyuqhiahxvxeyqg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

### 4. Start Development Server
```bash
npm run dev
# Server runs on http://localhost:3000
```

### 5. Test the API
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "session_id": "'$(uuidgen)'"
  }'
```

---

## 📝 Essential Code Snippets

### Basic Chat Request (JavaScript)
```javascript
async function sendMessage(text) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: text,
      session_id: crypto.randomUUID(),
      conversation_id: window.conversationId // if continuing
    })
  });
  
  const data = await response.json();
  window.conversationId = data.conversation_id; // Save for next message
  return data.message;
}
```

### WordPress Integration
```php
// Add to your WordPress theme/plugin
function render_chat_widget() {
    ?>
    <div id="chat-widget"></div>
    <script>
        const chatSessionId = crypto.randomUUID();
        const chatApiUrl = 'https://your-api.com/api/chat';
        
        async function sendToChat(message) {
            const response = await fetch(chatApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: message,
                    session_id: chatSessionId,
                    domain: window.location.hostname,
                    userData: {
                        isLoggedIn: <?php echo is_user_logged_in() ? 'true' : 'false'; ?>,
                        email: '<?php echo wp_get_current_user()->user_email; ?>'
                    }
                })
            });
            return await response.json();
        }
    </script>
    <?php
}
add_shortcode('chat_widget', 'render_chat_widget');
```

### React Component Example
```jsx
import { useState } from 'react';

function ChatWidget() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const sendMessage = async (text) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        conversation_id: conversationId
      })
    });
    
    const data = await response.json();
    setConversationId(data.conversation_id);
    setMessages(prev => [...prev, 
      { role: 'user', content: text },
      { role: 'assistant', content: data.message }
    ]);
  };

  return (
    <div className="chat-widget">
      {/* Render messages and input */}
    </div>
  );
}
```

---

## 🧪 Testing Commands

```bash
# Run all tests
node comprehensive-test.js

# Test specific functionality
node test-chat-integration.js  # Basic integration
node test-embeddings.js        # Embeddings search
node verify-supabase.js        # Database connection

# Check system health
curl http://localhost:3000/api/health
```

---

## 📊 Key Files Reference

| File | Purpose |
|------|---------|
| `app/api/chat/route.ts` | Main chat endpoint |
| `lib/chat-service.ts` | Database operations |
| `lib/embeddings.ts` | Context search |
| `constants/index.ts` | Configuration |
| `.env` | Environment variables |
| `wordpress-plugin/customer-service-chat.php` | WP integration |

---

## 🔧 Common Tasks

### View Recent Conversations
```javascript
// In your Node.js script
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const { data } = await supabase
  .from('conversations')
  .select('*, messages(*)')
  .order('created_at', { ascending: false })
  .limit(5);

console.log(data);
```

### Clear Test Data
```sql
-- Run in Supabase SQL editor
DELETE FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations 
  WHERE metadata->>'test' = 'true'
);
```

### Monitor Performance
```bash
# Watch server logs
npm run dev

# Check response times
time curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Test","session_id":"'$(uuidgen)'"}'
```

---

## ⚠️ Important Notes

1. **UUID Format**: Always use valid UUID v4 format for session_id
2. **Rate Limits**: Default is 100 requests/minute per domain
3. **Message Length**: Maximum 1000 characters per message
4. **Model**: Using GPT-5-mini with temperature=1
5. **Database**: Conversations older than 30 days may be cleaned up

---

## 🆘 Quick Fixes

| Problem | Solution |
|---------|----------|
| "Invalid UUID" | Use `crypto.randomUUID()` or UUID library |
| "Rate limit exceeded" | Wait 1 minute or increase limit |
| "Table not found" | Check Supabase project URL |
| "Temperature error" | Set to 1 in constants/index.ts |
| "No response" | Check OpenAI API key and credits |

---

## 📚 More Resources

- [Full Documentation](./CHAT_SYSTEM_DOCS.md)
- [API Reference](./CHAT_SYSTEM_DOCS.md#api-reference)
- [Troubleshooting Guide](./CHAT_SYSTEM_DOCS.md#troubleshooting)
- [WordPress Plugin Docs](./wordpress-plugin/README.md)

---

**Need Help?** Check server logs first: `npm run dev`

*Version 1.0.0 | Last Updated: August 25, 2025*
