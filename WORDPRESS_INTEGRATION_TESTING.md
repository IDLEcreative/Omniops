# WordPress Chat Widget Integration Testing Guide

**Purpose:** Complete testing guide to ensure the chat widget works perfectly on WordPress sites before deploying to clients.

**Last Updated:** 2025-10-29
**Status:** Active

---

## 🚨 Critical: Don't Deploy Untested Code to Clients!

You're absolutely right to want to test first. Here's how to do it properly.

---

## Production vs. Development URLs

### ❌ Current Code (Development Only)
```php
// This only works on localhost - NOT for production!
function add_chat_widget() {
    ?>
    <script src="http://localhost:3000/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');
```

### ✅ Correct Code (Production Ready)
```php
// This works on your production domain
function add_chat_widget() {
    ?>
    <script>
        window.ChatWidgetConfig = {
            serverUrl: 'https://www.omniops.co.uk',
            privacy: {
                allowOptOut: true,
                showPrivacyNotice: true,
                retentionDays: 30
            },
            // Optional: Enable WooCommerce integration
            woocommerceEnabled: true,
            storeDomain: window.location.hostname
        };
    </script>
    <script src="https://www.omniops.co.uk/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');
```

**Key Changes:**
- `http://localhost:3000` → `https://www.omniops.co.uk`
- Added `ChatWidgetConfig` for better control
- Enabled HTTPS (required for production)
- Added WooCommerce support flag

---

## Testing Strategy (3 Phases)

### Phase 1: Local WordPress Testing (Safe)
Test on your local WordPress installation before touching production.

### Phase 2: Staging Environment (Recommended)
Deploy to a staging/test WordPress site first.

### Phase 3: Production (Only After Phase 1 & 2 Pass)
Deploy to client sites with confidence.

---

## Phase 1: Local WordPress Testing

### Option A: Use Local WordPress (Recommended)

**Prerequisites:**
- LocalWP, XAMPP, or similar WordPress local environment
- Your Next.js app running on `localhost:3000`

**Setup Steps:**

1. **Install Local WordPress:**
   ```bash
   # If using LocalWP (https://localwp.com)
   # Create new site: "widget-test.local"
   ```

2. **Update Your `/etc/hosts` File:**
   ```bash
   # Add this line to /etc/hosts
   127.0.0.1 widget-test.local
   ```

3. **Create WordPress Plugin for Testing:**
   ```bash
   # Create plugin directory
   mkdir -p ~/wordpress-local/wp-content/plugins/omniops-chat-widget
   ```

4. **Add Plugin Code** (see section below)

5. **Activate Plugin in WordPress:**
   - Go to: http://widget-test.local/wp-admin
   - Navigate to: Plugins → Installed Plugins
   - Activate "Omniops Chat Widget"

6. **Test on Frontend:**
   - Visit: http://widget-test.local
   - Widget should appear in bottom-right corner
   - Test all features (see checklist below)

### Option B: Test on Existing WordPress Site (Staging)

If you have access to a staging WordPress site:

1. **Add Code to `functions.php`:**
   ```php
   // For testing: Use localhost
   function add_chat_widget_test() {
       if (!is_admin()) { // Only show on frontend
           ?>
           <script>
               window.ChatWidgetConfig = {
                   serverUrl: 'http://localhost:3000',
                   debug: true, // Enable debug mode for testing
                   privacy: {
                       allowOptOut: true,
                       showPrivacyNotice: true
                   }
               };
           </script>
           <script src="http://localhost:3000/embed.js" async></script>
           <?php
       }
   }
   add_action('wp_footer', 'add_chat_widget_test');
   ```

2. **Test with ngrok (to test from real domain):**
   ```bash
   # Install ngrok: https://ngrok.com
   ngrok http 3000

   # Output will show:
   # Forwarding: https://abc123.ngrok.io -> http://localhost:3000

   # Update WordPress code to use ngrok URL
   serverUrl: 'https://abc123.ngrok.io'
   ```

---

## Complete WordPress Plugin (Production Ready)

Create this plugin structure:

```
omniops-chat-widget/
├── omniops-chat-widget.php (main plugin file)
├── readme.txt
└── assets/
    └── admin-settings.php (optional: admin panel)
```

### Main Plugin File: `omniops-chat-widget.php`

```php
<?php
/**
 * Plugin Name: Omniops Chat Widget
 * Plugin URI: https://www.omniops.co.uk
 * Description: AI-powered customer service chat widget with semantic search and WooCommerce integration
 * Version: 1.1.0
 * Author: Omniops
 * Author URI: https://www.omniops.co.uk
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: omniops-chat-widget
 * Requires at least: 5.8
 * Requires PHP: 7.4
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('OMNIOPS_WIDGET_VERSION', '1.1.0');
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk'); // ⚠️ CHANGE THIS TO YOUR DOMAIN

/**
 * Add chat widget to footer
 */
function omniops_add_chat_widget() {
    // Don't show in admin area
    if (is_admin()) {
        return;
    }

    // Get current domain for WooCommerce integration
    $current_domain = $_SERVER['HTTP_HOST'];

    // Detect if WooCommerce is active
    $woocommerce_enabled = class_exists('WooCommerce') ? 'true' : 'false';

    // Get current user info (if logged in)
    $user_data = 'null';
    if (is_user_logged_in()) {
        $current_user = wp_get_current_user();
        $user_data = json_encode([
            'isLoggedIn' => true,
            'userId' => $current_user->ID,
            'email' => $current_user->user_email,
            'displayName' => $current_user->display_name,
        ]);
    }

    // Get page context
    $page_context = json_encode([
        'url' => get_permalink(),
        'title' => get_the_title(),
        'path' => $_SERVER['REQUEST_URI'],
        'postType' => get_post_type(),
    ]);

    ?>
    <!-- Omniops Chat Widget v<?php echo OMNIOPS_WIDGET_VERSION; ?> -->
    <script>
        window.ChatWidgetConfig = {
            serverUrl: '<?php echo OMNIOPS_WIDGET_URL; ?>',
            privacy: {
                allowOptOut: true,
                showPrivacyNotice: true,
                requireConsent: false,
                retentionDays: 30
            },
            appearance: {
                position: 'bottom-right',
                width: 400,
                height: 600
            },
            woocommerceEnabled: <?php echo $woocommerce_enabled; ?>,
            storeDomain: '<?php echo esc_js($current_domain); ?>',
            userData: <?php echo $user_data; ?>,
            pageContext: <?php echo $page_context; ?>,
            debug: false // Set to true for testing
        };
    </script>
    <script src="<?php echo OMNIOPS_WIDGET_URL; ?>/embed.js" async></script>
    <!-- End Omniops Chat Widget -->
    <?php
}
add_action('wp_footer', 'omniops_add_chat_widget', 100);

/**
 * Add admin notice after activation
 */
function omniops_activation_notice() {
    ?>
    <div class="notice notice-success is-dismissible">
        <p><strong>Omniops Chat Widget activated!</strong> The widget will now appear on your site's frontend.</p>
        <p>Visit any page on your site to see it in action.</p>
    </div>
    <?php
}
add_action('admin_notices', 'omniops_activation_notice');

/**
 * Add settings link on plugins page
 */
function omniops_plugin_action_links($links) {
    $settings_link = '<a href="' . admin_url('options-general.php?page=omniops-widget') . '">Settings</a>';
    array_unshift($links, $settings_link);
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'omniops_plugin_action_links');

/**
 * Optional: Add admin settings page
 */
function omniops_add_settings_page() {
    add_options_page(
        'Omniops Chat Widget Settings',
        'Chat Widget',
        'manage_options',
        'omniops-widget',
        'omniops_render_settings_page'
    );
}
add_action('admin_menu', 'omniops_add_settings_page');

/**
 * Render settings page
 */
function omniops_render_settings_page() {
    ?>
    <div class="wrap">
        <h1>Omniops Chat Widget Settings</h1>
        <div class="card">
            <h2>Widget Status</h2>
            <p><strong>Status:</strong> <span style="color: green;">✓ Active</span></p>
            <p><strong>Version:</strong> <?php echo OMNIOPS_WIDGET_VERSION; ?></p>
            <p><strong>Server URL:</strong> <?php echo OMNIOPS_WIDGET_URL; ?></p>
            <p><strong>WooCommerce:</strong>
                <?php echo class_exists('WooCommerce') ? '<span style="color: green;">✓ Detected</span>' : '<span style="color: gray;">Not installed</span>'; ?>
            </p>
        </div>

        <div class="card">
            <h2>How to Test</h2>
            <ol>
                <li>Visit any page on your website (not the admin area)</li>
                <li>Look for the chat widget in the bottom-right corner</li>
                <li>Click to open and try asking a question</li>
                <li>Check browser console (F12) for any errors</li>
            </ol>
        </div>

        <div class="card">
            <h2>Configuration</h2>
            <p>To customize the widget, edit the <code>OMNIOPS_WIDGET_URL</code> constant in the plugin file.</p>
            <p><strong>Current domain:</strong> <code><?php echo OMNIOPS_WIDGET_URL; ?></code></p>
        </div>
    </div>
    <?php
}
```

### Plugin `readme.txt`

```txt
=== Omniops Chat Widget ===
Contributors: omniops
Tags: chat, customer service, ai, woocommerce, support
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-powered customer service chat widget with semantic search and WooCommerce integration.

== Description ==

Omniops Chat Widget adds an intelligent customer service chat to your WordPress site.

Features:
* AI-powered responses using OpenAI
* Semantic search with vector embeddings
* WooCommerce integration (order lookup, product search)
* GDPR-compliant privacy controls
* Responsive design (mobile + desktop)
* Multi-language support (40+ languages)

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/omniops-chat-widget/`
2. Activate the plugin through the 'Plugins' screen in WordPress
3. The widget will automatically appear on your site

== Frequently Asked Questions ==

= How do I test if the widget is working? =

Visit any page on your site (not the admin area) and look for the chat widget in the bottom-right corner.

= Does this work with WooCommerce? =

Yes! If WooCommerce is installed, the widget automatically enables order lookup and product search features.

= Is this GDPR compliant? =

Yes, the widget includes privacy controls, opt-out functionality, and configurable data retention.

== Changelog ==

= 1.1.0 =
* Initial release
* AI-powered chat responses
* WooCommerce integration
* Privacy controls
```

---

## Integration Test Checklist

Use this checklist to verify everything works before deploying to clients:

### ✅ Basic Functionality

- [ ] **Widget Appears:** Chat icon visible in bottom-right corner
- [ ] **Widget Opens:** Clicking icon opens chat interface
- [ ] **Widget Closes:** Clicking X closes the chat
- [ ] **Mobile Responsive:** Widget adapts to mobile screen size
- [ ] **Desktop Display:** Widget displays correctly on desktop

### ✅ Chat Functionality

- [ ] **Send Message:** Can type and send messages
- [ ] **Receive Response:** AI responds to queries (may take 2-5 seconds)
- [ ] **Conversation History:** Messages persist in conversation
- [ ] **Multiple Conversations:** New conversations create new threads
- [ ] **Error Handling:** Graceful error messages if API fails

### ✅ WordPress Integration

- [ ] **Loads on All Pages:** Widget appears on homepage, posts, pages
- [ ] **Doesn't Load in Admin:** Widget NOT visible in wp-admin
- [ ] **No Console Errors:** Check browser console (F12) for errors
- [ ] **No Layout Breaking:** Widget doesn't break site layout
- [ ] **Z-index Correct:** Widget appears above other elements

### ✅ User Context (if logged in)

- [ ] **User Info Captured:** Widget knows if user is logged in
- [ ] **User Email Captured:** Email address sent to backend
- [ ] **Display Name Used:** User's name shown in chat (optional)

### ✅ WooCommerce Integration (if WooCommerce active)

- [ ] **Order Lookup Works:** Ask "Check order #123" (use real order)
- [ ] **Product Search Works:** Ask "Show me products"
- [ ] **Cart Integration:** Widget can see cart contents (if configured)
- [ ] **Stock Check:** Ask "Is product X in stock?"

### ✅ Privacy & Compliance

- [ ] **Privacy Notice Shows:** Privacy information displayed
- [ ] **Opt-Out Works:** Users can opt out of tracking
- [ ] **Data Retention:** Respects configured retention period (30 days default)
- [ ] **Consent Handling:** If requireConsent=true, asks for consent

### ✅ Performance

- [ ] **Load Time <2s:** Widget loads quickly
- [ ] **No Page Slowdown:** Widget doesn't slow page load
- [ ] **Cached Responses:** Repeat queries are faster (cache working)
- [ ] **No Memory Leaks:** Widget doesn't consume excessive memory

### ✅ Cross-Browser Testing

- [ ] **Chrome/Edge:** Works on Chromium browsers
- [ ] **Firefox:** Works on Firefox
- [ ] **Safari:** Works on Safari (desktop + mobile)
- [ ] **Mobile Chrome:** Works on Android Chrome
- [ ] **Mobile Safari:** Works on iOS Safari

---

## Testing Commands

### 1. Verify Widget Loads
```javascript
// Open browser console (F12) and run:
console.log(window.ChatWidget);

// Should output: Object with version, open(), close(), etc.
```

### 2. Check Configuration
```javascript
// Check widget config
console.log(window.ChatWidgetConfig);

// Should show your serverUrl, privacy settings, etc.
```

### 3. Test Programmatic API
```javascript
// Open widget
window.ChatWidget.open();

// Send test message
window.ChatWidget.sendMessage('Hello, this is a test!');

// Check privacy status
console.log(window.ChatWidget.privacy.getStatus());

// Get version
console.log(window.ChatWidget.version); // Should be "1.1.0"
```

### 4. Check for Errors
```javascript
// Look for errors in console
// If you see CORS errors, check server CORS settings
// If you see 404 errors, check serverUrl is correct
```

---

## Common Issues & Solutions

### Issue 1: Widget Not Appearing

**Symptoms:** No chat icon visible on page

**Check:**
1. View page source (Ctrl+U), search for "embed.js"
2. Open browser console (F12), look for errors
3. Check if `is_admin()` is accidentally blocking it
4. Verify serverUrl is correct (not localhost in production)

**Solution:**
```php
// Add this temporarily to debug:
function omniops_debug_info() {
    if (!is_admin()) {
        echo '<!-- Widget should load here -->';
        echo '<script>console.log("Widget config:", window.ChatWidgetConfig);</script>';
    }
}
add_action('wp_footer', 'omniops_debug_info', 99);
```

### Issue 2: CORS Errors

**Symptoms:** Console shows "blocked by CORS policy"

**Solution:** Ensure your Next.js app has CORS configured:

```typescript
// In your Next.js middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Allow WordPress site to load widget
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

  return response;
}
```

### Issue 3: Widget Loads But Doesn't Respond

**Symptoms:** Widget opens, but messages don't get responses

**Check:**
1. Backend server is running (https://www.omniops.co.uk)
2. API endpoint is accessible: `curl https://www.omniops.co.uk/api/chat`
3. OpenAI API key is configured on backend
4. No rate limiting blocking requests

**Solution:**
```bash
# Test API endpoint
curl -X POST https://www.omniops.co.uk/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"test","domain":"yourdomain.com","conversationId":"test-123"}'
```

### Issue 4: WooCommerce Integration Not Working

**Symptoms:** Widget can't look up orders or products

**Check:**
1. WooCommerce is activated on WordPress site
2. Widget config has `woocommerceEnabled: true`
3. WooCommerce API credentials are configured in backend
4. Orders exist to test with

**Solution:** Check backend logs for WooCommerce API errors

---

## Production Deployment Steps

Once ALL tests pass:

### Step 1: Update Production URLs

In your plugin, change:
```php
define('OMNIOPS_WIDGET_URL', 'https://www.omniops.co.uk');
```

### Step 2: Package Plugin

```bash
# Create distributable ZIP
cd ~/wordpress-local/wp-content/plugins
zip -r omniops-chat-widget.zip omniops-chat-widget/
```

### Step 3: Deploy to Client Sites

**Option A: Upload via WordPress Admin**
1. Go to: Plugins → Add New → Upload Plugin
2. Upload `omniops-chat-widget.zip`
3. Click "Install Now"
4. Activate plugin

**Option B: FTP/SFTP**
1. Connect to client's server
2. Upload to: `/wp-content/plugins/omniops-chat-widget/`
3. Activate via WordPress admin

### Step 4: Verify on Client Site

Go through the entire test checklist again on the live site.

### Step 5: Monitor for Issues

- Check browser console for errors
- Monitor backend logs for failed requests
- Ask client for feedback after 24-48 hours

---

## Testing Timeline Recommendation

| Phase | Duration | Actions |
|-------|----------|---------|
| **Week 1: Local Testing** | 3-5 days | Set up local WordPress, test all features |
| **Week 2: Staging Testing** | 3-5 days | Deploy to staging, get internal feedback |
| **Week 3: Soft Launch** | 7 days | Deploy to 1-2 friendly client sites |
| **Week 4: Full Launch** | Ongoing | Deploy to all clients after verification |

**Don't rush!** Testing saves you from embarrassing bugs and support tickets.

---

## Support Contacts

If you encounter issues during testing:

- **Documentation:** [docs/](docs/)
- **API Reference:** [docs/03-API/REFERENCE_API_ENDPOINTS.md](docs/03-API/REFERENCE_API_ENDPOINTS.md)
- **GitHub Issues:** (add your repo URL here)

---

## Summary

✅ **Before Sending to Client:**
1. Create WordPress plugin with correct production URL
2. Test locally on WordPress site
3. Complete entire test checklist
4. Test on staging environment
5. Soft launch to 1-2 test sites
6. Get feedback and fix issues
7. Deploy to production clients with confidence

❌ **Never:**
- Deploy untested code to client sites
- Use localhost URLs in production
- Skip the test checklist
- Assume it works without verification

---

**Last Updated:** 2025-10-29
**Status:** Ready for Testing
