# WordPress Plugin - Quick Start Guide

**For:** Omniops Chat Widget v1.1.0
**Date:** 2025-10-29

---

## 🚀 Quick Install (5 Minutes)

### Step 1: Get the Plugin

The plugin is in: `wordpress-plugin/omniops-chat-widget/`

### Step 2: Install Locally for Testing

**Option A: Copy to WordPress Plugins Folder**
```bash
# If you have local WordPress (XAMPP, Local, etc.)
cp -r wordpress-plugin/omniops-chat-widget /path/to/wordpress/wp-content/plugins/

# Example for Local by Flywheel:
cp -r wordpress-plugin/omniops-chat-widget ~/Local\ Sites/my-site/app/public/wp-content/plugins/
```

**Option B: Create ZIP and Upload**
```bash
# Create installable ZIP
cd wordpress-plugin
zip -r omniops-chat-widget.zip omniops-chat-widget/

# Then upload via WordPress admin:
# Plugins → Add New → Upload Plugin → Choose File
```

### Step 3: Activate

1. Go to WordPress admin: `http://your-site.local/wp-admin`
2. Navigate to: **Plugins → Installed Plugins**
3. Find "Omniops Chat Widget"
4. Click **Activate**

### Step 4: Test

1. Visit your site's homepage (NOT the admin area)
2. Look for chat icon in bottom-right corner
3. Click to open and type: "Hello!"
4. You should see a response within 2-5 seconds

---

## ⚙️ Configuration

### For Local Testing (localhost)

Edit the plugin file: `omniops-chat-widget.php`

Find this line (around line 20):
```php
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk');
```

Change to:
```php
define('OMNIOPS_WIDGET_URL', 'http://localhost:3000');
```

**Important:** Make sure your Next.js dev server is running on port 3000!

```bash
# In your Omniops project directory:
npm run dev
```

### For Production (Client Sites)

Keep the production URL:
```php
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk');
```

Make sure your production server is running and accessible.

---

## ✅ Testing Checklist

### Basic Functionality
- [ ] Widget icon appears on homepage
- [ ] Widget opens when clicked
- [ ] Can type and send messages
- [ ] Receives AI responses (2-5 seconds)
- [ ] Widget closes with X button
- [ ] Works on mobile (try resizing browser)

### User Context (if logged in to WordPress)
- [ ] Log in to WordPress
- [ ] Open widget
- [ ] Send message "Who am I?"
- [ ] Should recognize your user info

### WooCommerce (if installed)
- [ ] Create test order
- [ ] Ask: "Check order #123" (use real order number)
- [ ] Should retrieve order details
- [ ] Ask: "Show me products"
- [ ] Should list products

### Browser Console Check
- [ ] Press F12 to open console
- [ ] Should see: "Chat Widget v1.1.0" or similar
- [ ] No red errors
- [ ] Type: `console.log(window.ChatWidget)`
- [ ] Should show widget API object

---

## 🐛 Troubleshooting

### Widget Doesn't Appear

**Check 1: Correct Location**
- Widget only shows on **public pages**, not admin area
- Visit: `http://your-site.local/` (homepage)
- NOT: `http://your-site.local/wp-admin/`

**Check 2: View Source**
- Right-click page → "View Page Source"
- Search for "embed.js"
- Should find: `<script src="http://localhost:3000/embed.js" async></script>`
- If missing, plugin isn't loading

**Check 3: Server Running**
```bash
# Test if server is accessible
curl http://localhost:3000/embed.js

# Should return JavaScript code
# If "Connection refused", start your server:
npm run dev
```

**Check 4: Browser Console**
- Press F12
- Look for errors in Console tab
- Common errors:
  - "Failed to load resource" → Server not running
  - "CORS policy" → Need to configure CORS in Next.js
  - "ChatWidget is not defined" → Script didn't load

### Widget Appears But Doesn't Respond

**Check 1: Backend API**
```bash
# Test chat API endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","domain":"localhost","conversationId":"test-123"}'

# Should return JSON response
# If error, check backend logs
```

**Check 2: OpenAI API Key**
```bash
# In your .env.local file:
OPENAI_API_KEY=sk-proj-...

# Make sure it's set and valid
```

**Check 3: Browser Network Tab**
- Press F12 → Network tab
- Send a message in widget
- Look for POST to `/api/chat`
- Click it to see request/response
- Check response status (should be 200)

### WooCommerce Not Working

**Check 1: WooCommerce Installed**
```php
// In WordPress admin, check:
Plugins → Installed Plugins → WooCommerce should be active
```

**Check 2: Backend Credentials**
```bash
# In your backend, check WooCommerce API credentials are set
# See: docs/06-INTEGRATIONS/INTEGRATION_WOOCOMMERCE.md
```

**Check 3: Test Order Exists**
```php
// Create a test order in WooCommerce admin
// Note the order number
// Try: "Check order #123"
```

---

## 📦 Creating Production Package

When ready to deploy to client sites:

### Step 1: Update URL

Edit `omniops-chat-widget.php`:
```php
// Change from localhost to production
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk');
```

### Step 2: Create ZIP

```bash
cd wordpress-plugin
zip -r omniops-chat-widget-v1.1.0.zip omniops-chat-widget/
```

### Step 3: Test on Staging

- Install on a test/staging site first
- Go through full testing checklist
- Fix any issues
- Test for 24-48 hours

### Step 4: Deploy to Production

Once staging tests pass:
- Upload to client sites via Plugins → Add New → Upload
- Or send ZIP to clients for installation
- Monitor for first week

---

## 📚 Documentation

**Full Testing Guide:** [WORDPRESS_INTEGRATION_TESTING.md](../WORDPRESS_INTEGRATION_TESTING.md)

**Key Files:**
- `omniops-chat-widget.php` - Main plugin file
- `readme.txt` - WordPress plugin readme
- `QUICK_START.md` - This file

**Need Help?**
- Check: [docs/06-INTEGRATIONS/](../docs/06-INTEGRATIONS/)
- Email: support@omniops.co.uk
- GitHub Issues: (add URL)

---

## 🎯 Next Steps

1. ✅ Install plugin on local WordPress
2. ✅ Test basic functionality
3. ✅ Test with WooCommerce (if applicable)
4. ✅ Review all settings
5. ✅ Test on staging environment
6. ✅ Deploy to production with confidence

---

**Remember:** Always test locally before deploying to clients!
