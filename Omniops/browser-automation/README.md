# Browser Automation

Experimental browser automation tools and utilities for advanced web scraping and interaction.

## Overview

This directory contains experimental browser automation scripts using Puppeteer and other browser control libraries. These are separate from the main application's Crawlee-based scraping system.

## Quick Start

### Basic Visible Browser Test
```bash
node test-visible-browser.js
```

### Live Browser Control (Recommended)
```bash
# Start persistent browser
node claude-live-browser.js

# In another terminal, perform actions
node browser-action.js click 500 300
node browser-action.js type "hello world"
node browser-action.js enter
node browser-action.js scroll 500
```

### Fast Browser for Automation
```javascript
const ClaudeFastBrowser = require('./claude-fast-browser');
const browser = new ClaudeFastBrowser();
await browser.init();
await browser.go('https://example.com');
await browser.click('Sign in');
```

## File Structure

### Test Scripts
- `test-visible-browser.js` - Basic visible browser demo
- `test-google-search.js` - Google search automation (blocked by automation detection)
- `test-duckduckgo-search.js` - DuckDuckGo search (working)
- `test-interactive-browser.js` - Screenshot-based interaction demo

### Browser Controllers
- `claude-browser-controller.js` - First real-time control attempt
- `claude-fast-browser.js` - Optimized controller with DOM scanning
- `claude-live-browser.js` - Persistent browser for continuous control
- `browser-action.js` - Individual action performer
- `claude-control-interface.js` - Control interface for Claude integration
- `ai-vision-browser-control.js` - Vision-based browser control using AI
- `ai-browser-concept.js` - Concept implementation of AI-controlled browser

### Practical Examples
- `ai-news-collector.js` - Collects AI news from Google (blocked)
- `ai-news-direct.js` - Successfully collects AI news from TechCrunch

### Documentation
- `AI_BROWSER_AUTOMATION_EXPERIMENT.md` - Conceptual design document
- `BROWSER_AUTOMATION_DOCUMENTATION.md` - Complete journey documentation

### Screenshots
- `claude-browser-screenshots/` - Screenshots from browser control sessions
- `claude-fast-screenshots/` - Screenshots from fast browser sessions

## Performance Tips

1. Use `claude-fast-browser.js` for best performance
2. Keep screenshot quality low (30-50%)
3. Use DOM scanning instead of screenshots when possible
4. Batch multiple operations together

## Common Issues

- **Google blocks automation**: Use DuckDuckGo or go directly to target sites
- **Slow screenshots**: Reduce quality or use DOM scanning
- **ESM errors**: These files use CommonJS, compatible with Node.js

## Integration with Main App

⚠️ **Note**: The main application uses Crawlee for production web scraping (see `/lib/crawler-config.ts`). These browser automation scripts are experimental tools for testing and development.

## Next Steps

1. Integrate with AI vision models for intelligent navigation
2. Add session persistence (cookies, auth)
3. Create higher-level abstractions for common tasks
4. Build visual element detection system