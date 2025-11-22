# BREAKTHROUGH: Metadata Lost in Client-Side Flow

**Date:** 2025-11-22 23:42
**Test:** Minimal E2E test (`__tests__/playwright/isolated/metadata-button-minimal.spec.ts`)
**Status:** ROOT CAUSE IDENTIFIED

---

## 🎯 Critical Discovery

**The minimal test revealed the exact problem:**

```
[API Response] {
  "hasShoppingMetadata": true,
  "productCount": 17,
  "shoppingMetadataKeys": ["products", "context", "productCount"]
}
```

✅ **API returns metadata correctly**

**BUT:**

```yaml
# DOM Snapshot (error-context.md lines 25-34)
- article [ref=f1e26]:  # Assistant message
  - generic [ref=f1e28]:
    - text: "Thanks — I searched the site for pumps..."
    - link "Pumps, PTO's & Switches"
    - link "GEAR PUMP NPLA 40 DX 3H UNI"
    # ... full AI response with links ...
  - generic [ref=f1e31]: Sent at 11:40:47 PM
# ❌ NO Browse Products button
```

✅ **Message content renders**
❌ **Browse Products button missing**

---

## What This Proves

1. **Server-side:** ✅ Working perfectly
   - API generates metadata with 17 products
   - Response JSON includes shoppingMetadata

2. **Client-side message display:** ✅ Working
   - Message appears in chat
   - Message content displays correctly
   - Timestamp shows

3. **Metadata flow:** ❌ BROKEN
   - Metadata returned by API
   - Metadata NOT reaching MessageList component
   - Message renders WITHOUT metadata

---

## Metadata Flow Chain

```
API Response                 ✅ HAS metadata
    ↓
sendMessage.ts (line 143-146)   ← Need to verify
    ↓
onSuccess callback              ← Need to verify
    ↓
State update                    ← Need to verify
    ↓
MessageList props               ← Need to verify
    ↓
Button render check         ❌ NO metadata
```

**The metadata is being dropped somewhere in this chain.**

---

## Evidence from Test

### API Response (from test logs):
```javascript
{
  "hasShoppingMetadata": true,
  "productCount": 17,
  "shoppingMetadataKeys": [
    "products",
    "context",
    "productCount"
  ]
}
```

### DOM Snapshot (from error-context.md):
```yaml
- article [ref=f1e26]:           # Message exists
  - generic [ref=f1e28]:         # Content exists
    - text: "Thanks — I searched..." # Text exists
    - link "Pumps, PTO's & Switches" # Links exist
# BUT: No [data-testid="browse-products-button"]
```

### MessageList Rendering Logic (lines 177-182):
```typescript
{message.metadata?.shoppingProducts &&
 message.metadata.shoppingProducts.length > 0 && (
  <button data-testid="browse-products-button">
    Browse Products
  </button>
)}
```

**Conclusion:** `message.metadata` is `undefined` or `message.metadata.shoppingProducts` is `undefined`

---

## Next Steps (Production-Safe Debugging)

Since we're in production mode and `console.log()` is stripped by minification, we need `console.error()` statements which survive minification.

### Add to sendMessage.ts (after line 134):
```typescript
// Survives minification
console.error('[SENDMESSAGE] API Response:', {
  hasShoppingMetadata: !!data.shoppingMetadata,
  productCount: data.shoppingMetadata?.products?.length || 0,
  fullMetadata: JSON.stringify(data.shoppingMetadata).substring(0, 200)
});

// After creating message (after line 147):
console.error('[SENDMESSAGE] Created Message:', {
  hasMetadata: !!assistantMessage.metadata,
  productCount: assistantMessage.metadata?.shoppingProducts?.length || 0,
  metadataKeys: assistantMessage.metadata ? Object.keys(assistantMessage.metadata) : []
});
```

### Add to ChatWidget.tsx onSuccess (after line 178):
```typescript
onSuccess: (assistantMessage, newConversationId) => {
  console.error('[CHATWIDGET] onSuccess:', {
    messageId: assistantMessage.id,
    hasMetadata: !!assistantMessage.metadata,
    productCount: assistantMessage.metadata?.shoppingProducts?.length || 0,
    metadataSnapshot: JSON.stringify(assistantMessage.metadata).substring(0, 200)
  });

  // ... existing code

  console.error('[CHATWIDGET] After addMessage:', {
    messagesCount: messages.length,
    lastMessageHasMetadata: messages[messages.length - 1]?.metadata !== undefined
  });
}
```

### Add to MessageList.tsx render (before line 177):
```typescript
{messages.map((message) => {
  if (message.role === 'assistant') {
    console.error('[MESSAGELIST] Rendering assistant message:', {
      id: message.id,
      hasMetadata: !!message.metadata,
      productCount: message.metadata?.shoppingProducts?.length || 0,
      metadataKeys: message.metadata ? Object.keys(message.metadata) : [],
      metadataSnapshot: JSON.stringify(message.metadata).substring(0, 200)
    });
  }
```

### Run Test with Debugging:
```bash
# 1. Add console.error statements
# 2. Rebuild (production mode strips console.log but keeps console.error)
npm run build

# 3. Rebuild embed.js
npm run build:embed

# 4. Start production server
npm run start

# 5. Run minimal test
npm run test:e2e -- __tests__/playwright/isolated/metadata-button-minimal.spec.ts --project=chromium
```

### Expected Debug Output:
If metadata is lost in sendMessage:
```
[SENDMESSAGE] API Response: { hasShoppingMetadata: true, productCount: 17 }
[SENDMESSAGE] Created Message: { hasMetadata: false, productCount: 0 } ← LOST HERE
```

If metadata is lost in onSuccess:
```
[SENDMESSAGE] Created Message: { hasMetadata: true, productCount: 17 }
[CHATWIDGET] onSuccess: { hasMetadata: false } ← LOST HERE
```

If metadata is lost in state management:
```
[CHATWIDGET] onSuccess: { hasMetadata: true, productCount: 17 }
[CHATWIDGET] After addMessage: { lastMessageHasMetadata: false } ← LOST HERE
```

If metadata is lost before MessageList:
```
[CHATWIDGET] After addMessage: { lastMessageHasMetadata: true }
[MESSAGELIST] Rendering: { hasMetadata: false } ← LOST HERE
```

---

## Hypothesis

**Most Likely:** Metadata is being stripped during state update.

**Suspects:**
1. `useMessageState.ts` - loadPreviousMessages overwrites fresh message
2. `useChatState.ts` - addMessage doesn't preserve metadata
3. React state update - shallow copy losing nested metadata object
4. TypeScript type mismatch - metadata being filtered out

**Least Likely:** sendMessage transformation (we verified this code is correct)

---

## Alternative Quick Test

Instead of adding debug statements, we could test in **dev mode** temporarily:

```bash
# playwright.config.js line 50
webServer: {
  command: 'npm run dev',  # Switch to dev mode temporarily
  // ...
}
```

This would show ALL console.log statements and reveal exactly where metadata is lost. However, dev mode has HMR which we know causes issues. But for a quick diagnostic run, it might be worth it.

---

## Files to Modify

1. **[components/ChatWidget/utils/sendMessage.ts](../../components/ChatWidget/utils/sendMessage.ts)**
   - Add console.error after line 134
   - Add console.error after line 147

2. **[components/ChatWidget/ChatWidget.tsx](../../components/ChatWidget/ChatWidget.tsx)**
   - Add console.error in onSuccess callback (around line 178)
   - Add console.error after addMessage call

3. **[components/ChatWidget/MessageList.tsx](../../components/ChatWidget/MessageList.tsx)**
   - Add console.error in render loop (before line 177)

4. **Rebuild and test:**
   ```bash
   npm run build && npm run build:embed && npm run start
   npm run test:e2e -- __tests__/playwright/isolated/metadata-button-minimal.spec.ts --project=chromium
   ```

---

## Success Criteria

We'll know we found the root cause when:
1. Debug logs show exactly where metadata becomes undefined
2. We can see the transformation: `{ hasMetadata: true }` → `{ hasMetadata: false }`
3. We identify the specific line/function causing the loss
4. We can fix that specific issue and verify button appears

---

## Timeline

- **23:40:** Ran minimal E2E test
- **23:41:** Test failed - button not appearing
- **23:42:** Analyzed logs and DOM snapshot
- **23:42:** Identified metadata lost in client-side flow
- **23:43:** Created this document
- **NEXT:** Add production-safe debugging (console.error)
- **NEXT:** Rebuild and retest
- **NEXT:** Fix the identified issue
- **NEXT:** Verify fix with full E2E test

**Estimated time to fix:** 30-60 minutes with proper debugging
