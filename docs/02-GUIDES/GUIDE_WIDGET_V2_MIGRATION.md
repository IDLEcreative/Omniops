# Widget V2 Migration Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-11-02
**Estimated Time:** 10-15 minutes

## Purpose

This guide helps you migrate from the legacy widget integration (38 lines) to the new App ID-based system (1-2 lines). The new system is faster, more secure, and requires zero maintenance for configuration changes.

## Quick Links

- [Why Migrate?](#why-migrate)
- [Migration Steps](#migration-steps)
- [Troubleshooting](#troubleshooting)
- [Rollback Instructions](#rollback-instructions)

## Keywords

widget, migration, app id, embed code, integration, upgrade, v2

---

## Why Migrate?

### Old Method (Legacy)
```html
<!-- 38 lines of configuration -->
<script>
  window.ChatWidgetConfig = {
    serverUrl: 'https://omniops.co.uk',
    domain: window.location.hostname,
    appearance: {
      position: 'bottom-right',
      width: 400,
      height: 600,
      showPulseAnimation: true,
      showNotificationBadge: true,
      startMinimized: true
    },
    behavior: {
      welcomeMessage: 'Hi! How can I help you today?',
      placeholderText: 'Type your message...',
      botName: 'Assistant',
      showAvatar: true,
      showTypingIndicator: true,
      autoOpen: false,
      openDelay: 3000,
      minimizable: true,
      soundNotifications: false,
      persistConversation: true,
      messageDelay: 500
    },
    debug: false
  };
</script>
<script src="https://omniops.co.uk/embed.js" async></script>
```

### New Method (App ID-Based)
```html
<!-- 1 line total -->
<script async src="https://omniops.co.uk/w.js?id=app_abc123"></script>
```

### Benefits of New Method

| Feature | Old Method | New Method |
|---------|-----------|------------|
| **Lines of Code** | 38 | 1 |
| **Load Time** | ~500ms | ~150ms (70% faster) |
| **Update Settings** | Edit code, redeploy | Dashboard only (instant) |
| **Security** | PostMessage wildcards | Strict origins |
| **Bundle Size** | ~800 KB | ~100 KB target |
| **Cache Hit Rate** | 0% (no caching) | 95%+ (with versioning) |
| **Maintenance** | Manual updates required | Zero maintenance |

---

## Migration Steps

### Step 1: Get Your App ID

1. Log into [Omniops Dashboard](https://omniops.co.uk/dashboard)
2. Navigate to **Settings → Installation**
3. Copy your App ID (format: `app_xxxxxxxxxxxx`)

**Note:** Your App ID was auto-generated during the migration. Each customer has a unique ID.

### Step 2: Replace Embed Code

**Remove** your entire old embed code block and **replace** with:

#### Option A: URL Parameter (Recommended)
```html
<script async src="https://omniops.co.uk/w.js?id=YOUR_APP_ID"></script>
```

#### Option B: Data Attribute
```html
<script async data-id="YOUR_APP_ID" src="https://omniops.co.uk/w.js"></script>
```

#### Option C: Config Object
```html
<script>window.OmniopsConfig = {id: "YOUR_APP_ID"};</script>
<script async src="https://omniops.co.uk/w.js"></script>
```

**Where to add:**
- **WordPress**: Theme footer, before `</body>` tag
- **Shopify**: `theme.liquid`, before `</body>`
- **HTML Sites**: Any page, before `</body>`
- **React/Next.js**: See platform-specific guide below

### Step 3: Clear Browser Cache

```bash
# Chrome/Edge
Ctrl+Shift+Delete → Clear cached images and files

# Firefox
Ctrl+Shift+Delete → Cached Web Content

# Safari
Cmd+Option+E
```

### Step 4: Verify Installation

1. Visit your website
2. Open browser console (F12)
3. Look for: `[Omniops] Widget loaded successfully`
4. Check widget appears in bottom-right corner
5. Test chat functionality

#### Verification Checklist
- [ ] Widget loads without errors
- [ ] Chat bubble appears
- [ ] Click opens chat interface
- [ ] Can send test message
- [ ] Appearance matches your settings

---

## Platform-Specific Guides

### WordPress Integration

**Method 1: Theme Editor**
```php
// Add to footer.php before </body>
<script async src="https://omniops.co.uk/w.js?id=<?php echo esc_attr(get_option('omniops_app_id')); ?>"></script>
```

**Method 2: Plugin (Insert Headers and Footers)**
1. Install "Insert Headers and Footers" plugin
2. Go to Settings → Insert Headers and Footers
3. Paste code in "Scripts in Footer" section
4. Save

**Method 3: functions.php**
```php
add_action('wp_footer', function() {
    ?>
    <script async src="https://omniops.co.uk/w.js?id=app_YOUR_ID"></script>
    <?php
}, 100);
```

### Shopify Integration

```liquid
{%comment%} Add to theme.liquid before </body> {%endcomment%}
<script async src="https://omniops.co.uk/w.js?id={{ settings.omniops_app_id }}"></script>
```

**Settings Schema (config/settings_schema.json):**
```json
{
  "name": "Omniops Chat",
  "settings": [
    {
      "type": "text",
      "id": "omniops_app_id",
      "label": "Omniops App ID",
      "default": "app_"
    }
  ]
}
```

### React/Next.js Integration

**App Router (Next.js 13+):**
```typescript
// app/layout.tsx
import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          src="https://omniops.co.uk/w.js?id=app_YOUR_ID"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
```

**Pages Router (Next.js 12 and below):**
```typescript
// pages/_app.tsx
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://omniops.co.uk/w.js?id=app_YOUR_ID';
    script.async = true;
    document.head.appendChild(script);
  }, []);

  return <Component {...pageProps} />;
}
```

---

## Updating Widget Settings

With the new App ID system, all settings are managed from the dashboard:

### Via Dashboard (Recommended)
1. Go to **Settings → Widget Customization**
2. Update appearance, behavior, or features
3. Click **Save**
4. Changes apply instantly (5-minute CDN cache)

### Settings You Can Update
- **Appearance**: Position, colors, size
- **Behavior**: Welcome message, auto-open, timing
- **Features**: Enable/disable integrations
- **Privacy**: Consent, retention policies

**No code changes needed!** Your embed code never changes.

---

## Troubleshooting

### Widget Not Appearing

**Check 1: App ID Format**
```javascript
// Console should show:
'[Omniops] Widget loaded successfully'
'[Omniops] App ID: app_abc123...'

// If you see error:
'[Omniops] Missing app ID'
// → Check your App ID is correct
```

**Check 2: Network Requests**
1. Open DevTools → Network tab
2. Filter: "omniops"
3. Should see: `w.js` (200 OK), `embed.js` (200 OK), `widget-bundle.js` (200 OK)

**Check 3: Console Errors**
Look for JavaScript errors. Common issues:
- CORS errors → Check your domain is configured
- 404 errors → Verify server URL is correct
- Script blocked → Check Content Security Policy

### Settings Not Updating

**Cause:** CDN cache (5 minutes)

**Solutions:**
1. Wait 5 minutes for cache to expire
2. Force refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
3. Clear browser cache
4. Use incognito/private window for testing

### Old Widget Still Showing

**Cause:** Cached old embed code

**Solution:**
1. Search your site for "ChatWidgetConfig"
2. Remove ALL old embed code
3. Clear browser and CDN cache
4. Hard refresh (Ctrl+Shift+R)

---

## Rollback Instructions

If you need to revert to the old method:

### Step 1: Save Old Code
Before migrating, save your old embed code to a file.

### Step 2: Restore Old Code
Replace the new 1-line code with your old 38-line configuration block.

### Step 3: Clear Cache
Clear browser cache and hard refresh.

**Note:** Old method still works during migration period (90 days). After that, it will be deprecated but not removed.

---

## Migration Checklist

### Pre-Migration
- [ ] Copy your App ID from dashboard
- [ ] Save current embed code as backup
- [ ] Test widget in staging environment (if available)
- [ ] Notify team of planned update

### During Migration
- [ ] Replace embed code
- [ ] Clear cache
- [ ] Test on multiple pages
- [ ] Verify in different browsers

### Post-Migration
- [ ] Confirm widget loads correctly
- [ ] Test chat functionality
- [ ] Verify analytics tracking
- [ ] Update internal documentation
- [ ] Remove old backup code (after 7 days)

---

## FAQ

### Q: Will my old embed code stop working?
A: No. Old code continues to work for 90 days. After that, it will be deprecated but functional.

### Q: Do I lose my chat history?
A: No. Chat history, customer data, and settings are preserved.

### Q: Can I customize appearance after migration?
A: Yes! Use the dashboard (Settings → Widget Customization). Changes apply instantly.

### Q: What if I have multiple websites?
A: Each website gets its own App ID. Repeat migration for each site.

### Q: Can I use the old and new methods simultaneously?
A: No. Choose one method. We recommend migrating all sites to the new method.

### Q: How do I get my App ID?
A: Dashboard → Settings → Installation. It's auto-generated (format: `app_xxxxxxxxxxxx`).

### Q: What happens to my existing configuration?
A: All your settings (appearance, behavior, etc.) are preserved in the database. The new method loads them dynamically.

---

## Need Help?

- **Documentation**: [Widget Integration Guide](./INTEGRATION_EMBED_QUICK_START.md)
- **Support**: support@omniops.co.uk
- **Dashboard**: [https://omniops.co.uk/dashboard](https://omniops.co.uk/dashboard)
- **Status Page**: [https://status.omniops.co.uk](https://status.omniops.co.uk)

---

## Version History

- **v2.0.0** (2025-11-02): App ID-based integration, 95% code reduction
- **v1.0.0** (2024-08-01): Original domain-based integration
