**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Public Directory

Static assets and client-side scripts for the Customer Service Agent.

## Structure

```
public/
├── embed.js          # Widget loader script
├── favicon.ico       # Site favicon
└── *.svg            # SVG assets
```

## Files

### embed.js
The main widget loader script that customers embed on their websites.

**Usage:**
```html
<script src="https://your-domain.com/embed.js" async></script>
```

**Features:**
- Asynchronous loading
- Automatic initialization
- Configuration support
- Error handling
- CORS support

**Configuration:**
```javascript
window.ChatWidgetConfig = {
  // Optional configuration
  position: 'bottom-right',
  primaryColor: '#4F46E5',
  privacy: {
    allowOptOut: true
  }
};
```

### SVG Assets
- `file.svg` - File icon
- `globe.svg` - Globe icon
- `next.svg` - Next.js logo
- `vercel.svg` - Vercel logo
- `window.svg` - Window icon

## Widget Embedding

### Basic Installation
```html
<!-- Minimal setup -->
<script src="https://your-domain.com/embed.js" async></script>
```

### Advanced Installation
```html
<!-- With configuration -->
<script>
window.ChatWidgetConfig = {
  position: 'bottom-right',
  primaryColor: '#4F46E5',
  welcomeMessage: 'How can I help you today?',
  privacy: {
    allowOptOut: true,
    showPrivacyNotice: true
  }
};
</script>
<script src="https://your-domain.com/embed.js" async></script>
```

### Widget API
The embed script exposes a global `ChatWidget` object:

```javascript
// Open the widget
ChatWidget.open();

// Close the widget
ChatWidget.close();

// Send a message programmatically
ChatWidget.sendMessage('Hello!');

// Privacy controls
ChatWidget.privacy.optOut();
ChatWidget.privacy.optIn();
ChatWidget.privacy.clearData();
```

## Security Considerations

1. **CORS**: Widget served with appropriate CORS headers
2. **CSP**: Compatible with Content Security Policy
3. **Sandboxing**: Runs in isolated iframe
4. **HTTPS**: Always serve over HTTPS in production

## Performance

- Async loading doesn't block page render
- Minimal initial payload (~5KB gzipped)
- Lazy loads main widget code
- Uses CDN for static assets

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Development

To modify the embed script:
1. Edit `public/embed.js`
2. Test locally with different configurations
3. Test on various browsers
4. Ensure backward compatibility

## Deployment

Static files are:
- Cached with appropriate headers
- Served via CDN in production
- Versioned for cache busting
- Compressed (gzip/brotli)