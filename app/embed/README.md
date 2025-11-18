**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Embed Widget - OmniOps AI Chat Integration

The OmniOps embed widget provides a production-ready, customizable AI chat interface that can be integrated into any website with a single line of code. Built with performance and accessibility in mind, featuring real-time AI responses and seamless user experience.

**Widget Capabilities:**
- **One-Line Integration**: Simple script tag implementation for any website
- **AI-Powered Conversations**: Intelligent responses with context awareness and RAG integration
- **Multi-Language Support**: Native support for 40+ languages with automatic detection
- **Responsive Design**: Mobile-optimized with accessibility features (WCAG 2.1 AA)
- **Performance Optimized**: Minimal impact on host website with lazy loading
- **Customizable Appearance**: Complete branding and theme customization

## Widget Variants

### Standard Widget (`/embed`)
**Purpose**: Production-ready chat widget for live website integration
**File**: `page.tsx`
**Features:**
- **AI Chat Engine**: Real-time conversations with OpenAI GPT-4
- **Context Awareness**: RAG integration with website content and knowledge base
- **Customer Verification**: WooCommerce integration for authenticated support
- **Responsive Interface**: Mobile-first design with touch optimization
- **Accessibility**: Full keyboard navigation and screen reader support
- **Performance**: Lazy loading with minimal JavaScript footprint

### Enhanced Widget (`/embed/enhanced`)
**Purpose**: Advanced widget with additional features and customization options
**File**: `enhanced-page.tsx`
**Features:**
- **Advanced UI**: Rich media support with file attachments and image sharing
- **Voice Integration**: Voice-to-text and text-to-speech capabilities
- **Custom Branding**: Advanced theming with CSS customization
- **Analytics Integration**: Enhanced tracking and user behavior analytics
- **A/B Testing**: Built-in testing framework for optimization
- **Advanced Workflows**: Custom conversation flows and smart routing

## Integration Methods

### Simple Script Integration
**Recommended for most websites**
```html
<!-- Add this script tag to your website -->
<script 
  src="https://omniops.ai/embed.js" 
  data-domain="your-domain.com"
  data-api-key="your-api-key"
  async>
</script>
```

### Advanced Configuration
**For custom implementations with additional options**
```html
<script>
window.OmniOpsConfig = {
  domain: 'your-domain.com',
  apiKey: 'your-api-key',
  position: 'bottom-right',
  theme: 'auto',
  language: 'auto',
  customization: {
    primaryColor: '#0066cc',
    fontFamily: 'system-ui',
    borderRadius: '8px'
  },
  features: {
    voiceChat: false,
    fileUpload: false,
    emailCapture: true
  }
};
</script>
<script src="https://omniops.ai/embed.js" async></script>
```

### React Component Integration
**For React applications**
```jsx
import { OmniOpsWidget } from '@omniops/react-widget';

function App() {
  return (
    <div>
      {/* Your app content */}
      <OmniOpsWidget
        domain="your-domain.com"
        apiKey="your-api-key"
        position="bottom-right"
        theme="auto"
      />
    </div>
  );
}
```

### WordPress Plugin
**For WordPress sites**
```php
// Install via WordPress admin or add to functions.php
add_action('wp_head', function() {
  if (function_exists('omniops_widget_init')) {
    omniops_widget_init([
      'domain' => 'your-domain.com',
      'api_key' => 'your-api-key',
      'position' => 'bottom-right'
    ]);
  }
});
```

## Configuration Options

### Basic Configuration
**Essential settings for widget functionality**
- **`domain`** (required): Your website domain for multi-tenant isolation
- **`apiKey`** (required): Your OmniOps API key for authentication
- **`position`**: Widget position (`bottom-right`, `bottom-left`, `top-right`, `top-left`)
- **`language`**: Language code (`auto`, `en`, `es`, `fr`, etc.) or auto-detection
- **`theme`**: Theme preference (`auto`, `light`, `dark`) with system preference detection

### Appearance Customization
**Visual customization options**
```javascript
customization: {
  // Colors
  primaryColor: '#0066cc',        // Primary brand color
  backgroundColor: '#ffffff',     // Chat background
  textColor: '#333333',          // Text color
  borderColor: '#e1e5e9',        // Border color
  
  // Typography
  fontFamily: 'system-ui',       // Font family
  fontSize: '14px',              // Base font size
  
  // Layout
  borderRadius: '8px',           // Border radius
  shadow: 'medium',              // Shadow depth (none, small, medium, large)
  width: '380px',                // Widget width (desktop)
  height: '600px',               // Widget height (desktop)
  
  // Animation
  animation: 'smooth',           // Animation style (none, smooth, bounce)
  transition: '0.3s ease'        // Transition timing
}
```

### Feature Configuration
**Enable/disable specific widget features**
```javascript
features: {
  // Chat Features
  typing: true,                  // Show typing indicators
  readReceipts: true,           // Show read receipts
  timestamps: true,             // Display message timestamps
  avatars: true,                // Show user/bot avatars
  
  // Advanced Features
  voiceChat: false,             // Voice-to-text input
  fileUpload: false,            // File attachment support
  imageUpload: false,           // Image sharing
  emojiPicker: true,            // Emoji selection
  
  // Integration Features
  emailCapture: true,           // Collect user email
  phoneCapture: false,          // Collect phone number
  feedbackSystem: true,         // Post-chat feedback
  transcriptEmail: true,        // Email chat transcript
  
  // E-commerce Features (requires WooCommerce integration)
  orderLookup: true,            // Order status checking
  productSearch: true,          // Product search functionality
  cartRecovery: true,           // Abandoned cart assistance
  customerVerification: true    // Customer authentication
}
```

### Behavior Configuration
**Control widget behavior and conversation flow**
```javascript
behavior: {
  // Interaction
  autoOpen: false,              // Auto-open on page load
  autoOpenDelay: 5000,          // Delay before auto-open (ms)
  minimizeOnNavigate: true,     // Minimize on page navigation
  persistState: true,           // Remember open/closed state
  
  // Conversation
  greetingMessage: 'Hello! How can I help you today?',
  placeholderText: 'Type your message...',
  offlineMessage: 'We are currently offline. Please leave a message.',
  maxMessageLength: 1000,       // Character limit per message
  
  // Notifications
  soundEnabled: true,           // Play notification sounds
  desktopNotifications: false,  // Browser notifications
  badgeCount: true,             // Show unread message count
  
  // Privacy
  dataRetention: 30,            // Days to retain chat data
  anonymousChat: false,         // Allow anonymous conversations
  requireEmail: false,          // Require email before chat
  gdprCompliant: true          // Enable GDPR compliance features
}
```

## Advanced Features

### Customer Verification Integration
**WooCommerce customer authentication**
```javascript
// Enable customer verification
features: {
  customerVerification: true
},

// Configure verification methods
verification: {
  methods: ['email', 'order'],    // Verification methods
  required: false,                // Require verification for support
  orderLookupFields: ['email', 'order_number'],
  emailDomains: ['@yourstore.com'] // Restrict to specific domains
}
```

### Multi-Language Support
**Automatic language detection and manual configuration**
```javascript
// Automatic detection based on browser/page
language: 'auto',

// Manual language configuration
language: 'es',                   // Spanish
language: 'fr',                   // French
language: 'de',                   // German

// Custom translations
translations: {
  'greeting': 'Hello! How can I help you?',
  'placeholder': 'Type your message...',
  'offline': 'We are currently offline.',
  // ... additional custom translations
}
```

### Analytics Integration
**Track widget performance and user interactions**
```javascript
analytics: {
  enabled: true,                  // Enable analytics tracking
  provider: 'google',            // Analytics provider (google, adobe, custom)
  trackingId: 'GA_TRACKING_ID',  // Provider tracking ID
  
  events: {
    widgetOpen: true,            // Track widget opens
    messagesSent: true,          // Track messages sent
    conversationStart: true,     // Track conversation starts
    conversationEnd: true,       // Track conversation completion
    customerVerification: true,  // Track verification events
    orderLookups: true          // Track order search events
  },
  
  customEvents: {
    'product_inquiry': {
      category: 'ecommerce',
      action: 'product_question',
      label: 'product_name'
    }
  }
}
```

### A/B Testing Framework
**Built-in testing for optimization**
```javascript
testing: {
  enabled: true,                  // Enable A/B testing
  testId: 'widget_color_test',   // Test identifier
  
  variants: {
    'control': {
      customization: {
        primaryColor: '#0066cc'
      }
    },
    'variant_a': {
      customization: {
        primaryColor: '#ff6b35'
      }
    }
  },
  
  allocation: {
    'control': 50,                // 50% traffic
    'variant_a': 50              // 50% traffic
  }
}
```

## Technical Implementation

### Widget Architecture
**Modern, performant implementation**
- **Framework**: React 19 with Next.js 15 for optimal performance
- **Bundling**: Rollup with tree-shaking for minimal bundle size (<50KB gzipped)
- **Styling**: Tailwind CSS with CSS-in-JS for theme customization
- **State Management**: Zustand for lightweight state management
- **Real-time**: WebSocket connection with fallback to polling

### Performance Optimization
**Minimal impact on host website**
- **Lazy Loading**: Widget loads only when needed or triggered
- **Code Splitting**: Dynamic imports for advanced features
- **Caching**: Intelligent caching with service worker support
- **CDN Delivery**: Global CDN for fast asset delivery
- **Bundle Size**: Optimized for minimal JavaScript footprint

### Security Features
**Enterprise-grade security**
- **HTTPS Only**: All communications encrypted in transit
- **CSP Compatible**: Content Security Policy compliant
- **XSS Prevention**: Comprehensive input sanitization
- **Domain Validation**: Widget restricted to authorized domains
- **Rate Limiting**: Built-in protection against abuse

### Accessibility Features
**WCAG 2.1 Level AA compliance**
- **Keyboard Navigation**: Full functionality via keyboard
- **Screen Reader Support**: Semantic HTML with ARIA labels
- **High Contrast**: Supports high contrast mode
- **Focus Management**: Clear focus indicators and logical tab order
- **Voice Control**: Compatible with voice navigation tools

## Testing & Development

### Testing the Widget
**Multiple testing environments available**

1. **Development Testing**: `/test-widget` - Comprehensive testing environment
2. **Widget Validation**: `/widget-test` - Integration validation tools
3. **Demo Preview**: `/demo/[demoId]` - Auto-generated demo pages
4. **Simple Testing**: `/simple-test` - Basic functionality testing

### Testing Checklist
**Ensure proper widget functionality**
- [ ] Widget loads correctly on target website
- [ ] Chat functionality works as expected
- [ ] Customer verification integrates properly (if enabled)
- [ ] Mobile responsiveness across devices
- [ ] Accessibility features function correctly
- [ ] Performance impact is minimal
- [ ] Custom styling appears correctly
- [ ] Analytics tracking works (if configured)

### Debugging Tools
**Built-in debugging and monitoring**
```javascript
// Enable debug mode for development
debug: true,

// Console logging levels
logLevel: 'debug',  // none, error, warn, info, debug

// Performance monitoring
monitoring: {
  enabled: true,
  reportErrors: true,
  trackPerformance: true
}
```

## Deployment Checklist

### Pre-Deployment
**Essential setup before going live**
1. **Domain Configuration**: Add your domain to OmniOps dashboard
2. **API Key**: Generate and secure your API key
3. **Content Training**: Upload relevant content and FAQs
4. **WooCommerce Setup**: Configure e-commerce integration (if applicable)
5. **Customization**: Set up branding and appearance
6. **Testing**: Thoroughly test widget functionality

### Production Deployment
**Steps for live website integration**
1. **Add Widget Script**: Insert the embed script on your website
2. **Test Integration**: Verify widget loads and functions correctly
3. **Monitor Performance**: Check website performance impact
4. **Analytics Setup**: Configure tracking and monitoring
5. **Team Training**: Train support team on dashboard features
6. **Documentation**: Create internal documentation for team

### Post-Deployment
**Ongoing maintenance and optimization**
1. **Monitor Analytics**: Track widget performance and user engagement
2. **Regular Updates**: Keep training data current and relevant
3. **Performance Review**: Regular performance and accuracy assessment
4. **User Feedback**: Collect and act on user feedback
5. **Feature Updates**: Stay updated on new widget features and capabilities

## Troubleshooting

### Common Issues
**Solutions for frequent problems**

**Widget not loading:**
- Verify domain is configured in OmniOps dashboard
- Check API key is correct and active
- Ensure script tag is properly formatted
- Check browser console for JavaScript errors

**Chat not responding:**
- Verify API connectivity and rate limits
- Check training data is properly uploaded
- Ensure domain permissions are configured
- Test with simple queries first

**Styling issues:**
- Verify custom CSS doesn't conflict
- Check z-index conflicts with existing site elements
- Ensure responsive breakpoints work correctly
- Test across different browsers and devices

**Performance impact:**
- Enable lazy loading for better performance
- Check for JavaScript conflicts
- Monitor network requests and timing
- Consider using async loading

### Support Resources
**Getting help when needed**
- **Documentation**: Comprehensive guides in dashboard help section
- **API Reference**: Complete API documentation for custom implementations
- **Support Tickets**: Direct technical support through dashboard
- **Community**: User community for tips and best practices

**Related Documentation:**
- [Dashboard Documentation](../dashboard/README.md) - Management interface guide
- [API Documentation](../api/README.md) - Complete API reference
- [App Documentation](../README.md) - Complete application architecture
- [Project Guidelines](../../CLAUDE.md) - Development standards and best practices