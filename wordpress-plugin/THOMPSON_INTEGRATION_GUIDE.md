# Thompson's Parts - Omniops Widget Integration Guide

**Production Server:** https://www.omniops.co.uk
**Target Site:** https://www.thompsonseparts.co.uk
**Status:** ✅ Server is live and healthy
**Last Verified:** 2025-10-31

---

## 🎯 Quick Integration (5 Minutes)

### Step 1: Add Widget to WordPress

Add this code to your WordPress site **before the closing `</body>` tag**:

```html
<!-- Omniops Chat Widget Configuration -->
<script>
  window.ChatWidgetConfig = {
    serverUrl: 'https://www.omniops.co.uk',
    domain: window.location.hostname,
    appearance: {
      position: 'bottom-right',
      primaryColor: '#0070f3',
      startMinimized: true
    },
    debug: false // Set to true for troubleshooting
  };
</script>
<script src="https://www.omniops.co.uk/embed.js" async></script>
```

### Where to Add:

**Option A: WordPress Theme Editor** (Quick but theme-specific)
1. Go to: **Appearance → Theme Editor**
2. Open: **footer.php**
3. Paste code **before** `</body>`
4. Click **Update File**

**Option B: Plugin** (Recommended - survives theme changes)
1. Install: **Insert Headers and Footers** plugin
2. Go to: **Settings → Insert Headers and Footers**
3. Paste code in **"Scripts in Footer"** section
4. Click **Save**

**Option C: Functions.php** (Most flexible)
```php
// Add to your theme's functions.php
function omniops_chat_widget() {
    ?>
    <script>
      window.ChatWidgetConfig = {
        serverUrl: 'https://www.omniops.co.uk',
        domain: window.location.hostname
      };
    </script>
    <script src="https://www.omniops.co.uk/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'omniops_chat_widget');
```

---

## ✅ Verification Steps

### 1. Check Widget Loads
- Visit your WordPress site
- Look for the chat bubble in the bottom-right corner
- It should appear within 2-3 seconds

### 2. Check Browser Console
Press **F12** and look for these messages:

```
✅ GOOD:
[Omniops Widget] Initialized successfully
[Omniops Widget] Configuration loaded for: www.thompsonseparts.co.uk

❌ BAD (if you see these, contact support):
404 /api/widget/config
Error: Server returned an invalid response
```

### 3. Test Chat Functionality
1. Click the chat bubble
2. Type a test message: "Hello"
3. Wait for AI response (should take 2-5 seconds)

### 4. Verify API Calls
In browser **Network tab** (F12 → Network):
- Look for requests to: `https://www.omniops.co.uk/api/chat`
- Status should be: **200 OK**
- Response should be JSON with a message

---

## 🔧 Troubleshooting

### Widget Not Appearing

**Check 1: Script loaded?**
```javascript
// In browser console:
console.log(window.ChatWidgetConfig);
// Should show: { serverUrl: "https://www.omniops.co.uk", ... }
```

**Check 2: Clear cache**
- WordPress cache (if using caching plugin)
- CDN cache (if using Cloudflare/etc)
- Browser cache (Ctrl+Shift+R)

**Check 3: No JavaScript errors?**
- Open Console (F12)
- Look for red error messages
- Common issue: Conflicting plugins

### Widget Appears But Chat Doesn't Work

**Check 1: API connectivity**
```bash
# Test from command line:
curl https://www.omniops.co.uk/api/health
# Should return: {"status":"healthy", ...}
```

**Check 2: Domain configuration**
- Widget must know which domain it's on
- Check console for: "Configuration loaded for: [domain]"
- If wrong domain shown, override with:
  ```javascript
  window.ChatWidgetConfig = {
    serverUrl: 'https://www.omniops.co.uk',
    domain: 'www.thompsonseparts.co.uk' // Explicit override
  };
  ```

### Messages Not Getting Responses

**Check 1: OpenAI API key configured**
- This is server-side - contact Omniops admin

**Check 2: Domain has scraped content**
- Chat needs website content to answer questions
- Check dashboard: https://www.omniops.co.uk/dashboard

---

## 🎨 Customization Options

### Appearance

```javascript
window.ChatWidgetConfig = {
  serverUrl: 'https://www.omniops.co.uk',

  appearance: {
    // Widget position
    position: 'bottom-right', // or 'bottom-left'

    // Colors (match your brand)
    primaryColor: '#0070f3', // Thompson's brand color

    // Size
    width: 400,   // pixels
    height: 600,  // pixels

    // Behavior
    startMinimized: true,      // Start closed
    showPulseAnimation: true,  // Attention-grabbing pulse
    showNotificationBadge: false
  }
};
```

### Welcome Message

```javascript
window.ChatWidgetConfig = {
  serverUrl: 'https://www.omniops.co.uk',

  // Custom greeting (requires server-side config)
  welcomeMessage: "Hi! 👋 How can we help you today?",

  // Suggested questions
  suggestedQuestions: [
    "What are your opening hours?",
    "Do you have hydraulic pumps in stock?",
    "How do I track my order?"
  ]
};
```

### Privacy Settings

```javascript
window.ChatWidgetConfig = {
  serverUrl: 'https://www.omniops.co.uk',

  privacy: {
    allowOptOut: true,          // Show "Opt Out" option
    showPrivacyNotice: true,    // Show GDPR notice
    requireConsent: false,      // Don't block until consent given
    retentionDays: 30           // Delete data after 30 days
  }
};
```

---

## 📊 Production Server Status

**Current Status:** ✅ Healthy

- **API:** OK
- **Database:** OK
- **Redis:** ⚠️ Error (non-critical for chat)
- **Response Time:** ~1.2 seconds
- **Uptime:** 197 seconds (recently deployed)

**Health Check URL:** https://www.omniops.co.uk/api/health

---

## 🔐 Security & CORS

The production server is **already configured** to allow embedding on:
- `https://www.thompsonseparts.co.uk`
- `https://*.thompsonseparts.co.uk`
- `https://epartstaging.wpengine.com`
- `https://*.wpengine.com`

The production server is **already configured** to accept requests from www.thompsonseparts.co.uk ✅

---

## 📞 Support

**Issues? Contact:**
- Email: support@omniops.co.uk
- Dashboard: https://www.omniops.co.uk/dashboard
- GitHub: https://github.com/IDLEcreative/Omniops/issues

**Include in support requests:**
- Your WordPress site URL
- Browser console logs (F12 → Console → screenshot)
- Network tab screenshot (F12 → Network)
- Widget configuration code you're using
