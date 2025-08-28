# WooCommerce Chatbot - Quick Start Guide

## 🚀 5-Minute Setup

### Prerequisites
- WooCommerce store (v3.5+)
- Admin access to WordPress
- Your chatbot server URL

### Step 1: Install Plugin
```bash
# Download the plugin
curl -O https://your-server.com/wordpress-plugin/customer-service-chat.php

# Or copy directly to your WordPress installation
cp customer-service-chat.php /path/to/wordpress/wp-content/plugins/
```

### Step 2: Activate & Configure
1. Go to **WordPress Admin → Plugins**
2. Find "AI Customer Service Chat for WooCommerce"
3. Click **Activate**
4. Navigate to **WooCommerce → Chat Widget**
5. Enter your server URL and save

### Step 3: Test It Works
```javascript
// Open browser console on your store
console.log(window.ChatWidget); // Should show the API object
console.log(window.ChatWidgetConfig.userData); // Should show user data if logged in
```

## 📊 What Data is Available?

### For Logged-In Users
```javascript
{
  isLoggedIn: true,
  userId: "123",
  email: "customer@example.com",
  displayName: "John Doe",
  totalOrders: 15,
  totalSpent: "2500.00",
  customerGroup: "vip",  // auto-calculated
  lastOrderId: "4567"
}
```

### Cart Information
```javascript
{
  hasItems: true,
  itemCount: 3,
  cartTotal: "149.99",
  cartItems: [
    {
      id: "101",
      name: "Premium Widget",
      quantity: 2,
      price: "49.99"
    }
  ]
}
```

### Current Page Context
```javascript
{
  pageType: "product",  // or "cart", "checkout", etc.
  productId: "101",
  productName: "Premium Widget",
  productPrice: "49.99"
}
```

## 🎯 Common Use Cases

### 1. Personalized Greeting
```php
// Automatic based on customer tier
VIP Customer: "Welcome back, John! As a VIP customer..."
Regular: "Hi Sarah! Great to see you again..."
New: "Hello! Welcome to our store..."
Guest: "Hello! How can I help you today?"
```

### 2. Abandoned Cart Recovery
```javascript
// Automatically triggered after 5 minutes of inactivity
if (cartData.hasItems && timeSinceActivity > 300000) {
  openChatWithMessage("Need help completing your purchase?");
}
```

### 3. Order Support
```javascript
// When on order page, chat knows the order details
pageContext.pageType === 'order-confirmation'
// Chat can access: orderId, orderStatus, trackingNumber
```

## 🔧 Customization

### Change Widget Position
```javascript
window.ChatWidgetConfig = {
  appearance: {
    position: 'bottom-left'  // or 'top-right', 'top-left'
  }
};
```

### Custom Greeting Override
```javascript
window.ChatWidgetConfig = {
  behavior: {
    greeting: 'Welcome to our Black Friday sale!'
  }
};
```

### Control Data Sharing
```php
// In plugin settings
✅ Pass user information to chat
✅ Pass cart data to chat
✅ Enable order lookup in chat
```

## 🐛 Quick Debugging

### Check if User is Detected
```javascript
// In browser console
if (window.ChatWidgetConfig.userData.isLoggedIn) {
  console.log('User detected:', window.ChatWidgetConfig.userData.email);
} else {
  console.log('Guest user');
}
```

### Verify Cart Tracking
```javascript
// Trigger cart update manually
jQuery(document).trigger('updated_cart_totals');
// Check console for context update
```

### Test Message Passing
```javascript
// Send test message to chat
window.ChatWidget.sendMessage('Test message');
```

## 📝 Minimal Integration Code

### Option A: Simple Script Tag
```html
<!-- Add to footer.php or using a plugin -->
<script src="https://your-chatbot-server.com/embed.js"></script>
```

### Option B: With Basic User Detection
```php
// Add to functions.php
add_action('wp_footer', function() {
    $user_email = is_user_logged_in() ? wp_get_current_user()->user_email : '';
    ?>
    <script>
        window.ChatWidgetConfig = {
            serverUrl: 'https://your-chatbot-server.com',
            userData: {
                isLoggedIn: <?php echo is_user_logged_in() ? 'true' : 'false'; ?>,
                email: '<?php echo esc_js($user_email); ?>'
            }
        };
    </script>
    <script src="https://your-chatbot-server.com/embed.js"></script>
    <?php
});
```

### Option C: Full Plugin (Recommended)
Use the provided `customer-service-chat.php` for complete functionality.

## 🔄 Real-Time Updates

The chat automatically updates when:
- User logs in/out
- Cart items change
- Page navigation occurs
- Order is placed

```javascript
// Listen for updates
jQuery(document).on('added_to_cart', function() {
  console.log('Item added to cart - chat context updated');
});
```

## 🔒 Security Notes

1. **Data is sanitized** - All user inputs are cleaned
2. **HTTPS required** - Use SSL certificates
3. **Nonce verification** - AJAX requests are protected
4. **Origin checking** - PostMessage validates source

## 📱 Mobile Support

The widget is responsive and works on all devices:
- Auto-adjusts size on mobile
- Touch-friendly interface
- Reduced data usage on mobile connections

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| Widget not showing | Check console for JS errors, verify server URL |
| User not detected | Clear cache, check if logged in |
| Cart not updating | Ensure jQuery loaded, check for conflicts |
| CORS errors | Add your domain to server's allowed origins |

## 📚 More Resources

- [Full Documentation](./WOOCOMMERCE_EMBED_GUIDE.md)
- [WordPress Plugin Code](../wordpress-plugin/customer-service-chat.php)
- [Enhanced Embed Component](../app/embed/enhanced-page.tsx)
- [WooCommerce Integration Guide](./WOOCOMMERCE_INTEGRATION_GUIDE.md)

## 💡 Pro Tips

1. **Test with different user roles** - Admin, Customer, Guest
2. **Monitor performance** - Check load times with/without widget
3. **Use debug mode** during development: `window.ChatWidgetConfig.debug = true`
4. **Cache user context** to reduce server calls
5. **Implement fallbacks** for when WooCommerce API is slow

---

**Need help?** The chatbot reads this documentation, so you can ask it directly about implementation details!