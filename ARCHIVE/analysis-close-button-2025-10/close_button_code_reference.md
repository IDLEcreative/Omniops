# Chat Widget Close Button - Complete Code Reference

## Quick Reference: Close Button Implementation

### 1. CLOSE BUTTON VISUAL (Header Component)

**File:** `/Users/jamesguy/Omniops/components/ChatWidget/Header.tsx`

```typescript
// Lines 38-44: Close button markup
<button
  onClick={onClose}  // ← Handler passed as prop from parent
  className={`w-8 h-8 flex items-center justify-center rounded-full ${
    highContrast ? 'text-white hover:bg-white hover:text-black' : 
    'text-gray-400 hover:text-white hover:bg-white/10'
  } transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
  aria-label="Close chat widget"  // ← Accessibility label
>
  <X className="h-5 w-5" aria-hidden="true" />  // ← X Icon from lucide-react
</button>
```

**What happens when clicked:**
- Calls `onClose()` prop function
- This is wired to `setIsOpen(false)` in parent component

---

### 2. CLOSE BUTTON HANDLER (Main Widget Component)

**File:** `/Users/jamesguy/Omniops/components/ChatWidget.tsx`

```typescript
// Line 236: Passing onClose handler to Header
<Header
  headerTitle={demoConfig?.headerTitle}
  highContrast={highContrast}
  onToggleHighContrast={() => setHighContrast(\!highContrast)}
  onClose={() => setIsOpen(false)}  // ← When X is clicked, close widget
/>

// Lines 206-218: What happens when isOpen is false
if (\!isOpen) {
  return (
    <button
      onClick={() => setIsOpen(true)}
      className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 
                 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br 
                 from-[#3a3a3a] to-[#2a2a2a] text-white rounded-full 
                 shadow-xl hover:shadow-2xl hover:scale-105 
                 focus:outline-none focus:ring-2 focus:ring-white/50 
                 focus:ring-offset-2 focus:ring-offset-black 
                 transition-all duration-300 flex items-center justify-center 
                 animate-in fade-in z-50"
      aria-label="Open chat support widget"
      role="button"
      tabIndex={0}
    >
      <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
    </button>
  );
}
```

**What happens when widget closes:**
1. `setIsOpen(false)` triggers
2. Component re-renders
3. Full widget hidden (removed from DOM)
4. Minimized button shown instead

---

### 3. STATE MANAGEMENT (useChatState Hook)

**File:** `/Users/jamesguy/Omniops/components/ChatWidget/hooks/useChatState.ts`

#### A. State Declaration (Line 44)
```typescript
const [isOpen, setIsOpen] = useState(initialOpen);
```

#### B. Open/Close via postMessage (Lines 178-183)
```typescript
// Listen for messages from parent window (embed.js)
const handleMessage = (event: MessageEvent) => {
  switch (event.data?.type) {
    case 'init':
      // ... handle init
      break;
    case 'open':
      setIsOpen(true);  // ← Parent can open widget
      break;
    case 'close':
      setIsOpen(false);  // ← Parent can close widget
      break;
    // ... other cases
  }
};

window.addEventListener('message', handleMessage);
```

#### C. Persist State to localStorage (Lines 113-117)
```typescript
// Save widget open/close state after every change
useEffect(() => {
  if (mounted && typeof window \!== 'undefined') {
    localStorage.setItem('chat_widget_open', isOpen.toString());
  }
}, [isOpen, mounted]);
```

#### D. Restore State on Load (Lines 100-110)
```typescript
// Check localStorage for saved state after mount
useEffect(() => {
  if (\!mounted) return;

  const params = new URLSearchParams(window.location.search);
  // Skip if URL params override the saved state
  if (params.get('open') === 'true' || 
      params.get('forceClose') === 'true' || 
      initialOpen || 
      forceClose) return;

  // Restore saved state
  const savedState = localStorage.getItem('chat_widget_open');
  if (savedState === 'true') {
    setIsOpen(true);
  }
}, [mounted, initialOpen, forceClose]);
```

---

### 4. EMBED.JS PUBLIC API (Parent Script)

**File:** `/Users/jamesguy/Omniops/public/embed.js`

#### A. Programmatic Close API (Lines 248-254)
```javascript
// Make ChatWidget API available to parent page
window.ChatWidget = {
  open: function() {
    // Send message to iframe to open widget
    iframe.contentWindow.postMessage({ type: 'open' }, config.serverUrl);
  },
  close: function() {
    // Send message to iframe to close widget
    iframe.contentWindow.postMessage({ type: 'close' }, config.serverUrl);
  },
  sendMessage: function(message) {
    iframe.contentWindow.postMessage({ 
      type: 'message', 
      message: message 
    }, config.serverUrl);
  },
  updateContext: function(newContext) {
    iframe.contentWindow.postMessage({ 
      type: 'updateContext', 
      userData: newContext.userData,
      cartData: newContext.cartData,
      pageContext: newContext.pageContext,
    }, config.serverUrl);
  },
  // ... privacy controls
  version: WIDGET_VERSION,
};
```

**Usage in parent page:**
```javascript
// Parent page can control widget programmatically
window.ChatWidget.close();  // Close the widget
window.ChatWidget.open();   // Open the widget
```

#### B. Listen for Messages from iframe (Lines 191-245)
```javascript
window.addEventListener('message', function(event) {
  // Verify origin for security
  if (\!event.origin.startsWith(config.serverUrl)) {
    return;  // ← SILENTLY IGNORES if origin doesn't match\!
  }

  switch (event.data.type) {
    case 'resize':
      // Widget requested resize
      iframe.style.width = event.data.width + 'px';
      iframe.style.height = event.data.height + 'px';
      break;
    case 'analytics':
      // Track analytics event
      if (\!privacyPrefs.optedOut && typeof gtag \!== 'undefined') {
        gtag('event', event.data.event, {
          event_category: 'Chat Widget',
          event_label: event.data.label,
          value: event.data.value,
        });
      }
      break;
    case 'privacy':
      // Handle privacy actions
      switch (event.data.action) {
        case 'optOut':
          savePrivacyPreferences({ ...privacyPrefs, optedOut: true });
          iframe.remove();
          break;
        case 'optIn':
          savePrivacyPreferences({ ...privacyPrefs, optedOut: false });
          break;
        case 'giveConsent':
          savePrivacyPreferences({ ...privacyPrefs, consentGiven: true });
          break;
        case 'requestDataExport':
          window.open(`${config.serverUrl}/privacy/export?user=${event.data.userId}`, '_blank');
          break;
        case 'requestDataDeletion':
          if (confirm('Are you sure you want to delete all your chat data?')) {
            fetch(`${config.serverUrl}/api/privacy/delete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId: event.data.userId }),
            });
          }
          break;
      }
      break;
    case 'error':
      // Log widget errors
      logError('Widget error:', event.data.message);
      break;
  }
});
```

---

## Data Flow Detailed

### Scenario 1: User Clicks Close Button in Widget

```
┌─────────────────────────────────────────┐
│ User clicks X button in widget          │
│ (iframe /embed page)                    │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Header.tsx line 39                      │
│ onClick={onClose}                       │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ ChatWidget.tsx line 236                 │
│ onClose={() => setIsOpen(false)}        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ useChatState.ts line 44                 │
│ setIsOpen(false)                        │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ useEffect triggered (line 113-117)      │
│ localStorage.setItem('chat_widget_open',│
│   'false')                              │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Component re-renders                    │
│ isOpen = false                          │
│                                         │
│ if (\!isOpen) returns minimized button   │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ Widget collapses                        │
│ Shows message circle button instead     │
│ User can click to reopen                │
└─────────────────────────────────────────┘
```

---

### Scenario 2: Parent Page Calls window.ChatWidget.close()

```
┌─────────────────────────────────────────┐
│ Parent page (embed.js loaded)           │
│ window.ChatWidget.close()               │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ embed.js line 252                       │
│ iframe.contentWindow.postMessage({      │
│   type: 'close'                         │
│ }, config.serverUrl)                    │
└──────────────────┬──────────────────────┘
                   │
              (postMessage)
                   │
                   ▼
┌─────────────────────────────────────────┐
│ iframe /embed page                      │
│ message event received                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│ useChatState.ts line 181                │
│ case 'close':                           │
│   setIsOpen(false)                      │
└──────────────────┬──────────────────────┘
                   │
                   ▼
         (Same as Scenario 1)
         Widget collapses
```

---

## Storage Implementation Details

### localStorage Keys Used

| Key | Value | Purpose | File |
|-----|-------|---------|------|
| `chat_widget_open` | `'true'` or `'false'` | Widget open/closed state | useChatState.ts:115 |
| `chat_session_id` | UUID format | Session identifier | useChatState.ts:126 |
| `chat_widget_privacy` | JSON object | Privacy preferences | embed.js:57 |

### localStorage State Persistence Flow

```typescript
// When widget opens/closes:
// 1. State changes: setIsOpen(false)
// 2. useEffect fires (line 113-117)
// 3. localStorage updated: 'chat_widget_open' = 'false'
// 4. On next page load, useChatState restores state (line 106-110)

// Check: stored state
localStorage.getItem('chat_widget_open')
// Returns: 'false' or 'true' (string, not boolean)

// Then converted:
if (savedState === 'true') {  // String comparison\!
  setIsOpen(true);
}
```

---

## Conditional Rendering Logic

### Widget Display Logic (ChatWidget.tsx)

```typescript
// Lines 192-218: What gets rendered

// 1. If component not mounted yet
if (\!mounted) {
  return null;  // Nothing rendered
}

// 2. If privacy consent required but not given AND widget is open
if (privacySettings.requireConsent && \!privacySettings.consentGiven && isOpen) {
  return <PrivacyBanner ... />;  // Show privacy consent banner
}

// 3. If widget is closed
if (\!isOpen) {
  return (
    <button ... >  // Show minimized button
      <MessageCircle ... />
    </button>
  );
}

// 4. If widget is open
return (
  <div ... >  // Full widget with Header, Messages, Input
    <Header ... />
    <MessageList ... />
    <InputArea ... />
  </div>
);
```

---

## Event Handler Chain - Step by Step

### Close Button Click Event

```
1. User clicks X button
   └─► HTML: <button onClick={onClose} ... />
   
2. React calls onClose prop
   └─► Passed from ChatWidget.tsx: onClose={() => setIsOpen(false)}
   
3. setIsOpen(false) called
   └─► useChatState.ts line 44: const [isOpen, setIsOpen] = useState(initialOpen)
   
4. State updates
   └─► React re-renders component with new isOpen value
   
5. useEffect fires (line 113-117)
   └─► Condition: isOpen dependency changed
   └─► Action: localStorage.setItem('chat_widget_open', 'false')
   
6. Component re-renders with isOpen=false
   └─► Lines 206-218: if (\!isOpen) returns minimized button
   └─► Widget hidden, minimize button shown
   
7. User sees minimized button instead of widget
   └─► Can click to reopen
```

---

## Origin Verification (Security)

**File:** `/Users/jamesguy/Omniops/public/embed.js` Lines 193-194

```javascript
// CRITICAL: Origin check for cross-origin safety
window.addEventListener('message', function(event) {
  // Only accept messages from the expected server
  if (\!event.origin.startsWith(config.serverUrl)) {
    return;  // Silently ignore messages from other origins
  }
  
  // ... process trusted message
});
```

### How serverUrl is Determined (Lines 8-24)

```javascript
function getServerUrl() {
  // 1. Try to get from script tag src
  const currentScript = document.currentScript || 
                        document.querySelector('script[src*="embed.js"]');
  if (currentScript && currentScript.src) {
    const url = new URL(currentScript.src);
    // In development, always use port 3000
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      return `http://localhost:3000`;
    }
    return url.origin;
  }
  
  // 2. Fallback - in development use port 3000
  if (window.location.hostname === 'localhost' || 
      window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // 3. Use current page origin
  return window.location.origin;
}

// Then merged with user config
const config = window.ChatWidgetConfig ? 
  { ...defaultConfig, ...window.ChatWidgetConfig } : 
  defaultConfig;

// Ensure serverUrl is set
if (\!config.serverUrl) {
  config.serverUrl = getServerUrl();
}
```

### Production Risk: Origin Mismatch

```javascript
// Example: If widget loaded from different origin
embed.js loaded from: https://example.com/embed.js
config.serverUrl:     https://example.com
iframe.src:           https://example.com/embed?domain=customer.com
event.origin:         https://example.com

// Message from iframe checks:
if (\!event.origin.startsWith(config.serverUrl)) {  // MATCH\!
  return;
}
// Message accepted ✓

// BUT if there's a mismatch:
event.origin:  https://app.example.com  
config.serverUrl: https://example.com

// Check fails:
if (\!event.origin.startsWith('https://example.com')) {  // FAIL\!
  return;  // Message silently ignored\!
}
// No error, no warning, just silently drops message ❌
```

---

## Testing Evidence (Unit Tests)

**File:** `/__tests__/components/ChatWidget-interactions.test.tsx`

### Test 1: Open/Close Toggle

```typescript
describe('Widget Open/Close', () => {
  it('should toggle widget open/closed', async () => {
    const { user } = render(<ChatWidget />);  // Initially closed

    const openButton = screen.getByLabelText('Open chat support widget');
    await user.click(openButton);  // Open widget
    expect(screen.getByLabelText('Chat support widget')).toBeInTheDocument();

    const closeButton = screen.getByLabelText('Close chat widget');
    await user.click(closeButton);  // Click X button

    // Widget should be hidden
    await waitFor(() => {
      expect(screen.queryByLabelText('Chat support widget')).not.toBeInTheDocument();
      // Minimize button should appear
      expect(screen.getByLabelText('Open chat support widget')).toBeInTheDocument();
    });
  });
});
```

**Result:** PASSING ✅

### Test 2: localStorage Persistence

```typescript
it('should persist widget state to localStorage', async () => {
  const { user } = render(<ChatWidget />);

  const openButton = screen.getByLabelText('Open chat support widget');
  await user.click(openButton);

  // Verify open state saved
  await waitFor(() => {
    expect(mockLocalStorage.setItem)
      .toHaveBeenCalledWith('chat_widget_open', 'true');
  });

  const closeButton = screen.getByLabelText('Close chat widget');
  await user.click(closeButton);

  // Verify closed state saved
  await waitFor(() => {
    expect(mockLocalStorage.setItem)
      .toHaveBeenCalledWith('chat_widget_open', 'false');
  });
});
```

**Result:** PASSING ✅

---

## Common Issues & Debugging

### Issue: Close Button Exists but Doesn't Work

**Possible Cause 1: origin mismatch in embed.js**

Debug code:
```javascript
// Add to embed.js around line 195
console.log('postMessage from iframe:', {
  type: event.data.type,
  origin: event.origin,
  configServerUrl: config.serverUrl,
  matches: event.origin.startsWith(config.serverUrl)
});
```

### Issue: Widget Closes but State Not Saved

**Possible Cause: localStorage disabled**

Debug code:
```typescript
// Add to useChatState.ts useEffect (line 115)
useEffect(() => {
  if (mounted && typeof window \!== 'undefined') {
    try {
      localStorage.setItem('chat_widget_open', isOpen.toString());
      console.log('✓ Widget state saved:', isOpen.toString());
    } catch (error) {
      console.error('✗ localStorage failed:', error);
      // Fallback: could use sessionStorage
    }
  }
}, [isOpen, mounted]);
```

### Issue: Close Works Once Then Stops

**Possible Cause: postMessage listener removed or event handler conflict**

Debug code:
```typescript
// Add to useChatState.ts message listener (line 195)
const handleMessage = (event: MessageEvent) => {
  console.log('Message received:', event.data);
  switch (event.data?.type) {
    // ... cases
  }
};

window.addEventListener('message', handleMessage);
// Ensure cleanup in return:
return () => {
  window.removeEventListener('message', handleMessage);
  console.log('Message listener cleaned up');
};
```

