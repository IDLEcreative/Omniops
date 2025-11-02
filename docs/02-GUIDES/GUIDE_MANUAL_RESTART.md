# Manual Server Restart Instructions

**Date:** 2025-11-01
**Reason:** Port 3000 blocked by multiple Node processes, macOS security preventing automated cleanup

## Step 1: Kill All Node Processes

```bash
killall node
```

## Step 2: Verify Port 3000 is Free

```bash
lsof -i :3000
```

**Expected:** No output (port is free)
**If still blocked:** Run `killall -9 node` (force kill)

## Step 3: Set OpenAI API Key and Start Server

```bash
export OPENAI_API_KEY="sk-proj-your-openai-api-key-here" && npm run dev
```

## Step 4: Test Widget Functionality

Navigate to: http://localhost:3000/check-embed.html

### Expected Behavior:
- ✅ Widget loads in bottom-right corner
- ✅ Widget opens when clicked
- ✅ Chat message sends successfully
- ✅ No 500 errors in browser console
- ✅ Server logs show `domain: 'test.example.com'` (NOT empty string)

### Server Logs to Monitor:
```
[PERFORMANCE] Chat request started { message: '...', domain: 'test.example.com', hasConversationId: false }
```

**If domain is still empty:**
- Widget bundle may not have rebuilt correctly
- Check browser console for JavaScript errors
- Hard refresh the page (Cmd+Shift+R)

## Critical Fix Applied:

File: `/Users/jamesguy/Omniops/components/ChatWidget/hooks/useChatState.ts` (lines 146-150)

```typescript
// CRITICAL FIX: If config already has domain from parent (embed.js), use it directly
// This prevents overwriting correct domain with empty string from API
if (demoConfig?.domain && demoConfig.domain.trim() !== '') {
  setStoreDomain(demoConfig.domain);
  setWoocommerceEnabled(demoConfig.features?.woocommerce?.enabled || false);
  return; // Don't fetch from API - use parent config
}
```

## If Testing Fails:

1. **Check widget bundle loaded correctly:**
   ```bash
   ls -lh public/widget-bundle.js
   ```
   Should be ~213 KB, modified today

2. **Rebuild widget if needed:**
   ```bash
   npm run build:widget
   ```

3. **Check browser console** for JavaScript errors

4. **Check server logs** for domain value in chat request

## Success Criteria:

- [ ] Server starts on port 3000 without errors
- [ ] Widget loads at http://localhost:3000/check-embed.html
- [ ] Chat message sends without 500 error
- [ ] Server logs show `domain: 'test.example.com'`
- [ ] No NULL constraint violations in database

---

**Delete this file after successful testing**
